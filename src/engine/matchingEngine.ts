import type { Ride, Driver } from '../types'

/**
 * Returns true if a ride's route is locked and must NOT be re-optimized.
 * A route is locked when the assigned driver is a student driver.
 * Locked routes can only be changed by admin/safety/vehicle override.
 */
export function isRouteLocked(ride: Ride, drivers?: Driver[]): boolean {
  if ((ride as any).routeStatus === 'locked') return true
  if (drivers) {
    const driver = drivers.find((d) => d.id === ride.driverId)
    if (driver && (driver as any).driverType === 'student') return true
  }
  return false
}

/**
 * Valid override reasons that allow re-optimization of a locked student driver route.
 */
export type RouteOverrideReason =
  | 'driver_cancelled'
  | 'driver_unavailable'
  | 'vehicle_unavailable'
  | 'insufficient_capacity'
  | 'safety_emergency'
  | 'admin_override'
  | 'route_obstruction'

export function canReoptimizeLockedRoute(reason?: RouteOverrideReason): boolean {
  if (!reason) return false
  const validReasons: RouteOverrideReason[] = [
    'driver_cancelled', 'driver_unavailable', 'vehicle_unavailable',
    'insufficient_capacity', 'safety_emergency', 'admin_override', 'route_obstruction',
  ]
  return validReasons.includes(reason)
}

export interface MatchScore {
  total: number
  destination: number
  routeOverlap: number
  timeCompatibility: number
  pickupProximity: number
  detour: number
  activeBonus?: number
  driverDistanceKm?: number
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

function getSummary(scores: MatchScore, driverDistKm?: number, rideStatus?: string): string[] {
  const bullets: string[] = []
  if (typeof driverDistKm === 'number') {
    if (driverDistKm <= 2.0) bullets.push(`Nearest active driver (${driverDistKm.toFixed(1)} km away)`)
    else if (driverDistKm <= 5.0) bullets.push(`Driver nearby (${driverDistKm.toFixed(1)} km away)`)
    else if (driverDistKm > 10.0) bullets.push(`Long drive (${driverDistKm.toFixed(1)} km away)`)
  }
  if (rideStatus === 'active') bullets.push('Live active ride')
  if (scores.destination >= 80) bullets.push('Same destination')
  if (scores.pickupProximity >= 70) bullets.push('Pickup stop within 1km')
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

  // 0. Driver's actual current location
  const vehicleLat = typeof ride.currentLat === 'number' && ride.currentLat !== 0
    ? ride.currentLat
    : typeof ride.startLocationLat === 'number' && ride.startLocationLat !== 0
    ? ride.startLocationLat
    : (ride.pickupPoints?.[0]?.lat ?? ride.destinationLat)

  const vehicleLng = typeof ride.currentLng === 'number' && ride.currentLng !== 0
    ? ride.currentLng
    : typeof ride.startLocationLng === 'number' && ride.startLocationLng !== 0
    ? ride.startLocationLng
    : (ride.pickupPoints?.[0]?.lng ?? ride.destinationLng)

  const driverDistKm = haversineKm(vehicleLat, vehicleLng, pLat, pLng)

  // Route stop waypoint distance
  let minRouteDist = Infinity
  for (const pp of (ride.pickupPoints || [])) {
    minRouteDist = Math.min(minRouteDist, haversineKm(pLat, pLng, pp.lat, pp.lng))
  }
  if (minRouteDist === Infinity) minRouteDist = driverDistKm

  // 1. Driver & Pickup Proximity (40% Weight) - dominant factor
  // Distant vehicles (> 10 km) are severely penalized
  let driverProxScore = 0
  if (driverDistKm <= 0.8) driverProxScore = 100
  else if (driverDistKm <= 1.5) driverProxScore = 95
  else if (driverDistKm <= 3.0) driverProxScore = 85
  else if (driverDistKm <= 5.0) driverProxScore = 70
  else if (driverDistKm <= 8.0) driverProxScore = 50
  else if (driverDistKm <= 12.0) driverProxScore = 25
  else if (driverDistKm <= 18.0) driverProxScore = 10
  else driverProxScore = 0

  const routeProxScore = minRouteDist < 0.4 ? 100 : minRouteDist < 1.0 ? 85 : minRouteDist < 2.5 ? 65 : minRouteDist < 5.0 ? 40 : 10
  const proxScore = Math.round(driverProxScore * 0.75 + routeProxScore * 0.25)

  // 2. Active Ride Priority Bonus (15% Weight)
  let activeScore = 50
  if (ride.status === 'active') activeScore = 100
  else if (ride.status === 'boarding') activeScore = 80
  else if (ride.status === 'waiting') activeScore = 60

  // 3. Destination (15% Weight)
  const dDest = haversineKm(dLat, dLng, ride.destinationLat, ride.destinationLng)
  const isExactDest =
    ride.destination.toLowerCase() === request.destination.toLowerCase() ||
    ride.destination.toLowerCase().includes(request.destination.toLowerCase()) ||
    request.destination.toLowerCase().includes(ride.destination.toLowerCase())
  const destScore = isExactDest ? 100
    : dDest < 0.8 ? 90
    : dDest < 2.0 ? 75
    : dDest < 4.0 ? 50
    : dDest < 7.0 ? 30
    : 10

  // 4. Route Overlap (15% Weight)
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

  // 5. Detour (10% Weight)
  const detourScore = minRouteDist < 0.5 ? 100 : minRouteDist < 1.5 ? 85 : minRouteDist < 3.0 ? 60 : 30

  // 6. Time (5% Weight)
  const reqMin  = parseTime(request.requestedTime)
  const rideMin = parseTime(ride.departureTime)
  const timeDiff = Math.abs(reqMin - rideMin)
  const timeScore = timeDiff <= 10 ? 100
    : timeDiff <= 20 ? 85
    : timeDiff <= 35 ? 65
    : timeDiff <= 60 ? 40
    : 20

  // Weighted total (40% Prox + 15% Active + 15% Dest + 15% Route + 10% Detour + 5% Time)
  const total = Math.round(
    proxScore   * 0.40 +
    activeScore * 0.15 +
    destScore   * 0.15 +
    routeScore  * 0.15 +
    detourScore * 0.10 +
    timeScore   * 0.05
  )

  const score: MatchScore = {
    total,
    destination:       destScore,
    routeOverlap:      routeScore,
    timeCompatibility: timeScore,
    pickupProximity:   proxScore,
    detour:            detourScore,
    activeBonus:       activeScore,
    driverDistanceKm:  Math.round(driverDistKm * 10) / 10,
    explanation: {
      destinationLabel: scoreLabel(destScore),
      routeLabel:       scoreLabel(routeScore),
      timeLabel:        scoreLabel(timeScore),
      proximityLabel:   scoreLabel(proxScore),
      detourLabel:      scoreLabel(detourScore),
      summary: [],
    },
  }
  score.explanation.summary = getSummary(score, driverDistKm, ride.status)
  return score
}

export interface FindMatchesOptions {
  includeCompleted?: boolean
  minScore?: number
  drivers?: Driver[]
  overrideReason?: RouteOverrideReason
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
    // Route lock: student driver routes are excluded from re-optimization
    // unless a valid override reason is provided
    if (isRouteLocked(r, options?.drivers) && !canReoptimizeLockedRoute(options?.overrideReason)) return false
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
    .sort((a, b) => {
      const scoreDiff = b.score.total - a.score.total
      if (Math.abs(scoreDiff) <= 8) {
        const distA = a.score.driverDistanceKm ?? Infinity
        const distB = b.score.driverDistanceKm ?? Infinity
        if (distA !== distB) {
          return distA - distB
        }
      }
      return scoreDiff
    })

  return matches
}

