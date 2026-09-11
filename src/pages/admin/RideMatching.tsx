import { useState, useEffect, useMemo } from 'react'
import {
  Sparkles, CheckCircle2, ArrowRight, Layers, Sliders, Cpu,
  TrendingUp, Users, MapPin, Clock, Search, RefreshCw, UserCheck, PlusCircle, Check, Zap, Target
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppStore } from '../../store/appStore'
import { findMatches } from '../../engine/matchingEngine'
import type { Ride } from '../../types'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import SeatProgress from '../../components/ui/SeatProgress'

const DEFAULT_TRANSIT_HUBS = [
  { name: 'Kukatpally', lat: 17.4934, lng: 78.3995 },
  { name: 'HITEC City', lat: 17.4435, lng: 78.3772 },
  { name: 'Secunderabad Junction', lat: 17.4334, lng: 78.5016 },
  { name: 'Jubilee Hills', lat: 17.4319, lng: 78.4073 },
  { name: 'Charminar Bus Station', lat: 17.3616, lng: 78.4747 },
  { name: 'Koti Medical College', lat: 17.3850, lng: 78.4867 },
  { name: 'Ameerpet Metro Station', lat: 17.4375, lng: 78.4482 },
  { name: 'Dilsukhnagar Bus Depot', lat: 17.3685, lng: 78.5247 },
  { name: 'LB Nagar Ring Road', lat: 17.3457, lng: 78.5522 },
  { name: 'Mehdipatnam Bus Stop', lat: 17.3916, lng: 78.4402 },
  { name: 'Banjara Hills Road #12', lat: 17.4156, lng: 78.4357 },
  { name: 'Gachibowli Outer Ring Road', lat: 17.4401, lng: 78.3489 },
  { name: 'Uppal Ring Road', lat: 17.3984, lng: 78.5583 },
  { name: 'Nacharam Industrial Area', lat: 17.4262, lng: 78.5638 },
  { name: 'Madhapur Metro Station', lat: 17.4486, lng: 78.3908 },
  { name: 'Miyapur Allwyn X Roads', lat: 17.4969, lng: 78.3553 },
  { name: 'Hyderabad - Nagarjuna Sagar Road', lat: 17.2063, lng: 78.6015 },
]

export default function RideMatching() {
  const rides = useAppStore((s) => s.rides)
  const students = useAppStore((s) => s.students)
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)
  const resetScheduledFleet = useAppStore((s) => s.resetScheduledFleet)
  const joinRide = useAppStore((s) => s.joinRide)
  const createRide = useAppStore((s) => s.createRide)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [bookingRideId, setBookingRideId] = useState<string | null>(null)
  const [isSpawningRoute, setIsSpawningRoute] = useState(false)

  // Simulation controls
  const [testPickup, setTestPickup] = useState<string>('Kukatpally')
  const [testDestination, setTestDestination] = useState<string>('SRI INDU College')
  const [testTime, setTestTime] = useState('8:15 AM')
  const [testSeats, setTestSeats] = useState(1)
  const [includeNetworkRoutes, setIncludeNetworkRoutes] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('s1')

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await loadDispatcherData()
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id)
    }
  }, [students, selectedStudentId])

  const handleResetFleet = async () => {
    setIsResetting(true)
    try {
      const res = await resetScheduledFleet()
      toast.success(res?.message || 'Scheduled fleet re-opened for booking and matching!')
    } catch (err: any) {
      toast.error('Failed to reset scheduled fleet')
    } finally {
      setIsResetting(false)
    }
  }

  // Dynamic pickups
  const availablePickups = useMemo(() => {
    const map = new Map<string, { name: string; lat: number; lng: number }>()
    rides.forEach((r) => {
      r.pickupPoints?.forEach((p) => {
        if (p.name && !map.has(p.name)) {
          map.set(p.name, { name: p.name, lat: p.lat, lng: p.lng })
        }
      })
    })
    DEFAULT_TRANSIT_HUBS.forEach((hub) => {
      if (!map.has(hub.name)) {
        map.set(hub.name, hub)
      }
    })
    return Array.from(map.values())
  }, [rides])

  // Dynamic destinations
  const availableDestinations = useMemo(() => {
    const set = new Set<string>()
    rides.forEach((r) => {
      if (r.destination) set.add(r.destination)
    })
    if (!set.has('SRI INDU College of Engineering & Tech')) {
      set.add('SRI INDU College of Engineering & Tech')
    }
    if (!set.has('SRI INDU College')) {
      set.add('SRI INDU College')
    }
    return Array.from(set)
  }, [rides])

  const selectedPickupObj = availablePickups.find((p) => p.name === testPickup) || availablePickups[0]

  const selectedDestCoords = useMemo(() => {
    const matchingRide = rides.find((r) => r.destination === testDestination && r.destinationLat && r.destinationLng)
    if (matchingRide) {
      return { lat: matchingRide.destinationLat, lng: matchingRide.destinationLng }
    }
    const matchingHub = DEFAULT_TRANSIT_HUBS.find((h) => h.name.toLowerCase() === testDestination.toLowerCase())
    if (matchingHub) {
      return { lat: matchingHub.lat, lng: matchingHub.lng }
    }
    return { lat: 17.2063, lng: 78.6015 }
  }, [rides, testDestination])

  // Run matching engine live
  const matches = useMemo(() => {
    return findMatches(
      rides,
      {
        pickup: testPickup,
        destination: testDestination,
        requestedTime: testTime,
        seats: testSeats,
        pickupCoords: selectedPickupObj ? { lat: selectedPickupObj.lat, lng: selectedPickupObj.lng } : undefined,
        destinationCoords: selectedDestCoords,
      },
      {
        includeCompleted: includeNetworkRoutes,
        minScore: 30,
      }
    )
  }, [rides, testPickup, testDestination, testTime, testSeats, selectedPickupObj, selectedDestCoords, includeNetworkRoutes])

  // Assign seat
  const handleAssignSeat = async (ride: Ride) => {
    setBookingRideId(ride.id)
    try {
      const studentToAssign = selectedStudentId || (students[0]?.id ?? 's1')
      const result = await joinRide(ride.id, studentToAssign, testPickup, testDestination)
      if (result) {
        toast.success(`Passenger booked onto ${ride.routeName} (Seat Confirmed)!`)
        await loadDispatcherData()
      } else {
        toast.error('Could not assign passenger. Van may be at capacity.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign passenger')
    } finally {
      setBookingRideId(null)
    }
  }

  // Spawn route
  const handleSpawnRoute = async () => {
    setIsSpawningRoute(true)
    try {
      const studentToAssign = selectedStudentId || (students[0]?.id ?? 's1')
      const newRide = await createRide(
        testPickup,
        testDestination,
        testTime,
        testSeats,
        studentToAssign,
        selectedPickupObj ? { lat: selectedPickupObj.lat, lng: selectedPickupObj.lng } : undefined,
        selectedDestCoords
      )
      toast.success(`Spawned new dynamic pooled route (${newRide.routeName})!`)
      await loadDispatcherData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to spawn route')
    } finally {
      setIsSpawningRoute(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Autonomous Ride Matching & Route Clustering"
        subtitle="Multi-factor spatial pooling, detour penalty matrix, corridor optimization, and seat clustering"
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* Architecture Strategy Banner */}
        <Card className="bg-white border-[#E5EAF0] p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Spatial Clustering Engine v2.4
                </span>
              </div>
              <h2 className="font-bold text-xl text-[#17202A]">
                Deterministic Corridor Pooling Architecture
              </h2>
              <p className="text-xs text-[#5E6875] mt-1 max-w-2xl leading-relaxed">
                Evaluates real-time passenger demand against in-flight van trajectories using spatial geometric scoring to minimize campus vehicle miles traveled (VMT).
              </p>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
              <button
                onClick={handleResetFleet}
                disabled={isResetting}
                className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Re-open Fleet Schedules</span>
              </button>
            </div>
          </div>

          {/* Scoring Matrix Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-[#E5EAF0]">
            {[
              { label: 'Destination Match', weight: '30%', desc: 'Radial proximity to dropoff' },
              { label: 'Route Overlap', weight: '30%', desc: 'Trajectory corridor alignment' },
              { label: 'Time Delta', weight: '20%', desc: 'Departure window compatibility' },
              { label: 'Pickup Proximity', weight: '10%', desc: 'Walking distance to stop' },
              { label: 'Detour Penalty', weight: '10%', desc: 'Max +3 min total delay' },
            ].map((w, idx) => (
              <div key={idx} className="bg-[#F7F9FC] rounded-xl p-3 border border-[#E5EAF0]">
                <span className="font-mono font-bold text-base text-[#2563EB]">{w.weight}</span>
                <p className="text-xs font-semibold text-[#17202A] mt-0.5">{w.label}</p>
                <p className="text-[11px] text-[#5E6875] mt-0.5">{w.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Matching Simulator & Evaluation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input parameters */}
          <Card className="bg-white border-[#E5EAF0] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF0]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-bold text-sm text-[#17202A]">Simulator Controls</h3>
              </div>
              <span className="text-[11px] font-mono text-[#5E6875]">{availablePickups.length} hubs</span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#5E6875] uppercase tracking-wider block mb-1">
                  Simulated Passenger
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#17202A] focus:outline-none focus:border-[#2563EB]"
                >
                  {students.slice(0, 15).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.department || 'Student'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5E6875] uppercase tracking-wider block mb-1">
                  Pickup Hub
                </label>
                <select
                  value={testPickup}
                  onChange={(e) => setTestPickup(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#17202A] focus:outline-none focus:border-[#2563EB]"
                >
                  {availablePickups.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5E6875] uppercase tracking-wider block mb-1">
                  Campus Destination
                </label>
                <select
                  value={testDestination}
                  onChange={(e) => setTestDestination(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#17202A] focus:outline-none focus:border-[#2563EB]"
                >
                  {availableDestinations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#5E6875] uppercase tracking-wider block mb-1">
                    Target Time
                  </label>
                  <select
                    value={testTime}
                    onChange={(e) => setTestTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#17202A] focus:outline-none focus:border-[#2563EB]"
                  >
                    {['7:30 AM', '7:45 AM', '8:00 AM', '8:15 AM', '8:30 AM', '9:00 AM', '9:30 AM'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5E6875] uppercase tracking-wider block mb-1">
                    Seats
                  </label>
                  <select
                    value={testSeats}
                    onChange={(e) => setTestSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#17202A] focus:outline-none focus:border-[#2563EB]"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="pt-2 border-t border-[#E5EAF0]">
                <label className="text-xs text-[#17202A] flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={includeNetworkRoutes}
                    onChange={(e) => setIncludeNetworkRoutes(e.target.checked)}
                    className="rounded text-[#2563EB] focus:ring-[#2563EB] h-4 w-4 cursor-pointer"
                  />
                  <span>Include Scheduled Network Routes</span>
                </label>
                <p className="text-[11px] text-[#5E6875] mt-1 ml-6">
                  Cross-matches corridor pooling against all campus transit schedules.
                </p>
              </div>
            </div>
          </Card>

          {/* Right: Calculated Matches */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#17202A]">
                  Candidate Vehicles & Route Compatibility
                </h3>
                <Badge variant={matches.length > 0 ? 'green' : 'slate'} size="sm">
                  {matches.length} matches
                </Badge>
              </div>
              <Badge variant="blue">{testPickup} → {testDestination}</Badge>
            </div>

            {matches.length === 0 ? (
              <Card className="bg-white border-[#E5EAF0] p-10 text-center shadow-sm space-y-3">
                <Search className="w-10 h-10 mx-auto text-[#8C9BAE] opacity-50" />
                <p className="font-bold text-sm text-[#17202A]">No Existing Fleet Routes Match Corridor</p>
                <p className="text-xs text-[#5E6875] max-w-md mx-auto">
                  No in-flight shuttles match this corridor within the threshold. You can instantly spawn a new dynamic route for this corridor.
                </p>
                <div>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isSpawningRoute}
                    onClick={handleSpawnRoute}
                    className="cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Spawn Dynamic Route ({testPickup})
                  </Button>
                </div>
              </Card>
            ) : (
              matches.map((m, idx) => {
                return (
                  <Card
                    key={m.ride.id}
                    className={`bg-white border-[#E5EAF0] p-4 shadow-sm transition-all ${
                      idx === 0 ? 'border-[#0F9F8F] ring-1 ring-emerald-100' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#17202A]">{m.ride.routeName}</span>
                        {idx === 0 && <Badge variant="green" size="sm">TOP COMPATIBILITY</Badge>}
                        <Badge variant="slate" size="sm">Status: {m.ride.status}</Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#5E6875]">Score:</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                            m.score.total >= 85
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : m.score.total >= 60
                              ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                              : 'bg-slate-100 text-[#17202A] border border-slate-200'
                          }`}
                        >
                          {m.score.total}% Match
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#5E6875] mb-3">
                      {m.ride.pickupPoints.map((p) => p.name).join(' → ')} → <strong className="text-[#17202A]">{m.ride.destination}</strong> • Departs <span className="font-mono font-semibold text-[#17202A]">{m.ride.departureTime}</span>
                    </p>

                    {/* Summary tags */}
                    {m.score.explanation.summary.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {m.score.explanation.summary.map((text, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            <Check className="w-3 h-3" />
                            {text}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Score breakdown matrix */}
                    <div className="grid grid-cols-5 gap-1.5 text-center bg-[#F7F9FC] p-2.5 rounded-xl border border-[#E5EAF0] text-[10px]">
                      <div>
                        <span className="text-[#5E6875] block">Dest Proximity</span>
                        <span className="font-bold text-[#17202A] text-xs">{m.score.destination}%</span>
                      </div>
                      <div>
                        <span className="text-[#5E6875] block">Route Overlap</span>
                        <span className="font-bold text-[#17202A] text-xs">{m.score.routeOverlap}%</span>
                      </div>
                      <div>
                        <span className="text-[#5E6875] block">Time Window</span>
                        <span className="font-bold text-[#17202A] text-xs">{m.score.timeCompatibility}%</span>
                      </div>
                      <div>
                        <span className="text-[#5E6875] block">Pickup Walking</span>
                        <span className="font-bold text-[#17202A] text-xs">{m.score.pickupProximity}%</span>
                      </div>
                      <div>
                        <span className="text-[#5E6875] block">Detour Cost</span>
                        <span className="font-bold text-[#17202A] text-xs">{m.score.detour}%</span>
                      </div>
                    </div>

                    {/* Footer Dispatch Actions */}
                    <div className="mt-3.5 pt-3 border-t border-[#E5EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <SeatProgress filled={m.ride.bookedSeats} total={m.ride.capacity} size="sm" showLabel={false} />
                          <span className="text-[10px] text-[#5E6875] font-medium">
                            {m.ride.bookedSeats}/{m.ride.capacity} seats filled ({m.availableSeats} open)
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#0F9F8F]">₹{m.ride.fare}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant={idx === 0 ? 'primary' : 'secondary'}
                          size="sm"
                          loading={bookingRideId === m.ride.id}
                          disabled={m.availableSeats < testSeats}
                          onClick={() => handleAssignSeat(m.ride)}
                          className="cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                          {m.availableSeats < testSeats ? 'Van Full' : 'Assign & Confirm Seat'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
