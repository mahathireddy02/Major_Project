import React from 'react'
import toast, { Toast } from 'react-hot-toast'
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Navigation,
  MapPin,
  Car,
  Users,
  Clock,
  X,
  Zap,
  Route,
  CheckCheck,
  RefreshCw,
} from 'lucide-react'

export interface AppNotification {
  id: string
  userId?: string
  studentId?: string
  driverId?: string
  role?: string
  type: string
  priority?: 'NORMAL' | 'IMPORTANT' | 'CRITICAL'
  title: string
  message: string
  read?: boolean
  rideId?: string
  eventType?: string
  createdAt?: string
}

const getEventIcon = (type: string, priority?: string) => {
  if (priority === 'CRITICAL' || type === 'sos' || type === 'emergency') {
    return <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
  }
  if (priority === 'IMPORTANT' || type === 'safety' || type === 'alert' || type === 'cancelled') {
    return <AlertTriangle className="w-5 h-5 text-amber-500" />
  }
  switch (type) {
    case 'match':
      return <Zap className="w-5 h-5 text-indigo-500" />
    case 'boarding':
      return <CheckCheck className="w-5 h-5 text-emerald-500" />
    case 'dropped':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    case 'arriving':
      return <MapPin className="w-5 h-5 text-teal-500" />
    case 'trip':
      return <Navigation className="w-5 h-5 text-blue-500" />
    case 'route':
      return <Route className="w-5 h-5 text-violet-500" />
    case 'reassigned':
      return <RefreshCw className="w-5 h-5 text-amber-500" />
    case 'request':
      return <Clock className="w-5 h-5 text-blue-500" />
    default:
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
  }
}

interface ToastContentProps {
  t: Toast
  notification: AppNotification
}

export const NotificationToastContent: React.FC<ToastContentProps> = ({ t, notification }) => {
  const isCritical = notification.priority === 'CRITICAL' || notification.type === 'emergency' || notification.type === 'sos'
  const isImportant = notification.priority === 'IMPORTANT'

  return (
    <div
      className={`max-w-md w-full pointer-events-auto rounded-2xl shadow-xl border transition-all duration-300 transform ${
        t.visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-2 opacity-0 scale-95'
      } ${
        isCritical
          ? 'bg-slate-900/95 border-rose-500 text-white shadow-rose-900/30'
          : isImportant
          ? 'bg-white border-amber-300 text-slate-900 shadow-amber-500/10'
          : 'bg-white/95 backdrop-blur-md border-slate-200/90 text-slate-900 shadow-slate-900/10'
      }`}
      style={{ minWidth: '280px', maxWidth: '420px' }}
      role="status"
      aria-live={isCritical ? 'assertive' : 'polite'}
    >
      <div className="p-3.5 flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            isCritical
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 ring-2 ring-rose-500/20'
              : isImportant
              ? 'bg-amber-50 text-amber-600 border border-amber-200'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}
        >
          {getEventIcon(notification.type, notification.priority)}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h4
              className={`text-xs font-bold truncate ${
                isCritical ? 'text-rose-400' : isImportant ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {notification.title}
            </h4>
            {isCritical && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                Critical SOS
              </span>
            )}
            {isImportant && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                Alert
              </span>
            )}
          </div>
          <p
            className={`text-xs leading-snug line-clamp-2 ${
              isCritical ? 'text-slate-200' : 'text-slate-600'
            }`}
          >
            {notification.message}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            toast.dismiss(t.id)
          }}
          className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
            isCritical
              ? 'text-slate-400 hover:text-white hover:bg-white/10'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

/**
 * Display a non-blocking toast for ~5 seconds (or 10s for critical SOS)
 * Automatically disappears while keeping notification persisted in notification store.
 */
export function showNotificationToast(notification: AppNotification) {
  if (!notification || !notification.title) return

  const isCritical = notification.priority === 'CRITICAL' || notification.type === 'emergency' || notification.type === 'sos'
  const duration = isCritical ? 10000 : 5000

  toast.custom(
    (t) => <NotificationToastContent t={t} notification={notification} />,
    {
      id: notification.id || `toast-${Date.now()}`,
      duration,
      position: 'top-right',
    }
  )
}
