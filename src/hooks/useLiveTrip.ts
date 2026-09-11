import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../services/api'
import { useAppStore } from '../store/appStore'
import type { LiveTripState, MapCameraMode, RouteStop, RouteStep, TripRoute } from '../types'

interface UseLiveTripOptions {
  rideId: string | undefined
  defaultCameraMode?: MapCameraMode
  pollingIntervalMs?: number
}

function normalizeAngleDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180
}

export function useLiveTrip({
  rideId,
  defaultCameraMode = 'OVERVIEW',
  pollingIntervalMs = 8000,
}: UseLiveTripOptions) {
  const [tripState, setTripState] = useState<LiveTripState | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [cameraMode, setCameraMode] = useState<MapCameraMode>(defaultCameraMode)
  const [isRecenterNeeded, setIsRecenterNeeded] = useState<boolean>(false)

  // Smooth interpolation coordinates
  const [vehiclePosition, setVehiclePosition] = useState<[number, number] | null>(null)
  const [vehicleHeading, setVehicleHeading] = useState<number>(0)

  const animFrameRef = useRef<number | null>(null)
  const prevPositionRef = useRef<[number, number] | null>(null)
  const targetPositionRef = useRef<[number, number] | null>(null)
  const prevHeadingRef = useRef<number>(0)
  const targetHeadingRef = useRef<number>(0)
  const animStartRef = useRef<number>(0)
  const animDurationMs = 1200

  // Fetch initial trip state
  const fetchTrip = useCallback(async () => {
    if (!rideId) return
    try {
      const data = await api.getLiveTrip(rideId)
      setTripState(data)
      setError(null)

      if (data.vehicle?.currentLat && data.vehicle?.currentLng) {
        const initialPos: [number, number] = [data.vehicle.currentLat, data.vehicle.currentLng]
        const initialHeading = data.vehicle.heading || 0

        targetPositionRef.current = initialPos
        prevPositionRef.current = initialPos
        setVehiclePosition(initialPos)

        targetHeadingRef.current = initialHeading
        prevHeadingRef.current = initialHeading
        setVehicleHeading(initialHeading)
      }
    } catch (err: any) {
      console.warn('[useLiveTrip] Error fetching live trip:', err)
      setError(err?.message || 'Failed to load live trip data')
    } finally {
      setLoading(false)
    }
  }, [rideId])

  useEffect(() => {
    fetchTrip()
  }, [fetchTrip])

  // Polling fallback in case WS has intermittent drops
  useEffect(() => {
    if (!rideId || pollingIntervalMs <= 0) return
    const interval = setInterval(() => {
      fetchTrip()
    }, pollingIntervalMs)
    return () => clearInterval(interval)
  }, [rideId, pollingIntervalMs, fetchTrip])

  // Animate vehicle marker smoothly
  const animateMarker = useCallback((time: number) => {
    if (!prevPositionRef.current || !targetPositionRef.current) return

    if (!animStartRef.current) animStartRef.current = time
    const elapsed = time - animStartRef.current
    const progress = Math.min(1, elapsed / animDurationMs)

    // Ease-out cubic for smooth vehicle movement
    const ease = 1 - Math.pow(1 - progress, 3)

    const curLat = prevPositionRef.current[0] + (targetPositionRef.current[0] - prevPositionRef.current[0]) * ease
    const curLng = prevPositionRef.current[1] + (targetPositionRef.current[1] - prevPositionRef.current[1]) * ease
    setVehiclePosition([curLat, curLng])

    const deltaHeading = normalizeAngleDelta(prevHeadingRef.current, targetHeadingRef.current)
    const curHeading = (prevHeadingRef.current + deltaHeading * ease + 360) % 360
    setVehicleHeading(curHeading)

    if (progress < 1) {
      animFrameRef.current = requestAnimationFrame(animateMarker)
    } else {
      prevPositionRef.current = targetPositionRef.current
      prevHeadingRef.current = targetHeadingRef.current
      animFrameRef.current = null
    }
  }, [animDurationMs])

  const queueVehicleMovement = useCallback((lat: number, lng: number, heading: number) => {
    if (vehiclePosition) {
      prevPositionRef.current = vehiclePosition
    } else {
      prevPositionRef.current = [lat, lng]
    }
    targetPositionRef.current = [lat, lng]

    prevHeadingRef.current = vehicleHeading
    targetHeadingRef.current = heading

    animStartRef.current = performance.now()
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }
    animFrameRef.current = requestAnimationFrame(animateMarker)
  }, [vehiclePosition, vehicleHeading, animateMarker])

  // Real-time WebSocket subscriptions
  useEffect(() => {
    if (!rideId) return

    const unsubscribe = api.onRealtimeEvent((event, payload) => {
      if (payload?.rideId && payload.rideId !== rideId) return

      if (event === 'VEHICLE_LOCATION_UPDATED') {
        const { lat, lng, heading = 0, speed = 0, progress, currentStop, nextManeuver } = payload

        if (typeof lat === 'number' && typeof lng === 'number') {
          queueVehicleMovement(lat, lng, heading)
        }

        setTripState((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            vehicle: prev.vehicle
              ? { ...prev.vehicle, currentLat: lat, currentLng: lng, heading, speed }
              : undefined,
            progress: progress || prev.progress,
            currentStop: currentStop !== undefined ? currentStop : prev.currentStop,
            nextManeuver: nextManeuver !== undefined ? nextManeuver : prev.nextManeuver,
          }
        })
      } else if (event === 'STOP_UPDATED') {
        const { stop, currentStop } = payload
        setTripState((prev) => {
          if (!prev) return prev
          const updatedStops = (prev.stops || []).map((s) => (s.id === stop?.id ? { ...s, ...stop } : s))
          return {
            ...prev,
            stops: updatedStops,
            currentStop: currentStop || (stop?.status === 'ARRIVED' ? stop : prev.currentStop),
          }
        })
      } else if (event === 'ROUTE_UPDATED') {
        const { route, stops } = payload
        setTripState((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            route: route || prev.route,
            stops: stops || prev.stops,
          }
        })
      } else if (
        event === 'RIDE_STATUS_UPDATED' ||
        event === 'RIDE_STARTED' ||
        event === 'RIDE_COMPLETED' ||
        event === 'RIDE_UPDATED'
      ) {
        const updatedRide = payload.ride
        if (updatedRide) {
          setTripState((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              status: updatedRide?.status || prev.status,
              ride: { ...prev.ride, ...updatedRide },
              stops: updatedRide.stops || prev.stops,
              route: updatedRide.tripRoute || prev.route,
            }
          })
          useAppStore.setState((state) => ({
            rides: state.rides.map((r) => (r.id === updatedRide.id ? { ...r, ...updatedRide } : r)),
          }))
        }
      } else if (
        event === 'PASSENGER_BOARDED' ||
        event === 'PASSENGER_DROPPED' ||
        event === 'PASSENGER_ADDED' ||
        event === 'BOOKING_CREATED' ||
        event === 'BOOKING_UPDATED'
      ) {
        fetchTrip()
      }
    })

    return () => {
      unsubscribe()
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [rideId, queueVehicleMovement])

  // Camera helpers
  const handleUserPan = useCallback(() => {
    if (cameraMode !== 'FREE_EXPLORE') {
      setCameraMode('FREE_EXPLORE')
      setIsRecenterNeeded(true)
    }
  }, [cameraMode])

  const recenter = useCallback(() => {
    setCameraMode(defaultCameraMode)
    setIsRecenterNeeded(false)
  }, [defaultCameraMode])

  // Actions
  const sendDriverLocation = useCallback(
    async (loc: { lat: number; lng: number; heading?: number; speed?: number }) => {
      if (!rideId) return
      try {
        const res = await api.sendDriverLocation(rideId, loc)
        if (res?.progress) {
          setTripState((prev) => (prev ? { ...prev, progress: res.progress, currentStop: res.currentStop, nextManeuver: res.nextManeuver || undefined } : prev))
        }
      } catch (err) {
        console.warn('[useLiveTrip] Failed to send driver location:', err)
      }
    },
    [rideId]
  )

  const markStopArrived = useCallback(
    async (stopId: string) => {
      if (!rideId) return
      try {
        await api.markStopArrived(rideId, stopId)
      } catch (err) {
        console.warn('[useLiveTrip] Failed to mark stop arrived:', err)
      }
    },
    [rideId]
  )

  const markStopBoarded = useCallback(
    async (stopId: string) => {
      if (!rideId) return
      try {
        await api.markStopBoarded(rideId, stopId)
      } catch (err) {
        console.warn('[useLiveTrip] Failed to mark stop boarded:', err)
      }
    },
    [rideId]
  )

  const startTrip = useCallback(async (startLocation?: { name?: string; lat: number; lng: number }) => {
    if (!rideId) return
    try {
      await api.startDriverTrip(rideId, startLocation)
      fetchTrip()
    } catch (err) {
      console.warn('[useLiveTrip] Failed to start trip:', err)
      throw err
    }
  }, [rideId, fetchTrip])

  const completeTrip = useCallback(async () => {
    if (!rideId) return
    try {
      await api.completeDriverTrip(rideId)
      fetchTrip()
    } catch (err) {
      console.warn('[useLiveTrip] Failed to complete trip:', err)
    }
  }, [rideId, fetchTrip])

  const recalculateRoute = useCallback(async () => {
    if (!rideId) return
    try {
      const updatedRoute = await api.recalculateRoute(rideId)
      setTripState((prev) => (prev ? { ...prev, route: updatedRoute } : prev))
    } catch (err) {
      console.warn('[useLiveTrip] Failed to recalculate route:', err)
    }
  }, [rideId])

  const updatePassengerStatus = useCallback(
    async (studentId: string, status: 'waiting' | 'boarded' | 'dropped') => {
      if (!rideId) return
      try {
        const res: any = await api.updatePassengerStatus(rideId, studentId, status)
        const updatedRide = res?.data || res
        if (updatedRide && updatedRide.id) {
          setTripState((prev) => (prev ? {
            ...prev,
            ride: { ...prev.ride, ...updatedRide },
            stops: updatedRide.stops || prev.stops,
          } : prev))
          useAppStore.setState((state) => ({
            rides: state.rides.map((r) => (r.id === rideId ? { ...r, ...updatedRide } : r)),
          }))
        }
        await fetchTrip()
      } catch (err) {
        console.warn('[useLiveTrip] Failed to update passenger status:', err)
      }
    },
    [rideId, fetchTrip]
  )

  return {
    tripState,
    loading,
    error,
    cameraMode,
    setCameraMode,
    isRecenterNeeded,
    recenter,
    handleUserPan,
    vehiclePosition,
    vehicleHeading,
    sendDriverLocation,
    markStopArrived,
    markStopBoarded,
    updatePassengerStatus,
    startTrip,
    completeTrip,
    recalculateRoute,
    refresh: fetchTrip,
  }
}
