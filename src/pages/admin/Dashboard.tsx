import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Users, Car, MapPin, TrendingDown, Shield, AlertTriangle, Activity,
  Clock, ArrowRight, MessageSquare, Send, Sparkles, CheckCircle2, ChevronRight,
  Search, RefreshCw, X, UserCheck, Truck, Navigation, AlertOctagon, FileText, Cpu, Phone
} from 'lucide-react'
import { NetworkOptimizerModal } from './NetworkOptimizerModal'
import { useAppStore } from '../../store/appStore'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import CampusMap from '../../components/map/CampusMap'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import SeatProgress from '../../components/ui/SeatProgress'
import Avatar from '../../components/ui/Avatar'
import toast from 'react-hot-toast'
import { getRideStatusBadge, getRideStatusLabel } from '../../lib/utils'

export default function AdminDashboard() {
  const navigate = useNavigate()

  // Store selectors
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)
  const reassignDriver = useAppStore((s) => s.reassignDriver)
  const reassignVehicle = useAppStore((s) => s.reassignVehicle)
  const cancelRideByDispatcher = useAppStore((s) => s.cancelRideByDispatcher)
  const recalculateRideRoute = useAppStore((s) => s.recalculateRideRoute)
  const resolveSafetyEvent = useAppStore((s) => s.resolveSafetyEvent)

  const rides = useAppStore((s) => s.rides)
  const drivers = useAppStore((s) => s.drivers)
  const vehicles = useAppStore((s) => s.vehicles)
  const students = useAppStore((s) => s.students)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const auditLogs = useAppStore((s) => s.auditLogs)
  const sim = useAppStore((s) => s.sim)

  // Local UI state
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'rides' | 'vehicles' | 'drivers' | 'safety' | 'audit'>('rides')
  const [optimizerOpen, setOptimizerOpen] = useState(false)
  
  // Modals
  const [reassignDriverRideId, setReassignDriverRideId] = useState<string | null>(null)
  const [reassignVehicleRideId, setReassignVehicleRideId] = useState<string | null>(null)
  const [cancelRideId, setCancelRideId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [actionSubmitting, setActionSubmitting] = useState(false)

  // AI assistant chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello Dispatcher! I am your AI Mobility Intelligence Assistant. Ask about real-time fleet operations, route congestion, or driver availability.',
    },
  ])

  const refreshData = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      await loadDispatcherData()
    } catch (err: any) {
      setLoadError(err.message || 'Unable to connect to Dispatch Control backend.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  // KPI Calculations
  const activeRides = rides.filter((r) => r.status !== 'completed' && r.status !== 'cancelled')
  const runningVehicles = activeRides.filter((r) => r.status === 'active' || r.status === 'boarding').length
  const totalCapacity = activeRides.reduce((acc, r) => acc + r.capacity, 0)
  const totalBookedSeats = activeRides.reduce((acc, r) => acc + r.bookedSeats, 0)
  const availableSeats = activeRides.reduce((acc, r) => acc + Math.max(0, r.capacity - r.bookedSeats), 0)
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalBookedSeats / totalCapacity) * 100) : 0
  const estimatedSavings = totalBookedSeats * 18
  const activeSafetyAlerts = safetyEvents.filter((e) => !e.resolved)

  // Filtering Rides
  const filteredRides = rides.filter((ride) => {
    if (statusFilter === 'waiting' && ride.status !== 'waiting') return false
    if (statusFilter === 'boarding' && ride.status !== 'boarding') return false
    if (statusFilter === 'active' && ride.status !== 'active') return false
    if (statusFilter === 'completed' && ride.status !== 'completed') return false
    if (statusFilter === 'cancelled' && ride.status !== 'cancelled') return false
    if (statusFilter === 'safety' && !ride.hasDeviation && !ride.hasSosAlert) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchId = ride.id.toLowerCase().includes(q)
      const matchRoute = ride.routeName.toLowerCase().includes(q)
      const matchPickup = (ride.pickupPoints || []).some((p) => p.name.toLowerCase().includes(q))
      const matchDest = (ride.destination || '').toLowerCase().includes(q)
      const driverName = drivers.find((d) => d.id === ride.driverId)?.name || ''
      const matchDriver = driverName.toLowerCase().includes(q)
      const vehicleName = vehicles.find((v) => v.id === ride.vehicleId)?.name || ''
      const matchVehicle = vehicleName.toLowerCase().includes(q)
      const matchPassenger = (ride.passengers || []).some((p) => p.name.toLowerCase().includes(q))

      return matchId || matchRoute || matchPickup || matchDest || matchDriver || matchVehicle || matchPassenger
    }

    return true
  })

  // Selected Ride Context
  const targetRide = selectedRideId
    ? rides.find((r) => r.id === selectedRideId)
    : (activeRides[0] || rides[0])

  const targetDriver = drivers.find((d) => d.id === targetRide?.driverId)
  const targetVehicle = vehicles.find((v) => v.id === targetRide?.vehicleId)

  const mapPoints = targetRide
    ? [
        ...(targetRide.pickupPoints || []).map((pp) => ({
          lat: pp.lat,
          lng: pp.lng,
          label: pp.name,
          type: 'pickup' as const,
        })),
        {
          lat: targetRide.destinationLat,
          lng: targetRide.destinationLng,
          label: targetRide.destination,
          type: 'destination' as const,
        },
        {
          lat: targetRide.currentLat,
          lng: targetRide.currentLng,
          label: targetVehicle?.name || 'Van',
          type: 'vehicle' as const,
        },
      ]
    : []

  // Dispatch Action Handlers
  const handleReassignDriverConfirm = async (driverId: string) => {
    if (!reassignDriverRideId) return
    setActionSubmitting(true)
    try {
      await reassignDriver(reassignDriverRideId, driverId)
      toast.success('Driver reassigned successfully!')
      setReassignDriverRideId(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to reassign driver')
    } finally {
      setActionSubmitting(false)
    }
  }

  const handleReassignVehicleConfirm = async (vehicleId: string) => {
    if (!reassignVehicleRideId) return
    setActionSubmitting(true)
    try {
      await reassignVehicle(reassignVehicleRideId, vehicleId)
      toast.success('Vehicle reassigned successfully!')
      setReassignVehicleRideId(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to reassign vehicle')
    } finally {
      setActionSubmitting(false)
    }
  }

  const handleRecalculateRoute = async (rideId: string) => {
    setActionSubmitting(true)
    try {
      await recalculateRideRoute(rideId)
      toast.success('OSRM route recalculated & updated!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to recalculate route')
    } finally {
      setActionSubmitting(false)
    }
  }

  const handleCancelRideConfirm = async () => {
    if (!cancelRideId) return
    setActionSubmitting(true)
    try {
      await cancelRideByDispatcher(cancelRideId, cancelReason)
      toast.success('Ride cancelled by Dispatch Control')
      setCancelRideId(null)
      setCancelReason('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel ride')
    } finally {
      setActionSubmitting(false)
    }
  }

  const handleResolveAlert = async (eventId: string) => {
    setActionSubmitting(true)
    try {
      await resolveSafetyEvent(eventId)
      toast.success('Safety alert resolved!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve safety alert')
    } finally {
      setActionSubmitting(false)
    }
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!chatInput.trim()) return

    const userText = chatInput.trim()
    setMessages((prev) => [...prev, { sender: 'user', text: userText }])
    setChatInput('')

    setTimeout(() => {
      let reply = `Analyzed ${activeRides.length} active routes and ${runningVehicles} active vehicles. Average occupancy is currently ${avgOccupancy}%.`
      const lower = userText.toLowerCase()

      if (lower.includes('vehicle') || lower.includes('capacity') || lower.includes('full')) {
        reply = `Fleet status: ${runningVehicles} vehicles in active trip. Total available capacity across active routes is ${availableSeats} seats.`
      } else if (lower.includes('traffic') || lower.includes('delay')) {
        reply = sim.trafficActive
          ? 'Traffic density is high on campus arterial roads. Dynamic OSRM rerouting is actively engaged.'
          : 'Traffic conditions are normal across campus routes.'
      } else if (lower.includes('safety') || lower.includes('sos') || lower.includes('alert')) {
        reply = activeSafetyAlerts.length > 0
          ? `Attention: ${activeSafetyAlerts.length} active safety alert(s) require dispatcher resolution.`
          : 'All active rides are operating safely with no pending safety alerts.'
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: reply }])
    }, 500)
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Mobility Operations Control Center"
        subtitle="Global campus telemetry, active vehicle manifests, dynamic rerouting, and real-time fleet interventions"
        onRefresh={refreshData}
        isRefreshing={isLoading}
      />

      <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full flex-1 space-y-6">
        {/* Top Action Quick Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E5EAF0] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F9F8F] animate-pulse" />
            <span className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
              Autonomous Operations Active
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="px-3.5 py-1.5 rounded-xl border border-[#E5EAF0] bg-white hover:bg-slate-50 text-[#17202A] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
              AI Copilot
            </button>

            <button
              onClick={() => setOptimizerOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
              AI Network Optimizer
            </button>

            <button
              onClick={() => navigate('/admin/demo')}
              className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Demo Controls
            </button>
          </div>
        </div>

        {/* Backend Error Alert */}
        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-800 text-xs font-semibold">
              <AlertOctagon className="w-4 h-4 text-red-600" />
              <span>{loadError}</span>
            </div>
            <button
              onClick={refreshData}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Traffic simulation alert banner if active */}
        {sim.trafficActive && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
              <Activity className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Traffic simulation active. Autonomous dynamic rerouting is recalculating ETAs.</span>
            </div>
            <button
              onClick={() => navigate('/admin/demo')}
              className="px-3 py-1 bg-white border border-amber-200 text-amber-900 rounded-lg text-xs font-semibold"
            >
              Manage Simulation
            </button>
          </div>
        )}

        {/* KPI Row (Real Database Values) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-white border-[#E5EAF0] p-3.5 shadow-xs">
            <p className="text-[11px] font-semibold text-[#5E6875] uppercase tracking-wider">Students</p>
            <p className="text-xl font-bold text-[#17202A] mt-0.5">{students.length}</p>
            <p className="text-[10px] text-[#2563EB] font-medium mt-0.5">Enrolled</p>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-3.5 shadow-xs">
            <p className="text-[11px] font-semibold text-[#5E6875] uppercase tracking-wider">Active Rides</p>
            <p className="text-xl font-bold text-[#0F9F8F] mt-0.5">{activeRides.length}</p>
            <p className="text-[10px] text-[#5E6875] mt-0.5">In Transit</p>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-3.5 shadow-xs">
            <p className="text-[11px] font-semibold text-[#5E6875] uppercase tracking-wider">Available Seats</p>
            <p className="text-xl font-bold text-[#2563EB] mt-0.5">{availableSeats}</p>
            <p className="text-[10px] text-[#5E6875] mt-0.5">Open Capacity</p>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-3.5 shadow-xs">
            <p className="text-[11px] font-semibold text-[#5E6875] uppercase tracking-wider">Running Fleet</p>
            <p className="text-xl font-bold text-[#17202A] mt-0.5">{runningVehicles}</p>
            <p className="text-[10px] text-[#5E6875] mt-0.5">Of {vehicles.length} assets</p>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-3.5 shadow-xs">
            <p className="text-[11px] font-semibold text-[#5E6875] uppercase tracking-wider">Est. Savings</p>
            <p className="text-xl font-bold text-[#0F9F8F] mt-0.5">₹{estimatedSavings.toLocaleString()}</p>
            <p className="text-[10px] text-[#0F9F8F] font-medium mt-0.5">Fuel & Fare</p>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-3.5 shadow-xs">
            <p className="text-[11px] font-semibold text-[#5E6875] uppercase tracking-wider">Avg Occupancy</p>
            <p className="text-xl font-bold text-[#2563EB] mt-0.5">{avgOccupancy}%</p>
            <p className="text-[10px] text-[#5E6875] mt-0.5">Fleet Efficiency</p>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E5EAF0] pb-2 overflow-x-auto">
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#E5EAF0]">
            <button
              onClick={() => setActiveTab('rides')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'rides' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#5E6875] hover:text-[#17202A]'
              }`}
            >
              Rides ({rides.length})
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'vehicles' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#5E6875] hover:text-[#17202A]'
              }`}
            >
              Vehicles ({vehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'drivers' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#5E6875] hover:text-[#17202A]'
              }`}
            >
              Drivers ({drivers.length})
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'safety' ? 'bg-red-600 text-white shadow-xs' : 'text-[#5E6875] hover:text-[#17202A]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Safety Alerts ({activeSafetyAlerts.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#5E6875] hover:text-[#17202A]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Audit Trail ({auditLogs.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6875]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ride, driver, location..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-xl bg-white border border-[#E5EAF0] text-[#17202A] placeholder-[#8C9BAE] focus:outline-none focus:border-[#2563EB]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#5E6875] hover:text-[#17202A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: RIDES VIEW */}
        {activeTab === 'rides' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2/3: Live Telematics Map & Ride List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white border-[#E5EAF0] overflow-hidden shadow-sm">
                <div className="p-3.5 border-b border-[#E5EAF0] flex items-center justify-between bg-[#F7F9FC]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2563EB]" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#17202A]">Live Telematics Canvas</h3>
                  </div>
                  {targetRide && (
                    <Badge variant="blue" size="sm">
                      Focus: {targetRide.routeName}
                    </Badge>
                  )}
                </div>

                <div className="p-2">
                  <CampusMap
                    points={mapPoints}
                    routeCoordinates={targetRide?.routeCoordinates}
                    vehicleLat={targetRide?.currentLat}
                    vehicleLng={targetRide?.currentLng}
                    height="h-72"
                    interactive
                  />
                </div>

                {targetRide && (
                  <div className="px-4 py-3 bg-[#F7F9FC] border-t border-[#E5EAF0] flex items-center justify-between text-xs text-[#5E6875] flex-wrap gap-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 font-medium text-[#17202A]">
                        <span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Vehicle GPS: {targetRide.currentLat?.toFixed(4)}, {targetRide.currentLng?.toFixed(4)}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-[#17202A]">
                        <span className="w-2 h-2 rounded-full bg-[#0F9F8F]" /> Dropoff: {targetRide.destination}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRecalculateRoute(targetRide.id)}
                      disabled={actionSubmitting}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2563EB] bg-white border border-[#E5EAF0] hover:bg-blue-50 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${actionSubmitting ? 'animate-spin' : ''}`} />
                      Recalculate Route
                    </button>
                  </div>
                )}
              </Card>

              {/* Filter Pills */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-[#E5EAF0] overflow-x-auto">
                {['all', 'waiting', 'boarding', 'active', 'completed', 'cancelled', 'safety'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'text-[#5E6875] hover:text-[#17202A]'
                    }`}
                  >
                    {st === 'safety' ? 'Safety Alert' : st}
                  </button>
                ))}
              </div>

              {/* Filtered Rides List */}
              <Card className="bg-white border-[#E5EAF0] shadow-sm overflow-hidden">
                <div className="p-3.5 border-b border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#5E6875]">
                    Dispatch Fleet Rides ({filteredRides.length})
                  </span>
                  <span className="text-[11px] text-[#5E6875]">Click ride to inspect detail</span>
                </div>

                <div className="divide-y divide-[#E5EAF0] max-h-[420px] overflow-y-auto">
                  {filteredRides.length === 0 ? (
                    <div className="p-8 text-center text-[#5E6875]">
                      <Car className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#8C9BAE]" />
                      <p className="text-xs font-semibold text-[#17202A]">No rides match current filters.</p>
                    </div>
                  ) : (
                    filteredRides.map((ride) => {
                      const isSelected = selectedRideId === ride.id
                      const driver = drivers.find((d) => d.id === ride.driverId)
                      const vehicle = vehicles.find((v) => v.id === ride.vehicleId)

                      return (
                        <div
                          key={ride.id}
                          onClick={() => setSelectedRideId(ride.id)}
                          className={`p-3.5 hover:bg-[#F7F9FC] cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#DBEAFE]/40 border-l-4 border-l-[#2563EB]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#17202A] text-sm">{ride.routeName}</span>
                              {ride.hasDeviation && (
                                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold animate-pulse">
                                  DEVIATION
                                </span>
                              )}
                              {ride.hasSosAlert && (
                                <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold animate-pulse">
                                  🚨 SOS
                                </span>
                              )}
                            </div>
                            <Badge
                              variant={
                                ride.status === 'active' ? 'green'
                                : ride.status === 'boarding' ? 'yellow'
                                : ride.status === 'completed' ? 'slate'
                                : ride.status === 'cancelled' ? 'red'
                                : 'blue'
                              }
                              size="sm"
                            >
                              {getRideStatusLabel(ride.status)}
                            </Badge>
                          </div>

                          <p className="text-xs text-[#5E6875] mb-2 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
                            {(ride.pickupPoints || []).map((p) => p.name).join(' → ')} → <span className="font-semibold text-[#17202A]">{ride.destination}</span>
                          </p>

                          <div className="flex items-center justify-between gap-3 text-xs text-[#5E6875]">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-[#2563EB]" /> {driver?.name || 'Unassigned Driver'}
                              </span>
                              <span className="flex items-center gap-1 font-mono">
                                <Truck className="w-3 h-3 text-[#2563EB]" /> {vehicle?.registration || 'Vehicle'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <SeatProgress filled={ride.bookedSeats} total={ride.capacity} showLabel={false} size="sm" className="w-16" />
                              <span className="text-[11px] font-bold text-[#17202A]">
                                {ride.bookedSeats}/{ride.capacity}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* Right 1/3: Real Ride Detail Panel Drawer */}
            <div className="space-y-4">
              {targetRide ? (
                <Card className="bg-white border-[#E5EAF0] p-4 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
                    <div>
                      <h3 className="font-bold text-[#17202A] text-sm">{targetRide.routeName}</h3>
                      <p className="text-[11px] font-mono text-[#5E6875]">Trip #{targetRide.id}</p>
                    </div>
                    <Badge
                      variant={
                        targetRide.status === 'active' ? 'green'
                        : targetRide.status === 'boarding' ? 'yellow'
                        : targetRide.status === 'completed' ? 'slate'
                        : targetRide.status === 'cancelled' ? 'red'
                        : 'blue'
                      }
                      size="sm"
                    >
                      {getRideStatusLabel(targetRide.status)}
                    </Badge>
                  </div>

                  {/* Dispatcher Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setReassignDriverRideId(targetRide.id)}
                      disabled={actionSubmitting}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E5EAF0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#17202A] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" /> Reassign Driver
                    </button>

                    <button
                      onClick={() => setReassignVehicleRideId(targetRide.id)}
                      disabled={actionSubmitting}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E5EAF0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#17202A] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5 text-[#2563EB]" /> Reassign Vehicle
                    </button>

                    <button
                      onClick={() => handleRecalculateRoute(targetRide.id)}
                      disabled={actionSubmitting}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E5EAF0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#2563EB] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Reroute OSRM
                    </button>

                    <button
                      onClick={() => setCancelRideId(targetRide.id)}
                      disabled={actionSubmitting || targetRide.status === 'cancelled'}
                      className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-600 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel Ride
                    </button>
                  </div>

                  {/* Assigned Driver */}
                  <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0]">
                    <span className="text-[10px] font-bold text-[#5E6875] uppercase tracking-wider block mb-1">
                      Assigned Driver
                    </span>
                    {targetDriver ? (
                      <div className="flex items-center gap-2.5">
                        <Avatar name={targetDriver.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#17202A] truncate">{targetDriver.name}</p>
                          <p className="text-[11px] text-[#5E6875] truncate">{targetDriver.phone} • Rating {targetDriver.rating}★</p>
                        </div>
                        <a
                          href={`tel:${targetDriver.phone}`}
                          className="p-1.5 bg-white border border-[#E5EAF0] rounded-lg text-[#2563EB] hover:bg-blue-50"
                          title="Call Driver"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 font-semibold">No driver assigned to this ride</p>
                    )}
                  </div>

                  {/* Assigned Vehicle */}
                  <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0]">
                    <span className="text-[10px] font-bold text-[#5E6875] uppercase tracking-wider block mb-1">
                      Assigned Vehicle
                    </span>
                    {targetVehicle ? (
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#17202A]">{targetVehicle.name}</p>
                          <p className="text-[11px] font-mono text-[#5E6875]">{targetVehicle.registration} • {targetVehicle.type}</p>
                        </div>
                        <Badge variant="green" size="sm">{targetVehicle.capacity} Seats</Badge>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 font-semibold">No vehicle assigned to this ride</p>
                    )}
                  </div>

                  {/* Booked Passengers */}
                  <div>
                    <h4 className="font-bold text-[#17202A] text-xs mb-2">
                      Passenger Manifest ({targetRide.passengers?.length || 0} / {targetRide.capacity})
                    </h4>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                      {(!targetRide.passengers || targetRide.passengers.length === 0) ? (
                        <p className="text-xs text-[#5E6875] italic">No student bookings on this ride yet.</p>
                      ) : (
                        targetRide.passengers.map((p) => (
                          <div key={p.studentId} className="p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-[#17202A]">{p.name}</p>
                              <p className="text-[11px] text-[#5E6875]">Pickup: {p.pickup} • #{p.seatNo}</p>
                            </div>
                            <Badge
                              variant={
                                p.status === 'boarded' ? 'green'
                                : p.status === 'dropped' ? 'slate'
                                : 'yellow'
                              }
                              size="sm"
                            >
                              {p.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="bg-white border-[#E5EAF0] p-8 text-center text-[#5E6875]">
                  <Car className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#8C9BAE]" />
                  <p className="text-xs font-semibold text-[#17202A]">Select a ride to view full dispatch panel.</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VEHICLES VIEW */}
        {activeTab === 'vehicles' && (
          <Card className="bg-white border-[#E5EAF0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#17202A]">Campus Vehicle Fleet ({vehicles.length})</h3>
              <span className="text-xs text-[#5E6875]">Live telematics</span>
            </div>

            <div className="divide-y divide-[#E5EAF0]">
              {vehicles.map((v) => {
                const assignedDriver = drivers.find((d) => d.id === v.driverId)
                const activeRide = rides.find((r) => r.vehicleId === v.id && r.status !== 'completed' && r.status !== 'cancelled')

                return (
                  <div key={v.id} className="p-4 flex items-center justify-between text-xs flex-wrap gap-3 hover:bg-[#F7F9FC]/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[#17202A] text-sm">{v.name}</p>
                        <p className="text-[#5E6875] font-mono">{v.registration} • {v.type} • Capacity: {v.capacity} seats</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-[10px] text-[#5E6875] uppercase font-bold block">Assigned Driver</span>
                        <span className="font-semibold text-[#17202A]">{assignedDriver?.name || 'Unassigned'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#5E6875] uppercase font-bold block">Active Ride</span>
                        <span className="font-semibold text-[#17202A]">{activeRide?.routeName || 'None (Available)'}</span>
                      </div>

                      <Badge variant={activeRide ? 'green' : 'blue'}>
                        {activeRide ? 'ON_TRIP' : 'AVAILABLE'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* TAB 3: DRIVERS VIEW */}
        {activeTab === 'drivers' && (
          <Card className="bg-white border-[#E5EAF0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#17202A]">Registered Campus Drivers ({drivers.length})</h3>
              <span className="text-xs text-[#5E6875]">Live duty status</span>
            </div>

            <div className="divide-y divide-[#E5EAF0]">
              {drivers.map((d) => {
                const vehicle = vehicles.find((v) => v.id === d.vehicleId || v.driverId === d.id)
                const activeRide = rides.find((r) => r.driverId === d.id && r.status !== 'completed' && r.status !== 'cancelled')

                return (
                  <div key={d.id} className="p-4 flex items-center justify-between text-xs flex-wrap gap-3 hover:bg-[#F7F9FC]/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar name={d.name} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#17202A] text-sm">{d.name}</p>
                          <Badge variant={d.verified || d.verificationStatus === 'VERIFIED' ? 'green' : 'yellow'} size="sm">
                            {d.verified || d.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-[#5E6875] font-mono">{d.phone} • License: {d.licenseNo || 'TS09-2022'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-[10px] text-[#5E6875] uppercase font-bold block">Assigned Vehicle</span>
                        <span className="font-semibold text-[#17202A]">{vehicle?.name || 'Unassigned'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#5E6875] uppercase font-bold block">Active Trip</span>
                        <span className="font-semibold text-[#17202A]">{activeRide?.routeName || 'None (Available)'}</span>
                      </div>

                      <Badge variant={activeRide ? 'green' : 'blue'}>
                        {activeRide ? 'ON_TRIP' : 'AVAILABLE'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* TAB 4: SAFETY ALERTS VIEW */}
        {activeTab === 'safety' && (
          <Card className="bg-white border-[#E5EAF0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#17202A]">Active Safety Center Alerts ({activeSafetyAlerts.length})</h3>
              </div>
              <span className="text-xs text-[#5E6875]">Live incident queue</span>
            </div>

            <div className="divide-y divide-[#E5EAF0]">
              {activeSafetyAlerts.length === 0 ? (
                <div className="p-8 text-center text-[#5E6875]">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-[#0F9F8F]" />
                  <p className="text-sm font-bold text-[#17202A]">No active safety alerts!</p>
                  <p className="text-xs text-[#5E6875] mt-0.5">All campus rides operating strictly on schedule.</p>
                </div>
              ) : (
                activeSafetyAlerts.map((event) => {
                  const eventTypeStr = String((event as any).eventType || event.type || 'ALERT')
                  const eventMsg = event.description || event.message || 'Route deviation or SOS triggered'
                  const eventDate = event.timestamp || event.createdAt || Date.now()

                  return (
                    <div key={event.id} className="p-4 flex items-center justify-between text-xs flex-wrap gap-3 bg-red-50/40">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-red-900 uppercase text-xs">{eventTypeStr.replace(/_/g, ' ')}</span>
                            <Badge variant="red" size="sm">{event.severity || 'HIGH'}</Badge>
                          </div>
                          <p className="text-[#17202A] mt-0.5">{eventMsg}</p>
                          <p className="text-[11px] text-[#5E6875] mt-1">Ride ID: {event.rideId} • Timestamp: {new Date(eventDate).toLocaleTimeString()}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleResolveAlert(event.id)}
                        disabled={actionSubmitting}
                        className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Resolve Alert
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        )}

        {/* TAB 5: AUDIT TRAIL VIEW */}
        {activeTab === 'audit' && (
          <Card className="bg-white border-[#E5EAF0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#17202A]">Dispatch Operational Audit Trail ({auditLogs.length})</h3>
              </div>
              <span className="text-xs text-[#5E6875]">Immutable log stream</span>
            </div>

            <div className="divide-y divide-[#E5EAF0] max-h-[500px] overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-[#5E6875]">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#8C9BAE]" />
                  <p className="text-xs font-semibold text-[#17202A]">No audit log entries recorded yet.</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-[#F7F9FC]">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-slate-100 font-mono text-[10px] font-bold rounded text-[#17202A] border border-[#E5EAF0]">
                        {log.action}
                      </span>
                      <div>
                        <p className="font-bold text-[#17202A]">
                          {log.metadata?.driverName ? `Reassigned Driver to ${log.metadata.driverName}` : log.metadata?.vehicleName ? `Reassigned Vehicle to ${log.metadata.vehicleName}` : log.metadata?.reason || log.targetType}
                        </p>
                        <p className="text-[11px] text-[#5E6875]">Dispatcher: {log.dispatcherId} • Ride ID: {log.rideId || 'N/A'}</p>
                      </div>
                    </div>

                    <span className="text-[11px] text-[#5E6875] font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* MODAL: Reassign Driver */}
        {reassignDriverRideId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-[#E5EAF0]">
              <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
                <h3 className="font-bold text-[#17202A] text-sm">Reassign Driver for Ride #{reassignDriverRideId}</h3>
                <button onClick={() => setReassignDriverRideId(null)} className="text-[#5E6875] hover:text-[#17202A]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#5E6875]">Select an available verified campus driver to assign to this ride:</p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {drivers.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleReassignDriverConfirm(d.id)}
                    disabled={actionSubmitting}
                    className="w-full p-3 rounded-xl border border-[#E5EAF0] hover:bg-[#DBEAFE]/40 hover:border-[#2563EB]/40 text-left transition-colors flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={d.name} size="sm" />
                      <div>
                        <p className="font-bold text-[#17202A]">{d.name}</p>
                        <p className="text-[11px] text-[#5E6875]">{d.phone} • Rating {d.rating}★</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#2563EB]">Select</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Reassign Vehicle */}
        {reassignVehicleRideId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-[#E5EAF0]">
              <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
                <h3 className="font-bold text-[#17202A] text-sm">Reassign Vehicle for Ride #{reassignVehicleRideId}</h3>
                <button onClick={() => setReassignVehicleRideId(null)} className="text-[#5E6875] hover:text-[#17202A]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#5E6875]">Select a vehicle from the fleet to assign to this ride:</p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleReassignVehicleConfirm(v.id)}
                    disabled={actionSubmitting}
                    className="w-full p-3 rounded-xl border border-[#E5EAF0] hover:bg-[#DBEAFE]/40 hover:border-[#2563EB]/40 text-left transition-colors flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-[#17202A]">{v.name}</p>
                      <p className="text-[11px] font-mono text-[#5E6875]">{v.registration} • {v.type} ({v.capacity} seats)</p>
                    </div>
                    <span className="text-xs font-bold text-[#2563EB]">Assign</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Cancel Ride */}
        {cancelRideId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-[#E5EAF0]">
              <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
                <h3 className="font-bold text-red-900 text-sm">Cancel Ride #{cancelRideId}</h3>
                <button onClick={() => setCancelRideId(null)} className="text-[#5E6875] hover:text-[#17202A]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#5E6875]">
                Cancelling this ride will immediately notify all booked passengers and release the vehicle and driver.
              </p>

              <div>
                <label className="text-xs font-bold text-[#17202A] block mb-1">Reason for Cancellation (Optional)</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Severe weather, vehicle breakdown..."
                  className="w-full text-xs px-3 py-2 border border-[#E5EAF0] rounded-xl focus:outline-none focus:border-red-500 text-[#17202A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setCancelRideId(null)}
                  className="px-3 py-1.5 bg-white border border-[#E5EAF0] hover:bg-slate-50 text-xs font-semibold rounded-xl text-[#17202A] cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleCancelRideConfirm}
                  disabled={actionSubmitting}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {actionSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dispatcher AI Chat Assistant Drawer */}
        {chatOpen && (
          <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5EAF0] overflow-hidden flex flex-col h-[480px] animate-fade-in">
            {/* Header */}
            <div className="bg-[#2563EB] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-200" />
                <div>
                  <h4 className="font-bold text-sm">AI Mobility Assistant</h4>
                  <p className="text-[10px] text-blue-200">Autonomous Fleet Copilot</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/80 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Message History */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#F7F9FC] text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      m.sender === 'user'
                        ? 'bg-[#2563EB] text-white rounded-br-none shadow-xs'
                        : 'bg-white text-[#17202A] border border-[#E5EAF0] shadow-2xs rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-[#E5EAF0] flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask fleet copilot..."
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-[#F7F9FC] border border-[#E5EAF0] text-[#17202A] focus:outline-none focus:border-[#2563EB]"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-[#2563EB] text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* AI Transportation Intelligence & Network Optimizer */}
        <NetworkOptimizerModal
          isOpen={optimizerOpen}
          onClose={() => setOptimizerOpen(false)}
          onApplied={refreshData}
        />
      </div>
    </div>
  )
}
