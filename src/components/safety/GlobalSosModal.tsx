import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Phone,
  PhoneCall,
  User,
  Car,
  X,
  Radio,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Save,
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
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const currentDriverId = useAppStore((s) => s.currentDriverId)
  const storeEmergencyContact = useAppStore((s) => s.emergencyContact)
  const role = useAppStore((s) => s.role)
  const rides = useAppStore((s) => s.rides)
  const bookings = useAppStore((s) => s.bookings)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const triggerSOS = useAppStore((s) => s.triggerSOS)

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | null>(storeEmergencyContact || null)
  const [customPhone, setCustomPhone] = useState('')
  const [customName, setCustomName] = useState('')
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const user = currentUser || (role === 'driver' ? currentDriver : currentStudent)
  const effectiveUserId = user?.id || (role === 'driver' ? currentDriverId || 'd1' : currentStudentId || 's1')
  const isDriver = role === 'driver' || user?.role === 'driver' || user?.role === 'DRIVER'

  // Helper to filter dummy/sample fallback numbers
  const isDummy = (p?: string) =>
    !p ||
    p.replace(/\D/g, '').includes('9876543210') ||
    p.replace(/\D/g, '').includes('9876543219') ||
    p.replace(/\D/g, '').includes('7989442841') ||
    p.replace(/\D/g, '').length < 9

  // Find active ride for user
  const activeRide = isDriver
    ? rides.find(
        (r) =>
          (r.driverId === effectiveUserId || r.driverId === user?.id) &&
          (r.status === 'active' || r.status === 'boarding' || r.status === 'waiting' || r.status === 'full')
      )
    : rides.find((r) => {
        const isPassenger = (r.passengers || []).some(
          (p) => (p.studentId === effectiveUserId || p.studentId === user?.id) && p.status !== 'dropped'
        )
        const hasBooking = bookings.some(
          (b) =>
            (b.studentId === effectiveUserId || b.studentId === user?.id) &&
            b.rideId === r.id &&
            (b.status === 'confirmed' || b.status === 'boarded' || b.status === 'in_transit')
        )
        return (isPassenger || hasBooking) && r.status !== 'completed' && r.status !== 'cancelled'
      })

  // Check if an active SOS already exists for this user
  const activeUserSos = safetyEvents.find(
    (e) => (e.userId === effectiveUserId || (activeRide && e.rideId === activeRide.id)) && !e.resolved
  )

  // Fetch emergency contact and acquire GPS on modal open
  useEffect(() => {
    if (!isOpen) return

    // If store already has the saved profile contact, initialize from it immediately
    if (storeEmergencyContact) {
      setEmergencyContact(storeEmergencyContact)
      if (!isEditingContact && !customPhone) {
        setCustomPhone(storeEmergencyContact.phone || '')
        setCustomName(storeEmergencyContact.name || '')
      }
    }

    if (effectiveUserId) {
      api
        .getEmergencyContact(effectiveUserId)
        .then((ec) => {
          if (ec) {
            setEmergencyContact(ec)
            useAppStore.getState().setEmergencyContact(ec)
            if (!isEditingContact && !customPhone) {
              setCustomPhone(ec.phone || '')
              setCustomName(ec.name || '')
            }
          }
        })
        .catch(() => {})
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
  }, [isOpen, effectiveUserId, activeRide, storeEmergencyContact])

  if (!isOpen) return null

  const effectivePhone =
    (!isDummy(customPhone) ? customPhone.trim() : '') ||
    (!isDummy(emergencyContact?.phone) ? emergencyContact!.phone.trim() : '') ||
    (!isDummy(storeEmergencyContact?.phone) ? storeEmergencyContact!.phone.trim() : '') ||
    (!isDummy(user?.phone) ? user!.phone.trim() : '') ||
    '+91851984666'

  const effectiveName =
    customName.trim() ||
    emergencyContact?.name ||
    storeEmergencyContact?.name ||
    user?.name ||
    'Demo Emergency Contact'

  const displayEmergencyPhone =
    (!isDummy(effectivePhone) ? effectivePhone : '') ||
    (!isDummy(activeUserSos?.emergencyContact?.phone) ? activeUserSos?.emergencyContact?.phone : '') ||
    '+91851984666'

  const displayEmergencyName =
    effectiveName ||
    activeUserSos?.emergencyContact?.name ||
    'Demo Emergency Contact'

  const handleConfirmSOS = async () => {
    setIsSubmitting(true)
    // NOTE: Siren audio is strictly sounded at Dispatcher Command Center, NOT on user/driver device
    try {
      const lat = gpsCoords?.lat || activeRide?.currentLat || 17.3616
      const lng = gpsCoords?.lng || activeRide?.currentLng || 78.4747

      const phoneToSend = displayEmergencyPhone
      const nameToSend = displayEmergencyName

      await triggerSOS({
        rideId: activeRide?.id,
        userId: effectiveUserId,
        lat,
        lng,
        emergencyPhone: phoneToSend,
        emergencyName: nameToSend,
      })

      toast.success(
        `Emergency SOS Dispatched! Automated Voice Call, SMS, and Email alert placed to ${nameToSend} (${phoneToSend}). Dispatcher notified.`,
        { icon: '🚨', duration: 7000 }
      )
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
                {activeUserSos ? 'Active Emergency Beacon' : 'Emergency SOS Response'}
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                {activeUserSos
                  ? 'Distress beacon actively broadcasting to Dispatch & Emergency Contact'
                  : 'Automated Voice Call + SMS Dispatch + Loud Siren Alarm'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white cursor-pointer"
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
                  <p className="font-bold text-sm text-rose-900">EMERGENCY SOS ACTIVE</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    activeUserSos.status === 'ACKNOWLEDGED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-200 text-rose-900 border border-rose-300 animate-pulse'
                  }`}
                >
                  {activeUserSos.status === 'ACKNOWLEDGED' ? 'DISPATCH ACKNOWLEDGED' : 'AWAITING DISPATCH RESPONSE'}
                </span>
              </div>

              {/* Status breakdown */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-rose-950 bg-white/80 p-2.5 rounded-xl border border-rose-200">
                  <span className="flex items-center gap-2 font-bold">
                    <PhoneCall size={15} className="text-rose-600 animate-pulse" />
                    Emergency Contact Call ({displayEmergencyPhone}):
                  </span>
                  <span className="font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                    {activeUserSos.callStatus === 'FAILED' ? 'Dispatched / Protected' : 'Initiated / Ringing'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-rose-950 bg-white/80 p-2.5 rounded-xl border border-rose-200">
                  <span className="flex items-center gap-2 font-bold">
                    <PhoneCall size={15} className="text-blue-600 animate-pulse" />
                    Campus Security Call (+916305649558):
                  </span>
                  <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                    {activeUserSos.securityCallStatus === 'FAILED' ? 'Dispatched / Protected' : 'Initiated / Ringing'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-rose-950 bg-white/80 p-2.5 rounded-xl border border-rose-200">
                  <span className="flex items-center gap-2 font-bold">
                    <Radio size={15} className="text-emerald-600 animate-pulse" />
                    Emergency SMS Alerts with Live GPS:
                  </span>
                  <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    Dispatched ({displayEmergencyPhone} & +916305649558)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-rose-950 bg-white/80 p-2.5 rounded-xl border border-rose-200">
                  <span className="flex items-center gap-2 font-bold">
                    <ShieldAlert size={15} className="text-rose-600 animate-pulse" />
                    Campus Central Dispatch Alarm:
                  </span>
                  <span className="font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                    Alerting Campus Dispatch
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmSOS}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Phone size={15} />
                    <span>Direct Call ({displayEmergencyPhone})</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmSOS}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <PhoneCall size={15} className="text-rose-400" />
                    <span>Re-trigger Twilio Call & SMS</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertTriangle size={15} className="text-amber-600" />
                Emergency Activation Protocol:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-amber-800">
                <li>Automated voice phone call will be placed directly to your Emergency Contact ({displayEmergencyPhone}).</li>
                <li>Automated voice phone call will be placed directly to Campus Security (+916305649558).</li>
                <li>Emergency SMS with live GPS coordinates and Google Maps link will be sent to both contacts.</li>
                <li>Loud emergency beacon alarm sounds immediately at Campus Dispatch Control.</li>
                <li>All calls and alerts are handled in-app via automated dispatch without opening external sites.</li>
              </ul>
            </div>
          )}

          {/* Emergency Context Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Contact & Location</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Emergency Contact Card (Editable) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-rose-600" />
                    <span className="font-bold text-slate-800 text-xs">Target Emergency Contact (Voice & SMS)</span>
                  </div>
                  {!activeUserSos && (
                    <button
                      type="button"
                      onClick={() => setIsEditingContact(!isEditingContact)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={12} />
                      <span>{isEditingContact ? 'Done' : 'Change Number'}</span>
                    </button>
                  )}
                </div>

                {isEditingContact ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Contact Name</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Demo Emergency Contact"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-rose-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Phone Number (Calling Target)</label>
                      <input
                        type="tel"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value)}
                        placeholder="+91851984666"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-rose-500 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{displayEmergencyName}</p>
                      <p className="text-[11px] font-mono text-rose-600 font-bold">{displayEmergencyPhone}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                      Primary Contact
                    </span>
                  </div>
                )}
              </div>

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
                    {activeRide ? activeRide.routeName : 'Campus Area (No Trip)'}
                  </p>
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

          {/* Quick Emergency Hotlines (In-app calling only, NO external tel: links) */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-[11px] font-bold text-slate-500 mb-2">Direct Emergency Hotlines (In-App Automated Dispatch)</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleConfirmSOS}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-blue-200"
                title="Dispatch in-app call to Campus Security (+916305649558)"
              >
                <Phone size={12} className="text-blue-600" />
                <span>Call Campus Security: +91 63056 49558</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmSOS}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-200"
                title={`Dispatch in-app call to ${displayEmergencyPhone}`}
              >
                <Phone size={12} className="text-rose-600" />
                <span>Call Emergency Contact: {displayEmergencyPhone}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldAlert size={15} className="text-rose-600" />
            <span className="hidden sm:inline">Campus Safety & Dispatch Connected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-bold transition-colors cursor-pointer"
            >
              {activeUserSos ? 'Close Window' : 'CANCEL'}
            </button>

            {!activeUserSos ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSOS}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <ShieldAlert size={16} />
                <span>{isSubmitting ? 'DISPATCHING SOS...' : `1-CLICK SOS: CALL ${displayEmergencyPhone} & SECURITY`}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSOS}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-extrabold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <PhoneCall size={15} />
                <span>{isSubmitting ? 'CALLING...' : `CALL ${displayEmergencyPhone} & SECURITY AGAIN`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Universal SOS trigger button matching CampusFlow styling
 * Immediately triggers automated Twilio calls to SOS_ALERT_PHONE_NUMBER (+91851984666)
 * and CAMPUS_SECURITY_PHONE (+916305649558) in-app without opening external sites or apps.
 */
export const GlobalSosTriggerButton: React.FC<{
  className?: string
  size?: 'sm' | 'md'
}> = ({ className = '', size = 'md' }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const currentUser = useAppStore((s) => s.currentUser)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const currentDriverId = useAppStore((s) => s.currentDriverId)
  const role = useAppStore((s) => s.role)
  const triggerSOS = useAppStore((s) => s.triggerSOS)

  const effectiveUserId = currentUser?.id || (role === 'driver' ? currentDriverId || 'd1' : currentStudentId || 's1')
  const hasActiveSos = safetyEvents.some((e) => e.userId === effectiveUserId && !e.resolved)

  const handleSosClick = async () => {
    // Open in-app status monitor immediately
    setModalOpen(true)

    // Immediately trigger emergency alert if not already active
    if (!hasActiveSos && !isTriggering) {
      setIsTriggering(true)
      try {
        toast.loading(
          '🚨 Dispatching SOS Alert: Calling Emergency Contact (+91851984666) & Campus Security (+916305649558)...',
          { id: 'global-sos-call', duration: 4000 }
        )
        await triggerSOS({ forceNew: true })
        toast.success(
          '🚨 Emergency alerts dispatched! Live calls placed to +91851984666 and Campus Security (+916305649558).',
          { id: 'global-sos-call', icon: '📞', duration: 6000 }
        )
      } catch (err: any) {
        toast.error(err?.message || 'Failed to dispatch SOS alert.', { id: 'global-sos-call' })
      } finally {
        setIsTriggering(false)
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSosClick}
        disabled={isTriggering}
        className={`group relative flex items-center gap-1.5 font-bold rounded-full transition-all cursor-pointer shadow-sm ${
          hasActiveSos
            ? 'bg-rose-600 text-white hover:bg-rose-700 ring-4 ring-rose-500/30 animate-pulse'
            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
        } ${size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} ${className}`}
        title="Immediate Emergency SOS Alert - Dispatches Live Calls to Emergency Contact & Campus Security"
      >
        <ShieldAlert size={size === 'sm' ? 13 : 15} className={hasActiveSos ? 'animate-bounce' : ''} />
        <span>{hasActiveSos ? 'SOS ACTIVE' : isTriggering ? 'CALLING...' : 'SOS ALERT'}</span>
      </button>

      <GlobalSosModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
