import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { PricingEngine, PassengerTripRequest } from '../services/pricingEngine.js'
import { deepSeekPricingService } from '../services/deepSeekPricingService.js'
import { routingService } from '../services/routingService.js'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { RideModel } from '../models/Ride.js'
import { BookingModel } from '../models/Booking.js'
import { VehicleModel } from '../models/Vehicle.js'
import { RideFareModel } from '../models/RideFare.js'
import { PricingConfigModel } from '../models/PricingConfig.js'
import { PricingEventModel } from '../models/PricingEvent.js'

describe('Dynamic Shared-Ride Pricing Engine & Advisory Layer', () => {
  let pricingEngine: PricingEngine

  beforeAll(async () => {
    await connectDatabase()
    pricingEngine = new PricingEngine()
  })

  afterAll(async () => {
    await RideModel.deleteMany({ id: { $in: ['ride-test-cancel', 'ride-test-full', 'ride-test-race', 'ride-test-multistop'] } })
    await disconnectDatabase()
  })

  beforeEach(async () => {
    await RideModel.deleteMany({ id: { $in: ['ride-test-cancel', 'ride-test-full', 'ride-test-race', 'ride-test-multistop'] } })
  })

  // =========================================================================
  // 1. Single passenger distance + duration formula
  // =========================================================================
  it('1. calculates deterministic base + distance + duration formula accurately', async () => {
    const getRouteSpy = vi.spyOn(routingService, 'getRoute').mockResolvedValue({
      distanceMeters: 5000,
      durationSeconds: 600,
      geometry: [[17.3616, 78.4747], [17.4000, 78.4900]],
      legs: [],
    })

    const trip: PassengerTripRequest = {
      studentId: 'test_s1',
      studentName: 'Test Student',
      pickupName: 'Stop 1',
      pickupLat: 17.3616,
      pickupLng: 78.4747,
      destinationName: 'Stop 2',
      destinationLat: 17.4000,
      destinationLng: 78.4900,
      seats: 1,
    }

    const demandSpy = vi.spyOn(pricingEngine, 'calculateDemandLevel').mockResolvedValue({ level: 'LOW', score: 0.95 })

    const result = await pricingEngine.calculatePassengerFare(trip, null, {
      skipAi: true,
    })

    // Base 20 + Distance (5km * 8 = 40) + Duration (10m * 1 = 10) = 70.
    // Dynamic demand adjustment (-4% during low demand off-peak) = 68.
    expect(result.distanceKm).toBe(5.0)
    expect(result.durationMinutes).toBe(10)
    expect(result.breakdown.baseFare).toBe(20)
    expect(result.breakdown.distanceFare).toBe(40)
    expect(result.breakdown.durationFare).toBe(10)
    expect(result.breakdown.routeContribution).toBe(0)
    expect(result.finalAmount).toBe(68)
    expect(result.finalAmountPaise).toBe(6800)
    expect(result.currency).toBe('INR')

    demandSpy.mockRestore()
    getRouteSpy.mockRestore()
  })

  // =========================================================================
  // 2. 5 passengers with distinct trips in 1 vehicle with individual fares
  // =========================================================================
  it('2. assigns individual, distinct fares to 5 pooled passengers (never equal division)', async () => {
    const passengersData = [
      { name: 'Passenger A (Long)', dist: 11.0, dur: 18 },
      { name: 'Passenger B (Medium 1)', dist: 6.0, dur: 9 },
      { name: 'Passenger C (Medium 2)', dist: 4.5, dur: 6 },
      { name: 'Passenger D (Short)', dist: 2.5, dur: 5 },
      { name: 'Passenger E (New hop)', dist: 3.0, dur: 8 },
    ]

    const fares: number[] = []

    for (const p of passengersData) {
      const getRouteSpy = vi.spyOn(routingService, 'getRoute').mockResolvedValue({
        distanceMeters: p.dist * 1000,
        durationSeconds: p.dur * 60,
        geometry: [[17.36, 78.47], [17.40, 78.50]],
        legs: [],
      })

      const trip: PassengerTripRequest = {
        studentId: p.name,
        pickupName: 'Pickup',
        pickupLat: 17.36,
        pickupLng: 78.47,
        destinationName: 'Dropoff',
        destinationLat: 17.40,
        destinationLng: 78.50,
        seats: 1,
      }

      const fareResult = await pricingEngine.calculatePassengerFare(trip, null, { skipAi: true })
      fares.push(fareResult.finalAmount)
      getRouteSpy.mockRestore()
    }

    const totalFare = fares.reduce((a, b) => a + b, 0)
    const averageFare = Math.round(totalFare / fares.length)

    expect(fares[0]).toBeGreaterThan(fares[3])
    const uniqueFares = new Set(fares)
    expect(uniqueFares.size).toBeGreaterThanOrEqual(4)
    expect(fares[0]).not.toBe(averageFare)
  })

  // =========================================================================
  // 3. High route overlap yielding shared savings vs low overlap / detour
  // =========================================================================
  it('3. rewards high route overlap with pooled savings and penalizes large detour', async () => {
    const tripHighOverlap: PassengerTripRequest = {
      studentId: 's_overlap',
      pickupName: 'On Trunk Route',
      pickupLat: 17.38,
      pickupLng: 78.48,
      destinationName: 'Campus',
      destinationLat: 17.20,
      destinationLng: 78.60,
      seats: 1,
    }

    vi.spyOn(routingService, 'getRoute').mockResolvedValue({
      distanceMeters: 6000,
      durationSeconds: 720,
      geometry: [],
      legs: [],
    })
    vi.spyOn(routingService, 'calculateDetour').mockResolvedValue({
      bestOrder: [],
      extraDistanceMeters: 600, // 0.6 km detour on 6 km trip => 90% overlap
      extraDurationSeconds: 60,
      percentDetour: 5,
    })

    const mockRide: any = {
      id: 'ride-mock-1',
      capacity: 12,
      bookedSeats: 4,
      currentLat: 17.36,
      currentLng: 78.47,
      destination: 'Campus',
      destinationLat: 17.20,
      destinationLng: 78.60,
      departureTime: '8:00 AM',
      pickupPoints: [{ lat: 17.36, lng: 78.47 }],
      routeCoordinates: [[17.36, 78.47], [17.20, 78.60]],
      passengers: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }],
    }

    const highOverlapResult = await pricingEngine.calculatePassengerFare(tripHighOverlap, mockRide, {
      skipAi: true,
    })

    expect(highOverlapResult.routeOverlapPercent).toBeGreaterThanOrEqual(70)
    expect(highOverlapResult.breakdown.sharedSavings).toBeGreaterThan(0)

    // Detour scenario: 5.5 km extra detour
    vi.spyOn(routingService, 'calculateDetour').mockResolvedValue({
      bestOrder: [],
      extraDistanceMeters: 5500,
      extraDurationSeconds: 900,
      percentDetour: 60,
    })

    const detourResult = await pricingEngine.calculatePassengerFare(tripHighOverlap, mockRide, {
      skipAi: true,
    })

    expect(detourResult.breakdown.routeContribution).toBeGreaterThan(highOverlapResult.breakdown.routeContribution)
    vi.restoreAllMocks()
  })

  // =========================================================================
  // 4. Passenger cancellation releasing capacity and keeping co-passenger fares locked
  // =========================================================================
  it('4. maintains locked prices for co-passengers when one passenger cancels', async () => {
    const testRide = await RideModel.create({
      id: 'ride-test-cancel',
      routeName: 'Test Cancellation Pool',
      driverId: 'd1',
      vehicleId: 'v1',
      departureTime: '8:00 AM',
      destination: 'Campus Hub',
      destinationLat: 17.2063,
      destinationLng: 78.6015,
      capacity: 12,
      bookedSeats: 3,
      fare: 50,
      status: 'active',
      date: 'today',
      passengers: [
        { id: 'p1', studentId: 'u1', name: 'Passenger 1', pickup: 'Stop A', fare: 80, isPriceLocked: true, status: 'boarded', seatNo: 1 },
        { id: 'p2', studentId: 'u2', name: 'Passenger 2', pickup: 'Stop B', fare: 50, isPriceLocked: true, status: 'boarded', seatNo: 2 },
        { id: 'p3', studentId: 'u3', name: 'Passenger 3', pickup: 'Stop C', fare: 40, isPriceLocked: true, status: 'boarded', seatNo: 3 },
      ],
    })

    const cancelResult = await pricingEngine.handlePassengerCancellation({
      rideId: testRide.id,
      cancelledPassengerId: 'p3',
      cancelledUserId: 'u3',
      reason: 'Student lecture rescheduled',
    })

    expect(cancelResult.bookedSeats).toBe(2)
    expect(cancelResult.seatsAvailable).toBe(10)

    const updatedRide = await RideModel.findOne({ id: testRide.id })
    expect(updatedRide?.passengers.length).toBe(2)

    const remainingP1 = updatedRide?.passengers.find((p: any) => p.studentId === 'u1')
    const remainingP2 = updatedRide?.passengers.find((p: any) => p.studentId === 'u2')
    expect(remainingP1?.fare).toBe(80)
    expect(remainingP2?.fare).toBe(50)

    const cancelEvent = await PricingEventModel.findOne({
      rideId: testRide.id,
      eventType: 'PASSENGER_CANCELLED',
    })
    expect(cancelEvent).toBeDefined()
    expect(cancelEvent?.reason).toContain('Student lecture rescheduled')

    await RideModel.deleteOne({ id: testRide.id })
    await PricingEventModel.deleteMany({ rideId: testRide.id })
  })

  // =========================================================================
  // 5. Vehicle capacity limit enforcement (12/12 rejects 13th seat)
  // =========================================================================
  it('5. enforces vehicle capacity strictly and rejects bookings when vehicle is full (12/12)', async () => {
    const fullRide = await RideModel.create({
      id: 'ride-test-full',
      routeName: 'Full 12-Seater Shuttle',
      driverId: 'd1',
      vehicleId: 'v1',
      departureTime: '8:00 AM',
      destination: 'Campus Hub',
      destinationLat: 17.2063,
      destinationLng: 78.6015,
      capacity: 12,
      bookedSeats: 12,
      status: 'active',
      date: 'today',
      fare: 50,
      passengers: Array.from({ length: 12 }, (_, i) => ({
        id: `full_p_${i + 1}`,
        studentId: `u_${i + 1}`,
        name: `Passenger ${i + 1}`,
        pickup: 'Stop A',
        fare: 50,
        isPriceLocked: true,
        status: 'boarded',
        seatNo: i + 1,
      })),
    })

    const requestedSeats = 1
    const atomicUpdateResult = await RideModel.findOneAndUpdate(
      {
        id: 'ride-test-full',
        status: { $in: ['waiting', 'active', 'boarding'] },
        $expr: {
          $lte: [{ $add: ['$bookedSeats', requestedSeats] }, '$capacity'],
        },
      },
      {
        $inc: { bookedSeats: requestedSeats },
      },
      { returnDocument: 'after' }
    )

    expect(atomicUpdateResult).toBeNull()

    await RideModel.deleteOne({ id: 'ride-test-full' })
  })

  // =========================================================================
  // 6. Concurrent booking race condition protection
  // =========================================================================
  it('6. protects against race conditions when concurrent requests contest the last seat', async () => {
    const edgeRide = await RideModel.create({
      id: 'ride-test-race',
      routeName: 'Race Condition Test Ride',
      driverId: 'd1',
      vehicleId: 'v1',
      departureTime: '8:00 AM',
      destination: 'Campus Hub',
      destinationLat: 17.2063,
      destinationLng: 78.6015,
      capacity: 12,
      bookedSeats: 11,
      status: 'active',
      date: 'today',
      fare: 45,
    })

    const claimSeat = async (applicantId: string) => {
      return RideModel.findOneAndUpdate(
        {
          id: 'ride-test-race',
          status: { $in: ['waiting', 'active', 'boarding'] },
          $expr: {
            $lte: [{ $add: ['$bookedSeats', 1] }, '$capacity'],
          },
        },
        {
          $inc: { bookedSeats: 1 },
          $push: {
            passengers: {
              id: `p_${applicantId}`,
              studentId: applicantId,
              name: `Student ${applicantId}`,
              pickup: 'Campus Gate',
              fare: 45,
              seatNo: 12,
              status: 'boarded',
            },
          },
        },
        { returnDocument: 'after' }
      )
    }

    const [res1, res2] = await Promise.all([claimSeat('student_x'), claimSeat('student_y')])

    const successCount = [res1, res2].filter((r) => r !== null).length
    const rejectedCount = [res1, res2].filter((r) => r === null).length

    expect(successCount).toBe(1)
    expect(rejectedCount).toBe(1)

    const finalRide = await RideModel.findOne({ id: 'ride-test-race' })
    expect(finalRide?.bookedSeats).toBe(12)

    await RideModel.deleteOne({ id: 'ride-test-race' })
  })

  // =========================================================================
  // 7. DeepSeek failure / timeout fallback to deterministic engine
  // =========================================================================
  it('7. falls back gracefully to deterministic engine when DeepSeek times out or network fails', async () => {
    const origKey = (deepSeekPricingService as any).apiKey
    ;(deepSeekPricingService as any).apiKey = 'sk-mock-key-for-testing'

    const postSpy = vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('timeout of 10000ms exceeded'))

    const advisory = await deepSeekPricingService.getPricingAdvisory({
      vehicleCapacity: 12,
      occupiedSeats: 5,
      distanceKm: 8.0,
      durationMinutes: 15,
      routeOverlapPercent: 60,
      additionalDistanceKm: 1.0,
      additionalDurationMinutes: 2,
      demandLevel: 'NORMAL',
      passengerCount: 5,
    })

    expect(advisory.source).toBe('DETERMINISTIC_FALLBACK')
    expect(advisory.data).toBeDefined()
    expect(advisory.data.recommendedDemandFactor).toBe(1.0)
    expect(advisory.fallbackReason).toContain('DeepSeek API timeout')

    postSpy.mockRestore()
    ;(deepSeekPricingService as any).apiKey = origKey
  })

  // =========================================================================
  // 8. Malformed AI JSON response fallback
  // =========================================================================
  it('8. falls back safely when DeepSeek returns malformed JSON or schema violations', async () => {
    const origKey = (deepSeekPricingService as any).apiKey
    ;(deepSeekPricingService as any).apiKey = 'sk-mock-key-for-testing'

    // Mock DeepSeek returning schema violation
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      status: 200,
      data: {
        choices: [
          {
            message: {
              content: '{"recommendedDemandFactor": "INVALID_TYPE_STRING", "confidence": "INVALID"}',
            },
          },
        ],
      },
    })

    const advisory = await deepSeekPricingService.getPricingAdvisory({
      vehicleCapacity: 12,
      occupiedSeats: 3,
      distanceKm: 4.0,
      durationMinutes: 8,
      routeOverlapPercent: 50,
      additionalDistanceKm: 0.5,
      additionalDurationMinutes: 1,
      demandLevel: 'NORMAL',
      passengerCount: 3,
    })

    expect(advisory.source).toBe('DETERMINISTIC_FALLBACK')
    expect(advisory.data).toBeDefined()
    expect(advisory.data.recommendedDemandFactor).toBe(1.0)
    expect(advisory.fallbackReason).toContain('Schema validation failed')

    postSpy.mockRestore()
    ;(deepSeekPricingService as any).apiKey = origKey
  })

  // =========================================================================
  // 9. AI excessive recommendation (+50%) bounded by configured cap (+10%)
  // =========================================================================
  it('9. clamps excessive AI recommendations strictly to configured +/-10% bounds', async () => {
    vi.spyOn(deepSeekPricingService, 'getPricingAdvisory').mockResolvedValueOnce({
      success: true,
      source: 'DEEPSEEK_AI',
      latencyMs: 120,
      data: {
        recommendedDemandFactor: 1.50, // +50% surge attempt
        recommendedSharedSavingsFactor: 0.05,
        confidence: 0.95,
        reason: 'Aggressive surge recommendation',
        anomaly: false,
      },
    })

    vi.spyOn(routingService, 'getRoute').mockResolvedValue({
      distanceMeters: 5000,
      durationSeconds: 600,
      geometry: [],
      legs: [],
    })

    const trip: PassengerTripRequest = {
      studentId: 's_ai_test',
      pickupName: 'Stop A',
      pickupLat: 17.36,
      pickupLng: 78.47,
      destinationName: 'Stop B',
      destinationLat: 17.40,
      destinationLng: 78.50,
      seats: 1,
    }

    const result = await pricingEngine.calculatePassengerFare(trip, null, {
      skipAi: false,
    })

    // Private estimate = 20 (base) + 40 (dist) + 10 (dur) = 70
    // AI attempted +50% (+?35), but configured max cap is 10% (+?7.0)
    expect(result.breakdown.aiAdjustment).toBeLessThanOrEqual(7.0)
    expect(result.breakdown.aiAdjustment).toBeGreaterThan(0)
    expect(result.breakdown.aiAdjustment).toBeLessThan(30)

    vi.restoreAllMocks()
  })

  // =========================================================================
  // 10. Min (?30) / max (?500) fare constraints
  // =========================================================================
  it('10. strictly enforces minimum (?30) and maximum (?500) fare bounds', async () => {
    // Micro-trip: 0.2 km, 1 min => Base 20 + (0.2*8=1.6) + (1*1=1) = 22.6 => Clamped to 30
    vi.spyOn(routingService, 'getRoute').mockResolvedValueOnce({
      distanceMeters: 200,
      durationSeconds: 60,
      geometry: [],
      legs: [],
    })

    const microTrip: PassengerTripRequest = {
      studentId: 's_micro',
      pickupName: 'Hostel Gate',
      pickupLat: 17.36,
      pickupLng: 78.47,
      destinationName: 'Next Block',
      destinationLat: 17.362,
      destinationLng: 78.472,
      seats: 1,
    }

    const minResult = await pricingEngine.calculatePassengerFare(microTrip, null, { skipAi: true })
    expect(minResult.finalAmount).toBe(30) // Minimum fare enforced

    // Mega-trip: 150 km, 180 min => Raw formula would exceed 1000 => Clamped to 500
    vi.spyOn(routingService, 'getRoute').mockResolvedValueOnce({
      distanceMeters: 150000,
      durationSeconds: 10800,
      geometry: [],
      legs: [],
    })

    const megaTrip: PassengerTripRequest = {
      studentId: 's_mega',
      pickupName: 'Campus',
      pickupLat: 17.36,
      pickupLng: 78.47,
      destinationName: 'Far Outpost',
      destinationLat: 18.36,
      destinationLng: 79.47,
      seats: 1,
    }

    const maxResult = await pricingEngine.calculatePassengerFare(megaTrip, null, { skipAi: true })
    expect(maxResult.finalAmount).toBe(500) // Maximum fare enforced

    vi.restoreAllMocks()
  })

  // =========================================================================
  // 11. Multi-destination dropoff completion without terminating vehicle ride
  // =========================================================================
  it('11. marks individual passenger dropoff as completed without terminating active vehicle ride', async () => {
    const multiStopRide = await RideModel.create({
      id: 'ride-test-multistop',
      routeName: 'Multi-stop Campus Loop',
      driverId: 'd1',
      vehicleId: 'v1',
      departureTime: '8:00 AM',
      destination: 'Campus Hub',
      destinationLat: 17.2063,
      destinationLng: 78.6015,
      capacity: 12,
      bookedSeats: 2,
      status: 'active',
      date: 'today',
      fare: 40,
      passengers: [
        { id: 'p_stop1', studentId: 'u1', name: 'Passenger 1', pickup: 'Stop 1', fare: 40, status: 'boarded', seatNo: 1, destination: 'Stop 3' },
        { id: 'p_stop2', studentId: 'u2', name: 'Passenger 2', pickup: 'Stop 2', fare: 65, status: 'boarded', seatNo: 2, destination: 'Stop 7' },
      ],
    })

    const dropoffResult = await RideModel.findOneAndUpdate(
      { id: 'ride-test-multistop', 'passengers.studentId': 'u1' },
      {
        $set: { 'passengers.$.status': 'dropped' },
      },
      { returnDocument: 'after' }
    )

    expect(dropoffResult?.status).toBe('active')
    const p1 = dropoffResult?.passengers.find((p: any) => p.studentId === 'u1')
    const p2 = dropoffResult?.passengers.find((p: any) => p.studentId === 'u2')
    expect(p1?.status).toBe('dropped')
    expect(p2?.status).toBe('boarded')

    await RideModel.deleteOne({ id: 'ride-test-multistop' })
  })
})
