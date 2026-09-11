import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Map, Users, Navigation, LogOut, ChevronDown, Clock, DollarSign, Settings, User, Bell, BookOpen, Shield, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { cn } from '../../lib/utils'
import Avatar from '../ui/Avatar'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { GlobalSosTriggerButton } from '../safety/GlobalSosModal'

const driverTopNav = [
  { to: '/driver/dashboard',  icon: Home,  label: 'Dashboard' },
  { to: '/driver/trip',       icon: Map,   label: 'Current Trip' },
  { to: '/driver/passengers', icon: Users, label: 'Passengers' },
]

function DriverTopNavBar() {
  const navigate = useNavigate()
  const logout = useAppStore((s) => s.logout)
  const currentDriver = useAppStore((s) => s.currentDriver())
  const notifications = useAppStore((s) => s.notifications)
  const currentDriverId = useAppStore((s) => s.currentDriverId)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllRead = useAppStore((s) => s.markAllRead)
  const userName = currentDriver?.name ?? 'Driver'
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Driver-relevant notifications
  const driverNotifs = notifications.filter((n) =>
    n.driverId === currentDriverId ||
    n.userId === currentDriverId ||
    (n as any).role === 'driver' ||
    (n as any).targetRole === 'DRIVER'
  ).slice(0, 30)
  const unread = driverNotifs.filter((n) => !n.read).length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/auth/portal')
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-40 flex-shrink-0">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 mr-2 flex-shrink-0">
        <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
          <Navigation size={14} className="text-white" />
        </div>
        <span className="font-heading font-bold text-slate-900 text-sm">
          Campus<span className="text-emerald-600">Flow</span>
        </span>
      </NavLink>

      {/* Nav links */}
      <nav className="flex items-center gap-1 ml-auto mr-2">
        {driverTopNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              )
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* SOS Emergency Trigger */}
      <GlobalSosTriggerButton size="sm" />

      {/* Notification Bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((v) => !v); setOpen(false) }}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-84 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-900">Driver Notifications ({driverNotifs.length})</p>
              {unread > 0 && (
                <button onClick={() => markAllRead()} className="text-[10px] text-emerald-600 font-semibold hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {driverNotifs.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-400">No notifications yet</div>
              ) : (
                driverNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id)
                      if (n.rideId) navigate('/driver/trip')
                    }}
                    className={cn(
                      'px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50',
                      !n.read ? (n.priority === 'CRITICAL' ? 'bg-rose-50/70' : 'bg-emerald-50/40') : ''
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-xs font-semibold truncate', !n.read ? 'text-slate-900' : 'text-slate-600')}>
                        {n.title}
                      </p>
                      {n.priority === 'CRITICAL' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-200 flex-shrink-0 animate-pulse">
                          CRITICAL
                        </span>
                      )}
                      {n.priority === 'IMPORTANT' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0">
                          ALERT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => { setOpen((v) => !v); setNotifOpen(false) }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200"
        >
          <Avatar name={userName} size="sm" />
          <span className="text-xs font-semibold text-slate-700 max-w-[80px] truncate hidden sm:block">{userName}</span>
          <ChevronDown size={13} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50">
            <div className="px-4 py-2.5 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
              <p className="text-[10px] text-slate-400">Driver Portal</p>
            </div>

            {[
              { icon: User,        label: 'My Profile',     to: '/driver/profile' },
              { icon: Clock,       label: 'Trip History',   to: '/driver/profile?tab=history' },
              { icon: Users,       label: 'Passengers',     to: '/driver/passengers' },
              { icon: DollarSign,  label: 'My Earnings',    to: '/driver/dashboard' },
            ].map(({ icon: Icon, label, to }) => (
              <button
                key={label}
                onClick={() => { navigate(to); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Icon size={14} className="text-slate-400" />
                {label}
              </button>
            ))}

            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function StudentTopNavBar() {
  const navigate = useNavigate()
  const logout = useAppStore((s) => s.logout)
  const currentStudent = useAppStore((s) => s.currentStudent())
  const notifications = useAppStore((s) => s.notifications)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllRead = useAppStore((s) => s.markAllRead)
  const userName = currentStudent?.name ?? 'Student'
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const studentNotifs = notifications.filter((n) =>
    n.studentId === currentStudentId ||
    n.userId === currentStudentId ||
    (n as any).role === 'student' ||
    (n as any).role === 'faculty' ||
    (n as any).targetRole === 'STUDENT'
  ).slice(0, 30)
  const unread = studentNotifs.filter((n) => !n.read).length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); navigate('/auth/portal') }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 sticky top-0 z-40 flex-shrink-0">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
          <Navigation size={14} className="text-white" />
        </div>
        <span className="font-heading font-bold text-slate-900 text-sm">
          Campus<span className="text-primary-600">Flow</span>
        </span>
      </NavLink>

      <div className="flex-1" />

      {/* Home link */}
      <NavLink
        to="/student/home"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
            isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          )
        }
      >
        <Home size={14} />
        Home
      </NavLink>

      {/* My Rides link */}
      <NavLink
        to="/student/rides"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
            isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          )
        }
      >
        <BookOpen size={14} />
        My Rides
      </NavLink>

      {/* SOS Emergency Trigger */}
      <GlobalSosTriggerButton size="sm" />

      {/* Notification Bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((v) => !v); setOpen(false) }}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-84 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-900">Notifications ({studentNotifs.length})</p>
              {unread > 0 && (
                <button onClick={() => markAllRead()} className="text-[10px] text-primary-600 font-semibold hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {studentNotifs.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-400">No notifications yet</div>
              ) : (
                studentNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id)
                      if (n.rideId) navigate(`/student/rides`)
                    }}
                    className={cn(
                      'px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50',
                      !n.read ? (n.priority === 'CRITICAL' ? 'bg-rose-50/70' : 'bg-primary-50/40') : ''
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-xs font-semibold truncate', !n.read ? 'text-slate-900' : 'text-slate-600')}>
                        {n.title}
                      </p>
                      {n.priority === 'CRITICAL' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-200 flex-shrink-0 animate-pulse">
                          CRITICAL
                        </span>
                      )}
                      {n.priority === 'IMPORTANT' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0">
                          ALERT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => { setOpen((v) => !v); setNotifOpen(false) }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200"
        >
          <Avatar name={userName} size="sm" />
          <span className="text-xs font-semibold text-slate-700 max-w-[80px] truncate hidden sm:block">{userName}</span>
          <ChevronDown size={13} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-[10px] text-slate-400">Student Portal</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={10} />
                VERIFIED
              </span>
            </div>
            {[
              { icon: User,       label: 'My Profile',    to: '/student/profile' },
              { icon: BookOpen,   label: 'My Rides',      to: '/student/rides' },
              { icon: Clock,      label: 'Ride History',  to: '/student/rides' },
              { icon: Shield,     label: 'Safety Center', to: '/student/safety' },
              { icon: Settings,   label: 'Settings',      to: '/student/profile' },
            ].map(({ icon: Icon, label, to }) => (
              <button
                key={label}
                onClick={() => { navigate(to); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Icon size={14} className="text-slate-400" />
                {label}
              </button>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export function StudentLayout() {
  return (
    <div className="flex flex-col h-screen bg-surface-50">
      <StudentTopNavBar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export function DriverLayout() {
  return (
    <div className="flex flex-col h-screen bg-surface-50">
      <DriverTopNavBar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-surface-50">
      <Sidebar mode="admin" />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
