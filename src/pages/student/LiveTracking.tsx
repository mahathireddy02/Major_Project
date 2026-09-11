import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  Shield,
  AlertTriangle,
  Phone,
  Navigation,
  Clock,
  MapPin,
  Users,
  Crosshair,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useLiveTrip } from '../../hooks/useLiveTrip'
import { api } from '../../services/api'
import CampusMap from '../../components/map/CampusMap'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'

export default function LiveTracking() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetRideId = searchParams.get('rideId')

  const rides = useAppStore((s) => s.rides)
  const bookings = useAppStore((s) => s.bookings)
  const drivers = useAppStore((s) => s.drivers)
  const vehicles = useAppStore((s) => s.vehicles)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const currentUser = useAppStore((s) => s.currentUser)
  const currentUserId = currentUser?.id || currentStudentId

  // Fetch live bookings from server on mount if not yet loaded
  useEffect(() => {
    if (currentUserId && bookings.length === 0) {
      api.getUserBookings(currentUserId).then((freshBookings) => {
        if (freshBookings?.length) {
          useAppStore.setState((s) => ({
            bookings: [...freshBookings, ...s.bookings.filter((b) => !freshBookings.some((fb: any) => fb.id === b.id))],
          }))
        }
      }).catch(() => {})
    }
  }, [currentUserId, bookings.length])

  // Find user's confirmed, boarded, or pending booking if any
  const myBooking = bookings.find(
    (b) =>
      (b.studentId === currentUserId || b.studentId === currentStudentId) &&
      (b.status === 'confirmed' || b.status === 'boarded' || b.status === 'pending' || b.status === 'in_transit')
  )

  // Find authoritative ride:
  // 1. Specified directly in query param (?rideId=...)
  // 2. Associated with student's active booking
  // 3. Any ride where current student is in passengers list (not dropped)
  // 4. Any ride currently active or boarding
  // 5. Any waiting ride with booked seats
  // 6. First available ride fallback
  const activeRide =
    (targetRideId ? rides.find((r) => r.id === targetRideId) : null) ||
    (myBooking ? rides.find((r) => r.id === myBooking.rideId) : null) ||
    rides.find(
      (r) =>
        r.status !== 'completed' &&
        r.status !== 'cancelled' &&
        r.passengers?.some(
          (p) => (p.studentId === currentUserId || p.studentId === currentStudentId) && p.status !== 'dropped'
        )
    ) ||
    rides.find((r) => r.status === 'active') ||
    rides.find((r) => r.status === 'boarding') ||
    rides.find((r) => (r.status === 'waiting' || r.status === 'full') && r.bookedSeats > 0) ||
    rides[0]

  // Use authoritative live trip hook
  const {
    tripState,
    loading,
    cameraMode,
    setCameraMode,
    isRecenterNeeded,
    recenter,
    vehiclePosition,
    vehicleHeading,
  } = useLiveTrip({
    rideId: activeRide?.id,
    defaultCameraMode: 'OVERVIEW',
  })

  const effectiveRide = tripState?.ride ? { ...activeRide, ...tripState.ride } : activeRide

  const driver = tripState?.driver || (effectiveRide ? drivers.find((d) => d.id === effectiveRide.driverId) : undefined)
  const vehicle = tripState?.vehicle || (effectiveRide ? vehicles.find((v) => v.id === effectiveRide.vehicleId) : undefined)
  const progress = tripState?.progress
  const currentStop = tripState?.currentStop

  // Determine current student's passenger record (from ride passengers array)
  const currentPassenger = effectiveRide?.passengers?.find(
    (p) => p.studentId === currentUserId || p.studentId === currentStudentId
  )
  const isDropped = currentPassenger?.status === 'dropped' || myBooking?.status === 'completed'
  const isBoarded = currentPassenger?.status === 'boarded' || myBooking?.status === 'in_transit'

  // Driver starting location
  const driverStart =
    effectiveRide?.startLocation ||
    tripState?.route?.origin?.name ||
    effectiveRide?.pickupPoints?.[0]?.name ||
    'Driver Start'

  // Personal pickup — prefer booking record, then passenger record, then first stop
  const myPickup =
    myBooking?.pickupName ||
    (myBooking as any)?.pickup ||
    currentPassenger?.pickup ||
    effectiveRide?.pickupPoints?.[0]?.name ||
    'Campus Stop'

  // Personal destination — prefer booking record first (student's actual destination),
  // then passenger record, only fall back to ride-level destination last
  const myDestination =
    myBooking?.destinationName ||
    (myBooking as any)?.destination ||
    currentPassenger?.destination ||
    effectiveRide?.destination ||
    'Campus Hub'

  // Find student's personal pickup and dropoff stop for accurate personal ETA
  const stopsList = tripState?.stops || effectiveRide?.stops || []
  const myPickupStop = stopsList.find(
    (s: any) =>
      s.type === 'PICKUP' &&
      (s.studentId === currentUserId || s.name?.toLowerCase() === myPickup.toLowerCase())
  )
  const myDropoffStop = stopsList.find(
    (s: any) =>
      s.type === 'DROPOFF' &&
      (s.studentId === currentUserId || s.name?.toLowerCase() === myDestination.toLowerCase())
  )

  const personalEta = isBoarded
    ? myDropoffStop?.estimatedArrival || progress?.etaString || effectiveRide?.estimatedArrival
    : myPickupStop?.estimatedArrival || progress?.etaString || effectiveRide?.departureTime

  if (!activeRide) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-4">
          <Navigation size={32} />
        </div>
        <h2 className="text-xl font-heading font-bold text-slate-800 mb-1">No Active Booking Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          Find an available campus shuttle or submit a ride request to start live trip tracking.
        </p>
        <Button onClick={() => navigate('/student/rides')}>Browse Campus Rides</Button>
      </div>
    )
  }

  // Determine dynamic journey status
  let statusBanner = {
    title: 'Driver is en route to pickup',
    desc: driverStart && driverStart.toLowerCase() !== myPickup.toLowerCase()
      ? `Started from ${driverStart} · Heading to your pickup at ${myPickup}`
      : `Heading to your pickup stop: ${myPickup}`,
    color: 'bg-primary-600',
    badge: 'LIVE',
  }

  if (isDropped) {
    statusBanner = {
      title: 'You have arrived at your destination!',
      desc: `Safely dropped off at ${myDestination}. Thank you for riding with Campus Mobility!`,
      color: 'bg-emerald-600',
      badge: 'COMPLETED',
    }
  } else if (effectiveRide.status === 'waiting' || effectiveRide.status === 'full') {
    statusBanner = {
      title: 'Booking Confirmed — Driver Assigned',
      desc: `Pickup at ${myPickup} · Departs ${effectiveRide.departureTime}`,
      color: 'bg-slate-800',
      badge: 'SCHEDULED',
    }
  } else if (effectiveRide.status === 'boarding') {
    statusBanner = {
      title: 'Boarding in Progress',
      desc: `Driver is boarding passengers at ${myPickupStop?.name || myPickup}`,
      color: 'bg-amber-600',
      badge: 'BOARDING',
    }
  } else if (myPickupStop?.status === 'ARRIVED') {
    statusBanner = {
      title: 'Driver has arrived at your stop!',
      desc: `Meet your shuttle (${vehicle?.name || 'Campus Van'} · ${vehicle?.registration || 'TS 07 UA 1234'}) at ${myPickup}`,
      color: 'bg-emerald-600',
      badge: 'ARRIVED',
    }
  } else if (isBoarded) {
    statusBanner = {
      title: 'On Trip to Your Destination',
      desc: `Boarded at ${myPickup} · Heading to ${myDestination}`,
      color: 'bg-indigo-600',
      badge: 'IN TRANSIT',
    }
  }

  return (
    <div className="relative h-screen w-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Floating Header & SOS */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <button
          onClick={() => navigate(-1)}
          className="bg-white/95 backdrop-blur-md p-2.5 rounded-full shadow-lg text-slate-700 hover:text-slate-900 cursor-pointer transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${effectiveRide.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-primary-500'}`} />
          <span className="text-xs font-bold text-slate-800 tracking-wide">{statusBanner.badge} GPS MONITORING</span>
        </div>

        <button
          onClick={() => navigate('/student/safety')}
          className="bg-red-500 hover:bg-red-600 text-white px-3.5 py-2 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
        >
          <Shield size={15} />
          SOS
        </button>
      </div>

      {/* Route Deviation Banner if active */}
      {(progress?.isOffRoute || effectiveRide.hasDeviation) && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-slate-950 flex-shrink-0" />
            <p className="text-xs font-bold">Route deviation detected. Dispatcher & safety monitoring active.</p>
          </div>
          <Button size="sm" variant="secondary" className="text-xs py-1 h-7" onClick={() => navigate('/student/safety')}>
            Safety
          </Button>
        </div>
      )}

      {/* Full screen Map */}
      <div className="flex-1 w-full h-full">
        <CampusMap
          origin={
            tripState?.route?.origin ||
            (effectiveRide.startLocation
              ? {
                  lat: effectiveRide.startLocationLat || effectiveRide.currentLat,
                  lng: effectiveRide.startLocationLng || effectiveRide.currentLng,
                  name: effectiveRide.startLocation,
                }
              : undefined)
          }
          highlightStopStudentId={currentUserId || currentStudentId}
          stops={tripState?.stops || effectiveRide.stops || []}
          routeCoordinates={tripState?.route?.geometry || effectiveRide.routeCoordinates || []}
          vehicleLat={vehiclePosition ? vehiclePosition[0] : effectiveRide.currentLat}
          vehicleLng={vehiclePosition ? vehiclePosition[1] : effectiveRide.currentLng}
          vehicleHeading={vehicleHeading}
          cameraMode={cameraMode}
          onCameraModeChange={setCameraMode}
          onRecenter={recenter}
          height="h-full"
          interactive
          alertMode={progress?.isOffRoute || effectiveRide.hasDeviation}
          showRecenterButton={isRecenterNeeded}
        />
      </div>

      {/* Floating Bottom Sheet */}
      <div className="absolute bottom-4 left-4 right-4 z-20 max-w-lg mx-auto pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 space-y-3">
          {/* Status Pill */}
          <div className={`${statusBanner.color} text-white rounded-xl px-3 py-2 flex items-center justify-between`}>
            <div>
              <div className="font-bold text-xs">{statusBanner.title}</div>
              <div className="text-[11px] text-white/90">{statusBanner.desc}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-base font-extrabold text-white">
                {personalEta}
              </span>
              <div className="text-[10px] text-white/80">
                {isDropped ? 'Dropped Off' : effectiveRide.status === 'active' ? (isBoarded ? 'Dropoff ETA' : 'Pickup ETA') : 'Departure'}
              </div>
            </div>
          </div>

          {/* Journey Itinerary Stepper (Driver Start -> Pickup -> Destination) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Your Trip Route</span>
              <span className="text-primary-700 font-semibold">{effectiveRide.routeName || `${myPickup} → ${myDestination}`}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 relative">
              {/* Step 1: Driver Start */}
              <div className="flex flex-col items-center text-center p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center mb-1">
                  1
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Driver Start</span>
                <span className="text-xs font-bold text-slate-800 line-clamp-1" title={driverStart}>
                  {driverStart}
                </span>
                <span className="text-[9px] text-emerald-600 font-bold mt-0.5">
                  {effectiveRide.status === 'active' ? 'En Route' : 'Origin'}
                </span>
              </div>

              {/* Step 2: Passenger Pickup */}
              <div className={`flex flex-col items-center text-center p-2 rounded-lg border shadow-2xs ${
                isBoarded || isDropped
                  ? 'bg-slate-50 border-slate-200 opacity-80'
                  : 'bg-primary-50/50 border-primary-200 ring-2 ring-primary-300/40'
              }`}>
                <div className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center mb-1 ${
                  isBoarded || isDropped
                    ? 'bg-slate-200 text-slate-600'
                    : 'bg-primary-600 text-white animate-pulse'
                }`}>
                  {isBoarded || isDropped ? '✓' : '2'}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Your Pickup</span>
                <span className="text-xs font-bold text-slate-800 line-clamp-1" title={myPickup}>
                  {myPickup}
                </span>
                <span className={`text-[9px] font-bold mt-0.5 ${isBoarded ? 'text-slate-500' : 'text-primary-700'}`}>
                  {isBoarded ? 'Boarded' : myPickupStop?.status === 'ARRIVED' ? 'Arrived!' : myPickupStop?.estimatedArrival ? `ETA ${myPickupStop.estimatedArrival}` : 'Pickup'}
                </span>
              </div>

              {/* Step 3: Passenger Dropoff */}
              <div className={`flex flex-col items-center text-center p-2 rounded-lg border shadow-2xs ${
                isDropped
                  ? 'bg-emerald-50 border-emerald-300'
                  : isBoarded
                  ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-300/40'
                  : 'bg-white border-slate-200'
              }`}>
                <div className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center mb-1 ${
                  isDropped
                    ? 'bg-emerald-600 text-white'
                    : isBoarded
                    ? 'bg-indigo-600 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {isDropped ? '✓' : '3'}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Your Dropoff</span>
                <span className="text-xs font-bold text-slate-800 line-clamp-1" title={myDestination}>
                  {myDestination}
                </span>
                <span className={`text-[9px] font-bold mt-0.5 ${
                  isDropped
                    ? 'text-emerald-700'
                    : isBoarded
                    ? 'text-indigo-700'
                    : 'text-slate-400'
                }`}>
                  {isDropped ? 'Arrived' : personalEta ? `ETA ${personalEta}` : 'Destination'}
                </span>
              </div>
            </div>
          </div>

          {/* Ride Details Header */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">{effectiveRide.routeName}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-primary-600" />
                <span>Your Destination: <strong className="text-slate-800">{myDestination}</strong></span>
              </p>
            </div>
            <div className="text-right">
              {isDropped ? (
                <Button size="sm" variant="primary" onClick={() => navigate('/student/history')}>
                  View Receipt
                </Button>
              ) : (
                <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded-lg">
                  {progress?.remainingDistanceMeters
                    ? `${(progress.remainingDistanceMeters / 1000).toFixed(1)} km away`
                    : `${effectiveRide.distanceKm} km`}
                </span>
              )}
            </div>
          </div>

          {/* Driver brief */}
          {driver && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <Avatar name={driver.name} size="md" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900">{driver.name}</p>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                      ★ {driver.rating || 4.9}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {vehicle?.name || 'Campus Shuttle'} · {vehicle?.registration || 'TS 07 UA 1234'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${driver.phone || '+91 98765 43210'}`}
                  className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                >
                  <Phone size={16} />
                </a>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/student/ride/${activeRide.id}`)}>
                  Details
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
