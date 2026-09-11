import { useNavigate } from 'react-router-dom'
import { Check, X, MapPin, Navigation, Clock, Users, DollarSign, Shield } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import CampusMap from '../../components/map/CampusMap'

export default function IncomingRequest() {
  const navigate = useNavigate()
  const acceptRide = useAppStore((s) => s.acceptRide)
  const rides = useAppStore((s) => s.rides)
  const currentDriverId = useAppStore((s) => s.currentDriverId)

  const pendingRide = rides.find(
    (r) => r.status === 'waiting' && (r.driverId === currentDriverId || !r.driverId)
  )

  if (!pendingRide) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Navigation size={32} />
        </div>
        <h2 className="text-xl font-heading font-bold text-slate-800 mb-1">No Pending Requests</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
          You have no new dispatch requests waiting for acceptance right now.
        </p>
        <Button onClick={() => navigate('/driver/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  const handleAccept = () => {
    acceptRide(pendingRide.id)
    navigate('/driver/trip')
  }

  const handleDecline = () => {
    navigate('/driver/dashboard')
  }

  const mapPoints = [
    ...pendingRide.pickupPoints.map((pp) => ({
      lat: pp.lat,
      lng: pp.lng,
      label: pp.name,
      type: 'pickup' as const,
    })),
    {
      lat: pendingRide.destinationLat,
      lng: pendingRide.destinationLng,
      label: pendingRide.destination,
      type: 'destination' as const,
    }
  ]

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="text-center mb-6">
        <Badge variant="blue" className="animate-pulse mb-2">Incoming Dispatch</Badge>
        <h1 className="font-heading font-bold text-2xl text-slate-900">New Ride Request</h1>
        <p className="text-slate-500 text-sm">Automated route consolidation match</p>
      </div>

      {/* Map Snapshot */}
      <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200">
        <CampusMap
          points={mapPoints}
          routeCoordinates={pendingRide.routeCoordinates}
          height="h-48"
        />
      </div>

      {/* Details Card */}
      <Card className="mb-6" padding="lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900">{pendingRide.routeName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">3 Students Pooled Together</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-heading font-bold text-green-600">₹180</span>
            <p className="text-[10px] text-slate-400">Est. Trip Earnings</p>
          </div>
        </div>

        <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-primary-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Pickup Location</p>
              <p className="font-semibold text-slate-800">
                {pendingRide?.pickupPoints?.map((p) => p.name).join(', ') || 'Pickup Location'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Navigation size={16} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Destination</p>
              <p className="font-semibold text-slate-800">{pendingRide?.destination || 'Destination'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock size={16} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Est. Distance & Time</p>
              <p className="font-semibold text-slate-800">4.2 km · ~18 minutes</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-primary-50 rounded-xl flex items-center gap-2 text-xs text-primary-800 font-medium">
          <Shield size={14} className="text-primary-600 flex-shrink-0" />
          <span>All 3 passengers university verified with pre-paid student mobility cards.</span>
        </div>
      </Card>

      {/* Accept / Decline CTA */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
          onClick={handleDecline}
        >
          <X size={18} />
          Decline
        </Button>
        <Button
          variant="green"
          size="lg"
          className="flex-1 shadow-lg"
          onClick={handleAccept}
        >
          <Check size={18} />
          Accept Ride
        </Button>
      </div>
    </div>
  )
}
