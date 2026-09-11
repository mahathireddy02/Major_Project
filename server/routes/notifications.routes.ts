import { FastifyPluginAsync } from 'fastify'
import { NotificationModel } from '../models/Notification.js'
import { RideModel } from '../models/Ride.js'
import { UserModel } from '../models/User.js'
import { realtimeService } from '../services/realtimeService.js'

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {

  // ── Send a ride message (student→driver or driver→student) ──────────────────
  // Persists as a Notification with type='message' so it survives refresh/logout.
  fastify.post('/message', async (request, reply) => {
    const body = request.body as {
      rideId: string
      senderId: string
      senderName?: string
      senderRole: 'student' | 'driver'
      text: string
    }

    if (!body.rideId || !body.senderId || !body.text?.trim() || !body.senderRole) {
      return reply.status(400).send({ success: false, error: { message: 'rideId, senderId, senderRole and text are required' } })
    }

    const ride = await RideModel.findOne({ id: body.rideId })
    if (!ride) {
      return reply.status(404).send({ success: false, error: { message: 'Ride not found' } })
    }

    // Resolve sender name if not provided
    let senderName = body.senderName
    if (!senderName) {
      const senderUser = await UserModel.findOne({ id: body.senderId })
      senderName = senderUser?.name || (body.senderRole === 'driver' ? 'Driver' : 'Student')
    }

    // Determine recipient
    let recipientId: string
    let recipientStudentId: string | undefined
    let recipientDriverId: string | undefined

    if (body.senderRole === 'student') {
      // Student → Driver: recipient is the ride's assigned driver
      recipientId = ride.driverId
      recipientDriverId = ride.driverId
    } else {
      // Driver → Student: find the student on this ride
      // Use the first non-dropped passenger, or fall back to any passenger
      const passenger = ride.passengers.find((p) => p.status !== 'dropped') || ride.passengers[0]
      if (!passenger) {
        return reply.status(400).send({ success: false, error: { message: 'No passenger found on this ride to reply to' } })
      }
      recipientId = passenger.studentId
      recipientStudentId = passenger.studentId
    }

    const notifId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const doc = await NotificationModel.create({
      id: notifId,
      userId: recipientId,
      studentId: recipientStudentId,
      driverId: recipientDriverId,
      role: body.senderRole === 'student' ? 'driver' : 'student', // role of RECIPIENT
      type: 'message',
      priority: 'NORMAL',
      title: `Message from ${senderName}`,
      message: body.text.trim(),
      read: false,
      rideId: body.rideId,
      eventType: 'RIDE_MESSAGE',
      metadata: {
        senderId: body.senderId,
        senderName,
        senderRole: body.senderRole,
        recipientId,
        rideId: body.rideId,
        routeName: ride.routeName,
      },
    })

    realtimeService.broadcast('NOTIFICATION_ADDED', { notification: doc.toObject() })

    return { success: true, data: doc }
  })

  // ── Fetch full message thread for a ride ────────────────────────────────────
  // Returns all message-type notifications for this rideId (both directions).
  fastify.get('/messages/:rideId', async (request, reply) => {
    const { rideId } = request.params as { rideId: string }
    const msgs = await NotificationModel.find({ rideId, type: 'message' }).sort({ createdAt: 1 })
    return { success: true, data: msgs }
  })
  // Get notifications
  fastify.get('/', async (request) => {
    const query = (request.query as {
      userId?: string
      studentId?: string
      driverId?: string
      role?: string
      all?: string
      limit?: string
    }) || {}

    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10)))
    const userHeader = request.headers['x-user-id'] as string
    const driverHeader = request.headers['x-driver-id'] as string
    const authUser = (request as any).user

    const userId = authUser?.id || userHeader
    const userRole = (authUser?.role || query.role || '').toLowerCase()
    const driverId = userRole === 'driver' ? (userId || driverHeader) : driverHeader

    // If 'all=true' or requested by dispatcher/admin, return all operational notifications
    const isDispatcherOrAdmin =
      query.all === 'true' ||
      userRole === 'dispatcher' ||
      userRole === 'admin' ||
      userId === 'dispatcher' ||
      userId === 'admin' ||
      userId === 'admin1'

    if (isDispatcherOrAdmin) {
      const notifs = await NotificationModel.find({}).sort({ createdAt: -1 }).limit(limit)
      return { success: true, data: notifs }
    }

    const targetUserIds = [userId, query.userId, query.studentId].filter(Boolean) as string[]
    const targetDriverIds = [driverId, query.driverId].filter(Boolean) as string[]

    const orConditions: any[] = []

    if (targetUserIds.length > 0) {
      orConditions.push(
        { userId: { $in: targetUserIds } },
        { studentId: { $in: targetUserIds } }
      )
    }

    if (targetDriverIds.length > 0) {
      orConditions.push(
        { driverId: { $in: targetDriverIds } },
        { userId: { $in: targetDriverIds } }
      )
    }

    if (userRole) {
      orConditions.push({ role: userRole })
    }

    orConditions.push({ role: 'all' })

    const filter = orConditions.length > 0 ? { $or: orConditions } : {}
    const notifs = await NotificationModel.find(filter).sort({ createdAt: -1 }).limit(limit)

    return { success: true, data: notifs }
  })

  // Mark single as read
  fastify.post('/:id/read', async (request, reply) => {
    const { id } = request.params as { id: string }
    const notif = await NotificationModel.findOneAndUpdate(
      { id },
      { read: true },
      { new: true }
    )
    if (!notif) {
      return reply.status(404).send({ success: false, error: { message: 'Notification not found' } })
    }
    return { success: true, data: notif }
  })

  // Mark all as read
  fastify.post('/read-all', async (request) => {
    const userId = (request.headers['x-user-id'] as string)
    const driverId = (request.headers['x-driver-id'] as string)
    const body = (request.body as { userId?: string; role?: string; driverId?: string }) || {}

    const targetUserIds = [userId, body.userId].filter(Boolean) as string[]
    const targetDriverIds = [driverId, body.driverId].filter(Boolean) as string[]

    const orConditions: any[] = []
    if (targetUserIds.length > 0) {
      orConditions.push({ userId: { $in: targetUserIds } }, { studentId: { $in: targetUserIds } })
    }
    if (targetDriverIds.length > 0) {
      orConditions.push({ driverId: { $in: targetDriverIds } }, { userId: { $in: targetDriverIds } })
    }
    if (body.role) {
      orConditions.push({ role: body.role.toLowerCase() })
    }

    const filter = orConditions.length > 0 ? { $or: orConditions } : {}
    await NotificationModel.updateMany(filter, { read: true })

    return { success: true }
  })
}
