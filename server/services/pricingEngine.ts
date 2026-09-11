import { ENV } from '../config/env.js'
import { PricingConfigModel, IPricingConfig } from '../models/PricingConfig.js'
import { RideFareModel, IRideFare, IFareBreakdown, FareCalculationStatus } from '../models/RideFare.js'
import { PricingEventModel, PricingEventType } from '../models/PricingEvent.js'
import { RideModel, IRide } from '../models/Ride.js'
import { BookingModel, IBooking } from '../models/Booking.js'
import { RideRequestModel } from '../models/RideRequest.js'
import { routingService, RouteResult } from './routingService.js'
import { deepSeekPricingService, DeepSeekPricingContext } from './deepSeekPricingService.js'
import { realtimeService } from './realtimeService.js'

export interface PassengerTripRequest {
  studentId?: string
  studentName?: string
  pickupName: string
  pickupLat: number
  pickupLng: number
  destinationName: string
  destinationLat: number
  destinationLng: number
  seats?: number
}

export interface FareCalculationResult {
  bookingId?: string
  rideId?: string
  currency: string
  finalAmount: number
  finalAmountPaise: number
  distanceKm: number
  durationMinutes: number
  routeOverlapPercent: number
  additionalDistanceKm: number
  additionalDurationMinutes: number
  breakdown: IFareBreakdown
  explanation: string
  isLocked: boolean
  isHaversineFallback: boolean
  pricingVersion: string
}

export class PricingEngine {
  private defaultVersion = 'v1.0'

  /**
   * Fetch active pricing configuration from DB, falling back to ENV defaults.
   */
  async getActiveConfig(): Promise<IPricingConfig | any> {
    try {
      const dbConfig = await PricingConfigModel.findOne({ isActive: true }).sort({ createdAt: -1 })
      if (dbConfig) return dbConfig
    } catch (err: any) {
      console.warn(`[PricingEngine] Could not load DB config: ${err.message}`)
    }

    // Fallback to environment defaults
    return {
      name: 'Default Campus Policy',
      baseFare: ENV.PRICING_BASE_FARE,
      perKmRate: ENV.PRICING_PER_KM,
      perMinuteRate: ENV.PRICING_PER_MINUTE,
      minimumFare: ENV.PRICING_MIN_FARE,
      maximumFare: ENV.PRICING_MAX_FARE,
      sharedDiscountCap: ENV.PRICING_SHARED_DISCOUNT_MAX,
      aiAdjustmentCap:
        ENV.PRICING_AI_ADJUSTMENT_MAX_PERCENT > 1
          ? ENV.PRICING_AI_ADJUSTMENT_MAX_PERCENT / 100
          : ENV.PRICING_AI_ADJUSTMENT_MAX_PERCENT,
      isActive: true,
      pricingVersion: this.defaultVersion,
    }
  }

  /**
   * Determine real-time campus demand tier from recent requests vs available vehicles.
   */
  async calculateDemandLevel(): Promise<{ level: 'LOW' | 'NORMAL' | 'HIGH'; score: number }> {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
      const recentRequestsCount = await RideRequestModel.countDocuments({
        createdAt: { $gte: fifteenMinutesAgo },
      })
      const activeRidesCount = await RideModel.countDocuments({
        status: { $in: ['waiting', 'boarding', 'active'] },
      })

      const ratio = activeRidesCount > 0 ? recentRequestsCount / activeRidesCount : 1.0

      if (ratio > 2.0 || recentRequestsCount >= 15) {
        return { level: 'HIGH', score: 1.10 }
      }
      if (ratio < 0.5 && recentRequestsCount < 3) {
        return { level: 'LOW', score: 0.95 }
      }
      return { level: 'NORMAL', score: 1.0 }
    } catch {
      return { level: 'NORMAL', score: 1.0 }
    }
  }

  /**
   * Calculate deterministic passenger fare based on OSRM road geometry, shared efficiency, and AI advisory.
   */
  async calculatePassengerFare(
    trip: PassengerTripRequest,
    ride?: IRide | null,
    options: {
      status?: FareCalculationStatus
      trigger?: string
      pricingVersion?: string
      bookingId?: string
      skipAi?: boolean
    } = {}
  ): Promise<FareCalculationResult> {
    const config = await this.getActiveConfig()
    const pricingVersion = options.pricingVersion || config.pricingVersion || this.defaultVersion
    const seats = Math.max(1, trip.seats || 1)

    // 1. Calculate actual direct road route for this passenger (pickup -> destination)
    const privateWaypoints: [number, number][] = [
      [trip.pickupLat, trip.pickupLng],
      [trip.destinationLat, trip.destinationLng],
    ]
    const privateRoute: RouteResult = await routingService.getRoute(privateWaypoints)
    if (privateRoute.isHaversineFallback) {
      console.warn(
        `[PricingEngine] OSRM unavailable — using haversine straight-line distance for fare calculation. ` +
        `Road distance may differ. trip=${trip.pickupName} → ${trip.destinationName}`
      )
    }
    const distanceKm = Math.max(0.2, Number((privateRoute.distanceMeters / 1000).toFixed(2)))
    const durationMinutes = Math.max(1, Math.round(privateRoute.durationSeconds / 60))

    // 2. Shared route efficiency & incremental detour analysis
    let additionalDistanceKm = 0
    let additionalDurationMinutes = 0
    let routeOverlapPercent = 0
    let occupancy = ride?.bookedSeats || 1
    const capacity = ride?.capacity || 6

    if (
      ride &&
      ((ride.tripRoute && ride.tripRoute.geometry && ride.tripRoute.geometry.length >= 2) ||
        (ride.routeCoordinates && ride.routeCoordinates.length >= 2))
    ) {
      // Vehicle has an existing active route
      const currentRouteDistMeters =
        ride.tripRoute?.distanceMeters || (ride.distanceKm ? ride.distanceKm * 1000 : 10000)
      const currentRouteDurationSeconds =
        ride.tripRoute?.durationSeconds || (ride.distanceKm ? ride.distanceKm * 140 : 1200)

      // Waypoints with passenger added
      const existingWaypoints: [number, number][] = [
        [
          ride.currentLat || ride.tripRoute?.origin?.lat || ride.routeCoordinates?.[0]?.[0] || ride.destinationLat,
          ride.currentLng || ride.tripRoute?.origin?.lng || ride.routeCoordinates?.[0]?.[1] || ride.destinationLng,
        ],
        ...(ride.stops || []).map((s) => [s.latitude, s.longitude] as [number, number]),
        [ride.destinationLat, ride.destinationLng],
      ]

      // Evaluate detour for pickup insertion
      const detour = await routingService.calculateDetour(existingWaypoints, [
        trip.pickupLat,
        trip.pickupLng,
      ])

      additionalDistanceKm = Number((detour.extraDistanceMeters / 1000).toFixed(2))
      additionalDurationMinutes = Math.round(detour.extraDurationSeconds / 60)

      // Route overlap: proportion of passenger's private distance that is already shared with the vehicle route
      // If incremental distance is 1.5 km on a 6 km trip, 4.5 km (75%) is overlapped
      const overlapRatio = Math.max(0, Math.min(1, 1 - (additionalDistanceKm / distanceKm)))
      routeOverlapPercent = Math.round(overlapRatio * 100)
    } else {
      // First passenger or standalone private trip
      routeOverlapPercent = 0
      additionalDistanceKm = distanceKm
      additionalDurationMinutes = durationMinutes
    }

    // 3. Demand tier
    const demandInfo = await this.calculateDemandLevel()

    // 4. Deterministic Component Calculations (in Rupees, converted to integer paise)
    const baseFareRupees = config.baseFare
    const distanceFareRupees = Number((distanceKm * config.perKmRate).toFixed(2))
    const durationFareRupees = Number((durationMinutes * config.perMinuteRate).toFixed(2))

    // Route contribution: fair surcharge for passenger-induced route extension on shared pooled ride
    const routeContributionRupees =
      ride && (ride.bookedSeats > 0 || (ride.passengers && ride.passengers.length > 0))
        ? Number(
            (additionalDistanceKm * (config.perKmRate * 0.3) + additionalDurationMinutes * (config.perMinuteRate * 0.2)).toFixed(2)
          )
        : 0

    // Subtotal before savings & adjustments
    const privateEstimatedFare = baseFareRupees + distanceFareRupees + durationFareRupees

    // Shared Savings Calculation (Bounded):
    // Higher overlap + higher occupancy = higher pooling savings
    // Clamped strictly to config.sharedDiscountCap (e.g. max 30%)
    let sharedSavingsRupees = 0
    if (routeOverlapPercent > 10 && occupancy > 1) {
      const overlapWeight = (routeOverlapPercent / 100) * 0.7
      const occupancyWeight = Math.min(1, (occupancy - 1) / (capacity - 1 || 1)) * 0.3
      const calculatedSavingsFactor = Math.min(config.sharedDiscountCap, (overlapWeight + occupancyWeight) * config.sharedDiscountCap)
      sharedSavingsRupees = Number((privateEstimatedFare * calculatedSavingsFactor).toFixed(2))
    }

    // Demand adjustment
    let demandAdjustmentRupees = 0
    if (demandInfo.level === 'HIGH') {
      demandAdjustmentRupees = Number(((baseFareRupees + distanceFareRupees) * 0.08).toFixed(2)) // +8%
    } else if (demandInfo.level === 'LOW') {
      demandAdjustmentRupees = Number(((baseFareRupees + distanceFareRupees) * -0.04).toFixed(2)) // -4%
    }

    // 5. DeepSeek AI Advisory Layer
    let aiAdjustmentRupees = 0
    let aiAdviceSummary: any = undefined
    let aiExplanationText: string | undefined = undefined

    if (!options.skipAi && ENV.DEEPSEEK_ENABLED) {
      const aiContext: DeepSeekPricingContext = {
        vehicleCapacity: capacity,
        occupiedSeats: occupancy,
        distanceKm,
        durationMinutes,
        routeOverlapPercent,
        additionalDistanceKm,
        additionalDurationMinutes,
        demandLevel: demandInfo.level,
        passengerCount: (ride?.passengers?.length || 0) + 1,
      }

      const aiResult = await deepSeekPricingService.getPricingAdvisory(aiContext)

      if (aiResult.data) {
        // AI Guardrails: Backend clamps recommendation strictly within [-aiAdjustmentCap, +aiAdjustmentCap]
        const recommendedDelta = (aiResult.data.recommendedDemandFactor - 1.0)
        const maxCap = config.aiAdjustmentCap || 0.10
        const clampedDelta = Math.max(-maxCap, Math.min(maxCap, recommendedDelta))

        aiAdjustmentRupees = Number((privateEstimatedFare * clampedDelta).toFixed(2))
        aiAdviceSummary = {
          recommendedDemandFactor: aiResult.data.recommendedDemandFactor,
          recommendedSharedSavingsFactor: aiResult.data.recommendedSharedSavingsFactor,
          confidence: aiResult.data.confidence,
          reason: aiResult.data.reason,
          anomaly: aiResult.data.anomaly,
          appliedAdjustmentPercent: Math.round(clampedDelta * 100),
          source: aiResult.source,
        }
        aiExplanationText = aiResult.data.reason
      }
    }

    // 6. Compute Raw Fare and enforce bounds (Minimum & Maximum)
    const subtotal =
      baseFareRupees +
      distanceFareRupees +
      durationFareRupees +
      routeContributionRupees +
      demandAdjustmentRupees -
      sharedSavingsRupees +
      aiAdjustmentRupees

    // Seat multiplier for group booking
    const totalFareForSeats = subtotal * seats

    // Strict clamping: never < minimumFare, never > maximumFare
    const boundedFareRupees = Math.max(
      config.minimumFare * seats,
      Math.min(config.maximumFare * seats, Math.round(totalFareForSeats))
    )

    // Integer paise arithmetic
    const finalFarePaise = Math.round(boundedFareRupees * 100)

    // 6b. Critical sanity validation: if distance is significant but fare equals baseFare, the pricing pipeline has failed
    if (distanceKm > 1.0 && config.perKmRate > 0 && boundedFareRupees === config.baseFare * seats) {
      console.error(
        `[PricingEngine] CRITICAL: distanceKm=${distanceKm}, perKmRate=${config.perKmRate}, ` +
        `distanceFare=${distanceFareRupees}, finalFare=${boundedFareRupees} === baseFare*seats=${config.baseFare * seats}. ` +
        `This likely indicates a zero-distance route or misconfigured pricing.`
      )
    }

    // Diagnostic structured logging per calculation
    console.log(
      `[PricingEngine] distanceKm=${distanceKm} durationMin=${durationMinutes} ` +
      `baseFare=${baseFareRupees} distanceFare=${distanceFareRupees} durationFare=${durationFareRupees} ` +
      `routeContrib=${routeContributionRupees} sharedSavings=${sharedSavingsRupees} ` +
      `aiAdj=${aiAdjustmentRupees} subtotal=${subtotal} ` +
      `bounded=₹${boundedFareRupees} seats=${seats} status=${options.status || 'ESTIMATE'}`
    )

    // 7. Human-readable explainability text
    const explanation =
      `Your fare is ₹${boundedFareRupees}. ` +
      `${distanceKm} km road distance, ${durationMinutes} min estimated travel time, ` +
      `${routeOverlapPercent}% route overlap with co-passengers` +
      (sharedSavingsRupees > 0 ? `, ₹${Math.round(sharedSavingsRupees * seats)} shared-ride savings.` : '.') +
      (aiExplanationText ? ` [AI Note: ${aiExplanationText}]` : '')

    const breakdown: IFareBreakdown = {
      baseFare: baseFareRupees * seats,
      distanceFare: distanceFareRupees * seats,
      durationFare: durationFareRupees * seats,
      routeContribution: routeContributionRupees * seats,
      demandAdjustment: demandAdjustmentRupees * seats,
      sharedSavings: sharedSavingsRupees * seats,
      aiAdjustment: aiAdjustmentRupees * seats,
      finalFare: boundedFareRupees,
      finalFarePaise,
      currency: config.currency || 'INR',
      rates: {
        perKm: config.perKmRate,
        perMinute: config.perMinuteRate,
        base: config.baseFare,
        minimumFare: config.minimumFare,
        maximumFare: config.maximumFare,
      },
      metrics: {
        distanceKm,
        durationMinutes,
        routeOverlapPercent,
        additionalDistanceKm,
        additionalDurationMinutes,
        occupancy,
        capacity,
        demandTier: demandInfo.level,
      },
      explanation,
      aiAdvice: aiAdviceSummary,
    }

    return {
      bookingId: options.bookingId,
      rideId: ride?.id,
      currency: 'INR',
      finalAmount: boundedFareRupees,
      finalAmountPaise: finalFarePaise,
      distanceKm,
      durationMinutes,
      routeOverlapPercent,
      additionalDistanceKm,
      additionalDurationMinutes,
      breakdown,
      explanation,
      isLocked: options.status === 'CONFIRMED' || options.status === 'LOCKED',
      isHaversineFallback: !!privateRoute.isHaversineFallback,
      pricingVersion,
    }
  }

  /**
   * Persist authoritative RideFare record in MongoDB and emit audit event.
   */
  async saveAuthoritativeFare(
    bookingId: string,
    rideId: string,
    studentId: string,
    calcResult: FareCalculationResult,
    trigger: string,
    eventType: PricingEventType = 'INITIAL_CALCULATION'
  ): Promise<IRideFare> {
    const existingFare = await RideFareModel.findOne({ bookingId })
    const oldAmount = existingFare?.finalAmount

    const fareData = {
      id: existingFare?.id || `fare-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      bookingId,
      rideId,
      passengerId: studentId,
      currency: calcResult.currency,
      baseAmount: calcResult.breakdown.baseFare,
      distanceAmount: calcResult.breakdown.distanceFare,
      timeAmount: calcResult.breakdown.durationFare,
      routeContributionAmount: calcResult.breakdown.routeContribution,
      sharedSavingsAmount: calcResult.breakdown.sharedSavings,
      demandAdjustmentAmount: calcResult.breakdown.demandAdjustment,
      aiAdjustmentAmount: calcResult.breakdown.aiAdjustment,
      finalAmount: calcResult.finalAmount,
      finalAmountPaise: calcResult.finalAmountPaise,
      distanceKm: calcResult.distanceKm,
      durationMinutes: calcResult.durationMinutes,
      routeOverlapPercent: calcResult.routeOverlapPercent,
      additionalDistanceKm: calcResult.additionalDistanceKm,
      additionalDurationMinutes: calcResult.additionalDurationMinutes,
      occupancyAtCalculation: calcResult.breakdown.metrics.occupancy,
      pricingVersion: calcResult.pricingVersion,
      calculationStatus: 'CONFIRMED' as FareCalculationStatus,
      calculationReason: trigger,
      aiExplanation: calcResult.breakdown.aiAdvice?.reason,
      breakdown: calcResult.breakdown,
      isLocked: true,
      lockedAt: new Date(),
    }

    const savedFare = await RideFareModel.findOneAndUpdate(
      { bookingId },
      fareData,
      { upsert: true, new: true }
    )

    // Update Booking with fareId and breakdown
    await BookingModel.findOneAndUpdate(
      { id: bookingId },
      {
        fare: calcResult.finalAmount,
        fareId: savedFare.id,
        fareBreakdown: calcResult.breakdown,
        isPriceLocked: true,
        pricingVersion: calcResult.pricingVersion,
      }
    )

    // Record immutable audit event
    const eventId = `pe-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    await PricingEventModel.create({
      id: eventId,
      rideId,
      bookingId,
      eventType,
      oldAmount,
      newAmount: calcResult.finalAmount,
      trigger,
      reason: calcResult.explanation,
      inputSnapshot: {
        distanceKm: calcResult.distanceKm,
        durationMinutes: calcResult.durationMinutes,
        overlapPercent: calcResult.routeOverlapPercent,
        occupancy: calcResult.breakdown.metrics.occupancy,
      },
      calculationSnapshot: calcResult.breakdown,
    })

    // Recompute ride-level aggregates
    await this.updateRideAggregates(rideId)

    // Broadcast Realtime Event
    realtimeService.broadcast('PRICING_UPDATED' as any, {
      rideId,
      bookingId,
      fare: savedFare,
      eventType,
    })

    return savedFare
  }

  /**
   * Recalculate vehicle aggregates (total revenue, average fare, total savings)
   */
  async updateRideAggregates(rideId: string): Promise<void> {
    try {
      const activeBookings = await BookingModel.find({
        rideId,
        status: { $ne: 'cancelled' },
      })

      const totalFare = activeBookings.reduce((sum, b) => sum + (b.fare || 0), 0)
      const avgFare = activeBookings.length > 0 ? Math.round(totalFare / activeBookings.length) : 0

      // Sum shared savings from ride_fares
      const fares = await RideFareModel.find({ rideId })
      const totalSavings = fares.reduce((sum, f) => sum + (f.sharedSavingsAmount || 0), 0)

      await RideModel.findOneAndUpdate(
        { id: rideId },
        {
          totalFareAmount: totalFare,
          averageFare: avgFare,
          totalSharedSavings: totalSavings,
        }
      )
    } catch (err: any) {
      console.warn(`[PricingEngine] Could not update ride aggregates: ${err.message}`)
    }
  }

  /**
   * Calculate fleet-wide real pricing intelligence metrics for dispatcher.
   */
  async getFleetMetrics(): Promise<{
    averageFarePerPassenger: number
    totalRevenue: number
    averageSharedSavings: number
    seatUtilization: number
    activeRidesCount: number
    totalPassengersCount: number
    demandLevel: 'LOW' | 'NORMAL' | 'HIGH'
  }> {
    const activeRides = await RideModel.find({
      status: { $in: ['waiting', 'boarding', 'active'] },
    })

    const allConfirmedFares = await RideFareModel.find({
      calculationStatus: { $in: ['CONFIRMED', 'LOCKED', 'RECALCULATED'] },
    })

    const totalRevenue = allConfirmedFares.reduce((sum, f) => sum + f.finalAmount, 0)
    const averageFare = allConfirmedFares.length > 0 ? Math.round(totalRevenue / allConfirmedFares.length) : 25
    const totalSavings = allConfirmedFares.reduce((sum, f) => sum + (f.sharedSavingsAmount || 0), 0)
    const averageSavings = allConfirmedFares.length > 0 ? Math.round(totalSavings / allConfirmedFares.length) : 0

    let totalCapacity = 0
    let totalBooked = 0
    for (const r of activeRides) {
      totalCapacity += r.capacity || 6
      totalBooked += r.bookedSeats || 0
    }
    const seatUtilization = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0

    const demand = await this.calculateDemandLevel()

    return {
      averageFarePerPassenger: averageFare,
      totalRevenue,
      averageSharedSavings: averageSavings,
      seatUtilization,
      activeRidesCount: activeRides.length,
      totalPassengersCount: allConfirmedFares.length,
      demandLevel: demand.level,
    }
  }

  /**
   * Handle passenger cancellation:
   * Releases booked capacity, preserves locked fares for remaining co-passengers,
   * logs a CANCELLATION_ADJUSTMENT event in the audit trail, and returns updated seat stats.
   */
  async handlePassengerCancellation(options: {
    rideId: string
    cancelledPassengerId: string
    cancelledUserId?: string
    reason?: string
  }): Promise<{
    bookedSeats: number
    seatsAvailable: number
    rideId: string
  }> {
    const ride = await RideModel.findOne({ id: options.rideId })
    if (!ride) throw new Error(`Ride ${options.rideId} not found`)

    // Find passenger
    const passengerIndex = ride.passengers.findIndex(
      (p: any) => p.id === options.cancelledPassengerId || p.studentId === options.cancelledUserId || p.userId === options.cancelledUserId
    )

    let cancelledFare = 0
    if (passengerIndex !== -1) {
      cancelledFare = ride.passengers[passengerIndex].fare || 0
      ride.passengers.splice(passengerIndex, 1)
    }

    ride.bookedSeats = Math.max(0, ride.bookedSeats - 1)

    // Recompute totalFareAmount and averageFare while preserving locked fares of remaining passengers
    ride.totalFareAmount = ride.passengers.reduce((sum: number, p: any) => sum + (p.fare || 0), 0)
    ride.averageFare = ride.passengers.length > 0 ? Math.round(ride.totalFareAmount / ride.passengers.length) : 0

    await ride.save()

    // Log pricing event audit entry
    await PricingEventModel.create({
      id: `evt_cancel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rideId: ride.id,
      bookingId: options.cancelledPassengerId,
      eventType: 'PASSENGER_CANCELLED',
      oldAmount: cancelledFare,
      newAmount: ride.totalFareAmount,
      trigger: 'PASSENGER_CANCELLATION',
      reason: options.reason || 'Passenger cancelled ride reservation.',
      inputSnapshot: {
        cancelledPassengerId: options.cancelledPassengerId,
        cancelledUserId: options.cancelledUserId,
      },
      calculationSnapshot: {
        remainingBookedSeats: ride.bookedSeats,
        capacity: ride.capacity,
        totalFareAmount: ride.totalFareAmount,
      },
      createdAt: new Date(),
    })

    return {
      bookedSeats: ride.bookedSeats,
      seatsAvailable: ride.capacity - ride.bookedSeats,
      rideId: ride.id,
    }
  }
}

export const pricingEngine = new PricingEngine()
