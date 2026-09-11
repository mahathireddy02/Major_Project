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
import { StartPointSelectorModal } from '../../components/driver/StartPointSelectorModal'

export default function DriverDashboard() {
  const navigate = useNavigate()
  const rides = useAppStore((s) => s.rides)
  const currentDriverId = useAppStore((s) => s.currentDriverId)
  const currentDriver = useAppStore((s) => s.currentDriver())
  const vehicles = useAppStore((s) => s.vehicles)
  const startRide = useAppStore((s) => s.startRide)
  const refreshRides = useAppStore((s) => s.refreshRides)
  const [startingRideId, setStartingRideId] = useState<string | null>(null)
  const [startPointModalRide, setStartPointModalRide] = useState<Ride | null>(null)

  useEffect(() => {
    refreshRides()
  }, [refreshRides])

  useEffect(() => {
    const unsub = api.onRealtimeEvent((event) => {
      if (
        event === 'RIDE_COMPLETED' ||
        event === 'RIDE_UPDATED' ||
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
  const vehicle = vehicles.find((v) => v.driverId === currentDriverId)

  const todayCompleted = myRides.filter((r) => r.status === 'completed').length
  const todayTrips = myRides.length
  const totalPassengers = myRides.reduce((acc, r) => acc + r.bookedSeats, 0)
  const earnings = myRides.reduce((acc, r) => acc + r.bookedSeats * r.fare, 0)

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

      {/* Today's rides */}
      <h2 className="font-heading font-semibold text-slate-800 text-base mb-3">Today's Rides</h2>
      <div className="space-y-3">
        {myRides.length === 0 ? (
          <Card padding="lg" className="text-center text-slate-400">
            <MapPin size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No rides scheduled today</p>
          </Card>
        ) : (
          myRides.map((ride) => (
            <Card key={ride.id} padding="md" hover onClick={() => navigate(`/driver/trip?rideId=${ride.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
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
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={11} />
                    {ride.pickupPoints.map((p) => p.name).join(' → ')} → {ride.destination}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>

              <SeatProgress filled={ride.bookedSeats} total={ride.capacity} size="sm" />

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={12} />
                  {ride.departureTime}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users size={12} />
                  {ride.bookedSeats} passengers
                </div>
                {(ride.status === 'waiting' || ride.status === 'boarding') && (
                  <Button
                    size="sm"
                    variant="green"
                    disabled={startingRideId === ride.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setStartPointModalRide(ride)
                    }}
                  >
                    <Play size={13} />
                    Start
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Driver Start Point Selector Modal */}
      {startPointModalRide && (
        <StartPointSelectorModal
          isOpen={Boolean(startPointModalRide)}
          ride={startPointModalRide}
          isStarting={startingRideId === startPointModalRide.id}
          onClose={() => setStartPointModalRide(null)}
          onConfirm={async (startPoint) => {
            setStartingRideId(startPointModalRide.id)
            try {
              await startRide(startPointModalRide.id, startPoint)
              toast.success(`Trip started from ${startPoint.name}!`, { icon: '🚀' })
              const rideId = startPointModalRide.id
              setStartPointModalRide(null)
              navigate(`/driver/trip?rideId=${rideId}`)
            } catch (err: any) {
              toast.error(err.message || 'Failed to start trip')
            } finally {
              setStartingRideId(null)
            }
          }}
        />
      )}
    </div>
  )
}
