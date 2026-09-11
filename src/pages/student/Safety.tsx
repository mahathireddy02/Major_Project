import { useNavigate } from 'react-router-dom'
import { Shield, Phone, AlertTriangle, CheckCircle, ChevronLeft, Navigation, HeartHandshake } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { api } from '../../services/api'
import type { EmergencyContact } from '../../types'

export default function Safety() {
  const navigate = useNavigate()
  const [sosActivated, setSosActivated] = useState(false)
  const [confirmSos, setConfirmSos] = useState(false)
  const [contact, setContact] = useState<EmergencyContact | null>(null)
  const rides = useAppStore((s) => s.rides)
  const triggerSOS = useAppStore((s) => s.triggerSOS)
  const currentStudentId = useAppStore((s) => s.currentStudentId)

  useEffect(() => {
    if (currentStudentId) {
      api.getEmergencyContact(currentStudentId).then((ec) => {
        if (ec) setContact(ec)
      }).catch(() => {})
    }
  }, [currentStudentId])

  const activeRide = rides.find(
    (r) =>
      (r.status === 'active' || r.status === 'boarding') &&
      r.passengers.some((p) => p.studentId === currentStudentId)
  )

  const handleSOS = async () => {
    if (!confirmSos) { setConfirmSos(true); return }
    if (activeRide) await triggerSOS(activeRide.id, currentStudentId)
    else await triggerSOS('ride-102', currentStudentId)
    setSosActivated(true)
    setConfirmSos(false)
  }

  if (sosActivated) {
    return (
      <div className="min-h-screen bg-red-600 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 animate-pulse shadow-xl">
          <AlertTriangle size={36} className="text-red-600" />
        </div>
        <h1 className="font-heading font-bold text-3xl text-white mb-2">SOS Broadcast Live</h1>
        <p className="text-red-100 mb-8 max-w-xs">
          Campus security command center & your emergency contacts have been dispatched telemetry and live coordinates.
        </p>

        <div className="w-full max-w-sm space-y-3 text-left mb-8">
          {[
            'Campus Security Control Room alerted',
            contact
              ? `Emergency contact: ${contact.name} (${contact.relationship}, ${contact.phone}) notified`
              : 'Primary emergency contact notified',
            'Real-time GPS coordinates broadcasting',
            'Driver & Vehicle telemetry locked for investigation',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <CheckCircle size={18} className="text-white shrink-0" />
              <p className="text-white text-xs font-medium">{item}</p>
            </div>
          ))}
        </div>


        <p className="text-red-200 text-xs mb-6">
          This is a prototype simulation. No real emergency services contacted.
        </p>

        <Button
          variant="secondary"
          className="bg-white text-red-600 hover:bg-red-50"
          onClick={() => { setSosActivated(false) }}
        >
          Mark as Resolved
        </Button>
      </div>
    )
  }

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
        {confirmSos ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-lg text-red-700 mb-2">Confirm Emergency?</h3>
            <p className="text-sm text-red-600 mb-4">This will alert campus security and your emergency contacts.</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmSos(false)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={handleSOS}>
                Yes, Send SOS
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSOS}
            className="w-36 h-36 bg-red-600 hover:bg-red-700 rounded-full border-8 border-red-200 text-white font-heading font-bold text-xl transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl active:scale-95 mx-auto flex items-center justify-center flex-col gap-1"
          >
            <AlertTriangle size={28} />
            SOS
          </button>
        )}
        <p className="text-xs text-slate-400 mt-4">Press and hold in a real emergency</p>
      </div>

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
