import { useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import {
  Bell, CheckCheck, MapPin, Car, Shield, Zap, Gift,
  Navigation, Clock, XCircle, RefreshCw, AlertTriangle, Route, MessageCircle
} from 'lucide-react'
import { cn, formatDate } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import { useNavigate } from 'react-router-dom'

const iconMap: Record<string, any> = {
  match: Zap,
  full: Car,
  arriving: MapPin,
  safety: Shield,
  system: Bell,
  promo: Gift,
  trip: Navigation,
  request: Clock,
  boarding: CheckCheck,
  dropped: CheckCheck,
  cancelled: XCircle,
  route: Route,
  sos: AlertTriangle,
  emergency: AlertTriangle,
  alert: AlertTriangle,
  reassigned: RefreshCw,
  message: MessageCircle,
}

const variantMap: Record<string, 'blue' | 'green' | 'yellow' | 'red' | 'slate' | 'purple'> = {
  match:   'blue',
  full:    'slate',
  arriving:'green',
  safety:  'red',
  system:  'slate',
  promo:   'purple',
  trip:    'blue',
  request: 'yellow',
  boarding:'green',
  dropped: 'green',
  cancelled:'red',
  route:   'blue',
  sos:     'red',
  emergency:'red',
  alert:   'red',
  reassigned:'yellow',
  message: 'blue',
}

export default function Notifications() {
  const navigate = useNavigate()
  const notifications = useAppStore((s) => s.notifications)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const currentStudent = useAppStore((s) => s.currentStudent())
  const currentUser = useAppStore((s) => s.currentUser)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllRead = useAppStore((s) => s.markAllRead)
  const fetchNotifications = useAppStore((s) => s.fetchNotifications)

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const studentIds = new Set([currentStudentId, currentStudent?.id, currentUser?.id].filter(Boolean) as string[])

  const myNotifs = notifications.filter((n: any) =>
    (n.studentId && studentIds.has(n.studentId)) ||
    (n.userId && studentIds.has(n.userId)) ||
    (n.metadata?.studentId && studentIds.has(n.metadata.studentId)) ||
    (n.metadata?.receiverId && studentIds.has(n.metadata.receiverId)) ||
    n.role === 'student' ||
    n.role === 'faculty' ||
    n.targetRole === 'STUDENT'
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const unread = myNotifs.filter((n) => !n.read).length

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Notifications</h1>
          {unread > 0 && (
            <p className="text-sm text-slate-500">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer transition-colors"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      {myNotifs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {myNotifs.map((notif) => {
            const Icon = iconMap[notif.type] ?? Bell
            const variant = variantMap[notif.type] ?? 'slate'
            const isCritical = notif.priority === 'CRITICAL' || notif.type === 'emergency' || notif.type === 'sos'
            const isImportant = notif.priority === 'IMPORTANT'

            return (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationRead(notif.id)
                  if (notif.type === 'message' || (notif as any).eventType === 'RIDE_MESSAGE') {
                    navigate(notif.rideId ? `/student/confirmation/${notif.rideId}` : '/student/rides')
                  } else if (notif.rideId) {
                    navigate(`/student/live?rideId=${notif.rideId}`)
                  }
                }}
                className={cn(
                  'flex gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-150',
                  isCritical
                    ? 'bg-rose-50/80 border-rose-300 hover:border-rose-400 shadow-xs'
                    : notif.read
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-primary-50 border-primary-200 hover:border-primary-300'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                  isCritical
                    ? 'bg-rose-100 text-rose-700'
                    : notif.read
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-primary-100 text-primary-600'
                )}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn('text-sm font-semibold', notif.read ? 'text-slate-700' : 'text-slate-900')}>
                        {notif.title}
                      </p>
                      {isCritical && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-200 flex-shrink-0 animate-pulse">
                          CRITICAL
                        </span>
                      )}
                      {isImportant && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0">
                          ALERT
                        </span>
                      )}
                    </div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatDate(notif.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
