import { useAppStore } from '../../store/appStore'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Users, Clock, Play, CheckCircle, Star, Navigation, ChevronRight,
  GraduationCap, Lock, Bell, MessageCircle, Send, X, ChevronDown, CheckCheck, ArrowRight, User
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import SeatProgress from '../../components/ui/SeatProgress'
import Button from '../../components/ui/Button'
import StatCard from '../../components/ui/StatCard'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../services/api'
import { Ride } from '../../types'
import { StartPointSelectorModal, SelectedStartPoint } from '../../components/driver/StartPointSelectorModal'

export default function DriverDashboard() {
  const navigate = useNavigate()
  const rides = useAppStore((s) => s.rides)
  const currentDriverId = useAppStore((s) => s.currentDriverId)
  const currentDriver = useAppStore((s) => s.currentDriver())
  const currentUser = useAppStore((s) => s.currentUser)
  const vehicles = useAppStore((s) => s.vehicles)
  const startRide = useAppStore((s) => s.startRide)
  const createAndActivateRide = useAppStore((s) => s.createAndActivateRide)
  const refreshRides = useAppStore((s) => s.refreshRides)
  const [startingRideId, setStartingRideId] = useState<string | null>(null)
  const [startPointModalRide, setStartPointModalRide] = useState<Ride | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replyingRides, setReplyingRides] = useState<Record<string, boolean>>({})
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const chatEndRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const notifications = useAppStore((s) => s.notifications)
  const messages = useAppStore((s) => s.messages)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllRead = useAppStore((s) => s.markAllRead)
  const replyToMessage = useAppStore((s) => s.replyToMessage)
  const fetchRideMessages = useAppStore((s) => s.fetchRideMessages)
  const markMessagesRead = useAppStore((s) => s.markMessagesRead)
  const fetchNotifications = useAppStore((s) => s.fetchNotifications)

  const driverIds = new Set(
    [currentDriverId, currentDriver?.id, currentUser?.id].filter(Boolean) as string[]
  )

  const driverRides = rides.filter(
    (r) =>
      driverIds.has(r.driverId) ||
      (driverIds.size === 0 && r.driverId === 'd1') ||
      (currentDriver?.name && (r as any).driverName === currentDriver.name)
  )
  const myRides = [...driverRides].sort((a, b) => {
    const timeA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0
    const timeB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0
    if (timeA !== timeB) return timeB - timeA
    return b.id.localeCompare(a.id)
  })
  const myRideIds = new Set(myRides.map((r) => r.id))

  const isForThisDriver = (n: any) => {
    if (n.userId && driverIds.has(n.userId)) return true
    if (n.driverId && driverIds.has(n.driverId)) return true
    if (n.metadata?.driverId && driverIds.has(n.metadata.driverId)) return true
    if (n.metadata?.receiverId && driverIds.has(n.metadata.receiverId)) return true
    if (n.rideId && myRideIds.has(n.rideId)) {
      if (n.role === 'driver') return true
      if (n.type === 'message' && n.metadata?.senderRole === 'student') return true
      if (!n.role || n.role === 'driver') return true
    }
    return false
  }

  // Driver-targeted notifications (exclude message type — shown in messages section)
  const driverNotifs = notifications
    .filter((n) => isForThisDriver(n) && (n as any).type !== 'message')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Message-type notifications addressed to this driver
  const driverMessages = notifications
    .filter((n) => isForThisDriver(n) && (n as any).type === 'message')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const unreadNotifs = driverNotifs.filter((n) => !n.read).length
  const unreadMsgs = driverMessages.filter((n) => !n.read).length
  const totalUnread = unreadNotifs + unreadMsgs
const [showModal, setShowModal] = useState<boolean>(false)
  const [isActivating, setIsActivating] = useState<boolean>(false)


  useEffect(() => {
    refreshRides()
    fetchNotifications()
  }, [refreshRides, fetchNotifications])

  useEffect(() => {
    const unsub = api.onRealtimeEvent((event) => {
      if (
        event === 'RIDE_COMPLETED' ||
        event === 'RIDE_UPDATED' ||
        event === 'RIDE_STARTED' ||
        event === 'BOOKING_UPDATED' ||
        event === 'BOOKING_CREATED' ||
        event === 'PASSENGER_ADDED'
      ) {
        refreshRides()
        fetchNotifications()
      } else if (event === 'NOTIFICATION_ADDED' || event === 'RIDE_MESSAGE') {
        fetchNotifications()
      }
    })
    return unsub
  }, [refreshRides, fetchNotifications])

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
        {/* Notification Bell */}
        <button
          onClick={() => setNotifOpen(true)}
          className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <Bell size={20} className="text-slate-700" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {totalUnread}
            </span>
          )}
        </button>
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

      {/* Notifications + Messages Drawer */}
      {notifOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setNotifOpen(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl shadow-2xl flex flex-col"
            style={{ maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <p className="font-heading font-bold text-slate-900">Notifications</p>
                {totalUnread > 0 && <p className="text-xs text-slate-500">{totalUnread} unread</p>}
              </div>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <button onClick={() => markAllRead()} className="text-xs text-primary-600 font-semibold hover:underline cursor-pointer">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setNotifOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
              {/* Message threads from students */}
              {driverMessages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageCircle size={13} className="text-primary-600" />
                      Messages from Students ({driverMessages.length})
                    </p>
                    {unreadMsgs > 0 && (
                      <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        {unreadMsgs} new
                      </span>
                    )}
                  </div>
                  {driverMessages.map((n: any) => {
                    const rideId = n.rideId
                    const rideMessages = messages.filter((m) => m.rideId === rideId)
                    const draft = replyDrafts[rideId] || ''
                    const isExpanded = activeThreadId === n.id || !n.read
                    const studentName = n.metadata?.studentName || n.title?.replace('Message from ', '') || 'Student'
                    const studentId = n.studentId || n.metadata?.studentId
                    const bookingId = n.metadata?.bookingId
                    const routeName = n.metadata?.routeName || myRides.find((r) => r.id === rideId)?.routeName || 'Campus Shuttle'
                    const pickup = n.metadata?.pickup || 'Pickup Stop'
                    const destination = n.metadata?.destination || 'Campus Hub'
                    const timeString = n.metadata?.bookingTime || new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                    const quickReplies = [
                      'On my way! 🚗',
                      'At the pickup point 📍',
                      'Be there in 2 mins ⏱️',
                      'Okay, noted! 👍',
                    ]

                    const isReplying = Boolean(replyingRides[rideId])

                    const handleSendReply = async (textToSend: string) => {
                      if (!textToSend.trim() || isReplying) return
                      setReplyingRides((prev) => ({ ...prev, [rideId]: true }))
                      setReplyDrafts((d) => ({ ...d, [rideId]: '' }))
                      try {
                        await replyToMessage(rideId, textToSend, studentId, bookingId)
                        toast.success(`Reply sent to ${studentName}!`)
                      } catch (err: any) {
                        toast.error('Failed to send reply')
                      } finally {
                        setReplyingRides((prev) => ({ ...prev, [rideId]: false }))
                        setTimeout(() => {
                          chatEndRefs.current[rideId]?.scrollIntoView({ behavior: 'smooth' })
                        }, 50)
                      }
                    }

                    return (
                      <div
                        key={n.id}
                        className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                          !n.read ? 'bg-primary-50/70 border-primary-300 shadow-xs' : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        {/* Thread header / Card summary */}
                        <div
                          className="p-3.5 cursor-pointer hover:bg-slate-50/80 transition-colors"
                          onClick={() => {
                            if (!n.read) {
                              markNotificationRead(n.id)
                              markMessagesRead(rideId, 'driver')
                            }
                            fetchRideMessages(rideId)
                            setActiveThreadId(activeThreadId === n.id ? null : n.id)
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar name={studentName} size="sm" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-slate-900 truncate">{studentName}</p>
                                  <span className="text-[10px] font-mono text-slate-400">#{rideId}</span>
                                </div>
                                <p className="text-[11px] font-medium text-primary-700 truncate">{routeName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {!n.read ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-primary-600 text-white shadow-2xs animate-pulse">
                                  NEW
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500">
                                  Read
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">{timeString}</span>
                            </div>
                          </div>

                          {/* Ride Route Pill: Pickup -> Drop */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-100/70 px-2.5 py-1 rounded-lg mb-2">
                            <MapPin size={12} className="text-emerald-600 flex-shrink-0" />
                            <span className="truncate font-medium">{pickup}</span>
                            <ArrowRight size={10} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate font-medium">{destination}</span>
                          </div>

                          {/* Student message preview */}
                          <div className="bg-white/80 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-800">
                            <p className="text-[10px] font-semibold text-slate-400 mb-0.5">Message:</p>
                            <p className="italic font-medium text-slate-700 leading-relaxed">"{n.message}"</p>
                          </div>
                        </div>

                        {/* Full conversation thread & inline reply */}
                        {(isExpanded || rideMessages.length > 0) && (
                          <div className="px-3.5 pb-3 pt-2 bg-slate-50/50 border-t border-slate-100 space-y-2.5">
                            {rideMessages.length > 0 && (
                              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                {rideMessages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex ${msg.fromRole === 'driver' ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div
                                      className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs ${
                                        msg.fromRole === 'driver'
                                          ? 'bg-emerald-600 text-white rounded-br-xs'
                                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                                      }`}
                                    >
                                      {msg.fromRole === 'student' && (
                                        <p className="text-[9px] font-bold text-primary-600 mb-0.5">
                                          {msg.fromName}
                                        </p>
                                      )}
                                      <p className="leading-snug">{msg.text}</p>
                                      <p
                                        className={`text-[9px] mt-0.5 ${
                                          msg.fromRole === 'driver' ? 'text-emerald-200 text-right' : 'text-slate-400'
                                        }`}
                                      >
                                        {new Date(msg.sentAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                <div
                                  ref={(el) => {
                                    chatEndRefs.current[rideId] = el
                                  }}
                                />
                              </div>
                            )}

                            {/* Quick reply chips */}
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 mb-1">Quick Replies:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {quickReplies.map((chip) => (
                                  <button
                                    key={chip}
                                    type="button"
                                    disabled={isReplying}
                                    onClick={() => handleSendReply(chip)}
                                    className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {chip}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Reply Input */}
                            <div className="flex gap-1.5 pt-1">
                              <input
                                type="text"
                                value={draft}
                                onChange={(e) =>
                                  setReplyDrafts((d) => ({ ...d, [rideId]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !isReplying && draft.trim()) {
                                    e.preventDefault()
                                    handleSendReply(draft)
                                  }
                                }}
                                disabled={isReplying}
                                placeholder={`Reply to ${studentName}...`}
                                className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-50"
                              />
                              <button
                                disabled={!draft.trim() || isReplying}
                                onClick={() => handleSendReply(draft)}
                                className="px-3 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 cursor-pointer transition-colors"
                              >
                                {isReplying ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send size={13} />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Regular notifications */}
              {driverNotifs.length === 0 && driverMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs text-slate-400 mt-1">Passenger bookings and alerts will appear here</p>
                </div>
              ) : driverNotifs.length > 0 && (
                <div className="space-y-2">
                  {driverMessages.length > 0 && (
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Ride & Booking Alerts ({driverNotifs.length})
                    </p>
                  )}
                  {driverNotifs.map((n: any) => {
                    const studentName = n.metadata?.studentName
                    const pickup = n.metadata?.pickup
                    const destination = n.metadata?.destination
                    const routeName = n.metadata?.routeName
                    const bookingTime = n.metadata?.bookingTime || new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                    return (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          n.read ? 'bg-white border-slate-200' : 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                n.read ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              <Bell size={13} />
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${n.read ? 'text-slate-800' : 'text-slate-900'}`}>
                                {n.title}
                              </p>
                              {routeName && (
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {routeName} {n.rideId && `· #${n.rideId}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                            )}
                            <span className="text-[10px] text-slate-400">{bookingTime}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 mt-1 leading-relaxed pl-9">{n.message}</p>

                        {(studentName || pickup || destination) && (
                          <div className="mt-2.5 ml-9 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                            {studentName && (
                              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                <User size={11} className="text-primary-600" />
                                <span>Student: {studentName}</span>
                              </div>
                            )}
                            {(pickup || destination) && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <MapPin size={11} className="text-emerald-600 flex-shrink-0" />
                                <span className="truncate">{pickup || 'Pickup'}</span>
                                <ArrowRight size={9} className="text-slate-400" />
                                <span className="truncate">{destination || 'Campus'}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {n.rideId && (
                          <div className="mt-2.5 pl-9 flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                markNotificationRead(n.id)
                                setNotifOpen(false)
                                navigate(`/driver/passengers?rideId=${n.rideId}`)
                              }}
                              className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              View Passenger Roster →
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
