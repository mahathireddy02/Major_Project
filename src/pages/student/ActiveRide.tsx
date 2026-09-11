import { useNavigate } from 'react-router-dom'
import {
  Phone, Shield, Navigation, Clock, MapPin, AlertTriangle, Car,
  ChevronRight, XCircle, Share2, CheckCircle2
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import SeatProgress from '../../components/ui/SeatProgress'
import CampusMap from '../../components/map/CampusMap'

export default function ActiveRide() {
  const navigate = useNavigate()
  const rides = useAppStore((s) => s.rides)
  const drivers = useAppStore((s) => s.drivers)
  const vehicles = useAppStore((s) => s.vehicles)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const cancelBooking = useAppStore((s) => s.cancelBooking)
  const bookings = useAppStore((s) => s.bookings)

  // Find ride where student has a confirmed active, boarding, waiting, or full ride
  const activeRide = rides.find((r) => {
    if (r.status === 'completed' || r.status === 'cancelled') return false
    const hasBooking = bookings.some(
      (b) => b.studentId === currentStudentId && b.rideId === r.id && (b.status === 'confirmed' || b.status === 'pending')
    )
    const isPassenger = r.passengers?.some(
      (p) => p.studentId === currentStudentId && (p.status === 'boarded' || p.status === 'waiting')
    )
    return hasBooking || isPassenger
  })

  if (!activeRide) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Navigation size={48} className="mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-heading font-bold text-slate-800">No Active Ride</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">You don't have an active or upcoming trip right now.</p>
        <Button onClick={() => navigate('/student/book')}>Book a Ride</Button>
      </div>
    )
  }

  const driver = drivers.find((d) => d.id === activeRide.driverId)
  const vehicle = vehicles.find((v) => v.id === activeRide.vehicleId)
  const myBooking = bookings.find((b) => b.rideId === activeRide.id && b.studentId === currentStudentId && b.status === 'confirmed')

  const mapPoints = [
    ...activeRide.pickupPoints.map((pp) => ({
      lat: pp.lat,
      lng: pp.lng,
      label: pp.name,
      type: 'pickup' as const,
    })),
    {
      lat: activeRide.destinationLat,
      lng: activeRide.destinationLng,
      label: activeRide.destination,
      type: 'destination' as const,
    },
    {
      lat: activeRide.currentLat,
      lng: activeRide.currentLng,
      label: 'Campus Van',
      type: 'vehicle' as const,
    }
  ]

  const handleCancel = () => {
    if (myBooking) {
      cancelBooking(myBooking.id)
    }
    navigate('/student/home')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-20 lg:pb-8">
      {/* Route deviation alert if triggered */}
      {activeRide.hasDeviation && (
        <div className="mb-4 bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-start gap-3 shadow-md animate-pulse">
          <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-heading font-bold text-sm text-red-800">Route Deviation Detected</h4>
            <p className="text-xs text-red-700 mt-0.5">
              Your ride has moved away from the planned route. Campus security and dispatch have been alerted.
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="danger" onClick={() => navigate('/student/safety')}>
                Open Safety Center
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold text-primary-700 uppercase tracking-wider">Live Trip Status</span>
          <h1 className="font-heading font-bold text-2xl text-slate-900">{activeRide.routeName}</h1>
        </div>
        <Badge variant={activeRide.status === 'active' ? 'green' : activeRide.status === 'boarding' ? 'yellow' : 'blue'}>
          {activeRide.status === 'active' ? 'Driver on the way' : activeRide.status === 'boarding' ? 'Boarding now' : 'Scheduled'}
        </Badge>
      </div>

      {/* Interactive Map */}
      <div className="relative mb-4 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
        <CampusMap
          points={mapPoints}
          routeCoordinates={activeRide.routeCoordinates}
          vehicleLat={activeRide.currentLat}
          vehicleLng={activeRide.currentLng}
          height="h-64"
          interactive
        />
        {/* Floating ETA Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md border border-slate-200 flex items-center gap-2">
          <Clock size={14} className="text-primary-600" />
          <span className="text-xs font-bold text-slate-900">Arriving in ~6 min</span>
        </div>
      </div>

      {/* Next Pickup Card */}
      <Card className="mb-4 bg-gradient-to-r from-primary-50 to-white border-primary-200" padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center flex-shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-primary-700 uppercase tracking-wider">Next Stop</p>
              <p className="font-heading font-bold text-slate-900 text-sm">Hostel B Bay</p>
              <p className="text-[11px] text-slate-500">4 minutes away · 2 boarding</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/student/live?rideId=${activeRide.id}`)}>
            Full Screen
          </Button>
        </div>
      </Card>

      {/* Driver & Vehicle Card */}
      {driver && vehicle && (
        <Card className="mb-4" padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={driver.name} size="lg" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-semibold text-slate-900 text-sm">{driver.name}</h3>
                  <Badge variant="green" size="sm">Verified</Badge>
                </div>
                <p className="text-xs text-slate-500">{vehicle.name} · {vehicle.registration}</p>
                <p className="text-[11px] text-amber-600 font-medium mt-0.5">★ {driver.rating} Campus Driver</p>
              </div>
            </div>

            <a
              href={`tel:${driver.phone}`}
              className="w-10 h-10 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center justify-center hover:bg-green-100 transition-colors"
              title="Call Driver"
            >
              <Phone size={18} />
            </a>
          </div>
        </Card>
      )}

      {/* Dynamic Seat Capacity */}
      <Card className="mb-6" padding="md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">Vehicle Occupancy</span>
          <span className="text-xs font-bold text-slate-800">{activeRide.bookedSeats} / {activeRide.capacity} Seats Filled</span>
        </div>
        <SeatProgress filled={activeRide.bookedSeats} total={activeRide.capacity} showLabel={false} size="sm" />
      </Card>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button
          variant="secondary"
          className="flex items-center justify-center gap-2"
          onClick={() => navigate(`/student/live?rideId=${activeRide.id}`)}
        >
          <Navigation size={16} />
          Track Live
        </Button>
        <Button
          variant="secondary"
          className="flex items-center justify-center gap-2"
          onClick={() => navigate('/student/safety')}
        >
          <Shield size={16} className="text-green-600" />
          Safety Center
        </Button>
      </div>

      <div className="text-center">
        <button
          onClick={handleCancel}
          className="text-xs text-red-600 font-medium hover:underline cursor-pointer inline-flex items-center gap-1"
        >
          <XCircle size={13} />
          Cancel this booking
        </button>
      </div>
    </div>
  )
}
