import { FastifyPluginAsync } from 'fastify'
import { pricingEngine } from '../services/pricingEngine.js'
import { RideModel } from '../models/Ride.js'
import { BookingModel } from '../models/Booking.js'
import { RideFareModel } from '../models/RideFare.js'
import { PricingEventModel } from '../models/PricingEvent.js'
import { PricingConfigModel } from '../models/PricingConfig.js'

export const pricingRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /estimate
   * Calculates a pre-booking fare estimate and breakdown range.
   */
  fastify.post('/estimate', async (request, reply) => {
    const body = request.body as {
      pickupName: string
      pickupLat: number
      pickupLng: number
      destinationName: string
      destinationLat: number
      destinationLng: number
      seats?: number
      rideId?: string
    }

    if (
      body.pickupLat === undefined ||
      body.pickupLng === undefined ||
      body.destinationLat === undefined ||
      body.destinationLng === undefined
    ) {
      return reply.status(400).send({
        success: false,
        error: { message: 'pickupLat, pickupLng, destinationLat, destinationLng are required.' },
      })
    }

    let candidateRide = null
    if (body.rideId) {
      candidateRide = await RideModel.findOne({ id: body.rideId })
    }

    try {
      const calcResult = await pricingEngine.calculatePassengerFare(
        {
          pickupName: body.pickupName || 'Pickup Location',
          pickupLat: body.pickupLat,
          pickupLng: body.pickupLng,
          destinationName: body.destinationName || 'Destination',
          destinationLat: body.destinationLat,
          destinationLng: body.destinationLng,
          seats: body.seats || 1,
        },
        candidateRide,
        { status: 'ESTIMATE' }
      )

      // Estimate range (+/- 10% to account for dynamic pooling)
      const minEst = Math.max(calcResult.breakdown.rates.minimumFare * (body.seats || 1), Math.round(calcResult.finalAmount * 0.92))
      const maxEst = Math.round(calcResult.finalAmount * 1.08)

      return {
        success: true,
        data: {
          currency: calcResult.currency,
          estimatedFare: calcResult.finalAmount,
          estimateRange: { min: minEst, max: maxEst },
          distanceKm: calcResult.distanceKm,
          durationMinutes: calcResult.durationMinutes,
          sharedSavings: calcResult.breakdown.sharedSavings,
          routeOverlapPercent: calcResult.routeOverlapPercent,
          breakdown: calcResult.breakdown,
          explanation: calcResult.explanation,
          pricingVersion: calcResult.pricingVersion,
          isHaversineFallback: calcResult.isHaversineFallback,
        },
      }
    } catch (err: any) {
      fastify.log.error(err)
      return reply.status(500).send({
        success: false,
        error: { message: err.message || 'Fare estimation failed' },
      })
    }
  })

  /**
   * POST /calculate
   * Calculate authoritative fare for a ride booking request.
   */
  fastify.post('/calculate', async (request, reply) => {
    const body = request.body as {
      studentId?: string
      pickupName: string
      pickupLat: number
      pickupLng: number
      destinationName: string
      destinationLat: number
      destinationLng: number
      seats?: number
      rideId: string
    }

    const ride = await RideModel.findOne({ id: body.rideId })
    if (!ride) {
      return reply.status(404).send({ success: false, error: { message: 'Ride not found' } })
    }

    try {
      const calcResult = await pricingEngine.calculatePassengerFare(
        {
          studentId: body.studentId,
          pickupName: body.pickupName,
          pickupLat: body.pickupLat,
          pickupLng: body.pickupLng,
          destinationName: body.destinationName,
          destinationLat: body.destinationLat,
          destinationLng: body.destinationLng,
          seats: body.seats || 1,
        },
        ride,
        { status: 'CONFIRMED' }
      )

      return { success: true, data: calcResult }
    } catch (err: any) {
      fastify.log.error(err)
      return reply.status(500).send({ success: false, error: { message: err.message } })
    }
  })

  /**
   * POST /recalculate
   * Force recalculate fare for a booking with audit trail.
   */
  fastify.post('/recalculate', async (request, reply) => {
    const body = request.body as {
      bookingId: string
      reason?: string
      forceAdjustAmount?: number
    }

    const booking = await BookingModel.findOne({ id: body.bookingId })
    if (!booking) {
      return reply.status(404).send({ success: false, error: { message: 'Booking not found' } })
    }

    const ride = await RideModel.findOne({ id: booking.rideId })
    const oldFare = booking.fare

    try {
      let finalFareAmount = oldFare
      let calcResult: any

      if (body.forceAdjustAmount !== undefined) {
        // Manual override from dispatcher
        finalFareAmount = body.forceAdjustAmount
        const eventId = `pe-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        await PricingEventModel.create({
          id: eventId,
          rideId: booking.rideId,
          bookingId: booking.id,
          eventType: 'MANUAL_DISPATCH_ADJUSTMENT',
          oldAmount: oldFare,
          newAmount: finalFareAmount,
          trigger: 'DISPATCHER_OVERRIDE',
          reason: body.reason || 'Manual dispatcher adjustment',
        })

        await RideFareModel.findOneAndUpdate(
          { bookingId: booking.id },
          {
            finalAmount: finalFareAmount,
            finalAmountPaise: Math.round(finalFareAmount * 100),
            calculationReason: body.reason || 'Manual dispatcher adjustment',
          }
        )

        booking.fare = finalFareAmount
        await booking.save()
      } else {
        // Re-run deterministic pricing engine
        calcResult = await pricingEngine.calculatePassengerFare(
          {
            studentId: booking.studentId,
            pickupName: booking.pickupName || booking.pickup,
            pickupLat: booking.pickupLat || ride?.pickupPoints?.[0]?.lat || 17.4934,
            pickupLng: booking.pickupLng || ride?.pickupPoints?.[0]?.lng || 78.3995,
            destinationName: booking.destinationName || booking.destination,
            destinationLat: booking.destinationLat || ride?.destinationLat || 17.398,
            destinationLng: booking.destinationLng || ride?.destinationLng || 78.479,
            seats: booking.seats || 1,
          },
          ride,
          {
            status: 'RECALCULATED',
            trigger: body.reason || 'PRICE_RECALCULATED',
            bookingId: booking.id,
          }
        )

        await pricingEngine.saveAuthoritativeFare(
          booking.id,
          booking.rideId,
          booking.studentId,
          calcResult,
          body.reason || 'Dispatcher forced recalculation',
          'PRICE_RECALCULATED'
        )
        finalFareAmount = calcResult.finalAmount
      }

      await pricingEngine.updateRideAggregates(booking.rideId)

      return {
        success: true,
        data: {
          bookingId: booking.id,
          oldAmount: oldFare,
          newAmount: finalFareAmount,
          reason: body.reason || 'Price recalculated successfully',
        },
      }
    } catch (err: any) {
      fastify.log.error(err)
      return reply.status(500).send({ success: false, error: { message: err.message } })
    }
  })

  /**
   * GET /booking/:bookingId
   * Retrieve authoritative fare breakdown for a booking.
   */
  fastify.get('/booking/:bookingId', async (request, reply) => {
    const { bookingId } = request.params as { bookingId: string }
    const fare = await RideFareModel.findOne({ bookingId })
    if (!fare) {
      // Check if booking has embedded fareBreakdown
      const booking = await BookingModel.findOne({ id: bookingId })
      if (booking && booking.fareBreakdown) {
        return {
          success: true,
          data: {
            bookingId: booking.id,
            rideId: booking.rideId,
            finalAmount: booking.fare,
            currency: 'INR',
            breakdown: booking.fareBreakdown,
            isLocked: booking.isPriceLocked ?? true,
          },
        }
      }
      return reply.status(404).send({ success: false, error: { message: 'Fare record not found' } })
    }

    return { success: true, data: fare }
  })

  /**
   * GET /ride/:rideId
   * Retrieve all individual passenger fares and vehicle rollup for a ride.
   */
  fastify.get('/ride/:rideId', async (request, reply) => {
    const { rideId } = request.params as { rideId: string }
    const ride = await RideModel.findOne({ id: rideId })
    if (!ride) {
      return reply.status(404).send({ success: false, error: { message: 'Ride not found' } })
    }

    const fares = await RideFareModel.find({ rideId })
    const bookings = await BookingModel.find({ rideId, status: { $ne: 'cancelled' } })

    const passengerFares = bookings.map((b) => {
      const fare = fares.find((f) => f.bookingId === b.id)
      return {
        bookingId: b.id,
        studentId: b.studentId,
        studentName: b.studentName || 'Student',
        pickup: b.pickupName || b.pickup,
        destination: b.destinationName || b.destination,
        seats: b.seats || 1,
        fare: b.fare,
        fareBreakdown: fare?.breakdown || b.fareBreakdown,
        isLocked: fare?.isLocked ?? true,
        calculationStatus: fare?.calculationStatus || 'CONFIRMED',
        distanceKm: fare?.distanceKm,
        durationMinutes: fare?.durationMinutes,
        sharedSavings: fare?.sharedSavingsAmount || 0,
        routeOverlapPercent: fare?.routeOverlapPercent || 0,
      }
    })

    return {
      success: true,
      data: {
        rideId,
        routeName: ride.routeName,
        vehicleId: ride.vehicleId,
        capacity: ride.capacity,
        bookedSeats: ride.bookedSeats,
        totalRevenue: passengerFares.reduce((sum, p) => sum + p.fare, 0),
        averageFare: passengerFares.length > 0 ? Math.round(passengerFares.reduce((sum, p) => sum + p.fare, 0) / passengerFares.length) : 0,
        totalSharedSavings: passengerFares.reduce((sum, p) => sum + p.sharedSavings, 0),
        passengers: passengerFares,
      },
    }
  })

  /**
   * GET /ride/:rideId/events
   * Pricing audit history for a ride.
   */
  fastify.get('/ride/:rideId/events', async (request) => {
    const { rideId } = request.params as { rideId: string }
    const events = await PricingEventModel.find({ rideId }).sort({ createdAt: -1 })
    return { success: true, data: events }
  })

  /**
   * GET /config
   * Active pricing configuration.
   */
  fastify.get('/config', async () => {
    const config = await pricingEngine.getActiveConfig()
    return { success: true, data: config }
  })

  /**
   * PUT /config
   * Update pricing rules.
   */
  fastify.put('/config', async (request, reply) => {
    const body = request.body as any
    try {
      let config = await PricingConfigModel.findOne({ isActive: true })
      if (!config) {
        config = await PricingConfigModel.create({
          id: `pc-${Date.now()}`,
          name: body.name || 'Campus Mobility Pricing Policy',
          baseFare: body.baseFare ?? 20,
          perKmRate: body.perKmRate ?? 8,
          perMinuteRate: body.perMinuteRate ?? 1,
          minimumFare: body.minimumFare ?? 30,
          maximumFare: body.maximumFare ?? 500,
          sharedDiscountCap: body.sharedDiscountCap ?? 0.30,
          aiAdjustmentCap: body.aiAdjustmentCap ?? 0.10,
          isActive: true,
        })
      } else {
        if (body.baseFare !== undefined) config.baseFare = body.baseFare
        if (body.perKmRate !== undefined) config.perKmRate = body.perKmRate
        if (body.perMinuteRate !== undefined) config.perMinuteRate = body.perMinuteRate
        if (body.minimumFare !== undefined) config.minimumFare = body.minimumFare
        if (body.maximumFare !== undefined) config.maximumFare = body.maximumFare
        if (body.sharedDiscountCap !== undefined) config.sharedDiscountCap = body.sharedDiscountCap
        if (body.aiAdjustmentCap !== undefined) config.aiAdjustmentCap = body.aiAdjustmentCap
        if (body.name) config.name = body.name
        await config.save()
      }

      return { success: true, data: config }
    } catch (err: any) {
      fastify.log.error(err)
      return reply.status(500).send({ success: false, error: { message: err.message } })
    }
  })

  /**
   * GET /fleet-metrics
   * Fleet-level pricing KPIs for dispatcher dashboard.
   */
  fastify.get('/fleet-metrics', async () => {
    const metrics = await pricingEngine.getFleetMetrics()
    return { success: true, data: metrics }
  })
}
