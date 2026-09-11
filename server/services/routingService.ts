import axios from 'axios'
import { ENV } from '../config/env.js'

export interface RouteResult {
  distanceMeters: number
  durationSeconds: number
  geometry: [number, number][] // [lat, lng]
  legs: any[]
  steps?: any[]
}

// In-memory LRU-style cache
const routeCache = new Map<string, { data: RouteResult; timestamp: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

function getCacheKey(coordinates: [number, number][]): string {
  return coordinates.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join(';')
}

// Haversine fallback distance in meters
export function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export class RoutingService {
  private baseUrl: string

  constructor(baseUrl = ENV.OSRM_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  /**
   * Get route geometry and duration across multiple waypoints [[lat, lng], ...]
   */
  async getRoute(coordinates: [number, number][]): Promise<RouteResult> {
    if (coordinates.length < 2) {
      return {
        distanceMeters: 0,
        durationSeconds: 0,
        geometry: coordinates,
        legs: [],
      }
    }

    const cacheKey = getCacheKey(coordinates)
    const cached = routeCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }

    // OSRM expects coordinates in lng,lat order separated by semicolon
    const coordString = coordinates.map(([lat, lng]) => `${lng},${lat}`).join(';')
    const url = `${this.baseUrl}/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=true`

    let lastError: any = null
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: 8000,
          headers: { 'User-Agent': 'CampusMobility/2.0' },
        })
        if (response.data && response.data.routes && response.data.routes.length > 0) {
          const route = response.data.routes[0]
          // GeoJSON coordinates are [lng, lat], normalize to [lat, lng]
          const geometry: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          )

          const steps: any[] = []
          if (route.legs) {
            for (const leg of route.legs) {
              if (leg.steps) {
                for (const s of leg.steps) {
                  steps.push({
                    instruction: s.maneuver?.instruction || `${s.maneuver?.type || 'Drive'} on ${s.name || 'road'}`,
                    distanceMeters: Math.round(s.distance || 0),
                    durationSeconds: Math.round(s.duration || 0),
                    maneuverType: s.maneuver?.type || 'turn',
                    roadName: s.name || '',
                  })
                }
              }
            }
          }

          const result: RouteResult = {
            distanceMeters: Math.round(route.distance),
            durationSeconds: Math.round(route.duration),
            geometry,
            legs: route.legs || [],
            steps,
          }

          routeCache.set(cacheKey, { data: result, timestamp: Date.now() })
          return result
        }
      } catch (err: any) {
        lastError = err
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 600))
        }
      }
    }

    console.warn(`[RoutingService] OSRM call failed after 2 attempts: ${lastError?.message || 'Unknown error'}`)

    // If OSRM is completely unreachable, calculate distance and provide route points without synthetic straight lines across buildings
    let totalDist = 0
    for (let i = 0; i < coordinates.length - 1; i++) {
      totalDist += haversineDistanceMeters(
        coordinates[i][0],
        coordinates[i][1],
        coordinates[i + 1][0],
        coordinates[i + 1][1]
      )
    }
    const durationSeconds = Math.round(totalDist / 6.94) // 25 km/h campus speed

    const fallbackResult: RouteResult = {
      distanceMeters: Math.round(totalDist),
      durationSeconds,
      geometry: coordinates,
      legs: [],
      steps: [],
    }

    return fallbackResult
  }

  /**
   * Calculate detour extra time and extra distance when inserting a new stop
   */
  async calculateDetour(
    existingStops: [number, number][],
    newStop: [number, number]
  ): Promise<{
    bestOrder: [number, number][]
    extraDistanceMeters: number
    extraDurationSeconds: number
    percentDetour: number
  }> {
    const baseRoute = await this.getRoute(existingStops)

    // Evaluate all possible insertion indices (between start and destination)
    let bestResult: {
      bestOrder: [number, number][]
      extraDistanceMeters: number
      extraDurationSeconds: number
      percentDetour: number
    } = {
      bestOrder: [...existingStops.slice(0, -1), newStop, existingStops[existingStops.length - 1]],
      extraDistanceMeters: Infinity,
      extraDurationSeconds: Infinity,
      percentDetour: 100,
    }

    for (let i = 1; i < existingStops.length; i++) {
      const candidateOrder: [number, number][] = [
        ...existingStops.slice(0, i),
        newStop,
        ...existingStops.slice(i),
      ]

      const candidateRoute = await this.getRoute(candidateOrder)
      const extraDist = Math.max(0, candidateRoute.distanceMeters - baseRoute.distanceMeters)
      const extraTime = Math.max(0, candidateRoute.durationSeconds - baseRoute.durationSeconds)
      const pct = baseRoute.distanceMeters > 0 ? (extraDist / baseRoute.distanceMeters) * 100 : 0

      if (extraDist < bestResult.extraDistanceMeters) {
        bestResult = {
          bestOrder: candidateOrder,
          extraDistanceMeters: extraDist,
          extraDurationSeconds: extraTime,
          percentDetour: Math.round(pct * 10) / 10,
        }
      }
    }

    return bestResult
  }
}

export const routingService = new RoutingService()
