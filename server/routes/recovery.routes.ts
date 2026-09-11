import { FastifyPluginAsync } from 'fastify'
import { recoveryService } from '../services/recoveryService.js'
import { RideModel } from '../models/Ride.js'
import { VehicleModel } from '../models/Vehicle.js'
import { RideRecoveryEventModel } from '../models/RideRecoveryEvent.js'
import { requireRoles } from '../middleware/auth.js'

export const recoveryRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Report Vehicle Breakdown & Trigger Automated Recovery
  fastify.post(
    '/vehicles/:vehicleId/breakdown',
    { preHandler: [requireRoles(['DRIVER', 'DISPATCHER', 'ADMIN'])] },
    async (request, reply) => {
      const { vehicleId } = request.params as { vehicleId: string }
      const body = (request.body as any) || {}
      const driverId = request.user?.id || body.driverId || 'd1'

      try {
        const result = await recoveryService.reportBreakdown({
          vehicleId,
          driverId,
          location: body.location,
          reason: body.reason || 'Vehicle breakdown / mechanical failure',
          trigger: request.user?.role === 'DISPATCHER' ? 'DISPATCHER_MANUAL' : 'DRIVER_REPORTED',
        })

        return reply.status(200).send({
          success: true,
          data: result,
        })
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          error: { message: err.message || 'Failed to report vehicle breakdown' },
        })
      }
    }
  )

  // 2. Trigger Recovery for an Active Ride directly
  fastify.post(
    '/rides/:rideId/recovery',
    { preHandler: [requireRoles(['DRIVER', 'DISPATCHER', 'ADMIN'])] },
    async (request, reply) => {
      const { rideId } = request.params as { rideId: string }
      const body = (request.body as any) || {}

      const ride = await RideModel.findOne({ id: rideId })
      if (!ride) {
        return reply.status(404).send({ success: false, error: { message: `Ride "${rideId}" not found` } })
      }

      try {
        const result = await recoveryService.reportBreakdown({
          vehicleId: ride.vehicleId,
          driverId: ride.driverId,
          location: body.location,
          reason: body.reason || 'Manual ride recovery triggered',
          trigger: 'DISPATCHER_MANUAL',
        })

        return reply.status(200).send({
          success: true,
          data: result,
        })
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          error: { message: err.message },
        })
      }
    }
  )

  // 3. Get Recovery Status for a Ride
  fastify.get('/rides/:rideId/recovery-status', async (request, reply) => {
    const { rideId } = request.params as { rideId: string }
    const event = await recoveryService.getRecoveryStatus(rideId)

    if (!event) {
      return reply.status(200).send({
        success: true,
        data: null,
        message: 'No recovery event on record for this ride',
      })
    }

    return reply.status(200).send({
      success: true,
      data: event,
    })
  })

  // 4. Get Scored Replacement Candidates for a Ride
  fastify.get(
    '/recovery/candidates/:rideId',
    { preHandler: [requireRoles(['DISPATCHER', 'ADMIN'])] },
    async (request, reply) => {
      const { rideId } = request.params as { rideId: string }
      const ride = await RideModel.findOne({ id: rideId })
      if (!ride) {
        return reply.status(404).send({ success: false, error: { message: `Ride "${rideId}" not found` } })
      }

      const breakdownLat = ride.breakdownLocation?.lat || ride.currentLat || 17.385
      const breakdownLng = ride.breakdownLocation?.lng || ride.currentLng || 78.486

      const candidates = await recoveryService.findAndScoreCandidates(
        ride,
        breakdownLat,
        breakdownLng,
        ride.vehicleId
      )

      return reply.status(200).send({
        success: true,
        data: {
          rideId,
          breakdownLocation: { lat: breakdownLat, lng: breakdownLng },
          candidates,
        },
      })
    }
  )

  // 5. Retry Recovery or Manual Override by Dispatcher
  fastify.post(
    '/recovery/:recoveryId/retry',
    { preHandler: [requireRoles(['DISPATCHER', 'ADMIN'])] },
    async (request, reply) => {
      const { recoveryId } = request.params as { recoveryId: string }
      const body = (request.body as any) || {}

      try {
        const result = await recoveryService.retryRecovery(recoveryId, body.replacementVehicleId)
        return reply.status(200).send({
          success: result.success,
          message: result.message,
        })
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          error: { message: err.message },
        })
      }
    }
  )

  // 6. Get All Recent Recovery Events (for Dispatcher Roster & Audit)
  fastify.get(
    '/recovery/history',
    { preHandler: [requireRoles(['DISPATCHER', 'ADMIN'])] },
    async (request, reply) => {
      const events = await RideRecoveryEventModel.find({}).sort({ createdAt: -1 }).limit(50)
      return reply.status(200).send({
        success: true,
        data: events,
      })
    }
  )
}