import { FastifyPluginAsync } from 'fastify'
import { SafetyEventModel } from '../models/SafetyEvent.js'
import { safetyService } from '../services/safetyService.js'

export const safetyRoutes: FastifyPluginAsync = async (fastify) => {
  // Trigger emergency SOS
  fastify.post('/sos', async (request, reply) => {
    const body = request.body as {
      rideId: string
      userId?: string
      lat?: number
      lng?: number
    }

    if (!body.rideId) {
      return reply.status(400).send({ success: false, error: { message: 'rideId is required' } })
    }

    const userId = body.userId || (request.headers['x-user-id'] as string) || 's1'
    const event = await safetyService.triggerSOS(body.rideId, userId, body.lat, body.lng)

    return { success: true, data: event }
  })

  // Trigger route deviation
  fastify.post('/route-deviation', async (request, reply) => {
    const body = request.body as {
      rideId: string
      lat?: number
      lng?: number
    }

    if (!body.rideId) {
      return reply.status(400).send({ success: false, error: { message: 'rideId is required' } })
    }

    // Coordinates placing vehicle off-route (e.g. Unplanned Road)
    const lat = body.lat || 17.382
    const lng = body.lng || 78.472

    const result = await safetyService.checkRouteDeviation(body.rideId, lat, lng)
    return { success: true, data: result }
  })

  // List safety events
  fastify.get('/events', async (request) => {
    const query = request.query as { resolved?: string }
    const filter: any = {}
    if (query.resolved !== undefined) {
      filter.resolved = query.resolved === 'true'
    }

    const events = await SafetyEventModel.find(filter).sort({ createdAt: -1 })
    return { success: true, data: events }
  })

  // Resolve safety event
  fastify.post('/events/:id/resolve', async (request, reply) => {
    const { id } = request.params as { id: string }
    const resolved = await safetyService.resolveEvent(id)
    if (!resolved) {
      return reply.status(404).send({ success: false, error: { message: 'Safety event not found' } })
    }
    return { success: true, data: resolved }
  })
}
