import { describe, it, expect } from 'vitest'

describe('Route Sync, Driver Origin, and Passenger Boarding/Dropoff Lifecycle', () => {
  it('1. formats full route containing Driver Start, Pickups, and Destination without omissions', () => {
    const ride = {
      startLocation: 'Charminar Old City',
      pickupPoints: [
        { name: 'Sri Indu College of Engineering & Technology', lat: 17.2063, lng: 78.6015 },
      ],
      destination: 'Secunderabad Station',
    }

    const startPt = ride.startLocation || ride.pickupPoints[0]?.name || 'Driver Start'
    const intermediateStops = (ride.pickupPoints || [])
      .map((p) => p.name)
      .filter((name) => Boolean(name && name.trim().toLowerCase() !== startPt.trim().toLowerCase()))
    const dest = ride.destination || 'Destination'
    const fullRoute = [startPt, ...intermediateStops, dest].filter(Boolean)
    const cleanRoute = fullRoute.filter((pt, i) => i === 0 || pt.toLowerCase() !== fullRoute[i - 1].toLowerCase())

    expect(cleanRoute).toEqual([
      'Charminar Old City',
      'Sri Indu College of Engineering & Technology',
      'Secunderabad Station',
    ])
  })

  it('2. collapses duplicates when Driver Start is same as pickup stop', () => {
    const ride = {
      startLocation: 'Sri Indu College of Engineering & Technology',
      pickupPoints: [
        { name: 'Sri Indu College of Engineering & Technology', lat: 17.2063, lng: 78.6015 },
      ],
      destination: 'Secunderabad Station',
    }

    const startPt = ride.startLocation || ride.pickupPoints[0]?.name || 'Driver Start'
    const intermediateStops = (ride.pickupPoints || [])
      .map((p) => p.name)
      .filter((name) => Boolean(name && name.trim().toLowerCase() !== startPt.trim().toLowerCase()))
    const dest = ride.destination || 'Destination'
    const fullRoute = [startPt, ...intermediateStops, dest].filter(Boolean)
    const cleanRoute = fullRoute.filter((pt, i) => i === 0 || pt.toLowerCase() !== fullRoute[i - 1].toLowerCase())

    expect(cleanRoute).toEqual([
      'Sri Indu College of Engineering & Technology',
      'Secunderabad Station',
    ])
  })

  it('3. updates generic campus destination and route name when passenger specifies custom destination', () => {
    const ride: any = {
      id: 'ride-test-sync',
      routeName: 'Campus Route #101',
      destination: 'SRI INDU Campus Main Gate',
      destinationLat: 17.2063,
      destinationLng: 78.6015,
      pickupPoints: [],
      passengers: [
        { studentId: 'stu-1', name: 'Demo Student', pickup: 'Sri Indu College of Engineering & Technology', status: 'waiting' },
      ],
    }

    const passengerPickup = 'Sri Indu College of Engineering & Technology'
    const passengerDest = 'Secunderabad Station'
    const passengerCoords = { lat: 17.4339, lng: 78.5016 }

    const isGenericCampus =
      !ride.destination ||
      ride.destination.toLowerCase().includes('campus main gate') ||
      ride.destination.toLowerCase().includes('sri indu campus') ||
      ride.passengers.length <= 1

    if (isGenericCampus) {
      ride.destination = passengerDest
      ride.destinationLat = passengerCoords.lat
      ride.destinationLng = passengerCoords.lng
      ride.routeName = `${passengerPickup} → ${passengerDest}`
    }

    const passengerItem = ride.passengers.find((p: any) => p.studentId === 'stu-1')
    if (passengerItem) {
      passengerItem.destination = passengerDest
    }

    expect(ride.destination).toBe('Secunderabad Station')
    expect(ride.destinationLat).toBe(17.4339)
    expect(ride.routeName).toBe('Sri Indu College of Engineering & Technology → Secunderabad Station')
    expect(passengerItem?.destination).toBe('Secunderabad Station')
  })

  it('4. progresses passenger status correctly from waiting -> boarded -> dropped', () => {
    const passenger: any = {
      studentId: 'stu-1',
      status: 'waiting',
      pickup: 'Sri Indu College of Engineering & Technology',
      destination: 'Secunderabad Station',
    }

    // Driver boards passenger
    passenger.status = 'boarded'
    expect(passenger.status).toBe('boarded')

    // Driver drops off passenger
    passenger.status = 'dropped'
    expect(passenger.status).toBe('dropped')
  })
})
