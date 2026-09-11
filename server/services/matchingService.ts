import { IRide } from '../models/Ride.js'
import { UserModel } from '../models/User.js'
import { haversineDistanceMeters, routingService } from './routingService.js'

export interface MatchScoreDetails {
  total: number
  destination: number
  routeOverlap: number
  timeCompatibility: number
  pickupProximity: number
  detour: number
  explanation: {
    destinationLabel: string
    routeLabel: string
    timeLabel: string
    proximityLabel: string
    detourLabel: string
    summary: string[]
  }
}

export interface RideMatchCandidate {
  rideId: string
  ride: IRide
  score: MatchScoreDetails
  availableSeats: number
  compatible: boolean
  estimatedExtraTimeMinutes: number
  estimatedExtraDistanceMeters: number
}

// Parse "8:15 AM" -> minutes since midnight
function parseTimeToMinutes(t: string): number {
  if (!t) return 480 // 8:00 AM default
  const parts = t.trim().split(' ')
  const timePart = parts[0]
  const period = parts[1] || 'AM'
  const [hStr, mStr] = timePart.split(':')
  let hours = parseInt(hStr, 10) || 0
  const minutes = parseInt(mStr, 10) || 0
  if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0
  return hours * 60 + minutes
}

function getRatingLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Poor'
}

export class MatchingService {
  /**
   * Evaluates a single ride against a booking request
   */
  async evaluateMatch(
    ride: IRide,
    request: {
      pickupName: string
      pickupLat: number
      pickupLng: number
      destinationName: string
      destinationLat: number
      destinationLng: number
      requestedTime: string
      seatsRequested: number
      genderPreference?: string
      requestingStudentId?: string
    }
  ): Promise<RideMatchCandidate> {
    const availableSeats = ride.capacity - ride.bookedSeats

    // 0. Female-Only Strict Group Compatibility Check
    if (request.genderPreference === 'FEMALE_ONLY') {
      if (request.requestingStudentId) {
        const student = await UserModel.findOne({ id: request.requestingStudentId })
        if (student && student.gender === 'Male') {
          // Male student cannot select Female-Only ride
          return this.buildIncompatibleResponse(ride, availableSeats, 'Female-only preference restricts group to female passengers only.')
        }
      }

      // Check existing passengers in the ride
      const passengerIds = ride.passengers.map((p) => p.studentId)
      if (passengerIds.length > 0) {
        const existingPassengers = await UserModel.find({ id: { $in: passengerIds } })
        const hasMale = existingPassengers.some((p) => p.gender === 'Male')
        if (hasMale) {
          return this.buildIncompatibleResponse(ride, availableSeats, 'Ride group contains non-female passengers.')
        }
      }
    }

    // 1. Destination Compatibility (30%)
    let destScore = 20
    if (ride.destination.toLowerCase() === request.destinationName.toLowerCase()) {
      destScore = 100
    } else {
      const dDist = haversineDistanceMeters(
        ride.destinationLat,
        ride.destinationLng,
        request.destinationLat,
        request.destinationLng
      )
      if (dDist < 600) destScore = 90
      else if (dDist < 1500) destScore = 75
      else if (dDist < 3000) destScore = 50
      else if (dDist < 5000) destScore = 30
      else destScore = 10
    }

    // 2. Pickup Proximity (10%)
    let minPickupDist = Infinity
    for (const pp of ride.pickupPoints) {
      const d = haversineDistanceMeters(pp.lat, pp.lng, request.pickupLat, request.pickupLng)
      if (d < minPickupDist) minPickupDist = d
    }

    const proxScore =
      minPickupDist < 400 ? 100 : minPickupDist < 1000 ? 80 : minPickupDist < 2000 ? 60 : minPickupDist < 3500 ? 40 : 15

    // 3. Time Compatibility (20%)
    const reqMins = parseTimeToMinutes(request.requestedTime)
    const rideMins = parseTimeToMinutes(ride.departureTime)
    const deltaMins = Math.abs(reqMins - rideMins)

    const timeScore =
      deltaMins <= 5 ? 100 : deltaMins <= 12 ? 85 : deltaMins <= 20 ? 65 : deltaMins <= 35 ? 40 : 15

    // 4. Detour & Route Overlap (30% Route + 10% Detour)
    let extraDistance = 0
    let extraSeconds = 0
    let detourScore = 80
    let routeScore = 70

    if (minPickupDist < 350) {
      routeScore = 95
      detourScore = 95
      extraSeconds = 60
      extraDistance = 150
    } else {
      // Calculate detour using routing service
      const existingWaypoints: [number, number][] = [
        ...ride.pickupPoints.map((pp) => [pp.lat, pp.lng] as [number, number]),
        [ride.destinationLat, ride.destinationLng],
      ]

      const detourResult = await routingService.calculateDetour(existingWaypoints, [
        request.pickupLat,
        request.pickupLng,
      ])

      extraDistance = detourResult.extraDistanceMeters
      extraSeconds = detourResult.extraDurationSeconds

      detourScore =
        extraSeconds <= 120 ? 95 : extraSeconds <= 300 ? 80 : extraSeconds <= 450 ? 55 : 20

      routeScore = Math.max(20, Math.round(100 - detourResult.percentDetour * 2.5))
    }

    // Total weighted score
    const totalScore = Math.round(
      destScore * 0.3 +
        routeScore * 0.3 +
        timeScore * 0.2 +
        proxScore * 0.1 +
        detourScore * 0.1
    )

    // Dynamic Summary Reasons
    const summary: string[] = []
    if (destScore >= 80) summary.push('Same destination')
    if (minPickupDist < 600) summary.push(`Pickup within ${Math.round(minPickupDist)}m`)
    if (deltaMins <= 15) summary.push(`Departure within ${deltaMins} minutes`)
    if (routeScore >= 75) summary.push(`${Math.round(routeScore)}% route overlap`)
    if (extraSeconds <= 180) summary.push(`Only +${Math.round(extraSeconds / 60)} min detour`)

    const scoreDetails: MatchScoreDetails = {
      total: totalScore,
      destination: destScore,
      routeOverlap: routeScore,
      timeCompatibility: timeScore,
      pickupProximity: proxScore,
      detour: detourScore,
      explanation: {
        destinationLabel: getRatingLabel(destScore),
        routeLabel: getRatingLabel(routeScore),
        timeLabel: getRatingLabel(timeScore),
        proximityLabel: getRatingLabel(proxScore),
        detourLabel: getRatingLabel(detourScore),
        summary,
      },
    }

    return {
      rideId: ride.id,
      ride,
      score: scoreDetails,
      availableSeats,
      compatible: totalScore >= 50 && availableSeats >= request.seatsRequested,
      estimatedExtraTimeMinutes: Math.round(extraSeconds / 60),
      estimatedExtraDistanceMeters: Math.round(extraDistance),
    }
  }

  /**
   * Search and rank best matching rides from active database rides
   */
  async findBestRideMatches(
    rides: IRide[],
    request: {
      pickupName: string
      pickupLat: number
      pickupLng: number
      destinationName: string
      destinationLat: number
      destinationLng: number
      requestedTime: string
      seatsRequested: number
      genderPreference?: string
      requestingStudentId?: string
    }
  ): Promise<RideMatchCandidate[]> {
    const candidates: RideMatchCandidate[] = []

    for (const ride of rides) {
      if (
        ride.status === 'completed' ||
        ride.status === 'cancelled' ||
        ride.status === 'full' ||
        ride.bookedSeats + request.seatsRequested > ride.capacity
      ) {
        continue
      }

      const match = await this.evaluateMatch(ride, request)
      if (match.score.total >= 40) {
        candidates.push(match)
      }
    }

    // Sort descending by score
    return candidates.sort((a, b) => b.score.total - a.score.total)
  }

  private buildIncompatibleResponse(ride: IRide, availableSeats: number, reason: string): RideMatchCandidate {
    return {
      rideId: ride.id,
      ride,
      score: {
        total: 0,
        destination: 0,
        routeOverlap: 0,
        timeCompatibility: 0,
        pickupProximity: 0,
        detour: 0,
        explanation: {
          destinationLabel: 'Incompatible',
          routeLabel: 'Incompatible',
          timeLabel: 'Incompatible',
          proximityLabel: 'Incompatible',
          detourLabel: 'Incompatible',
          summary: [reason],
        },
      },
      availableSeats,
      compatible: false,
      estimatedExtraTimeMinutes: 0,
      estimatedExtraDistanceMeters: 0,
    }
  }
}

export const matchingService = new MatchingService()
