import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  Car,
  X,
  Radio,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppStore } from '../../store/appStore'
import { api } from '../../services/api'
import type { EmergencyContact } from '../../types'

interface GlobalSosModalProps {
  isOpen: boolean
  onClose: () => void
}

export const GlobalSosModal: React.FC<GlobalSosModalProps> = ({ isOpen, onClose }) => {
  const currentUser = useAppStore((s) => s.currentUser)
  const currentStudent = useAppStore((s) => s.currentStudent())
  const currentDriver = useAppStore((s) => s.currentDriver())
  const role = useAppStore((s) => s.role)
  const rides = useAppStore((s) => s.rides)
  const bookings = useAppStore((s) => s.bookings)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const triggerSOS = useAppStore((s) => s.triggerSOS)

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | null>(null)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const user = currentUser || (role === 'driver' ? currentDriver : currentStudent)
  const userId = user?.id || (role === 'driver' ? 'd1' : 's1')
  const isDriver = role === 'driver' || user?.role === 'driver' || user?.role === 'DRIVER'

  // Find active ride for user
  const activeRide = isDriver
    ? rides.find(
        (r) =>
          (r.driverId === userId || r.driverId === user?.id) &&
          (r.status === 'active' || r.status === 'boarding' || r.status === 'waiting' || r.status === 'full')
      )
    : rides.find((r) => {
        const isPassenger = (r.passengers || []).some(
          (p) => (p.studentId === userId || p.studentId === user?.id) && p.status !== 'dropped'
        )
        const hasBooking = bookings.some(
          (b) =>
            (b.studentId === userId || b.studentId === user?.id) &&
            b.rideId === r.id &&
            (b.status === 'confirmed' || b.status === 'boarded' || b.status === 'in_transit')
        )
        return (isPassenger || hasBooking) && r.status !== 'completed' && r.status !== 'cancelled'
      })

  // Check if an active SOS already exists for this user
  const activeUserSos = safetyEvents.find(
    (e) => (e.userId === userId || (activeRide && e.rideId === activeRide.id)) && !e.resolved
  )

  // Fetch emergency contact and acquire GPS on modal open
  useEffect(() => {
    if (!isOpen) return

    if (userId) {
      api
        .getEmergencyContact(userId)
        .then((ec) => setEmergencyContact(ec))
        .catch(() => setEmergencyContact(null))
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {
          if (activeRide?.currentLat && activeRide?.currentLng) {
            setGpsCoords({ lat: activeRide.currentLat, lng: activeRide.currentLng })
          }
        },
        { timeout: 5000, enableHighAccuracy: true }
      )
    } else if (activeRide?.currentLat && activeRide?.currentLng) {
      setGpsCoords({ lat: activeRide.currentLat, lng: activeRide.currentLng })
    }
  }, [isOpen, userId, activeRide])

  if (!isOpen) return null

  const handleConfirmSOS = async () => {
    setIsSubmitting(true)
    try {
      const lat = gpsCoords?.lat || activeRide?.currentLat || 17.3616
      const lng = gpsCoords?.lng || activeRide?.currentLng || 78.4747

      const res = await triggerSOS({
        rideId: activeRide?.id,
        userId,
        lat,
        lng,
      })

      if (res?.isExistingActive) {
        toast('Active SOS already open and actively monitored by Dispatch Control', { icon: '🚨' })
      } else {
        toast.success(
          isDriver
            ? 'Emergency Driver SOS alert sent to Dispatch Control!'
            : 'Emergency SOS alert sent! Dispatcher & emergency contacts notified.',
          { icon: '🚨', duration: 6000 }
        )
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to dispatch SOS alert. Please call emergency services directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-rose-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-white">
                {activeUserSos ? 'Active Emergency Beacon' : 'Send Emergency Alert?'}
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                {activeUserSos
                  ? 'Your SOS beacon is actively broadcasting to Dispatch Control'
                  : 'CampusFlow 24/7 Rapid Emergency Response'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Active Alert Banner if already triggered */}
          {activeUserSos ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                  </span>
                  <p className="font-bold text-sm text-rose-900">SOS BEACON ACTIVE</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    activeUserSos.status === 'ACKNOWLEDGED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-200 text-rose-900 border border-rose-300 animate-pulse'
                  }`}
                >
                  {activeUserSos.status === 'ACKNOWLEDGED' ? 'DISPATCH ACKNOWLEDGED' : 'ACTIVE — AWAITING RESPONSE'}
                </span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                {activeUserSos.status === 'ACKNOWLEDGED'
                  ? 'Campus Dispatch has acknowledged your emergency. Responders are tracking your live coordinates.'
                  : 'Your emergency distress beacon is active. Dispatchers and responders have been alerted with your location telemetry.'}
              </p>
              {activeUserSos.emergencyContact && (
                <p className="text-[11px] text-rose-700 bg-white/70 p-2.5 rounded-xl border border-rose-200">
                  <span className="font-bold">Emergency SMS Alert:</span> Sent to{' '}
                  {activeUserSos.emergencyContact.name} ({activeUserSos.emergencyContact.phone})
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed">
              This will immediately alert your registered <span className="font-semibold text-slate-900">Emergency Contact</span> and the <span className="font-semibold text-slate-900">CampusFlow Dispatch Center</span>. Your current trip and live GPS telemetry will be transmitted to authorized emergency responders.
            </div>
          )}

          {/* Emergency Context Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Context Telemetry</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* User info */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <User size={16} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{isDriver ? 'Driver' : 'Passenger'}</p>
                  <p className="font-bold text-slate-800 truncate">{user?.name || 'Authorized User'}</p>
                </div>
              </div>

              {/* Active Trip Info */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <Car size={16} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Active Trip</p>
                  <p className="font-bold text-slate-800 truncate">
                    {activeRide ? activeRide.routeName : 'No Active Trip (Campus Area)'}
                  </p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 sm:col-span-2">
                <Phone size={16} className="text-rose-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Registered Emergency Contact</p>
                  {emergencyContact ? (
                    <p className="font-bold text-slate-800">
                      {emergencyContact.name} ({emergencyContact.relationship}) —{' '}
                      <span className="text-rose-600">{emergencyContact.phone}</span>
                    </p>
                  ) : (
                    <p className="text-slate-500 italic">No emergency contact registered in Profile</p>
                  )}
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 sm:col-span-2">
                <MapPin size={16} className="text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Live GPS Coordinates</p>
                  <p className="font-bold text-slate-800">
                    {gpsCoords
                      ? `${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`
                      : 'Acquiring high-accuracy GPS telemetry...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Emergency Hotlines */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-[11px] font-bold text-slate-500 mb-2">Direct Emergency Hotlines</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="tel:112"
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Phone size={12} className="text-rose-600" />
                <span>National Emergency: 112</span>
              </a>
              <a
                href="tel:+919123456789"
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Phone size={12} className="text-blue-600" />
                <span>Campus Security: +91 91234 56789</span>
              </a>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-bold transition-colors cursor-pointer"
          >
            {activeUserSos ? 'Close Window' : 'CANCEL'}
          </button>

          {!activeUserSos && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmSOS}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <ShieldAlert size={16} />
              <span>{isSubmitting ? 'DISPATCHING SOS...' : 'SEND SOS'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Universal SOS trigger button matching CampusFlow styling
 */
export const GlobalSosTriggerButton: React.FC<{
  className?: string
  size?: 'sm' | 'md'
}> = ({ className = '', size = 'md' }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const currentUser = useAppStore((s) => s.currentUser)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const currentDriverId = useAppStore((s) => s.currentDriverId)

  const userId = currentUser?.id || currentStudentId || currentDriverId
  const hasActiveSos = safetyEvents.some((e) => e.userId === userId && !e.resolved)

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`group relative flex items-center gap-1.5 font-bold rounded-full transition-all cursor-pointer shadow-sm ${
          hasActiveSos
            ? 'bg-rose-600 text-white hover:bg-rose-700 ring-4 ring-rose-500/30 animate-pulse'
            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
        } ${size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} ${className}`}
        title="Emergency SOS Response"
      >
        <ShieldAlert size={size === 'sm' ? 13 : 15} className={hasActiveSos ? 'animate-bounce' : ''} />
        <span>{hasActiveSos ? 'SOS ACTIVE' : 'SOS'}</span>
      </button>

      <GlobalSosModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
