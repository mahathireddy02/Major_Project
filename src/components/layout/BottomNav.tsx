import { NavLink } from 'react-router-dom'
import { Home, Map, BookOpen, Bell, User, Navigation } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/appStore'

const navItems = [
  { to: '/student/home',          icon: Home,       label: 'Home' },
  { to: '/student/rides',         icon: BookOpen,   label: 'My Rides' },
  { to: '/student/notifications', icon: Bell,       label: 'Alerts' },
  { to: '/student/profile',       icon: User,       label: 'Profile' },
]

export default function BottomNav() {
  const notifications = useAppStore((s) => s.notifications)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const unread = notifications.filter(
    (n) =>
      (n.studentId === currentStudentId || n.userId === currentStudentId || (n as any).targetRole === 'STUDENT') &&
      !n.read
  ).length

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-bottom">
      <div className="flex items-stretch h-16">
        {navItems.map(({ to, icon: Icon, label }) => {
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-200 relative',
                  isActive
                    ? 'text-primary-600'
                    : 'text-slate-400 hover:text-slate-600'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                    {to.includes('/notifications') && unread > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                  {label ? <span>{label}</span> : null}
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

