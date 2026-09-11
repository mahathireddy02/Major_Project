import { FastifyPluginAsync } from 'fastify'
import { NotificationModel } from '../models/Notification.js'

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
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
