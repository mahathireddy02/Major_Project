import type { Ride } from '../types'

export interface MatchScore {
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

export interface BookingRequest {
  pickup: string
  destination: string
  requestedTime: string // "HH:MM AM/PM"
  seats: number
  pickupCoords?: { lat: number; lng: number }
  destinationCoords?: { lat: number; lng: number }
}

export interface RideMatch {
  ride: Ride
  score: MatchScore
  availableSeats: number
  addedPickupPoint: string | null
}

// Parse "8:15 AM" → minutes since midnight
function parseTime(t: string): number {
  if (!t) return 0
  const clean = t.trim()
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) {
    const parts = clean.split(':')
    const h = parseInt(parts[0], 10) || 0
    const m = parseInt(parts[1], 10) || 0
    return h * 60 + m
  }
  let hours = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const period = match[3]?.toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours * 60 + m
}

// Haversine distance in km
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Poor'
}

function getSummary(scores: MatchScore): string[] {
  const bullets: string[] = []
  if (scores.destination >= 80)  bullets.push('Same destination')
  if (scores.pickupProximity >= 70) bullets.push('Pickup within 1km')
  if (scores.timeCompatibility >= 70) bullets.push('Departure within 15 minutes')
  if (scores.routeOverlap >= 70) bullets.push(`${Math.round(scores.routeOverlap)}% route overlap`)
  if (scores.detour >= 70) bullets.push('Minimal detour added')
  return bullets
}

export function calculateMatchScore(
  ride: Ride,
  request: BookingRequest
): MatchScore {
  let pLat = request.pickupCoords?.lat
  let pLng = request.pickupCoords?.lng
  if (!pLat || !pLng) {
    const matchedPickup = ride.pickupPoints?.find(
      (p) => p.name.toLowerCase() === request.pickup.toLowerCase()
    )
    pLat = matchedPickup?.lat ?? 17.3616
    pLng = matchedPickup?.lng ?? 78.4747
  }

  const dLat = request.destinationCoords?.lat || ride.destinationLat || 17.2063
  const dLng = request.destinationCoords?.lng || ride.destinationLng || 78.6015

  // 1. Destination (30%)
  const dDest = haversineKm(dLat, dLng, ride.destinationLat, ride.destinationLng)
  const isExactDest =
    ride.destination.toLowerCase() === request.destination.toLowerCase() ||
    ride.destination.toLowerCase().includes(request.destination.toLowerCase()) ||
    request.destination.toLowerCase().includes(ride.destination.toLowerCase())
  const destScore = isExactDest ? 100
    : dDest < 0.8 ? 95
    : dDest < 1.5 ? 80
    : dDest < 3.0 ? 60
    : dDest < 5.0 ? 40
    : 15

  // 2. Route overlap (30%) — check if request pickup is on/near the route
  let routeScore = 20
  for (const pp of (ride.pickupPoints || [])) {
    const d = haversineKm(pLat, pLng, pp.lat, pp.lng)
    if (d < 0.5) { routeScore = 100; break }
    if (d < 1.2) { routeScore = Math.max(routeScore, 85) }
    if (d < 2.5) { routeScore = Math.max(routeScore, 65) }
    if (d < 4.0) { routeScore = Math.max(routeScore, 45) }
  }

  // Also check route coordinates if available
  if (routeScore < 80 && ride.routeCoordinates && ride.routeCoordinates.length > 0) {
    for (const coord of ride.routeCoordinates) {
      const d = haversineKm(pLat, pLng, coord[0], coord[1])
      if (d < 0.5) { routeScore = Math.max(routeScore, 90); break }
      if (d < 1.5) { routeScore = Math.max(routeScore, 75) }
    }
  }

  if (dDest > 3.0) {
    routeScore = Math.min(routeScore, 40)
  }

  // 3. Time (20%)
  const reqMin  = parseTime(request.requestedTime)
  const rideMin = parseTime(ride.departureTime)
  const timeDiff = Math.abs(reqMin - rideMin)
  const timeScore = timeDiff <= 5  ? 100
    : timeDiff <= 15 ? 85
    : timeDiff <= 25 ? 65
    : timeDiff <= 45 ? 40
    : 15

  // 4. Pickup proximity (10%)
  let minDist = Infinity
  for (const pp of (ride.pickupPoints || [])) {
    minDist = Math.min(minDist, haversineKm(pLat, pLng, pp.lat, pp.lng))
  }
  const proxScore = minDist < 0.5 ? 100 : minDist < 1.2 ? 80 : minDist < 2.5 ? 60 : minDist < 4.0 ? 40 : 15

  // 5. Detour (10%)
  const detourScore = minDist < 0.5 ? 100 : minDist < 1.5 ? 85 : minDist < 3.0 ? 60 : 30

  // Weighted total
  const total = Math.round(
    destScore  * 0.30 +
    routeScore * 0.30 +
    timeScore  * 0.20 +
    proxScore  * 0.10 +
    detourScore * 0.10
  )

  const score: MatchScore = {
    total,
    destination:       destScore,
    routeOverlap:      routeScore,
    timeCompatibility: timeScore,
    pickupProximity:   proxScore,
    detour:            detourScore,
    explanation: {
      destinationLabel: scoreLabel(destScore),
      routeLabel:       scoreLabel(routeScore),
      timeLabel:        scoreLabel(timeScore),
      proximityLabel:   scoreLabel(proxScore),
      detourLabel:      scoreLabel(detourScore),
      summary: [],
    },
  }
  score.explanation.summary = getSummary(score)
  return score
}

export interface FindMatchesOptions {
  includeCompleted?: boolean
  minScore?: number
}

export function findMatches(
  rides: Ride[],
  request: BookingRequest,
  options?: FindMatchesOptions
): RideMatch[] {
  const includeCompleted = options?.includeCompleted ?? true
  const minScore = options?.minScore ?? 30

  const eligibleRides = rides.filter((r) => {
    if (r.status === 'cancelled') return false
    if (!includeCompleted && r.status === 'completed') return false
    if (r.status !== 'completed' && r.bookedSeats + request.seats > r.capacity) return false
    return true
  })

  const matches: RideMatch[] = eligibleRides
    .map((ride) => {
      const score = calculateMatchScore(ride, request)
      return {
        ride,
        score,
        availableSeats: Math.max(0, ride.capacity - ride.bookedSeats),
        addedPickupPoint: null,
      }
    })
    .filter((m) => m.score.total >= minScore)
    .sort((a, b) => b.score.total - a.score.total)

  return matches
}

