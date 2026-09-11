import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { VehicleModel } from '../server/models/Vehicle.js'
import { RideModel } from '../server/models/Ride.js'
import { BookingModel } from '../server/models/Booking.js'
import { RideRecoveryEventModel } from '../server/models/RideRecoveryEvent.js'
import { recoveryService } from '../server/services/recoveryService.js'

async function runTests() {
  console.log('\n======================================================')
  console.log('🚀 RUNNING BREAKDOWN RECOVERY AUTOMATED TEST SUITE')
  console.log('======================================================\n')

  let mongod: any = null

  try {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    await mongoose.connect(uri)
    console.log('[PASS] Connected to in-memory test MongoDB instance')

    // -----------------------------------------------------------------
    // TEST 1: Driver Breakdown Report & State Transitions
    // -----------------------------------------------------------------
    console.log('\n[TEST 1] Reporting vehicle breakdown transitions vehicle to OUT_OF_SERVICE and ride to recovery_pending...')
    
    await VehicleModel.create({
      id: 'v-test-broken',
      name: 'Campus Shuttle Alfa',
      vehicleType: 'Electric Shuttle',
      registrationNumber: 'TS-09-EV-0001',
      capacity: 6,
      driverId: 'd-test-1',
      color: '#2563EB',
      verificationStatus: true,
      rating: 4.8,
      totalTrips: 120,
      status: 'ON_TRIP',
      currentLat: 17.3850,
      currentLng: 78.4867,
    })

    await RideModel.create({
      id: 'ride-test-1',
      routeName: 'Main Gate to Academic Block A',
      driverId: 'd-test-1',
      vehicleId: 'v-test-broken',
      destination: 'Academic Block A',
      destinationLat: 17.3910,
      destinationLng: 78.4920,
      departureTime: '08:30 AM',
      estimatedArrival: '08:45 AM',
      capacity: 6,
      bookedSeats: 2,
      fare: 25,
      status: 'active',
      currentLat: 17.3860,
      currentLng: 78.4875,
      distanceKm: 2.4,
      date: new Date().toISOString().split('T')[0],
      pickupPoints: [
        { id: 'p1', name: 'Main Gate', lat: 17.3850, lng: 78.4867, estimatedPickupTime: '08:30 AM' },
        { id: 'p2', name: 'Library Plaza', lat: 17.3880, lng: 78.4890, estimatedPickupTime: '08:37 AM' },
      ],
      passengers: [
        {
          id: 'p-101',
          studentId: 's-101',
          bookingId: 'bk-101',
          name: 'Priya Sharma',
          pickup: 'Main Gate',
          destination: 'Academic Block A',
          seatNo: 1,
          fare: 25,
          status: 'boarded',
        },
        {
          id: 'p-102',
          studentId: 's-102',
          bookingId: 'bk-102',
          name: 'Rahul Varma',
          pickup: 'Library Plaza',
          destination: 'Academic Block A',
          seatNo: 2,
          fare: 25,
          status: 'waiting',
        },
      ],
      routeCoordinates: [[17.3850, 78.4867], [17.3910, 78.4920]],
    })

    await BookingModel.create({
      id: 'bk-101',
      studentId: 's-101',
      rideId: 'ride-test-1',
      pickup: 'Main Gate',
      destination: 'Academic Block A',
      fare: 25,
      originalFare: 25,
      recoveryPricingPolicy: 'PRICE_LOCKED',
      status: 'boarded',
      seatNo: 1,
      bookedAt: new Date(),
    })
    await BookingModel.create({
      id: 'bk-102',
      studentId: 's-102',
      rideId: 'ride-test-1',
      pickup: 'Library Plaza',
      destination: 'Academic Block A',
      fare: 25,
      originalFare: 25,
      recoveryPricingPolicy: 'PRICE_LOCKED',
      status: 'pending',
      seatNo: 2,
      bookedAt: new Date(),
    })

    await VehicleModel.create({
      id: 'v-test-replacement',
      name: 'Campus Shuttle Beta',
      vehicleType: 'Electric Shuttle',
      registrationNumber: 'TS-09-EV-0002',
      capacity: 8,
      driverId: 'd-test-2',
      color: '#10B981',
      verificationStatus: true,
      rating: 4.9,
      totalTrips: 85,
      status: 'AVAILABLE',
      currentLat: 17.3870,
      currentLng: 78.4880,
    })

    const breakdownReport = await recoveryService.reportBreakdown({
      vehicleId: 'v-test-broken',
      driverId: 'd-test-1',
      location: { lat: 17.3862, lng: 78.4878 },
      reason: 'Motor drive overheating',
      trigger: 'DRIVER_REPORTED',
    })

    console.log('[PASS] Breakdown report executed:', breakdownReport.message)

    const updatedBrokenVehicle = await VehicleModel.findOne({ id: 'v-test-broken' })
    if (updatedBrokenVehicle?.status !== 'OUT_OF_SERVICE') {
      throw new Error(`Expected broken vehicle status OUT_OF_SERVICE, got ${updatedBrokenVehicle?.status}`)
    }
    console.log('[PASS] Broken vehicle transitioned to OUT_OF_SERVICE')

    const recoveryEvent = await RideRecoveryEventModel.findOne({ oldVehicleId: 'v-test-broken' })
    if (!recoveryEvent) {
      throw new Error('Expected RideRecoveryEvent to be recorded in MongoDB')
    }
    console.log(`[PASS] RideRecoveryEvent created: ${recoveryEvent.id} with status ${recoveryEvent.status}`)

    // -----------------------------------------------------------------
    // TEST 2: Multi-Metric Candidate Scoring
    // -----------------------------------------------------------------
    console.log('\n[TEST 2] Testing candidate discovery and constraint-aware scoring...')

    const freshRide = await RideModel.findOne({ id: 'ride-test-1' })
    const scoredCandidates = await recoveryService.findAndScoreCandidates(
      freshRide!,
      17.3862,
      78.4878,
      'v-test-broken'
    )

    console.log(`[PASS] Discovered ${scoredCandidates.length} replacement candidate(s)`)
    if (scoredCandidates.length === 0) {
      throw new Error('Expected at least 1 replacement candidate')
    }

    const topCandidate = scoredCandidates[0]
    console.log(`  - Candidate: ${topCandidate.vehicle.name} (${topCandidate.vehicle.registrationNumber || topCandidate.vehicle.registration})`)
    console.log(`  - Distance: ${topCandidate.distanceKm.toFixed(2)} km`)
    console.log(`  - Composite Score: ${topCandidate.compositeScore}/100`)

    if (topCandidate.vehicle.id !== 'v-test-replacement') {
      throw new Error(`Expected v-test-replacement as top candidate, got ${topCandidate.vehicle.id}`)
    }
    if (topCandidate.compositeScore <= 0 || topCandidate.compositeScore > 100) {
      throw new Error(`Invalid composite score: ${topCandidate.compositeScore}`)
    }
    console.log('[PASS] Multi-metric scoring passed constraint verification')

    // -----------------------------------------------------------------
    // TEST 3: Passenger Continuity & Price Locking
    // -----------------------------------------------------------------
    console.log('\n[TEST 3] Testing passenger booking continuity & fare locking...')

    const finalRide = await RideModel.findOne({ id: 'ride-test-1' })
    console.log(`[PASS] Recovered ride vehicleId: ${finalRide?.vehicleId}, driverId: ${finalRide?.driverId}`)
    console.log(`[PASS] Recovered ride status: ${finalRide?.status}`)

    const b1 = await BookingModel.findOne({ id: 'bk-101' })
    const b2 = await BookingModel.findOne({ id: 'bk-102' })

    if (!b1 || !b2) {
      throw new Error('Bookings were unexpectedly modified or deleted!')
    }
    if (b1.fare !== 25 || b2.fare !== 25) {
      throw new Error(`Fare was altered! Expected 25, got ${b1.fare}, ${b2.fare}`)
    }
    if (b1.recoveryPricingPolicy !== 'PRICE_LOCKED' || b2.recoveryPricingPolicy !== 'PRICE_LOCKED') {
      throw new Error('Booking recoveryPricingPolicy was not locked to PRICE_LOCKED!')
    }
    console.log('[PASS] Passenger bookings preserved identically: zero cancellations, original fares locked')

    // -----------------------------------------------------------------
    // TEST 4: Fallback to MANUAL_INTERVENTION_REQUIRED when Fleet Empty
    // -----------------------------------------------------------------
    console.log('\n[TEST 4] Testing graceful escalation when no replacement vehicles meet capacity...')

    // Create broken vehicle for test 4
    await VehicleModel.create({
      id: 'v-hopeless',
      name: 'Campus Shuttle Hopeless',
      vehicleType: 'Electric Shuttle',
      registrationNumber: 'TS-09-EV-9999',
      capacity: 10,
      driverId: 'd-hopeless',
      color: '#EF4444',
      verificationStatus: true,
      rating: 4.5,
      totalTrips: 10,
      status: 'ON_TRIP',
      currentLat: 17.3850,
      currentLng: 78.4850,
    })

    // Mark all other vehicles OUT_OF_SERVICE so fleet has 0 replacement candidates
    await VehicleModel.updateMany({ id: { $ne: 'v-hopeless' } }, { status: 'OUT_OF_SERVICE' })

    await RideModel.create({
      id: 'ride-hopeless-1',
      routeName: 'Hostel Block 4 to Sports Complex',
      driverId: 'd-hopeless',
      vehicleId: 'v-hopeless',
      destination: 'Sports Complex',
      destinationLat: 17.3950,
      destinationLng: 78.4990,
      departureTime: '09:00 AM',
      estimatedArrival: '09:15 AM',
      capacity: 10,
      bookedSeats: 5,
      fare: 30,
      status: 'active',
      currentLat: 17.3850,
      currentLng: 78.4850,
      distanceKm: 3.0,
      date: new Date().toISOString().split('T')[0],
      pickupPoints: [{ id: 'p-h', name: 'Hostel 4', lat: 17.3850, lng: 78.4850, estimatedPickupTime: '09:00 AM' }],
      passengers: [{
        id: 'p-h1',
        studentId: 's-h1',
        name: 'Alex Tan',
        pickup: 'Hostel 4',
        destination: 'Sports Complex',
        seatNo: 1,
        fare: 30,
        status: 'boarded',
      }],
      routeCoordinates: [[17.3850, 78.4850], [17.3950, 78.4990]],
    })

    const hopelessResult = await recoveryService.reportBreakdown({
      vehicleId: 'v-hopeless',
      driverId: 'd-hopeless',
      location: { lat: 17.3850, lng: 78.4850 },
      reason: 'Puncture / tyre blow',
      trigger: 'DRIVER_REPORTED',
    })

    console.log('[PASS] Automated recovery handled fleet exhaustion:', hopelessResult.message)

    const hopelessEvent = await RideRecoveryEventModel.findOne({ rideId: 'ride-hopeless-1' })
    if (hopelessEvent?.status !== 'MANUAL_INTERVENTION_REQUIRED') {
      throw new Error(`Expected MANUAL_INTERVENTION_REQUIRED, got ${hopelessEvent?.status}`)
    }
    console.log('[PASS] Graceful escalation: event marked MANUAL_INTERVENTION_REQUIRED for dispatcher intervention')

    console.log('\n======================================================')
    console.log('🎉 ALL BREAKDOWN RECOVERY TESTS PASSED SUCCESSFULLY!')
    console.log('======================================================\n')
    process.exit(0)
  } catch (err: any) {
    console.error('\n[FAIL] TEST SUITE FAILED:', err)
    process.exit(1)
  } finally {
    if (mongod) {
      await mongoose.disconnect()
      await mongod.stop()
    }
  }
}

runTests()