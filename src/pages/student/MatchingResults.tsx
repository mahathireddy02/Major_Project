import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Star, MapPin, Clock, Users, ChevronRight, CheckCircle2,
  AlertCircle, ArrowLeft, Car, Zap, ChevronDown, ChevronUp,
  Sparkles, ShieldCheck, ArrowRight, Shield
} from 'lucide-react'
import { findMatches, haversineKm, type RideMatch } from '../../engine/matchingEngine'
import { useAppStore } from '../../store/appStore'
import MatchingAnimation from '../../components/matching/MatchingAnimation'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import SeatProgress from '../../components/ui/SeatProgress'
import { getScoreColor, getScoreBg, getRideStatusBadge, getRideStatusLabel } from '../../lib/utils'

import { getCurrentRealTime } from '../../components/booking/DepartureTimeSelector'
import { api } from '../../services/api'
import type { FareEstimateResult } from '../../types'

function getEstimatedFallbackFare(pickupLat: number, pickupLng: number, destLat: number, destLng: number, seats: number = 1): number {
  if (!pickupLat || !pickupLng || !destLat || !destLng) return 30 * seats
  const directDist = haversineKm(pickupLat, pickupLng, destLat, destLng)
  const roadDist = Math.max(1, directDist * 1.25)
  const estTimeMin = Math.max(2, Math.round(roadDist * 1.3))
  const calculated = Math.round(20 + roadDist * 8 + estTimeMin * 1)
  return Math.max(30, Math.min(500, calculated)) * seats
}

export default function MatchingResults() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const pickup = searchParams.get('pickup') || 'Charminar'
  const pickupAddress = searchParams.get('pickupAddress') || ''
  const pickupLat = Number(searchParams.get('pickupLat')) || 17.3616
  const pickupLng = Number(searchParams.get('pickupLng')) || 78.4747

  const destination = searchParams.get('destination') || 'Destination Hub'
  const destinationAddress = searchParams.get('destinationAddress') || ''
  const destinationLat = Number(searchParams.get('destinationLat')) || 17.2063
  const destinationLng = Number(searchParams.get('destinationLng')) || 78.6015

  const time = searchParams.get('time') || getCurrentRealTime()
  const seats = Number(searchParams.get('seats') || '1')
  const genderPreference = searchParams.get('genderPreference') || 'ANYONE'

  const rides = useAppStore((s) => s.rides)
  const drivers = useAppStore((s) => s.drivers)
  const vehicles = useAppStore((s) => s.vehicles)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const createRide = useAppStore((s) => s.createRide)

  const [showAnimation, setShowAnimation] = useState(true)
  const [matches, setMatches] = useState<RideMatch[]>([])
  const [showOtherOptions, setShowOtherOptions] = useState(false)
  const [isCreatingRequest, setIsCreatingRequest] = useState(false)
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0)
  const [faresByRideId, setFaresByRideId] = useState<Record<string, FareEstimateResult>>({})

  // Fetch dynamic individual fare estimates for all match options
  useEffect(() => {
    if (matches.length > 0 && pickupLat && pickupLng && destinationLat && destinationLng) {
      matches.forEach((m) => {
        api
          .getFareEstimate({
            pickupName: pickup,
            pickupLat,
            pickupLng,
            destinationName: destination,
            destinationLat,
            destinationLng,
            seats,
            rideId: m.ride.id,
          })
          .then((res: any) => {
            const fareData = res?.data || res
            if (fareData && typeof fareData.estimatedFare === 'number') {
              setFaresByRideId((prev) => ({ ...prev, [m.ride.id]: fareData }))
            }
          })
          .catch((e) => console.warn('[MatchingResults] Fare estimate fetch failed:', e?.message))
      })
    }
  }, [matches, pickupLat, pickupLng, destinationLat, destinationLng, seats, pickup, destination])

  const handleAnimationComplete = async () => {
    try {
      const resp = await api.submitRideRequest({
        pickup: { name: pickup, address: pickupAddress, latitude: pickupLat, longitude: pickupLng },
        destination: { name: destination, address: destinationAddress, latitude: destinationLat, longitude: destinationLng },
        time,
        seats,
        genderPreference,
      })

      if (resp && resp.matches && resp.matches.length > 0) {
        const mapped: RideMatch[] = resp.matches.map((m: any) => ({
          ride: m.ride,
          score: {
            ...m.score,
            driverDistanceKm: typeof m.driverDistanceMeters === 'number'
              ? Math.round(m.driverDistanceMeters / 100) / 10
              : typeof m.score?.driverDistanceMeters === 'number'
              ? Math.round(m.score.driverDistanceMeters / 100) / 10
              : undefined,
          },
          availableSeats: m.availableSeats,
          addedPickupPoint: pickup,
        }))
        setMatches(mapped)
        // Sync matched rides into store so RideDetail can immediately access them
        const matchedRides = mapped.map((m) => m.ride).filter(Boolean)
        useAppStore.setState((s) => ({
          rides: [
            ...s.rides,
            ...matchedRides.filter((mr) => !s.rides.some((sr) => sr.id === mr.id)),
          ],
        }))
        setShowAnimation(false)
        return
      }
    } catch (e) {
      console.warn('[MatchingResults] Backend match query fallback to client:', e)
    }

    const results = findMatches(rides, {
      pickup,
      destination,
      requestedTime: time,
      seats,
      pickupCoords: { lat: pickupLat, lng: pickupLng },
      destinationCoords: { lat: destinationLat, lng: destinationLng },
    })
    setMatches(results)
    setShowAnimation(false)
  }

  const handleCreateNewRide = async () => {
    setIsCreatingRequest(true)
    try {
      const newRide = await createRide(
        pickup,
        destination,
        time,
        seats,
        currentStudentId,
        { lat: pickupLat, lng: pickupLng },
        { lat: destinationLat, lng: destinationLng },
        genderPreference
      )
      setIsCreatingRequest(false)
      navigate(`/student/confirmation/${newRide.id}`)
    } catch {
      setIsCreatingRequest(false)
    }
  }

  // Animation Phase
  if (showAnimation) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <MatchingAnimation onComplete={handleAnimationComplete} duration={2400} />
      </div>
    )
  }

  const topMatch = matches[selectedMatchIndex] || matches[0]
  const otherMatches = matches
    .map((m, idx) => ({ ...m, originalIndex: idx }))
    .filter((_, idx) => idx !== (matches[selectedMatchIndex] ? selectedMatchIndex : 0))
  const topDriver = topMatch ? drivers.find((d) => d.id === topMatch.ride.driverId) : null
  const topVehicle = topMatch ? vehicles.find((v) => v.id === topMatch.ride.vehicleId) : null

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/student/book')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Modify Search
        </button>
        <span className="text-xs text-slate-500 font-medium">
          {pickup} → {destination}
        </span>
      </div>

      {matches.length === 0 ? (
        /* No Match State */
        <Card className="text-center py-12 px-6" padding="none">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-amber-500" />
          </div>
          <h2 className="font-heading font-bold text-xl text-slate-900 mb-2">No suitable shared ride found</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            We couldn't find an existing active ride that fits your schedule without an excessive detour.
            We'll create a new ride request and automatically match compatible passengers as they book.
          </p>

          <div className="bg-slate-50 max-w-xs mx-auto p-4 rounded-xl text-xs text-slate-600 text-left space-y-1 mb-6 border border-slate-200">
            <p><span className="font-semibold text-slate-700">Pickup:</span> {pickup}</p>
            <p><span className="font-semibold text-slate-700">Destination:</span> {destination}</p>
            <p><span className="font-semibold text-slate-700">Time:</span> {time}</p>
            <p><span className="font-semibold text-slate-700">Seats:</span> {seats}</p>
          </div>

          <Button
            size="lg"
            variant="green"
            className="w-full max-w-xs mx-auto shadow-md"
            onClick={handleCreateNewRide}
            loading={isCreatingRequest}
          >
            Create Ride Request
            <ArrowRight size={16} />
          </Button>
        </Card>
      ) : (
        /* Top Match Found */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                Autonomous Route Matching
              </span>
              <h1 className="font-heading font-bold text-2xl text-slate-900">Best Match Found</h1>
            </div>
            <Badge variant="green" size="md">
              {matches.length} Compatible Option{matches.length > 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Featured Top Match Card */}
          <Card className="overflow-hidden border-2 border-primary-400 shadow-lg" padding="none">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-5 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-heading font-bold text-xl">{topMatch.ride.routeName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                    {getRideStatusLabel(topMatch.ride.status)}
                  </span>
                  {topMatch.score.driverDistanceKm !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400/25 border border-emerald-300/40 text-emerald-100 text-xs font-bold flex items-center gap-1 shadow-xs">
                      <MapPin size={11} /> Driver: {topMatch.score.driverDistanceKm} km away
                    </span>
                  )}
                  {(topMatch.ride.isFemaleOnly || topMatch.ride.genderPreference === 'FEMALE_ONLY') && (
                    <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs">
                      <Shield size={11} /> ♀ Female Only
                    </span>
                  )}
                </div>
                <div className="text-xs text-primary-100 flex items-center gap-1.5 flex-wrap">
                  <span className="bg-white/15 px-2 py-0.5 rounded text-white font-medium">Your Route:</span>
                  <span className="font-semibold text-white">{pickup}</span>
                  <ArrowRight size={11} className="text-emerald-300" />
                  <span className="font-bold text-emerald-300">{destination}</span>
                </div>
              </div>

              {/* Match Score Badge */}
              <div className="text-right">
                <div className="inline-flex flex-col items-end">
                  <span className="text-2xl font-heading font-black text-green-300">
                    {topMatch.score.total}%
                  </span>
                  <span className="text-[10px] font-bold text-primary-200 uppercase tracking-wide">
                    Match Score
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Driver & Vehicle */}
              {topDriver && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    <Avatar name={topDriver.name} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900 text-sm">{topDriver.name}</p>
                        <ShieldCheck size={14} className="text-green-600" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-slate-700">{topDriver.rating}</span>
                        <span>· {topVehicle?.name || 'Campus Van'}</span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const topFare = faresByRideId[topMatch.ride.id]
                    const fallbackFare = getEstimatedFallbackFare(pickupLat, pickupLng, destinationLat, destinationLng, seats)
                    return (
                      <div className="text-right">
                        <p className="text-xl font-heading font-bold text-slate-900">
                          ₹{topFare ? topFare.estimatedFare : fallbackFare}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          {topFare && topFare.sharedSavings > 0
                            ? `Save ₹${topFare.sharedSavings} pooled`
                            : topFare
                            ? `${topFare.distanceKm} km · OSRM Road Fare`
                            : 'Estimating road fare…'}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Timing and Seat Status */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Scheduled Departure</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Clock size={13} className="text-primary-600" />
                    {topMatch.ride.departureTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Available Seats</span>
                  <span className="font-bold text-green-700 flex items-center gap-1">
                    <Users size={13} />
                    {topMatch.availableSeats} seat{topMatch.availableSeats > 1 ? 's' : ''} remaining
                  </span>
                </div>
              </div>

              {/* Dynamic Seat Progress Bar */}
              <div>
                <SeatProgress
                  filled={topMatch.ride.bookedSeats}
                  total={topMatch.ride.capacity}
                  size="md"
                />
              </div>

              {/* AI Match Explanation Box */}
              <div className="bg-primary-50/60 rounded-xl p-4 border border-primary-100 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary-900">
                  <Sparkles size={14} className="text-primary-600" />
                  Why this ride was recommended ({topMatch.score.total}% match)
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
                    <span>Route Match: <strong>{topMatch.score.explanation.routeLabel}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
                    <span>Time Match: <strong>{topMatch.score.explanation.timeLabel}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
                    <span>Pickup: <strong>{topMatch.score.explanation.proximityLabel}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
                    <span>Detour: <strong>{topMatch.score.explanation.detourLabel}</strong></span>
                  </div>
                </div>

                <div className="pt-2 border-t border-primary-100 flex flex-wrap gap-2 text-[11px] text-primary-800">
                  {topMatch.score.explanation.summary.map((item, idx) => (
                    <span key={idx} className="bg-white px-2 py-0.5 rounded-full border border-primary-200">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  variant="green"
                  className="flex-1 shadow-md"
                  onClick={() => navigate(`/student/ride/${topMatch.ride.id}?${searchParams.toString()}`)}
                >
                  Join This Ride
                  <ArrowRight size={18} />
                </Button>

                {otherMatches.length > 0 && (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => setShowOtherOptions(!showOtherOptions)}
                  >
                    {showOtherOptions ? 'Hide Other Options' : `See Other Options (${otherMatches.length})`}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Secondary Other Matches List */}
          {showOtherOptions && otherMatches.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Alternative Compatible Rides (Click to select or join)
              </h3>
              {otherMatches.map((m) => {
                const driver = drivers.find((d) => d.id === m.ride.driverId)
                return (
                  <Card
                    key={m.ride.id}
                    hover
                    onClick={() => setSelectedMatchIndex(m.originalIndex)}
                    padding="md"
                    className="border-slate-200 hover:border-primary-400 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-heading font-semibold text-slate-900 text-sm">{m.ride.routeName}</p>
                          <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                            {m.score.total}% Match
                          </span>
                          {m.score.driverDistanceKm !== undefined && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <MapPin size={10} className="text-emerald-600" /> Driver: {m.score.driverDistanceKm} km
                            </span>
                          )}
                          {(m.ride.isFemaleOnly || m.ride.genderPreference === 'FEMALE_ONLY') && (
                            <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200 flex items-center gap-1">
                              <Shield size={10} className="text-pink-600" /> ♀ Female Only
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {pickup} → <span className="font-semibold text-emerald-700">{destination}</span> · Departs {m.ride.departureTime}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {m.availableSeats} seats left · {driver?.name || 'Staff Driver'}
                        </p>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        {(() => {
                          const matchFare = faresByRideId[m.ride.id]
                          const fallbackFare = getEstimatedFallbackFare(pickupLat, pickupLng, destinationLat, destinationLng, seats)
                          return (
                            <div>
                              <p className="font-heading font-bold text-slate-900">
                                ₹{matchFare ? matchFare.estimatedFare : fallbackFare}
                              </p>
                              {matchFare && matchFare.sharedSavings > 0 ? (
                                <span className="text-[10px] text-emerald-600 font-semibold block">
                                  -₹{matchFare.sharedSavings} saved
                                </span>
                              ) : matchFare ? (
                                <span className="text-[10px] text-slate-400 block">{matchFare.distanceKm} km · OSRM</span>
                              ) : (
                                <span className="text-[10px] text-slate-400 block">Personal Fare</span>
                              )}
                            </div>
                          )
                        })()}
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedMatchIndex(m.originalIndex)
                            }}
                          >
                            Select
                          </Button>
                          <Button
                            size="sm"
                            variant="green"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/student/ride/${m.ride.id}?${searchParams.toString()}`)
                            }}
                          >
                            Join
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}