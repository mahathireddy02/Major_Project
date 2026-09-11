import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Clock, MapPin, Users, ChevronLeft, RefreshCw, AlertCircle } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { api } from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

export default function PassengerList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetRideId = searchParams.get('rideId')

  const rides = useAppStore((s) => s.rides)
  const currentDriverId = useAppStore((s) => s.currentDriverId)
  const currentUser = useAppStore((s) => s.currentUser)
  const updatePassengerStatus = useAppStore((s) => s.updatePassengerStatus)

  const [backendBookings, setBackendBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null)

  // Scope rides to this driver
  const driverRides = rides.filter(
    (r) => r.driverId === currentDriverId || r.driverId === currentUser?.id || r.driverId === 'd1'
  )
  const sortedRides = [...driverRides].sort((a, b) => {
    const timeA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0
    const timeB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0
    if (timeA !== timeB) return timeB - timeA
    return b.id.localeCompare(a.id)
  })

  const activeRide = targetRideId
    ? sortedRides.find((r) => r.id === targetRideId)
    : (
        sortedRides.find((r) => r.status === 'active') ||
        sortedRides.find((r) => r.status === 'boarding') ||
        sortedRides.find((r) => (r.status === 'waiting' || r.status === 'full') && (r.bookedSeats > 0 || (r.passengers && r.passengers.length > 0))) ||
        sortedRides.find((r) => r.status === 'waiting') ||
        sortedRides[0]
      )

  const loadBookings = async () => {
    if (!activeRide) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await api.getRideBookings(activeRide.id)
      if (Array.isArray(data)) {
        setBackendBookings(data.filter((b: any) => b.status !== 'cancelled'))
      }
    } catch (err: any) {
      console.warn('[PassengerList] Failed to load bookings:', err)
      setBackendBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [activeRide?.id])

  // Realtime listeners
  useEffect(() => {
    const unsub = api.onRealtimeEvent((event, payload) => {
      if (
        event === 'BOOKING_CREATED' ||
        event === 'BOOKING_CANCELLED' ||
        event === 'BOOKING_UPDATED' ||
        event === 'PASSENGER_BOARDED' ||
        event === 'RIDE_UPDATED' ||
        event === 'RIDE_COMPLETED'
      ) {
        if (!payload?.rideId || payload.rideId === activeRide?.id) {
          loadBookings()
        }
      }
    })
    return unsub
  }, [activeRide?.id])

  // Boarding action
  const handleBoard = async (studentId: string) => {
    if (!activeRide) return
    setUpdatingStudentId(studentId)
    try {
      await updatePassengerStatus(activeRide.id, studentId, 'boarded')
      toast.success('Passenger marked as Boarded! ✅')
      await loadBookings()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to board passenger')
    } finally {
      setUpdatingStudentId(null)
    }
  }

  // Dropping action
  const handleDrop = async (studentId: string) => {
    if (!activeRide) return
    setUpdatingStudentId(studentId)
    try {
      await updatePassengerStatus(activeRide.id, studentId, 'dropped')
      toast.success('Passenger marked as Dropped off!')
      await loadBookings()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to drop passenger')
    } finally {
      setUpdatingStudentId(null)
    }
  }

  // Build unified passenger list: merge backend bookings with embedded ride.passengers
  const studentIdsSeen = new Set<string>()
  const passengers: any[] = []

  // 1. Process backend bookings
  if (backendBookings.length > 0) {
    backendBookings.forEach((b: any) => {
      studentIdsSeen.add(b.studentId)
      const embeddedP = (activeRide?.passengers || []).find((p: any) => p.studentId === b.studentId)
      let status: 'waiting' | 'boarded' | 'dropped' = 'waiting'

      if (embeddedP?.status === 'dropped' || b.status === 'completed' || activeRide?.status === 'completed') {
        status = 'dropped'
      } else if (embeddedP?.status === 'boarded' || b.status === 'boarded') {
        status = 'boarded'
      }

      passengers.push({
        studentId: b.studentId,
        name: b.passengerName || b.studentName || embeddedP?.name || (b.studentId === currentUser?.id ? currentUser?.name : b.studentId),
        pickup: b.pickup || embeddedP?.pickup || '',
        destination: b.destination || embeddedP?.destination || activeRide?.destination || '',
        status,
        seatNo: b.seatNo || embeddedP?.seatNo || passengers.length + 1,
      })
    })
  }

  // 2. Add any embedded passengers not in bookings
  if (activeRide?.passengers && activeRide.passengers.length > 0) {
    (activeRide.passengers as any[]).forEach((p) => {
      if (p.name === 'Dispatch Control' || p.studentId === 'admin1') return
      if (!studentIdsSeen.has(p.studentId)) {
        studentIdsSeen.add(p.studentId)
        const isDropped = p.status === 'dropped' || activeRide?.status === 'completed'
        passengers.push({
          studentId: p.studentId,
          name: p.name || 'Student',
          pickup: p.pickup || '',
          destination: p.destination || activeRide?.destination || '',
          status: isDropped ? 'dropped' : p.status || 'waiting',
          seatNo: p.seatNo || passengers.length + 1,
        })
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            {passengers.length}/{activeRide?.capacity || 6} Seats Filled
          </span>
          <button
            onClick={loadBookings}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Refresh passengers"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-primary-600' : ''} />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-bold text-2xl text-slate-900">Passenger Roster</h1>
          {activeRide && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/driver/trip?rideId=${activeRide.id}`)}
              className="text-xs"
            >
              Open Live Trip
            </Button>
          )}
        </div>
        <p className="text-slate-500 text-sm">{activeRide?.routeName || 'Campus Shuttle'} · Boarding verification</p>
      </div>

      {loading ? (
        <Card padding="lg" className="text-center text-slate-400 py-12">
          <RefreshCw size={24} className="mx-auto mb-2 animate-spin opacity-40 text-primary-600" />
          <p className="text-sm">Loading passengers...</p>
        </Card>
      ) : passengers.length === 0 ? (
        <Card padding="lg" className="text-center text-slate-400 py-12">
          <Users size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium text-slate-600">No passengers booked on this trip yet.</p>
          <p className="text-xs mt-1 text-slate-400">Passengers will appear here once they join or book this ride.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {passengers.map((passenger, idx) => {
            const isUpdating = updatingStudentId === passenger.studentId
            const isBoarded = passenger.status === 'boarded'
            const isDropped = passenger.status === 'dropped'
            const isWaiting = passenger.status === 'waiting'

            return (
              <Card key={passenger.studentId + idx} padding="md" className="border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={passenger.name || '?'} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900 text-sm">{passenger.name || passenger.studentId}</p>
                        <Badge variant="blue" size="sm">Seat #{passenger.seatNo}</Badge>
                      </div>
                      {passenger.pickup && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-primary-600 flex-shrink-0" />
                          <span>{passenger.pickup}</span>
                          <span className="text-slate-400 font-bold">→</span>
                          <span className="font-medium text-slate-700">{passenger.destination || activeRide?.destination}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        isBoarded ? 'green' : isDropped ? 'slate' : 'yellow'
                      }
                    >
                      {isBoarded ? 'Boarded' : isDropped ? 'Dropped off' : 'Waiting'}
                    </Badge>

                    {isWaiting && activeRide && (
                      <Button
                        size="sm"
                        variant="green"
                        disabled={isUpdating}
                        onClick={() => handleBoard(passenger.studentId)}
                        className="text-xs gap-1 cursor-pointer"
                      >
                        <CheckCircle size={14} className={isUpdating ? 'animate-spin' : ''} />
                        <span>{isUpdating ? 'Boarding...' : 'Board'}</span>
                      </Button>
                    )}

                    {isBoarded && activeRide && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isUpdating}
                        onClick={() => handleDrop(passenger.studentId)}
                        className="text-xs cursor-pointer"
                      >
                        {isUpdating ? 'Dropping...' : 'Drop'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
