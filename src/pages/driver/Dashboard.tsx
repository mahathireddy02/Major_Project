import { useAppStore } from '../../store/appStore'
import { useNavigate } from 'react-router-dom'
import { MapPin, Users, Clock, Play, CheckCircle, Star, Navigation, ChevronRight, GraduationCap, Lock } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import SeatProgress from '../../components/ui/SeatProgress'
import Button from '../../components/ui/Button'
import StatCard from '../../components/ui/StatCard'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../services/api'
import { Ride } from '../../types'
import { StartPointSelectorModal, SelectedStartPoint } from '../../components/driver/StartPointSelectorModal'

export default function DriverDashboard() {
  const navigate = useNavigate()
  const rides = useAppStore((s) => s.rides)
  const currentDriverId = useAppStore((s) => s.currentDriverId)
  const currentDriver = useAppStore((s) => s.currentDriver())
  const vehicles = useAppStore((s) => s.vehicles)
  const startRide = useAppStore((s) => s.startRide)
  const createAndActivateRide = useAppStore((s) => s.createAndActivateRide)
  const refreshRides = useAppStore((s) => s.refreshRides)
  const [startingRideId, setStartingRideId] = useState<string | null>(null)
  const [startPointModalRide, setStartPointModalRide] = useState<Ride | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [isActivating, setIsActivating] = useState<boolean>(false)

  useEffect(() => {
    refreshRides()
  }, [refreshRides])

  useEffect(() => {
    const unsub = api.onRealtimeEvent((event) => {
      if (
        event === 'RIDE_COMPLETED' ||
        event === 'RIDE_UPDATED' ||
        event === 'RIDE_STARTED' ||
        event === 'BOOKING_UPDATED' ||
        event === 'BOOKING_CREATED'
      ) {
        refreshRides()
      }
    })
    return unsub
  }, [refreshRides])

  const driverRides = rides.filter(
    (r) =>
      r.driverId === currentDriverId ||
      r.driverId === currentDriver?.id ||
      r.driverId === 'd1' ||
      (currentDriver?.name && (r as any).driverName === currentDriver.name)
  )
  const myRides = [...driverRides].sort((a, b) => {
    const timeA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0
    const timeB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0
    if (timeA !== timeB) return timeB - timeA
    return b.id.localeCompare(a.id)
  })

  const activeTrip =
    myRides.find((r) => r.status === 'active') ||
    rides.find((r) => r.status === 'active' && (r.driverId === currentDriverId || r.driverId === 'd1'))

  const vehicle =
    vehicles.find((v) => v.driverId === currentDriverId) ||
    vehicles.find((v) => v.driverId === currentDriver?.id) ||
    vehicles.find((v) => v.driverId === 'd1') ||
    vehicles[0]

  const todayCompleted = myRides.filter((r) => r.status === 'completed').length
  const todayTrips = myRides.length
  const totalPassengers = myRides.reduce((acc, r) => acc + r.bookedSeats, 0)
  const earnings = myRides.reduce((acc, r) => acc + r.bookedSeats * r.fare, 0)

  const handleConfirmStartPoint = async (startPoint: SelectedStartPoint) => {
    setIsActivating(true)
    try {
      if (startPointModalRide) {
        setStartingRideId(startPointModalRide.id)
        await startRide(startPointModalRide.id, startPoint)
        toast.success(`Trip started from ${startPoint.name}!`, { icon: '🚀' })
        const targetId = startPointModalRide.id
        setShowModal(false)
        setStartPointModalRide(null)
        navigate(`/driver/trip?rideId=${targetId}`)
      } else {
        const newRide = await createAndActivateRide({
          startLocation: startPoint,
        })
        toast.success(`Trip activated from ${startPoint.name}!`, { icon: '🚀' })
        setShowModal(false)
        navigate(`/driver/trip?rideId=${newRide.id}`)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to activate trip')
    } finally {
      setIsActivating(false)
      setStartingRideId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
      {/* Greeting */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-slate-500">Good morning,</p>
          <h1 className="font-heading font-bold text-xl text-slate-900">{currentDriver?.name ?? 'Driver'}</h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <div className="flex items-center gap-1">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-slate-700">{currentDriver?.rating}</span>
              <span className="text-xs text-slate-400">· {currentDriver?.totalTrips} trips</span>
            </div>
            {(currentDriver as any)?.driverType === 'student' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                <GraduationCap size={11} /> STUDENT DRIVER
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Route Locked banner for Student Drivers */}
      {(currentDriver as any)?.driverType === 'student' && (
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
          <Lock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800">🔒 ROUTE LOCKED</p>
            <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5">
              Your assigned route will remain unchanged unless a safety, vehicle, driver availability, or administrator action requires a change.
            </p>
          </div>
        </div>
      )}

      {/* HERO SECTION: Activate Ride from Current Location Button */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Live Driver Telematics
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-white">
              Activate Ride from Current Location
            </h2>
            <p className="text-xs text-emerald-100 mt-1 max-w-md leading-relaxed">
              Start your route directly from wherever you are located right now. Lock your start point via GPS, search, or map.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold shadow-md flex items-center justify-center gap-2 border-0 shrink-0 cursor-pointer text-sm"
            onClick={() => {
              const candidate = myRides.find((r) => r.status === 'waiting' || r.status === 'boarding') || myRides[0]
              setStartPointModalRide(candidate || null)
              setShowModal(true)
            }}
          >
            <Navigation size={17} className="text-emerald-700" />
            Activate Ride Now
          </Button>
        </div>
      </div>

      {/* In-Progress Live Trip Alert Banner */}
      {activeTrip && (
        <div className="mb-6 p-4 bg-emerald-50/80 border-2 border-emerald-500 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg shadow-sm flex-shrink-0">
              🚗
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Live Trip Active</span>
                <Badge variant="green">In Transit</Badge>
              </div>
              <p className="font-heading font-bold text-slate-900 text-sm">{activeTrip.routeName}</p>
              <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-emerald-600 flex-shrink-0" />
                Start: <strong className="text-slate-800">{activeTrip.startLocation || activeTrip.pickupPoints[0]?.name || 'Origin'}</strong> → {activeTrip.destination}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 sm:flex-initial text-xs border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50"
              onClick={() => {
                setStartPointModalRide(activeTrip)
                setShowModal(true)
              }}
            >
              📍 Change Start
            </Button>
            <Button
              size="sm"
              variant="green"
              className="flex-1 sm:flex-initial text-xs shadow-sm"
              onClick={() => navigate(`/driver/trip?rideId=${activeTrip.id}`)}
            >
              Open HUD
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Today's Trips" value={todayTrips} color="blue" />
        <StatCard label="Passengers" value={totalPassengers} color="green" />
        <StatCard label="Earnings" value={`₹${earnings}`} color="amber" />
        <StatCard label="Completed" value={todayCompleted} color="slate" />
      </div>

      {/* Vehicle info */}
      {vehicle && (
        <Card padding="md" className="mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Navigation size={18} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold text-slate-900 text-sm">{vehicle.name}</p>
                <Badge variant="green">Verified</Badge>
              </div>
              <p className="text-xs text-slate-400">{vehicle.type} · {vehicle.registration} · {vehicle.capacity} seats</p>
            </div>
          </div>
        </Card>
      )}

      {/* Today's rides header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-semibold text-slate-800 text-base">Today's Rides</h2>
        <Button
          size="sm"
          variant="secondary"
          className="text-xs h-7 px-2.5 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
          onClick={() => {
            setStartPointModalRide(null)
            setShowModal(true)
          }}
        >
          + New Route from My Spot
        </Button>
      </div>

      <div className="space-y-3">
        {myRides.length === 0 ? (
          <Card padding="lg" className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <MapPin size={24} />
            </div>
            <h3 className="font-heading font-bold text-slate-900 text-base">No Assigned Rides Scheduled</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              No pre-assigned trips for today. You can go online now and activate an on-demand campus route from your current location.
            </p>
            <Button
              variant="green"
              className="mx-auto shadow-md font-bold text-sm px-5"
              onClick={() => {
                setStartPointModalRide(null)
                setShowModal(true)
              }}
            >
              <Play size={14} className="fill-current mr-1.5" />
              Activate Ride from Current Location
            </Button>
          </Card>
        ) : (
          myRides.map((ride) => (
            <Card key={ride.id} padding="md" hover onClick={() => navigate(`/driver/trip?rideId=${ride.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-heading font-semibold text-slate-900 text-sm">{ride.routeName}</p>
                    <Badge
                      variant={
                        ride.status === 'active' ? 'green'
                        : ride.status === 'boarding' ? 'yellow'
                        : ride.status === 'completed' ? 'slate'
                        : 'blue'
                      }
                    >
                      {ride.status === 'active' ? 'Live'
                       : ride.status === 'boarding' ? 'Boarding'
                       : ride.status === 'completed' ? 'Completed'
                       : 'Upcoming'}
                    </Badge>
                    {(currentDriver as any)?.driverType === 'student' && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold border border-amber-200">
                        <Lock size={9} /> LOCKED
                      </span>
                    )}
                  </div>
                  {(() => {
                    const startPt = ride.startLocation || ride.pickupPoints[0]?.name || 'Driver Start'
                    const intermediateStops = (ride.pickupPoints || [])
                      .map((p) => p.name)
                      .filter((name) => Boolean(name && name.trim().toLowerCase() !== startPt.trim().toLowerCase()))
                    const dest = ride.destination || 'Destination'
                    const fullRoute = [startPt, ...intermediateStops, dest].filter(Boolean)
                    const cleanRoute = fullRoute.filter((pt, i) => i === 0 || pt.toLowerCase() !== fullRoute[i - 1].toLowerCase())

                    return (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                        <MapPin size={12} className="flex-shrink-0 text-primary-600" />
                        <span>
                          <strong className="text-slate-900">{cleanRoute[0]}</strong>
                          {cleanRoute.length > 2 && (
                            <>
                              {' → '}
                              <span className="text-primary-700 font-medium">
                                {cleanRoute.slice(1, -1).join(' → ')}
                              </span>
                            </>
                          )}
                          {cleanRoute.length > 1 && (
                            <>
                              {' → '}
                              <strong className="text-emerald-700">{cleanRoute[cleanRoute.length - 1]}</strong>
                            </>
                          )}
                        </span>
                      </p>
                    )
                  })()}
                </div>
                <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
              </div>

              <SeatProgress filled={ride.bookedSeats} total={ride.capacity} size="sm" />

              <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {ride.departureTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    {ride.bookedSeats} / {ride.capacity} pax
                  </div>
                </div>

                {/* Direct Action Buttons on each ride card */}
                {ride.status === 'active' ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs h-7 px-2 border-emerald-200 text-emerald-700 bg-emerald-50/60"
                      onClick={(e) => {
                        e.stopPropagation()
                        setStartPointModalRide(ride)
                        setShowModal(true)
                      }}
                    >
                      📍 Change Start
                    </Button>
                    <Button
                      size="sm"
                      variant="green"
                      className="text-xs h-7 px-3 shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/driver/trip?rideId=${ride.id}`)
                      }}
                    >
                      <Navigation size={12} />
                      HUD
                    </Button>
                  </div>
                ) : ride.status === 'waiting' || ride.status === 'boarding' ? (
                  <Button
                    size="sm"
                    variant="green"
                    className="shadow-sm text-xs font-bold"
                    disabled={startingRideId === ride.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setStartPointModalRide(ride)
                      setShowModal(true)
                    }}
                  >
                    <Play size={12} className="fill-current mr-1" />
                    Choose Start & Activate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs h-7 px-2.5"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/driver/trip?rideId=${ride.id}`)
                    }}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Driver Start Point Selector Modal */}
      {showModal && (
        <StartPointSelectorModal
          isOpen={showModal}
          ride={startPointModalRide}
          isStarting={isActivating || startingRideId !== null}
          onClose={() => {
            setShowModal(false)
            setStartPointModalRide(null)
          }}
          onConfirm={handleConfirmStartPoint}
        />
      )}
    </div>
  )
}
