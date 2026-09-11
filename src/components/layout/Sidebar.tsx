import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, Map, Navigation, Bell, User, BookOpen, Shield, BarChart3,
  Car, Users, Zap, ChevronRight, Settings, LogOut, CheckCircle2, Clock,
  GraduationCap, Building, Layers, TrendingUp
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/appStore'
import Avatar from '../ui/Avatar'

const studentNav = [
  { to: '/student/home',          icon: Home,      label: 'Home' },
  { to: '/student/rides',         icon: BookOpen,  label: 'My Rides' },
  { to: '/student/notifications', icon: Bell,      label: '' },
  { to: '/student/profile',       icon: User,      label: 'Profile' },
]

const adminNav = [
  { to: '/admin/dashboard',   icon: Zap,           label: 'Overview' },
  { to: '/admin/map',         icon: Map,           label: 'Live Network' },
  { to: '/admin/requests',    icon: Layers,        label: 'Ride Requests' },
  { to: '/admin/students',    icon: GraduationCap, label: 'Students' },
  { to: '/admin/faculty',     icon: Building,      label: 'Faculty' },
  { to: '/admin/drivers',     icon: Users,         label: 'Drivers' },
  { to: '/admin/vehicles',    icon: Car,           label: 'Vehicles' },
  { to: '/admin/matching',    icon: BarChart3,     label: 'Pools' },
  { to: '/admin/rides',       icon: Navigation,    label: 'Active Trips' },
  { to: '/admin/safety',      icon: Shield,        label: 'Safety & SOS' },
  { to: '/admin/analytics',   icon: TrendingUp,    label: 'Analytics' },
  { to: '/admin/profile',     icon: User,          label: 'Profile' },
]

const driverNav = [
  { to: '/driver/dashboard', icon: Home,  label: 'Dashboard' },
  { to: '/driver/trip',      icon: Map,   label: 'Current Trip' },
  { to: '/driver/profile',   icon: User,  label: 'Profile' },
]

interface SidebarProps {
  mode: 'student' | 'admin' | 'driver'
}

export default function Sidebar({ mode }: SidebarProps) {
  const navigate = useNavigate()
  const setRole = useAppStore((s) => s.setRole)
  const logout = useAppStore((s) => s.logout)
  const currentUser = useAppStore((s) => s.currentUser)
  const currentStudent = useAppStore((s) => s.currentStudent())
  const adminUser = useAppStore((s) => s.adminUser)
  const currentDriver = useAppStore((s) => s.currentDriver())
  const notifications = useAppStore((s) => s.notifications)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const unread = notifications.filter((n) => n.studentId === currentStudentId && !n.read).length

  const navItems = mode === 'admin' ? adminNav : mode === 'driver' ? driverNav : studentNav
  const user =
    mode === 'admin'
      ? (currentUser && (currentUser.role?.toUpperCase() === 'DISPATCHER' || currentUser.role?.toUpperCase() === 'ADMIN')
          ? currentUser
          : adminUser)
      : mode === 'driver'
      ? currentDriver
      : currentStudent
  const userName = user?.name ?? 'User'
  const verificationStatus = (user as any)?.verificationStatus === 'REJECTED' ? 'REJECTED' : 'VERIFIED'

  const handleLogout = () => {
    logout()
    navigate('/auth/portal')
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200 h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-slate-100">
        <NavLink
          to="/"
          title="CampusFlow Home"
          className="flex items-center gap-2.5 group cursor-pointer transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
        >
          <div className="w-8 h-8 bg-primary-600 group-hover:bg-primary-500 rounded-xl flex items-center justify-center transition-colors shadow-sm">
            <Navigation size={16} className="text-white group-hover:rotate-6 transition-transform" />
          </div>
          <div>
            <p className="font-heading font-bold text-slate-900 text-sm leading-tight">Campus</p>
            <p className="font-heading font-bold text-primary-600 text-sm leading-tight">Flow</p>
          </div>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer group',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="flex-1 truncate">{label}</span>
                {label === 'Notifications' && unread > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={() => {
              if (mode === 'admin') navigate('/admin/profile')
              else if (mode === 'driver') navigate('/driver/profile')
              else navigate('/student/profile')
            }}
            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            title="View Profile"
          >
            <Avatar name={userName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-slate-400 capitalize">{mode}</span>
                {verificationStatus && (
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.2 rounded',
                      verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : verificationStatus === 'REJECTED'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {verificationStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out & Switch Portal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
