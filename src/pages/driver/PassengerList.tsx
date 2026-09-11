import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, MapPin, Users, ChevronLeft, RefreshCw, MessageCircle, Send } from 'lucide-react'
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
  const messages = useAppStore((s) => s.messages)
  const replyToMessage = useAppStore((s) => s.replyToMessage)
  const markMessagesRead = useAppStore((s) => s.markMessagesRead)
  const fetchRideMessages = useAppStore((s) => s.fetchRideMessages)
  const refreshRides = useAppStore((s) => s.refreshRides)

  const initialTab = searchParams.get('tab') === 'messages' ? 'messages' : 'roster'
  const [activeTab, setActiveTab] = useState<'roster' | 'messages'>(initialTab)
  const [replyDraft, setReplyDraft] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    refreshRides()
  }, [refreshRides])

  useEffect(() => {
    if (searchParams.get('tab') === 'messages') {
      setActiveTab('messages')
    }
  }, [searchParams])

  const [backendBookings, setBackendBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null)

  const driverIds = new Set([currentDriverId, currentUser?.id].filter(Boolean) as string[])
  const driverRides = rides.filter(
    (r) => driverIds.has(r.driverId) || (driverIds.size === 0 && r.driverId === 'd1')
  )
  const sortedRides = [...driverRides].sort((a, b) => {
    const timeA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0
    const timeB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0
    if (timeA !== timeB) return timeB - timeA
    return b.id.localeCompare(a.id)
  })

  const activeRide = targetRideId
    ? (driverRides.find((r) => r.id === targetRideId) || rides.find((r) => r.id === targetRideId))
    : (
        driverRides.find((r) => r.status === 'boarding' || r.status === 'active' || r.status === 'waiting') ||
        driverRides[0] ||
        rides[0]
      )

  const rideMessages = activeRide ? messages.filter((m) => m.rideId === activeRide.id) : []
  const unreadFromStudents = rideMessages.filter((m) => m.fromRole === 'student' && !m.read).length

  useEffect(() => {
    if (activeRide?.id) fetchRideMessages(activeRide.id)
  }, [activeRide?.id])

  useEffect(() => {
    if (activeTab === 'messages' && activeRide) {
      markMessagesRead(activeRide.id, 'student')
      fetchRideMessages(activeRide.id)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [activeTab, rideMessages.length])

  const handleReply = async (customText?: string, targetStudentId?: string) => {
    const textToSend = (typeof customText === 'string' ? customText : replyDraft).trim()
    if (!textToSend || !activeRide || isReplying) return
    setIsReplying(true)
    setReplyDraft('')
    const recipientStudentId =
      targetStudentId ||
      rideMessages.filter((m) => m.fromRole === 'student').pop()?.fromId ||
      passengers[0]?.studentId
    try {
      await replyToMessage(activeRide.id, textToSend, recipientStudentId)
    } finally {
      setIsReplying(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

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

  // Build unified passenger list
  const studentIdsSeen = new Set<string>()
  const passengers: any[] = []

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

  if (activeRide?.passengers && activeRide.passengers.length > 0) {
    ;(activeRide.passengers as any[]).forEach((p) => {
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

      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-bold text-2xl text-slate-900">Passenger Roster</h1>
          {activeRide && (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/driver/trip?rideId=${activeRide.id}`)} className="text-xs">
              Open Live Trip
            </Button>
          )}
        </div>
        <p className="text-slate-500 text-sm">{activeRide?.routeName || 'Campus Shuttle'} · Boarding verification</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'roster' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Roster ({passengers.length})
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`relative flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'messages' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Messages
          {unreadFromStudents > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadFromStudents}
            </span>
          )}
        </button>
      </div>

      {/* Roster Tab */}
      {activeTab === 'roster' && (
        loading ? (
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
                      <Badge variant={isBoarded ? 'green' : isDropped ? 'slate' : 'yellow'}>
                        {isBoarded ? 'Boarded' : isDropped ? 'Dropped off' : 'Waiting'}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('messages')
                          setReplyDraft(`Hi ${passenger.name}, `)
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                        title={`Message ${passenger.name}`}
                      >
                        <MessageCircle size={14} />
                      </button>
                      {isWaiting && activeRide && (
                        <Button size="sm" variant="green" disabled={isUpdating} onClick={() => handleBoard(passenger.studentId)} className="text-xs gap-1 cursor-pointer">
                          <CheckCircle size={14} className={isUpdating ? 'animate-spin' : ''} />
                          <span>{isUpdating ? 'Boarding...' : 'Board'}</span>
                        </Button>
                      )}
                      {isBoarded && activeRide && (
                        <Button size="sm" variant="secondary" disabled={isUpdating} onClick={() => handleDrop(passenger.studentId)} className="text-xs cursor-pointer">
                          {isUpdating ? 'Dropping...' : 'Drop'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="flex flex-col" style={{ minHeight: '55vh' }}>
          {rideMessages.length === 0 ? (
            <Card padding="lg" className="text-center text-slate-400 py-12">
              <MessageCircle size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-slate-600">No messages yet.</p>
              <p className="text-xs mt-1 text-slate-400">Passengers can message you from their booking screen.</p>
            </Card>
          ) : (
            <div className="space-y-2 mb-3 overflow-y-auto flex-1">
              {rideMessages.map((msg) => {
                const isDriver = msg.fromRole === 'driver'
                return (
                  <div key={msg.id} className={`flex ${isDriver ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm ${
                      isDriver ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      {!isDriver && <p className="text-[10px] font-bold text-primary-600 mb-0.5">{msg.fromName}</p>}
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-0.5 ${isDriver ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5 pb-2">
            {['On my way! 🚗', 'At pickup point 📍', 'Be there in 2 mins ⏱️', 'Boarding now 🚌'].map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={isReplying}
                onClick={() => handleReply(chip)}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="mt-auto pt-2 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isReplying && replyDraft.trim()) {
                  e.preventDefault()
                  handleReply()
                }
              }}
              disabled={isReplying}
              placeholder="Reply to passengers..."
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-50"
            />
            <button
              onClick={() => handleReply()}
              disabled={!replyDraft.trim() || isReplying}
              className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {isReplying ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
