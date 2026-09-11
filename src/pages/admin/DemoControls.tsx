import { useAppStore } from '../../store/appStore'
import toast from 'react-hot-toast'
import {
  Zap, XCircle, UserPlus, AlertTriangle, AlertOctagon, Activity,
  PlusCircle, RefreshCw, CheckCircle, Navigation, MapPin
} from 'lucide-react'
import { routingService } from '../../services/routing/routingService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useNavigate } from 'react-router-dom'

export default function DemoControls() {
  const navigate = useNavigate()
  const rides = useAppStore((s) => s.rides)
  const notifications = useAppStore((s) => s.notifications)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const fillNextSeat = useAppStore((s) => s.fillNextSeat)
  const cancelPassenger = useAppStore((s) => s.cancelPassenger)
  const addStudentRequest = useAppStore((s) => s.addStudentRequest)
  const simulateTraffic = useAppStore((s) => s.simulateTraffic)
  const triggerDeviation = useAppStore((s) => s.triggerDeviation)
  const triggerSOS = useAppStore((s) => s.triggerSOS)
  const createRide = useAppStore((s) => s.createRide)
  const resetDemo = useAppStore((s) => s.resetDemo)
  const sim = useAppStore((s) => s.sim)

  const ride102 = rides.find((r) => r.id === 'ride-102')
  const activeRides = rides.filter((r) => r.date === 'today' && r.status !== 'completed')
  const alertCount = rides.filter((r) => r.hasDeviation || r.hasSosAlert).length

  const actions = [
    {
      icon: Zap,
      label: 'Fill Next Seat',
      desc: 'Add a student to Ride #102',
      color: 'text-primary-600 bg-primary-50',
      disabled: !ride102 || ride102.bookedSeats >= ride102.capacity,
      onClick: () => {
        fillNextSeat('ride-102')
        toast.success('Seat filled! Ride #102 updated.')
      },
    },
    {
      icon: XCircle,
      label: 'Cancel Passenger',
      desc: 'Remove last passenger from Ride #102',
      color: 'text-amber-600 bg-amber-50',
      disabled: !ride102 || ride102.passengers.length === 0,
      onClick: () => {
        cancelPassenger('ride-102')
        toast.success('Passenger cancelled from Ride #102.')
      },
    },
    {
      icon: UserPlus,
      label: 'Add Student Request',
      desc: 'Simulate new booking request arriving',
      color: 'text-green-600 bg-green-50',
      onClick: () => {
        addStudentRequest()
        toast.success('New student request added!')
      },
    },
    {
      icon: AlertTriangle,
      label: 'Trigger Route Deviation',
      desc: 'Simulate GPS deviation on Ride #105',
      color: 'text-orange-600 bg-orange-50',
      onClick: () => {
        triggerDeviation('ride-105')
        toast.error('Route deviation triggered on Ride #105!')
        navigate('/admin/safety')
      },
    },
    {
      icon: AlertOctagon,
      label: 'Trigger SOS',
      desc: 'Simulate emergency on Ride #102',
      color: 'text-red-600 bg-red-50',
      onClick: () => {
        triggerSOS('ride-102', 's1')
        toast.error('SOS activated on Ride #102!')
        navigate('/admin/safety')
      },
    },
    {
      icon: Activity,
      label: sim.trafficActive ? 'Stop Traffic Sim' : 'Simulate Traffic',
      desc: sim.trafficActive ? 'Stop route recalculation' : 'Toggle traffic congestion mode',
      color: sim.trafficActive ? 'text-rose-600 bg-rose-50' : 'text-violet-600 bg-violet-50',
      onClick: () => {
        simulateTraffic()
        toast(sim.trafficActive ? 'Traffic simulation stopped.' : 'Traffic simulation active! Routes recalculating.', { icon: '🚦' })
      },
    },
    {
      icon: Navigation,
      label: 'Recalculate OSRM Route',
      desc: 'Query OSRM road network for Ride #102',
      color: 'text-blue-600 bg-blue-50',
      onClick: async () => {
        if (!ride102) return
        const waypoints = [...ride102.pickupPoints.map((p) => ({ lat: p.lat, lng: p.lng })), { lat: ride102.destinationLat, lng: ride102.destinationLng }]
        const res = await routingService.getRoute(waypoints)
        toast.success(`OSRM calculated: ${routingService.formatDistance(res.distanceMeters)}, ETA ${routingService.formatDuration(res.durationSeconds)}`, { duration: 4000 })
      },
    },
    {
      icon: MapPin,
      label: 'Dynamic Pickup Insertion',
      desc: 'Insert Hostel C stop into Ride #102',
      color: 'text-cyan-600 bg-cyan-50',
      onClick: async () => {
        if (!ride102) return
        const existing = [...ride102.pickupPoints.map((p) => ({ lat: p.lat, lng: p.lng })), { lat: ride102.destinationLat, lng: ride102.destinationLng }]
        const detour = await routingService.calculateDetour(existing, { lat: 17.395, lng: 78.484 })
        toast.success(`OSRM Detour: +${Math.round(detour.extraDurationSeconds / 60)} min (+${routingService.formatDistance(detour.extraDistanceMeters)}). ${detour.isAcceptable ? 'Acceptable' : 'Exceeds limit'}!`, { duration: 4500 })
      },
    },
    {
      icon: PlusCircle,
      label: 'Create New Ride',
      desc: 'Add a new ride request to system',
      color: 'text-teal-600 bg-teal-50',
      onClick: () => {
        createRide('Hostel C', 'Main Campus', '9:30 AM', 1, 's20')
        toast.success('New ride created and added to system!')
      },
    },
    {
      icon: RefreshCw,
      label: 'Reset Demo',
      desc: 'Restore all data to original state',
      color: 'text-slate-600 bg-slate-100',
      danger: true,
      onClick: () => {
        resetDemo()
        toast.success('Demo reset to initial state!')
      },
    },
  ]

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-heading font-bold text-2xl text-slate-900">Demo Controls</h1>
        <Badge variant="orange">DEMO MODE</Badge>
      </div>
      <p className="text-slate-500 text-sm mb-6">
        Hackathon judge controls — trigger real-time events to demonstrate the system
      </p>

      {/* Action grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {actions.map(({ icon: Icon, label, desc, color, onClick, disabled, danger }) => (
          <Card
            key={label}
            padding="md"
            className={`flex flex-col items-start ${danger ? 'border-red-200' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <h3 className="font-heading font-semibold text-slate-800 text-sm mb-1">{label}</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed flex-1">{desc}</p>
            <Button
              size="sm"
              variant={danger ? 'danger' : 'primary'}
              className="w-full"
              disabled={disabled}
              onClick={onClick}
            >
              Run
            </Button>
          </Card>
        ))}
      </div>

      {/* Current state summary */}
      <h2 className="font-heading font-semibold text-slate-800 mb-3">Current State</h2>
      <Card padding="md" className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Ride #102 Seats</p>
            <p className="font-heading font-bold text-slate-900">
              {ride102?.bookedSeats ?? 0} / {ride102?.capacity ?? 6}
              {ride102?.bookedSeats === ride102?.capacity && (
                <span className="text-xs text-red-500 ml-2">FULL</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Active Alerts</p>
            <p className={`font-heading font-bold ${alertCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {alertCount === 0 ? 'None' : alertCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Active Rides</p>
            <p className="font-heading font-bold text-slate-900">{activeRides.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Notifications</p>
            <p className="font-heading font-bold text-slate-900">{notifications.length}</p>
          </div>
        </div>
      </Card>

      {sim.trafficActive && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Activity size={16} className="text-amber-600" />
          <p className="text-sm text-amber-700 font-medium">Traffic simulation active — routes are being recalculated</p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
        <CheckCircle size={14} className="text-primary-400" />
        <span>Open the dispatcher dashboard to see real-time state updates</span>
        <button onClick={() => navigate('/admin/dashboard')} className="text-primary-600 font-medium hover:underline cursor-pointer ml-1">
          Go to Dashboard →
        </button>
      </div>
    </div>
  )
}
