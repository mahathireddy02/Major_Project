import { useState, useEffect, useMemo } from 'react'
import {
  Navigation, Search, RefreshCw, AlertTriangle, ChevronDown, ChevronUp,
  MapPin, Users, Clock, Shield, Car, RotateCw, UserCheck, Eye, Phone, CheckCircle2
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import DetailDrawer from '../../components/admin/DetailDrawer'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import SeatProgress from '../../components/ui/SeatProgress'
import Avatar from '../../components/ui/Avatar'
import { getRideStatusLabel } from '../../lib/utils'
import type { Ride } from '../../types'

export default function AdminActiveRides() {
  const rides = useAppStore((s) => s.rides)
  const drivers = useAppStore((s) => s.drivers)
  const vehicles = useAppStore((s) => s.vehicles)
  const recalculateRideRoute = useAppStore((s) => s.recalculateRideRoute)
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)

  const [filter, setFilter] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [drawerTab, setDrawerTab] = useState<'manifest' | 'stops' | 'telematics'>('manifest')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

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

  // Filter and search
  const filteredRides = useMemo(() => {
    return rides.filter((r) => {
      if (filter !== 'All' && r.status.toLowerCase() !== filter.toLowerCase()) return false

      if (!search.trim()) return true
      const q = search.toLowerCase().trim()
      const driver = drivers.find((d) => d.id === r.driverId)
      const hasPassenger = r.passengers?.some((p) => p.name.toLowerCase().includes(q))

      return (
        r.routeName.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        (driver && driver.name.toLowerCase().includes(q)) ||
        hasPassenger
      )
    })
  }, [rides, filter, search, drivers])

  const counts = useMemo(() => {
    return {
      all: rides.length,
      active: rides.filter((r) => r.status === 'active').length,
      boarding: rides.filter((r) => r.status === 'boarding').length,
      waiting: rides.filter((r) => r.status === 'waiting').length,
      completed: rides.filter((r) => r.status === 'completed').length,
    }
  }, [rides])

  const handleRecalculate = async (rideId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionLoading(true)
    try {
      await recalculateRideRoute(rideId)
    } finally {
      setActionLoading(false)
    }
  }

  const selectedDriver = selectedRide ? drivers.find((d) => d.id === selectedRide.driverId) : null
  const selectedVehicle = selectedRide ? vehicles.find((v) => v.id === selectedRide.vehicleId) : null

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Active Trips & Route Dispatch"
        subtitle="Live campus vehicle routes, real-time passenger manifests, stop sequences, and route interventions"
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Active Trips</p>
              <p className="text-2xl font-bold text-[#17202A]">{counts.active}</p>
              <p className="text-xs text-[#2563EB] font-medium mt-0.5">Live On-Campus</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Boarding / Waiting</p>
              <p className="text-2xl font-bold text-[#17202A]">{counts.boarding + counts.waiting}</p>
              <p className="text-xs text-amber-600 mt-0.5">At pickup stations</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0F9F8F] flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Completed Today</p>
              <p className="text-2xl font-bold text-[#0F9F8F]">{counts.completed}</p>
              <p className="text-xs text-[#5E6875] mt-0.5">Safe dropoffs</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Route Incidents</p>
              <p className="text-2xl font-bold text-red-600">
                {rides.filter((r) => r.hasDeviation || r.hasSosAlert).length}
              </p>
              <p className="text-xs text-[#5E6875] mt-0.5">Deviations & Flags</p>
            </div>
          </Card>
        </div>

        {/* Filter and Search */}
        <Card className="bg-white border-[#E5EAF0] p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E6875]" />
              <input
                type="text"
                placeholder="Search rides by route name, destination, driver, or passenger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#17202A] placeholder-[#8C9BAE] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5E6875] hover:text-[#17202A]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex items-center bg-[#F7F9FC] p-1 rounded-xl border border-[#E5EAF0] overflow-x-auto">
              {(['All', 'Active', 'Boarding', 'Waiting', 'Completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    filter === tab
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-[#5E6875] hover:text-[#17202A]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Rides List */}
        <div className="space-y-3">
          {filteredRides.length === 0 ? (
            <Card className="bg-white border-[#E5EAF0] p-12 text-center shadow-sm">
              <Navigation className="w-10 h-10 mx-auto text-[#8C9BAE] mb-2 opacity-60" />
              <p className="font-bold text-base text-[#17202A]">No rides match your filter</p>
              <p className="text-xs text-[#5E6875] mt-1">Try selecting a different status filter or clearing search</p>
            </Card>
          ) : (
            filteredRides.map((ride) => {
              const driver = drivers.find((d) => d.id === ride.driverId)
              const vehicle = vehicles.find((v) => v.id === ride.vehicleId)
              const isExpanded = expandedId === ride.id
              const hasAlert = ride.hasDeviation || ride.hasSosAlert

              return (
                <Card
                  key={ride.id}
                  className={`bg-white border-[#E5EAF0] shadow-sm transition-all overflow-hidden ${
                    hasAlert ? 'border-red-300 ring-1 ring-red-200' : ''
                  }`}
                >
                  <div
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-[#F7F9FC]/60 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : ride.id)}
                  >
                    {/* Left: Route Title and Stops */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] flex-shrink-0 mt-0.5">
                        <Navigation className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-sm text-[#17202A]">{ride.routeName}</h3>
                          <Badge
                            variant={
                              ride.status === 'active'
                                ? 'green'
                                : ride.status === 'boarding'
                                ? 'yellow'
                                : ride.status === 'completed'
                                ? 'slate'
                                : 'blue'
                            }
                            size="sm"
                          >
                            {getRideStatusLabel(ride.status)}
                          </Badge>
                          {ride.hasDeviation && (
                            <Badge variant="red" size="sm" className="gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> DEVIATION
                            </Badge>
                          )}
                          {ride.hasSosAlert && (
                            <Badge variant="red" size="sm" className="font-bold animate-pulse">
                              SOS ACTIVE
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-[#5E6875] truncate">
                          {ride.pickupPoints.map((p) => p.name).join(' → ')} → <strong className="text-[#17202A]">{ride.destination}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Middle: Driver & Vehicle */}
                    <div className="flex items-center gap-4 text-xs">
                      {driver && (
                        <div className="flex items-center gap-2">
                          <Avatar name={driver.name} size="sm" />
                          <div>
                            <p className="font-semibold text-[#17202A] truncate max-w-[120px]">{driver.name}</p>
                            <p className="text-[10px] text-[#5E6875] font-mono">{vehicle?.registration || 'Fleet Shuttle'}</p>
                          </div>
                        </div>
                      )}

                      <div className="w-28 hidden sm:block">
                        <div className="flex items-center justify-between text-[10px] text-[#5E6875] mb-0.5">
                          <span>Capacity</span>
                          <strong>{ride.bookedSeats}/{ride.capacity}</strong>
                        </div>
                        <SeatProgress filled={ride.bookedSeats} total={ride.capacity} size="sm" showLabel={false} />
                      </div>

                      <div className="text-right hidden md:block">
                        <p className="text-xs font-mono font-semibold text-[#17202A]">{ride.departureTime}</p>
                        <p className="text-[10px] text-[#5E6875]">Est: {ride.estimatedArrival}</p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end lg:self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRide(ride)
                          setDrawerTab('manifest')
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2563EB] bg-[#DBEAFE]/40 hover:bg-[#DBEAFE] border border-blue-200 transition-colors"
                      >
                        Inspect
                      </button>

                      <button
                        onClick={(e) => handleRecalculate(ride.id, e)}
                        disabled={actionLoading}
                        title="Recalculate Optimal Route"
                        className="p-1.5 rounded-lg text-[#5E6875] hover:text-[#2563EB] hover:bg-[#F7F9FC] border border-[#E5EAF0] transition-colors"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#5E6875]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#5E6875]" />
                      )}
                    </div>
                  </div>

                  {/* Expanded manifest view */}
                  {isExpanded && (
                    <div className="p-4 bg-[#F7F9FC] border-t border-[#E5EAF0] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5E6875]">
                          Assigned Passengers ({ride.passengers?.length || 0})
                        </h4>
                        <span className="text-[11px] text-[#5E6875]">
                          Trip ID: <span className="font-mono">{ride.id}</span>
                        </span>
                      </div>

                      {(!ride.passengers || ride.passengers.length === 0) ? (
                        <p className="text-xs text-[#5E6875] italic">No passengers currently assigned to this vehicle route.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {ride.passengers.map((p, idx) => (
                            <div key={idx} className="p-3 bg-white rounded-xl border border-[#E5EAF0] flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar name={p.name} size="xs" />
                                <div className="truncate">
                                  <p className="font-bold text-[#17202A] truncate">{p.name}</p>
                                  <p className="text-[11px] text-[#5E6875] truncate">
                                    Pickup: {p.pickup} • Seat #{p.seatNo}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={p.status === 'boarded' ? 'green' : 'yellow'} size="sm">
                                {p.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedRide)}
        onClose={() => setSelectedRide(null)}
        title={selectedRide?.routeName || 'Trip Dossier'}
        subtitle={`Live Operations Dispatch • Ride #${selectedRide?.id}`}
        badge={{
          label: selectedRide?.status ? getRideStatusLabel(selectedRide.status) : 'Active',
          variant: selectedRide?.status === 'active' ? 'green' : 'blue',
        }}
        tabs={[
          { key: 'manifest', label: `Passenger Manifest (${selectedRide?.passengers?.length || 0})` },
          { key: 'stops', label: 'Route Stops' },
          { key: 'telematics', label: 'Vehicle Telemetry' },
        ]}
        activeTab={drawerTab}
        onTabChange={(tab) => setDrawerTab(tab as any)}
      >
        {selectedRide && (
          <div className="space-y-5">
            {drawerTab === 'manifest' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E5EAF0] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#5E6875] font-semibold">Assigned Driver</p>
                      <p className="font-bold text-sm text-[#17202A]">{selectedDriver?.name || 'Assigned Driver'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#5E6875] font-semibold">Assigned Vehicle</p>
                      <p className="font-mono font-bold text-sm text-[#17202A]">{selectedVehicle?.registration || 'CAMPUS-EV'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedRide.passengers?.map((p, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-[#E5EAF0] flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#17202A]">{p.name}</p>
                        <p className="text-[11px] text-[#5E6875] mt-0.5">Boarding at {p.pickup} • Seat #{p.seatNo}</p>
                      </div>
                      <Badge variant={p.status === 'boarded' ? 'green' : 'yellow'} size="sm">
                        {p.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {drawerTab === 'stops' && (
              <div className="space-y-2">
                {selectedRide.pickupPoints.map((pt, idx) => (
                  <div key={pt.id || idx} className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-[#17202A]">{pt.name}</span>
                    </div>
                    <span className="font-mono text-[#5E6875]">{pt.estimatedPickupTime}</span>
                  </div>
                ))}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0F9F8F]" />
                    <span className="font-bold text-emerald-900">{selectedRide.destination}</span>
                  </div>
                  <span className="font-mono text-emerald-800">{selectedRide.estimatedArrival}</span>
                </div>
              </div>
            )}

            {drawerTab === 'telematics' && (
              <div className="space-y-3">
                <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-[#5E6875] uppercase">Current Latitude</p>
                    <p className="font-mono font-bold text-[#17202A] mt-0.5">{selectedRide.currentLat.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5E6875] uppercase">Current Longitude</p>
                    <p className="font-mono font-bold text-[#17202A] mt-0.5">{selectedRide.currentLng.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5E6875] uppercase">Total Route Distance</p>
                    <p className="font-bold text-[#17202A] mt-0.5">{selectedRide.distanceKm || 3.4} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5E6875] uppercase">Hardware Status</p>
                    <p className="font-bold text-[#0F9F8F] mt-0.5">Online & Streaming</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  )
}
