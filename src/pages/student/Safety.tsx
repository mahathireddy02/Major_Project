import { useNavigate } from 'react-router-dom'
import { Shield, Phone, AlertTriangle, CheckCircle, ChevronLeft, Navigation, HeartHandshake, ShieldAlert } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { api } from '../../services/api'
import type { EmergencyContact } from '../../types'
import { GlobalSosModal } from '../../components/safety/GlobalSosModal'

export default function Safety() {
  const navigate = useNavigate()
  const [sosModalOpen, setSosModalOpen] = useState(false)
  const [contact, setContact] = useState<EmergencyContact | null>(null)
  const rides = useAppStore((s) => s.rides)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const currentUser = useAppStore((s) => s.currentUser)

  const activeUserId = currentUser?.id || currentStudentId

  useEffect(() => {
    if (activeUserId) {
      api.getEmergencyContact(activeUserId).then((ec) => {
        if (ec) setContact(ec)
      }).catch(() => {})
    }
  }, [activeUserId])

  const activeRide = rides.find(
    (r) =>
      (r.status === 'active' || r.status === 'boarding') &&
      r.passengers.some((p) => p.studentId === activeUserId)
  )

  const hasActiveSos = safetyEvents.some((e) => e.userId === activeUserId && !e.resolved)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-5 cursor-pointer transition-colors">
        <ChevronLeft size={18} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <h1 className="font-heading font-bold text-2xl text-slate-900 mb-1">Ride Safety</h1>
      <p className="text-slate-500 text-sm mb-6">Your safety is our top priority</p>

      {/* Verification badges */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: Shield,   label: 'Driver Verified',     sub: 'Background checked' },
          { icon: Navigation, label: 'Vehicle Verified',  sub: 'Inspected & certified' },
          { icon: CheckCircle, label: 'University Verified', sub: 'Campus registered' },
          { icon: Navigation, label: 'Trip Monitored',   sub: 'Real-time tracking' },
        ].map(({ icon: Icon, label, sub }) => (
          <Card key={label} padding="md" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">{label}</p>
              <p className="text-[10px] text-slate-400">{sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Active ride info */}
      {activeRide && (
        <Card padding="md" className="mb-6 border-primary-200 bg-primary-50">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="blue">Active Trip</Badge>
          </div>
          <p className="text-sm font-semibold text-slate-800">{activeRide.routeName}</p>
          <p className="text-xs text-slate-500">{activeRide.pickupPoints.map((p) => p.name).join(' → ')} → {activeRide.destination}</p>
        </Card>
      )}

      {/* SOS Button */}
      <div className="text-center mb-6">
        <button
          type="button"
          onClick={() => setSosModalOpen(true)}
          className={`w-36 h-36 rounded-full border-8 text-white font-heading font-bold text-xl transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl active:scale-95 mx-auto flex items-center justify-center flex-col gap-1 ${
            hasActiveSos
              ? 'bg-rose-700 border-rose-300 ring-8 ring-rose-500/30 animate-pulse'
              : 'bg-rose-600 hover:bg-rose-700 border-rose-200'
          }`}
        >
          <AlertTriangle size={28} className={hasActiveSos ? 'animate-bounce' : ''} />
          <span>{hasActiveSos ? 'SOS ACTIVE' : 'SOS'}</span>
        </button>
        <p className="text-xs text-slate-400 mt-4">
          {hasActiveSos
            ? 'Distress beacon is active — tap to view responder status'
            : 'Tap to trigger immediate emergency broadcast'}
        </p>
      </div>

      <GlobalSosModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />

      {/* Emergency contacts */}
      <Card padding="md">
        <h3 className="font-heading font-semibold text-slate-800 mb-3 text-sm">Emergency Contacts</h3>
        <div className="space-y-2">
          {contact && (
            <div className="flex items-center justify-between py-2 border-b border-slate-100 bg-rose-50/50 p-2.5 rounded-xl mb-1">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-900">{contact.name}</p>
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-semibold">
                    {contact.relationship}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{contact.phone}</p>
              </div>
              <a
                href={`tel:${contact.phone}`}
                className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-rose-200 transition-colors"
              >
                <Phone size={14} className="text-rose-600" />
              </a>
            </div>
          )}
          {[
            { name: 'Campus Security Control', number: '040-2345-6789' },
            { name: 'University 24/7 Helpline', number: '1800-CAMPUS-HELP' },
          ].map((c) => (
            <div key={c.name} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-400">{c.number}</p>
              </div>
              <a
                href={`tel:${c.number}`}
                className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-green-100 transition-colors"
              >
                <Phone size={14} className="text-green-600" />
              </a>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-[10px] text-slate-400 text-center mt-4">Demo prototype — SOS does not contact real emergency services</p>
    </div>
  )
}
