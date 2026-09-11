import { useAppStore } from '../../store/appStore'
import { useNavigate } from 'react-router-dom'
import { MapPin, Users, Clock, Play, CheckCircle, Star, Navigation, ChevronRight, GraduationCap, Lock, Bell, MessageCircle, Send, X, ChevronDown } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import SeatProgress from '../../components/ui/SeatProgress'
import Button from '../../components/ui/Button'
import StatCard from '../../components/ui/StatCard'
import { useState, useEffect, useRef } from 'react'
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
  const [notifOpen, setNotifOpen] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const chatEndRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const notifications = useAppStore((s) => s.notifications)
  const messages = useAppStore((s) => s.messages)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllRead = useAppStore((s) => s.markAllRead)
  const replyToMessage = useAppStore((s) => s.replyToMessage)
  const fetchRideMessages = useAppStore((s) => s.fetchRideMessages)

  // Driver-targeted notifications (exclude message type — shown in chat)
  const driverNotifs = notifications.filter((n) =>
    (n.userId === currentDriverId || (n as any).driverId === currentDriverId ||
     (n as any).role === 'driver') && (n as any).type !== 'message'
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Message-type notifications addressed to this driver
  const driverMessages = notifications.filter((n) =>
    (n.userId === currentDriverId || (n as any).driverId === currentDriverId) &&
    (n as any).type === 'message'
  )
  const unreadNotifs = driverNotifs.filter((n) => !n.read).length
  const unreadMsgs = driverMessages.filter((n) => !n.read).length
  const totalUnread = unreadNotifs + unreadMsgs

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

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {/* Message threads from students */}
              {driverMessages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Messages from Passengers</p>
                  {driverMessages.map((n: any) => {
                    const rideId = n.rideId
                    const rideMessages = messages.filter((m) => m.rideId === rideId)
                    const draft = replyDrafts[rideId] || ''
                    return (
                      <div key={n.id} className="bg-primary-50 border border-primary-200 rounded-xl overflow-hidden">
                        {/* Thread header */}
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-primary-100 transition-colors"
                          onClick={() => {
                            markNotificationRead(n.id)
                            fetchRideMessages(rideId)
                          }}
                        >
                          <MessageCircle size={14} className="text-primary-600 flex-shrink-0" />
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                            <p className="text-[11px] text-slate-600 truncate">{n.message}</p>
                            <p className="text-[10px] text-slate-400">{n.metadata?.routeName || rideId}</p>
                          </div>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                        </button>

                        {/* Full thread */}
                        {rideMessages.length > 0 && (
                          <div className="px-3 pb-2 space-y-1.5 border-t border-primary-100">
                            <div className="pt-2 space-y-1.5 max-h-40 overflow-y-auto">
                              {rideMessages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.fromRole === 'driver' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] px-2.5 py-1.5 rounded-xl text-xs ${
                                    msg.fromRole === 'driver'
                                      ? 'bg-emerald-600 text-white rounded-br-sm'
                                      : 'bg-white border border-primary-200 text-slate-800 rounded-bl-sm'
                                  }`}>
                                    {msg.fromRole === 'student' && <p className="text-[9px] font-bold text-primary-600 mb-0.5">{msg.fromName}</p>}
                                    <p>{msg.text}</p>
                                    <p className={`text-[9px] mt-0.5 ${msg.fromRole === 'driver' ? 'text-emerald-200' : 'text-slate-400'}`}>
                                      {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <div ref={(el) => { chatEndRefs.current[rideId] = el }} />
                            </div>
                            {/* Reply input */}
                            <div className="flex gap-1.5 pt-1">
                              <input
                                type="text"
                                value={draft}
                                onChange={(e) => setReplyDrafts((d) => ({ ...d, [rideId]: e.target.value }))}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && draft.trim()) {
                                    await replyToMessage(rideId, draft)
                                    setReplyDrafts((d) => ({ ...d, [rideId]: '' }))
                                  }
                                }}
                                placeholder="Reply..."
                                className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                              />
                              <button
                                disabled={!draft.trim()}
                                onClick={async () => {
                                  if (!draft.trim()) return
                                  await replyToMessage(rideId, draft)
                                  setReplyDrafts((d) => ({ ...d, [rideId]: '' }))
                                }}
                                className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 cursor-pointer transition-colors"
                              >
                                <Send size={13} />
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
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : driverNotifs.length > 0 && (
                <div className="space-y-2">
                  {driverMessages.length > 0 && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Notifications</p>}
                  {driverNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        n.read ? 'bg-white border-slate-200' : 'bg-primary-50 border-primary-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        n.read ? 'bg-slate-100 text-slate-500' : 'bg-primary-100 text-primary-600'
                      }`}>
                        <Bell size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-semibold truncate ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
