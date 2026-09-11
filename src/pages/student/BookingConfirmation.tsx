import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, Navigation, MapPin, Calendar, Clock, ArrowRight, ShieldCheck, Share2 } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import SeatProgress from '../../components/ui/SeatProgress'

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const rides = useAppStore((s) => s.rides)
  const drivers = useAppStore((s) => s.drivers)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const currentUser = useAppStore((s) => s.currentUser)
  const bookings = useAppStore((s) => s.bookings)

  const ride = rides.find((r) => r.id === id)

  if (!ride) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-heading font-bold text-slate-800">Booking confirmed</h2>
        <Button className="mt-4" onClick={() => navigate('/student/home')}>Return to Home</Button>
      </div>
    )
  }

  const driver = drivers.find((d) => d.id === ride.driverId)
  const isFull = ride.bookedSeats >= ride.capacity
  const studentId = currentUser?.id || currentStudentId
  const myBooking = bookings.find((b) => b.rideId === ride.id && (b.studentId === studentId || b.studentId === currentStudentId))
  const myPassenger = ride.passengers.find((p) => p.studentId === studentId || p.studentId === currentStudentId)
  const mySeat = myPassenger ? myPassenger.seatNo : (myBooking?.seatNo || ride.bookedSeats)
  const myDestination = myBooking?.destination || (myPassenger as any)?.destination || ride.destination

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-16">
      {/* Success Badge / Icon */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 size={36} />
        </div>
        <Badge variant="green" size="md" className="mb-2">Confirmed Booking</Badge>
        <h1 className="font-heading font-bold text-3xl text-slate-900">You're booked!</h1>
        <p className="text-slate-500 text-sm mt-1">Intelligent dispatch has secured your seat</p>
      </div>

      {/* Main Confirmation Card */}
      <Card className="mb-5 overflow-hidden border-2 border-primary-200" padding="none">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-primary-200 uppercase tracking-wider">Ride Assigned</p>
              <h2 className="text-xl font-heading font-bold">{ride.routeName}</h2>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                Seat #{mySeat}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Dynamic Seat Status */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Capacity Status</span>
              {isFull ? (
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  RIDE FULL · BOOKING CLOSED
                </span>
              ) : (
                <span className="text-xs font-bold text-primary-700">
                  {ride.bookedSeats}/{ride.capacity} seats filled
                </span>
              )}
            </div>
            <SeatProgress filled={ride.bookedSeats} total={ride.capacity} showLabel={false} size="md" />
            {isFull && (
              <p className="text-xs font-medium text-slate-600 mt-2 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-green-600 flex-shrink-0" />
                This vehicle reached 100% occupancy. Zero wasted campus vehicle capacity!
              </p>
            )}
          </div>

          {/* Ride Details List */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                <Clock size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Departure Time</p>
                <p className="font-semibold text-slate-800">{ride.departureTime} (Departs in 8 min)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                <MapPin size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Designated Pickup</p>
                <p className="font-semibold text-slate-800">{myPassenger?.pickup || ride.pickupPoints[0]?.name || 'Designated Pickup'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                <Navigation size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Destination</p>
                <p className="font-semibold text-slate-800">{myDestination}</p>
              </div>
            </div>

            {driver && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                  {driver.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Driver</p>
                  <p className="font-semibold text-slate-800">{driver.name} · {driver.rating} ★</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Fare</p>
                  <p className="font-bold text-slate-900">₹{ride.fare}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          size="lg"
          variant="primary"
          className="w-full shadow-lg"
          onClick={() => navigate(`/student/live?rideId=${ride.id}`)}
        >
          Track Live Ride
          <ArrowRight size={18} />
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate('/student/rides')}
          >
            My Rides
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate('/student/home')}
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  )
}
