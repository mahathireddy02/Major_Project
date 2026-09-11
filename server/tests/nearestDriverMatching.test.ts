import { describe, it, expect } from 'vitest'
import { matchingService } from '../services/matchingService.js'
import { findMatches } from '../../src/engine/matchingEngine'
import type { Ride } from '../../src/types'

describe('Nearest Active Driver Assignment & Matching Engine', () => {
  const sampleRequest = {
    pickupName: 'LB Nagar Circle',
    pickupLat: 17.3457,
    pickupLng: 78.5522,
    destinationName: 'SRI INDU College of Engineering',
    destinationLat: 17.2063,
    destinationLng: 78.6015,
    requestedTime: '9:00 AM',
    seatsRequested: 1,
  }

  const nearActiveRide: any = {
    id: 'ride-near-active',
    routeName: 'LB Nagar Campus Shuttle',
    driverId: 'driver-near',
    vehicleId: 'veh-near',
    status: 'active',
    capacity: 6,
    bookedSeats: 1,
    departureTime: '8:55 AM',
    destination: 'SRI INDU College of Engineering',
    destinationLat: 17.2063,
    destinationLng: 78.6015,
    currentLat: 17.3500, // ~600m from LB Nagar
    currentLng: 78.5540,
    startLocationLat: 17.3500,
    startLocationLng: 78.5540,
    pickupPoints: [
      { id: 'p1', name: 'LB Nagar Circle', lat: 17.3457, lng: 78.5522, estimatedPickupTime: '8:58 AM' },
    ],
    passengers: [],
    routeCoordinates: [[17.3500, 78.5540], [17.3457, 78.5522], [17.2063, 78.6015]],
  }

  const farLongDriveRide: any = {
    id: 'ride-far-long-drive',
    routeName: 'ECIL to SRI INDU Long Express',
    driverId: 'driver-far',
    vehicleId: 'veh-far',
    status: 'waiting', // Not started, far away
    capacity: 20,
    bookedSeats: 2,
    departureTime: '9:00 AM', // Same departure time
    destination: 'SRI INDU College of Engineering', // Same destination
    destinationLat: 17.2063,
    destinationLng: 78.6015,
    currentLat: 17.4850, // ECIL ~18 km away from LB Nagar
    currentLng: 78.5600,
    startLocationLat: 17.4850,
    startLocationLng: 78.5600,
    pickupPoints: [
      { id: 'p_far_1', name: 'ECIL Cross Roads', lat: 17.4850, lng: 78.5600, estimatedPickupTime: '8:15 AM' },
      { id: 'p_far_2', name: 'Uppal Ring Road', lat: 17.3980, lng: 78.5580, estimatedPickupTime: '8:40 AM' },
      { id: 'p_far_3', name: 'LB Nagar Circle', lat: 17.3457, lng: 78.5522, estimatedPickupTime: '9:00 AM' },
    ],
    passengers: [],
    routeCoordinates: [[17.4850, 78.5600], [17.3980, 78.5580], [17.3457, 78.5522], [17.2063, 78.6015]],
  }

  it('Backend matchingService ranks nearest active driver at #1 over distant long drive', async () => {
    const matches = await matchingService.findBestRideMatches(
      [farLongDriveRide, nearActiveRide],
      sampleRequest
    )

    expect(matches.length).toBeGreaterThan(0)
    // The top match MUST be the near active driver!
    expect(matches[0].rideId).toBe('ride-near-active')
    expect(matches[0].score.total).toBeGreaterThan(matches[1].score.total)
    // Distance to driver must be properly calculated
    expect(matches[0].driverDistanceMeters).toBeLessThan(1000)
    expect(matches[1].driverDistanceMeters).toBeGreaterThan(10000)
  })

  it('Frontend matchingEngine ranks nearest active driver at #1 over distant long drive', () => {
    const clientMatches = findMatches(
      [farLongDriveRide as Ride, nearActiveRide as Ride],
      {
        pickup: sampleRequest.pickupName,
        destination: sampleRequest.destinationName,
        requestedTime: sampleRequest.requestedTime,
        seats: 1,
        pickupCoords: { lat: sampleRequest.pickupLat, lng: sampleRequest.pickupLng },
        destinationCoords: { lat: sampleRequest.destinationLat, lng: sampleRequest.destinationLng },
      }
    )

    expect(clientMatches.length).toBe(2)
    // Top match must be nearest active driver
    expect(clientMatches[0].ride.id).toBe('ride-near-active')
    expect(clientMatches[0].score.total).toBeGreaterThan(clientMatches[1].score.total)
    expect(clientMatches[0].score.driverDistanceKm).toBeLessThan(1.5)
    expect(clientMatches[1].score.driverDistanceKm).toBeGreaterThan(10.0)
  })
})
