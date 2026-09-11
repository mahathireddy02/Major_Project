import { FastifyPluginAsync } from 'fastify'
import { NotificationModel } from '../models/Notification.js'

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  // Get notifications
  fastify.get('/', async (request) => {
    const userId = (request.headers['x-user-id'] as string)
    if (!userId) return { success: true, data: [] }
    const notifs = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(50)
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
    if (!userId) return { success: true }
    await NotificationModel.updateMany({ userId }, { read: true })
    return { success: true }
  })
}
