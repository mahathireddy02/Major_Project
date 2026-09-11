import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, X, Clock, MapPin, ChevronRight, Car, User, Star,
  AlertTriangle, Navigation, Shield, RefreshCw
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { formatDate } from '../../lib/utils'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { api } from '../../services/api'
import type { Booking, Ride } from '../../types'
import toast from 'react-hot-toast'

const TABS = ['Active', 'Upcoming', 'Completed', 'Cancelled', 'All'] as const
type Tab = typeof TABS[number]

export default function RideHistory() {
  const navigate = useNavigate()
  const storeBookings = useAppStore((s) => s.bookings)
  const rides = useAppStore((s) => s.rides)
  const drivers = useAppStore((s) => s.drivers)
  const vehicles = useAppStore((s) => s.vehicles)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const cancelBookingStore = useAppStore((s) => s.cancelBooking)

  const [activeTab, setActiveTab] = useState<Tab>('Active')
  const [backendBookings, setBackendBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  // Rating Modal state
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean
    rideId: string
    bookingId: string
    driverName: string
    rating: number
    comment: string
  }>({
    isOpen: false,
    rideId: '',
    bookingId: '',
    driverName: '',
    rating: 5,
    comment: '',
  })
  const [submittingRating, setSubmittingRating] = useState(false)

  // Load real backend bookings
  const loadBookings = async () => {
    if (!currentStudentId) return
    try {
      const data = await api.getUserBookings(currentStudentId)
      if (Array.isArray(data)) {
        setBackendBookings(data)
      }
    } catch {
      // Fallback to store bookings
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()

    // Listen to realtime websocket events to refresh bookings
    const unsubscribe = api.onRealtimeEvent((event) => {
      if (
        event === 'BOOKING_CREATED' ||
        event === 'BOOKING_CANCELLED' ||
        event === 'RIDE_UPDATED' ||
        event === 'RIDE_COMPLETED' ||
        event === 'RIDE_STARTED'
      ) {
        loadBookings()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [currentStudentId])

  // Merge backend bookings with store bookings, prioritizing backend
  const allBookings: Booking[] = (() => {
    const map = new Map<string, Booking>()
    storeBookings
      .filter((b) => b.studentId === currentStudentId)
      .forEach((b) => map.set(b.id, b))
    backendBookings.forEach((b) => map.set(b.id, b))
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.bookedAt || 0).getTime() - new Date(a.bookedAt || 0).getTime()
    )
  })()

  // Filter bookings based on active tab and ride status
  const filteredBookings = allBookings.filter((b) => {
    const ride = rides.find((r) => r.id === b.rideId)
    const isRideActive = ride?.status === 'active' || ride?.status === 'boarding'
    const isCompleted = b.status === 'completed' || ride?.status === 'completed'
    const isCancelled = b.status === 'cancelled' || ride?.status === 'cancelled'

    if (activeTab === 'All') return true
    if (activeTab === 'Active') {
      return !isCancelled && !isCompleted && (isRideActive || b.status === 'confirmed')
    }
    if (activeTab === 'Upcoming') {
      return !isCancelled && !isCompleted && ride?.status === 'waiting'
    }
    if (activeTab === 'Completed') {
      return isCompleted
    }
    if (activeTab === 'Cancelled') {
      return isCancelled
    }
    return true
  })

  const getStatusBadge = (booking: Booking, ride?: Ride) => {
    if (booking.status === 'cancelled' || ride?.status === 'cancelled') {
      return <Badge variant="red" size="sm">Cancelled</Badge>
    }
    if (booking.status === 'completed' || ride?.status === 'completed') {
      return <Badge variant="green" size="sm">Completed</Badge>
    }
    if (ride?.status === 'active') {
      return (
        <Badge variant="blue" size="sm">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1 inline-block" />
          On Route
        </Badge>
      )
    }
    if (ride?.status === 'boarding') {
      return (
        <Badge variant="yellow" size="sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping mr-1 inline-block" />
          Pickup Arrived
        </Badge>
      )
    }
    return <Badge variant="slate" size="sm">Confirmed</Badge>
  }

  const handleCancel = async (booking: Booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    try {
      await cancelBookingStore(booking.id)
      await api.cancelBooking(booking.rideId, currentStudentId)
      toast.success('Booking cancelled successfully')
      loadBookings()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking')
    }
  }

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingRating(true)
    try {
      await api.rateRide(ratingModal.rideId, {
        rating: ratingModal.rating,
        comment: ratingModal.comment,
        bookingId: ratingModal.bookingId,
      })
      toast.success('Thank you for your rating!', { icon: '⭐' })
      setRatingModal((prev) => ({ ...prev, isOpen: false }))
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-12">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading font-bold text-2xl text-slate-900">My Rides</h1>
        <button
          onClick={loadBookings}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          title="Refresh bookings"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <p className="text-slate-500 text-sm mb-5">Track live rides, view stops, and manage your trips</p>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all shrink-0 ${
              activeTab === t
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Booking List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs">
          <MapPin size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-heading font-bold text-slate-700 text-base">No {activeTab.toLowerCase()} rides found</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Book your next trip easily from the home map</p>
          <Button size="sm" onClick={() => navigate('/student/home')}>
            Book a Ride on Home
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredBookings.map((booking) => {
            const ride = rides.find((r) => r.id === booking.rideId)
            const driver = drivers.find((d) => d.id === ride?.driverId)
            const vehicle = vehicles.find((v) => v.id === ride?.vehicleId)

            const isActiveOrBoarding = ride?.status === 'active' || ride?.status === 'boarding'
            const isCompleted = booking.status === 'completed' || ride?.status === 'completed'
            const isCancelled = booking.status === 'cancelled' || ride?.status === 'cancelled'

            return (
              <Card
                key={booking.id}
                padding="md"
                className={`border transition-all shadow-sm ${
                  isActiveOrBoarding
                    ? 'border-blue-300 bg-blue-50/20 ring-1 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(booking, ride)}
                    <span className="text-xs font-mono font-medium text-slate-500">
                      Seat #{booking.seatNo || 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-right">
                    <span className="text-xs text-slate-400 font-medium">Fare:</span>
                    <span className="font-heading font-bold text-slate-900 text-base">₹{booking.fare}</span>
                  </div>
                </div>

                {/* Route Path */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{booking.pickup}</p>
                      <p className="text-[10px] text-slate-400">Pickup Location</p>
                    </div>
                  </div>
                  <div className="ml-1 border-l-2 border-dashed border-slate-200 h-3" />
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{booking.destination || ride?.destination || 'Destination'}</p>
                      <p className="text-[10px] text-slate-400">Destination</p>
                    </div>
                  </div>
                </div>

                {/* Driver & Vehicle Details */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Avatar name={driver?.name || 'Driver'} size="sm" />
                    <div>
                      <p className="font-semibold text-slate-800">{driver?.name || 'Assigned Driver'}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        {driver?.rating || 4.9} · {vehicle?.name || 'Campus Shuttle'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-700">
                      {ride?.bookedSeats ?? 1}/{ride?.capacity ?? 6} seats
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                      <Clock size={10} />
                      {ride?.departureTime || 'Scheduled'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {!isCancelled && !isCompleted && (
                    <button
                      type="button"
                      onClick={() => handleCancel(booking)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      Cancel Ride
                    </button>
                  )}

                  {isCompleted && (
                    <button
                      type="button"
                      onClick={() =>
                        setRatingModal({
                          isOpen: true,
                          rideId: booking.rideId,
                          bookingId: booking.id,
                          driverName: driver?.name || 'Driver',
                          rating: 5,
                          comment: '',
                        })
                      }
                      className="text-xs text-amber-600 hover:text-amber-700 font-semibold px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Star size={12} className="fill-amber-500" />
                      Rate Trip
                    </button>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    {ride && (
                      <Button
                        size="sm"
                        variant={isActiveOrBoarding ? 'primary' : 'secondary'}
                        onClick={() => navigate(isActiveOrBoarding ? `/student/live?rideId=${ride.id}` : `/student/ride/${ride.id}`)}
                        className="text-xs gap-1"
                      >
                        {isActiveOrBoarding ? (
                          <>
                            <Navigation size={12} />
                            Track Live
                          </>
                        ) : (
                          <>
                            Details
                            <ChevronRight size={12} />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Rate Trip Modal                                                  */}
      {/* ---------------------------------------------------------------- */}
      {ratingModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-heading font-bold text-base text-slate-900">Rate Your Ride</h3>
              <button
                type="button"
                onClick={() => setRatingModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              How was your experience with <span className="font-semibold text-slate-700">{ratingModal.driverName}</span>?
            </p>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingModal((prev) => ({ ...prev, rating: star }))}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={
                      star <= ratingModal.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 fill-slate-200'
                    }
                  />
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-3">
              <textarea
                placeholder="Leave feedback for the driver (optional)..."
                value={ratingModal.comment}
                onChange={(e) => setRatingModal((prev) => ({ ...prev, comment: e.target.value }))}
                className="input-field text-xs h-20 resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRatingModal((prev) => ({ ...prev, isOpen: false }))}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingRating}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

