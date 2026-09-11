import { useState, useEffect, useMemo } from 'react'
import {
  Car, CheckCircle2, Star, Users, RefreshCw, Search,
  Zap, Wrench, Shield, Eye, ArrowUpDown, Filter, LayoutGrid, Table as TableIcon,
  Navigation, AlertTriangle, BatteryCharging, Gauge
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import DetailDrawer from '../../components/admin/DetailDrawer'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import type { Vehicle, Ride } from '../../types'

export default function VehicleManagement() {
  const rides = useAppStore((s) => s.rides)
  const vehicles = useAppStore((s) => s.vehicles)
  const drivers = useAppStore((s) => s.drivers)
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'standby'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [activeTab, setActiveTab] = useState<'specs' | 'driver' | 'active_route' | 'maintenance'>('specs')

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

  // Map active ride per vehicle
  const vehicleActiveRideMap = useMemo(() => {
    const map = new Map<string, Ride>()
    rides.forEach((r) => {
      if (r.status === 'active' || r.status === 'boarding' || r.status === 'waiting') {
        map.set(r.vehicleId, r)
      }
    })
    return map
  }, [rides])

  // Vehicle types
  const vehicleTypes = useMemo(() => {
    const types = new Set<string>()
    vehicles.forEach((v) => types.add(v.type))
    return Array.from(types)
  }, [vehicles])

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const activeRide = vehicleActiveRideMap.get(v.id)
      const isActive = Boolean(activeRide)

      if (filterStatus === 'active' && !isActive) return false
      if (filterStatus === 'standby' && isActive) return false
      if (filterType !== 'all' && v.type !== filterType) return false

      if (!search.trim()) return true
      const q = search.toLowerCase().trim()
      const driver = drivers.find((d) => d.id === v.driverId)
      return (
        (v.name?.toLowerCase() || '').includes(q) ||
        (v.registration?.toLowerCase() || '').includes(q) ||
        (v.type?.toLowerCase() || '').includes(q) ||
        Boolean(driver && (driver.name?.toLowerCase() || '').includes(q))
      )
    })
  }, [vehicles, filterStatus, filterType, search, vehicleActiveRideMap, drivers])

  const activeVehiclesCount = vehicleActiveRideMap.size
  const selectedVehicleDriver = selectedVehicle ? drivers.find((d) => d.id === selectedVehicle.driverId) : null
  const selectedVehicleRide = selectedVehicle ? vehicleActiveRideMap.get(selectedVehicle.id) : null

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Fleet Telematics & Vehicle Registry"
        subtitle="Live campus vehicle fleet, asset specifications, real-time occupancy, and mechanical diagnostics"
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Total Fleet Assets</p>
              <p className="text-2xl font-bold text-[#17202A]">{vehicles.length}</p>
              <p className="text-xs text-[#2563EB] font-medium mt-0.5">Licensed & Registered</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0F9F8F] flex-shrink-0">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Active on Campus</p>
              <p className="text-2xl font-bold text-[#0F9F8F]">{activeVehiclesCount}</p>
              <p className="text-xs text-[#5E6875] mt-0.5">Moving / Boarding</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Clean Energy / EV</p>
              <p className="text-2xl font-bold text-[#17202A]">
                {vehicles.filter((v) => (v.name || '').includes('EV') || (v.type || '').includes('Electric') || (v.name || '').includes('e-')).length || vehicles.length}
              </p>
              <p className="text-xs text-[#0F9F8F] font-medium mt-0.5">Zero Campus Emissions</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Total Seating Capacity</p>
              <p className="text-2xl font-bold text-[#17202A]">
                {vehicles.reduce((acc, v) => acc + (v.capacity || 0), 0)} Seats
              </p>
              <p className="text-xs text-[#5E6875] mt-0.5">Fleet-wide passenger capacity</p>
            </div>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <Card className="bg-white border-[#E5EAF0] p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E6875]" />
              <input
                type="text"
                placeholder="Search vehicles by name, registration plate, type, or driver..."
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

            {/* Filter and View toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#17202A] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="all">All Vehicle Types ({vehicleTypes.length})</option>
                {vehicleTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <div className="flex items-center bg-[#F7F9FC] p-1 rounded-xl border border-[#E5EAF0]">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-[#5E6875] hover:text-[#17202A]'
                  }`}
                >
                  All ({vehicles.length})
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filterStatus === 'active'
                      ? 'bg-white text-[#0F9F8F] shadow-xs'
                      : 'text-[#5E6875] hover:text-[#17202A]'
                  }`}
                >
                  Active ({activeVehiclesCount})
                </button>
                <button
                  onClick={() => setFilterStatus('standby')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filterStatus === 'standby'
                      ? 'bg-white text-[#17202A] shadow-xs'
                      : 'text-[#5E6875] hover:text-[#17202A]'
                  }`}
                >
                  Standby ({vehicles.length - activeVehiclesCount})
                </button>
              </div>

              {/* View Mode */}
              <div className="flex items-center bg-[#F7F9FC] p-1 rounded-xl border border-[#E5EAF0]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#5E6875]'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#5E6875]'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Content: Grid or Table */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVehicles.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-[#E5EAF0]">
                <Car className="w-10 h-10 mx-auto text-[#8C9BAE] mb-2 opacity-60" />
                <p className="font-semibold text-base text-[#17202A]">No vehicles found</p>
                <p className="text-xs text-[#5E6875] mt-1">Try changing your search keywords or filter options</p>
              </div>
            ) : (
              filteredVehicles.map((vehicle) => {
                const driver = drivers.find((d) => d.id === vehicle.driverId)
                const activeRide = vehicleActiveRideMap.get(vehicle.id)
                const isActive = Boolean(activeRide)

                return (
                  <Card
                    key={vehicle.id}
                    className={`bg-white border-[#E5EAF0] p-4 shadow-sm hover:border-[#2563EB]/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${
                      isActive ? 'ring-1 ring-emerald-200' : ''
                    }`}
                    onClick={() => {
                      setSelectedVehicle(vehicle)
                      setActiveTab('specs')
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs"
                          style={{
                            backgroundColor: (vehicle.color || '#2563EB') + '15',
                            borderColor: (vehicle.color || '#2563EB') + '30',
                          }}
                        >
                          <Car className="w-5 h-5" style={{ color: vehicle.color || '#2563EB' }} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {vehicle.verified && (
                            <Badge variant="green" size="sm" className="text-[10px] font-semibold">
                              VERIFIED
                            </Badge>
                          )}
                          {isActive ? (
                            <Badge variant="blue" size="sm" className="text-[10px] font-bold animate-pulse">
                              LIVE
                            </Badge>
                          ) : (
                            <span className="text-[10px] font-medium text-[#5E6875] px-1.5 py-0.5 rounded bg-slate-100">
                              STANDBY
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-[#17202A] group-hover:text-[#2563EB] transition-colors">
                        {vehicle.name}
                      </h3>
                      <p className="text-xs text-[#5E6875] font-mono mt-0.5">
                        {vehicle.type} • {vehicle.registration}
                      </p>

                      <div className="flex items-center gap-3 my-3 text-xs text-[#5E6875]">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                          <strong className="text-[#17202A]">{vehicle.capacity}</strong> Seats
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-[#0F9F8F]" />
                          <span className="text-[#0F9F8F] font-semibold">Clean EV</span>
                        </span>
                      </div>
                    </div>

                    {/* Driver snippet */}
                    <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-between">
                      {driver ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={driver.name} size="xs" />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-[#17202A] truncate">{driver.name}</p>
                            <p className="text-[10px] text-[#5E6875]">Assigned Operator</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-[#5E6875]">No driver assigned</span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedVehicle(vehicle)
                          setActiveTab('specs')
                        }}
                        className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 flex-shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        ) : (
          <Card className="bg-white border-[#E5EAF0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#17202A]">
                <thead className="bg-[#F7F9FC] border-b border-[#E5EAF0] text-xs uppercase tracking-wider font-semibold text-[#5E6875]">
                  <tr>
                    <th className="px-5 py-3.5">Vehicle Asset</th>
                    <th className="px-5 py-3.5">Plate & Type</th>
                    <th className="px-5 py-3.5">Capacity</th>
                    <th className="px-5 py-3.5">Assigned Operator</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAF0]">
                  {filteredVehicles.map((vehicle) => {
                    const driver = drivers.find((d) => d.id === vehicle.driverId)
                    const activeRide = vehicleActiveRideMap.get(vehicle.id)
                    const isActive = Boolean(activeRide)

                    return (
                      <tr
                        key={vehicle.id}
                        className="hover:bg-[#F7F9FC]/70 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedVehicle(vehicle)
                          setActiveTab('specs')
                        }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: (vehicle.color || '#2563EB') + '20' }}
                            >
                              <Car className="w-4 h-4" style={{ color: vehicle.color || '#2563EB' }} />
                            </div>
                            <span className="font-semibold text-[#17202A] group-hover:text-[#2563EB] transition-colors">
                              {vehicle.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-[#5E6875]">
                          {vehicle.registration} ({vehicle.type})
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-[#17202A]">
                          {vehicle.capacity} Passengers
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {driver ? (
                            <span className="font-medium text-[#17202A]">{driver.name}</span>
                          ) : (
                            <span className="text-[#8C9BAE]">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {isActive ? (
                            <Badge variant="green" size="sm">ACTIVE ON ROUTE</Badge>
                          ) : (
                            <Badge variant="slate" size="sm">STANDBY</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVehicle(vehicle)
                              setActiveTab('specs')
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2563EB] bg-[#DBEAFE]/40 hover:bg-[#DBEAFE] border border-blue-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Slide-over Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedVehicle)}
        onClose={() => setSelectedVehicle(null)}
        title={selectedVehicle?.name || 'Vehicle Telematics'}
        subtitle={`Fleet Asset • ${selectedVehicle?.registration || selectedVehicle?.id}`}
        badge={{
          label: selectedVehicleRide ? 'Active On-Route' : 'On Standby',
          variant: selectedVehicleRide ? 'green' : 'blue',
        }}
        tabs={[
          { key: 'specs', label: 'Asset Specs' },
          { key: 'driver', label: 'Driver Dossier' },
          { key: 'active_route', label: 'Live Telemetry' },
          { key: 'maintenance', label: 'Diagnostics & Health' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      >
        {selectedVehicle && (
          <div className="space-y-6">
            {/* Tab: Specs */}
            {activeTab === 'specs' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E5EAF0] flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center border shadow-xs"
                    style={{
                      backgroundColor: (selectedVehicle.color || '#2563EB') + '20',
                      borderColor: (selectedVehicle.color || '#2563EB') + '40',
                    }}
                  >
                    <Car className="w-7 h-7" style={{ color: selectedVehicle.color || '#2563EB' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#17202A]">{selectedVehicle.name}</h3>
                    <p className="text-xs text-[#5E6875] font-mono mt-0.5">{selectedVehicle.registration} • {selectedVehicle.type}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Zap className="w-3 h-3" /> Electric Powertrain
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                        <Users className="w-3 h-3" /> {selectedVehicle.capacity} Seats
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <p className="text-[10px] text-[#5E6875] uppercase font-semibold">Plate Registration</p>
                    <p className="font-mono font-bold text-[#17202A] mt-0.5">{selectedVehicle.registration}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <p className="text-[10px] text-[#5E6875] uppercase font-semibold">Passenger Capacity</p>
                    <p className="font-bold text-[#17202A] mt-0.5">{selectedVehicle.capacity} Maximum</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <p className="text-[10px] text-[#5E6875] uppercase font-semibold">Fleet Type</p>
                    <p className="font-bold text-[#17202A] mt-0.5">{selectedVehicle.type}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <p className="text-[10px] text-[#5E6875] uppercase font-semibold">Institutional Status</p>
                    <p className="font-bold text-[#0F9F8F] mt-0.5">Approved & Licensed</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Driver */}
            {activeTab === 'driver' && (
              <div className="space-y-4">
                {selectedVehicleDriver ? (
                  <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={selectedVehicleDriver.name} size="md" />
                      <div>
                        <h4 className="font-bold text-sm text-[#17202A]">{selectedVehicleDriver.name}</h4>
                        <p className="text-xs text-[#5E6875]">{selectedVehicleDriver.phone || 'Fleet Operator'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-[#F7F9FC] rounded-lg">
                        <p className="text-[10px] text-[#5E6875] uppercase">Driver Rating</p>
                        <p className="font-bold text-[#17202A] mt-0.5 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {selectedVehicleDriver.rating || 5.0}
                        </p>
                      </div>
                      <div className="p-2.5 bg-[#F7F9FC] rounded-lg">
                        <p className="text-[10px] text-[#5E6875] uppercase">Total Completed Runs</p>
                        <p className="font-bold text-[#17202A] mt-0.5">{selectedVehicleDriver.totalTrips || 0}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#F7F9FC] rounded-xl border border-[#E5EAF0]">
                    <Car className="w-8 h-8 text-[#8C9BAE] mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-[#17202A]">No Driver Assigned</p>
                    <p className="text-xs text-[#5E6875] mt-1">Vehicle is available in the dispatcher pool.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Live Telemetry */}
            {activeTab === 'active_route' && (
              <div className="space-y-4">
                {selectedVehicleRide ? (
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2563EB] uppercase">Active Commute</span>
                      <span className="text-xs font-mono text-[#5E6875]">#{selectedVehicleRide.id}</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#17202A]">{selectedVehicleRide.routeName}</h4>
                    <p className="text-xs text-[#5E6875]">
                      Occupancy: {selectedVehicleRide.bookedSeats} / {selectedVehicleRide.capacity} Seats Filled
                    </p>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#F7F9FC] rounded-xl border border-[#E5EAF0]">
                    <Gauge className="w-8 h-8 text-[#8C9BAE] mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-[#17202A]">Vehicle is Parked / Standby</p>
                    <p className="text-xs text-[#5E6875] mt-1">No active trip telemetry is transmitting.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Maintenance */}
            {activeTab === 'maintenance' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <BatteryCharging className="w-6 h-6 text-[#0F9F8F]" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">EV Battery State of Charge: 94%</p>
                    <p className="text-[11px] text-emerald-700">Estimated remaining range: 180 km</p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E5EAF0] flex items-center gap-3">
                  <Shield className="w-6 h-6 text-[#2563EB]" />
                  <div>
                    <p className="text-xs font-bold text-[#17202A]">Safety & Mechanical Inspection</p>
                    <p className="text-[11px] text-[#5E6875]">All braking, lighting, and GPS systems operating normally</p>
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
