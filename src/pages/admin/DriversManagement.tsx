import { useState, useEffect, useMemo } from 'react'
import {
  Car, Search, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, Eye, Phone, Mail, FileText, Shield, Star, Award, Layers,
  Navigation, UserCheck, AlertCircle, Key, Check
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import DetailDrawer from '../../components/admin/DetailDrawer'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Card from '../../components/ui/Card'
import type { Driver, Ride, Vehicle } from '../../types'

export default function DriversManagement() {
  const drivers = useAppStore((s) => s.drivers)
  const rides = useAppStore((s) => s.rides)
  const vehicles = useAppStore((s) => s.vehicles)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'in_trip' | 'idle'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicle' | 'active_trip' | 'compliance'>('overview')

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

  // Map active ride for each driver
  const activeDriverRideMap = useMemo(() => {
    const map = new Map<string, Ride>()
    rides.forEach((r) => {
      if (r.status === 'active' || r.status === 'boarding' || r.status === 'waiting') {
        map.set(r.driverId, r)
      }
    })
    return map
  }, [rides])

  // Map assigned vehicle for each driver
  const driverVehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>()
    vehicles.forEach((v) => {
      if (v.driverId) map.set(v.driverId, v)
    })
    return map
  }, [vehicles])

  // Filter drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const isVerified = driver.verified || driver.verificationStatus === 'VERIFIED'
      const activeRide = activeDriverRideMap.get(driver.id)
      const hasActive = Boolean(activeRide)

      if (filterStatus === 'verified' && !isVerified) return false
      if (filterStatus === 'pending' && isVerified) return false
      if (filterStatus === 'in_trip' && !hasActive) return false
      if (filterStatus === 'idle' && hasActive) return false

      if (!search.trim()) return true
      const q = search.toLowerCase().trim()
      return (
        driver.name.toLowerCase().includes(q) ||
        (driver.email && driver.email.toLowerCase().includes(q)) ||
        (driver.phone && driver.phone.toLowerCase().includes(q)) ||
        (driver.licenseNo && driver.licenseNo.toLowerCase().includes(q)) ||
        (driver.vehicleRegistration && driver.vehicleRegistration.toLowerCase().includes(q)) ||
        (driver.vehicleType && driver.vehicleType.toLowerCase().includes(q))
      )
    })
  }, [drivers, filterStatus, search, activeDriverRideMap])

  // Selected driver active ride & vehicle
  const selectedDriverRide = selectedDriver ? activeDriverRideMap.get(selectedDriver.id) : null
  const selectedDriverVehicle = selectedDriver
    ? driverVehicleMap.get(selectedDriver.id) || vehicles.find((v) => v.id === selectedDriver.vehicleId)
    : null

  // Safety events for driver
  const driverSafety = useMemo(() => {
    if (!selectedDriver) return []
    return safetyEvents.filter((e) => (selectedDriverRide && e.rideId === selectedDriverRide.id) || (e as any).driverId === selectedDriver.id)
  }, [selectedDriver, selectedDriverRide, safetyEvents])

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Fleet Operators & Driver Management"
        subtitle="Driver licensing verification, assigned vehicle telematics, on-duty tracking, and compliance logs"
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
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Total Drivers</p>
              <p className="text-2xl font-bold text-[#17202A]">{drivers.length}</p>
              <p className="text-xs text-[#2563EB] font-medium mt-0.5">Licensed Fleet Operators</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0F9F8F] flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Verified Drivers</p>
              <p className="text-2xl font-bold text-[#17202A]">
                {drivers.filter((d) => d.verified || d.verificationStatus === 'VERIFIED').length}
              </p>
              <p className="text-xs text-[#0F9F8F] font-medium mt-0.5">Commercial ID Verified</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">On Active Trip</p>
              <p className="text-2xl font-bold text-[#2563EB]">{activeDriverRideMap.size}</p>
              <p className="text-xs text-[#5E6875] mt-0.5">In-transit right now</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Avg Driver Rating</p>
              <p className="text-2xl font-bold text-[#17202A]">
                {(drivers.reduce((acc, d) => acc + (d.rating || 5), 0) / (drivers.length || 1)).toFixed(2)}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">Safety & punctuality score</p>
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
                placeholder="Search drivers by name, phone, license number, vehicle model, registration..."
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

            {/* Filter buttons */}
            <div className="flex items-center bg-[#F7F9FC] p-1 rounded-xl border border-[#E5EAF0]">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                All ({drivers.length})
              </button>
              <button
                onClick={() => setFilterStatus('verified')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterStatus === 'verified'
                    ? 'bg-white text-[#0F9F8F] shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setFilterStatus('in_trip')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterStatus === 'in_trip'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                In Trip ({activeDriverRideMap.size})
              </button>
              <button
                onClick={() => setFilterStatus('idle')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterStatus === 'idle'
                    ? 'bg-white text-[#17202A] shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                Idle / Available
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-white text-amber-600 shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </Card>

        {/* Drivers Table */}
        <Card className="bg-white border-[#E5EAF0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#17202A]">
              <thead className="bg-[#F7F9FC] border-b border-[#E5EAF0] text-xs uppercase tracking-wider font-semibold text-[#5E6875]">
                <tr>
                  <th className="px-5 py-3.5">Driver & Operator</th>
                  <th className="px-5 py-3.5">Assigned Vehicle</th>
                  <th className="px-5 py-3.5">License & RC</th>
                  <th className="px-5 py-3.5">Trip Records</th>
                  <th className="px-5 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Live Duty Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0]">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#5E6875]">
                      <Car className="w-10 h-10 mx-auto text-[#8C9BAE] mb-2 opacity-60" />
                      <p className="font-semibold text-base text-[#17202A]">No drivers match your criteria</p>
                      <p className="text-xs text-[#5E6875] mt-1">Try clearing search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => {
                    const isVerified = driver.verified || driver.verificationStatus === 'VERIFIED'
                    const activeRide = activeDriverRideMap.get(driver.id)
                    const assignedVehicle = driverVehicleMap.get(driver.id) || vehicles.find((v) => v.id === driver.vehicleId)

                    return (
                      <tr
                        key={driver.id}
                        className="hover:bg-[#F7F9FC]/70 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedDriver(driver)
                          setActiveTab('overview')
                        }}
                      >
                        {/* Driver */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={driver.name}
                              size="md"
                              className="bg-[#2563EB]/10 text-[#2563EB] font-bold border border-[#2563EB]/20"
                            />
                            <div>
                              <p className="font-semibold text-[#17202A] group-hover:text-[#2563EB] transition-colors flex items-center gap-1.5">
                                {driver.name}
                                {isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#0F9F8F]" />}
                              </p>
                              <p className="text-xs text-[#5E6875] flex items-center gap-2 mt-0.5">
                                <span>{driver.phone || 'No phone'}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Vehicle */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-[#17202A] text-xs">
                              {driver.vehicleType || assignedVehicle?.name || assignedVehicle?.type || 'Assigned Shuttle'}
                            </p>
                            <p className="text-[11px] font-mono text-[#5E6875] mt-0.5">
                              {driver.vehicleRegistration || assignedVehicle?.registration || 'N/A'}
                            </p>
                          </div>
                        </td>

                        {/* License */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-mono text-xs font-semibold text-[#17202A]">
                              {driver.licenseNo || `DL-${driver.id.slice(0, 6)}`}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {isVerified ? (
                                <Badge variant="green" size="sm" className="text-[10px]">
                                  DOCS VERIFIED
                                </Badge>
                              ) : (
                                <Badge variant="yellow" size="sm" className="text-[10px]">
                                  DOCS PENDING
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Trips */}
                        <td className="px-5 py-4">
                          <span className="font-semibold text-xs text-[#17202A]">{driver.totalTrips || 0} completed</span>
                        </td>

                        {/* Rating */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {driver.rating ? driver.rating.toFixed(2) : '5.00'}
                          </span>
                        </td>

                        {/* Live Status */}
                        <td className="px-5 py-4">
                          {activeRide ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-semibold animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                              Driving: {activeRide.routeName}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-[#5E6875] border border-slate-200 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              On Standby / Available
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDriver(driver)
                              setActiveTab('overview')
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2563EB] bg-[#DBEAFE]/40 hover:bg-[#DBEAFE] border border-blue-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Slide-over Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedDriver)}
        onClose={() => setSelectedDriver(null)}
        title={selectedDriver?.name || 'Driver Details'}
        subtitle={`Fleet Operator • ${selectedDriver?.licenseNo || selectedDriver?.id}`}
        badge={{
          label: selectedDriver?.verified || selectedDriver?.verificationStatus === 'VERIFIED' ? 'Verified Commercial Operator' : 'Pending Verification',
          variant: selectedDriver?.verified || selectedDriver?.verificationStatus === 'VERIFIED' ? 'green' : 'yellow',
        }}
        tabs={[
          { key: 'overview', label: 'Driver Dossier' },
          { key: 'vehicle', label: 'Assigned Vehicle' },
          { key: 'active_trip', label: 'Current Trip' },
          { key: 'compliance', label: `Compliance & Safety (${driverSafety.length})` },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      >
        {selectedDriver && (
          <div className="space-y-6">
            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Hero profile card */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E5EAF0] flex items-center gap-4">
                  <Avatar
                    name={selectedDriver.name}
                    size="lg"
                    className="bg-[#2563EB] text-white text-xl font-bold border-2 border-white shadow-sm"
                  />
                  <div>
                    <h3 className="font-bold text-base text-[#17202A]">{selectedDriver.name}</h3>
                    <p className="text-xs text-[#5E6875] font-medium mt-0.5">Commercial Transit Driver • Shift Active</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Background Checked
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {selectedDriver.rating ? selectedDriver.rating.toFixed(2) : '5.00'} Rating
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <div className="flex items-center gap-1.5 text-xs text-[#5E6875] font-medium mb-1">
                      <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Commercial License</span>
                    </div>
                    <p className="text-xs font-mono font-bold text-[#17202A]">{selectedDriver.licenseNo || 'DL-992810'}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <div className="flex items-center gap-1.5 text-xs text-[#5E6875] font-medium mb-1">
                      <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Phone Line</span>
                    </div>
                    <p className="text-xs font-bold text-[#17202A]">{selectedDriver.phone || '+1 (555) 019-2831'}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <div className="flex items-center gap-1.5 text-xs text-[#5E6875] font-medium mb-1">
                      <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Email</span>
                    </div>
                    <p className="text-xs font-medium text-[#17202A] truncate">{selectedDriver.email || 'operator@campusflow.edu'}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <div className="flex items-center gap-1.5 text-xs text-[#5E6875] font-medium mb-1">
                      <Award className="w-3.5 h-3.5 text-[#0F9F8F]" />
                      <span>Completed Trips</span>
                    </div>
                    <p className="text-xs font-bold text-[#17202A]">{selectedDriver.totalTrips || 0} Successful Commutes</p>
                  </div>
                </div>

                {/* Document Verification Section */}
                <div className="p-4 rounded-xl border border-[#E5EAF0] bg-white space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5E6875] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#0F9F8F]" />
                    Driver Document & License Verification
                  </h4>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2563EB]" />
                        <div>
                          <p className="text-xs font-bold text-[#17202A]">Commercial Driver License (CDL / State DL)</p>
                          <p className="text-[11px] font-mono text-[#5E6875]">{selectedDriver.licenseNo || 'Verified & Valid through 2028'}</p>
                        </div>
                      </div>
                      <Badge variant="green" size="sm">ACTIVE</Badge>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-[#2563EB]" />
                        <div>
                          <p className="text-xs font-bold text-[#17202A]">Vehicle Registration Certificate (RC)</p>
                          <p className="text-[11px] font-mono text-[#5E6875]">{selectedDriver.vehicleRegistration || 'Valid Institutional RC'}</p>
                        </div>
                      </div>
                      <Badge variant="green" size="sm">VERIFIED</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Vehicle */}
            {activeTab === 'vehicle' && (
              <div className="space-y-4">
                {selectedDriverVehicle ? (
                  <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="w-5 h-5 text-[#2563EB]" />
                        <div>
                          <h4 className="font-bold text-sm text-[#17202A]">{selectedDriverVehicle.name || selectedDriverVehicle.type}</h4>
                          <p className="text-xs text-[#5E6875] font-mono">{selectedDriverVehicle.registration}</p>
                        </div>
                      </div>
                      <Badge variant="green" size="sm">ASSIGNED</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-[#F7F9FC] rounded-lg border border-[#E5EAF0]">
                        <p className="text-[10px] text-[#5E6875] uppercase font-semibold">Capacity</p>
                        <p className="font-bold text-[#17202A] mt-0.5">{selectedDriverVehicle.capacity} Passenger Seats</p>
                      </div>
                      <div className="p-3 bg-[#F7F9FC] rounded-lg border border-[#E5EAF0]">
                        <p className="text-[10px] text-[#5E6875] uppercase font-semibold">Vehicle Type</p>
                        <p className="font-bold text-[#17202A] mt-0.5">{selectedDriverVehicle.type}</p>
                      </div>
                      <div className="p-3 bg-[#F7F9FC] rounded-lg border border-[#E5EAF0]">
                        <p className="text-[10px] text-[#5E6875] uppercase font-semibold">Color & Fleet Body</p>
                        <p className="font-bold text-[#17202A] mt-0.5">{selectedDriverVehicle.color || 'Campus Electric'}</p>
                      </div>
                      <div className="p-3 bg-[#F7F9FC] rounded-lg border border-[#E5EAF0]">
                        <p className="text-[10px] text-[#5E6875] uppercase font-semibold">Total Vehicle Trips</p>
                        <p className="font-bold text-[#17202A] mt-0.5">{selectedDriverVehicle.totalTrips || 0} Runs</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#F7F9FC] rounded-xl border border-[#E5EAF0]">
                    <Car className="w-8 h-8 text-[#8C9BAE] mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-[#17202A]">No Specific Vehicle Bound</p>
                    <p className="text-xs text-[#5E6875] mt-1">Vehicle assignment is dynamically scheduled upon route dispatch.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Current Trip */}
            {activeTab === 'active_trip' && (
              <div className="space-y-4">
                {selectedDriverRide ? (
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-xs font-bold">
                        <Navigation className="w-3.5 h-3.5" />
                        LIVE ON ROUTE
                      </span>
                      <span className="text-xs font-mono font-bold text-[#2563EB]">Ride #{selectedDriverRide.id}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#17202A]">{selectedDriverRide.routeName}</h4>
                      <p className="text-xs text-[#5E6875] mt-0.5">
                        Occupancy: {selectedDriverRide.bookedSeats} / {selectedDriverRide.capacity} Seats Booked
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#5E6875] uppercase tracking-wider">Passenger Roster ({selectedDriverRide.passengers?.length || 0})</p>
                      <div className="space-y-1.5">
                        {selectedDriverRide.passengers?.map((p, idx) => (
                          <div key={idx} className="p-2.5 bg-white rounded-lg border border-blue-100 flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#17202A]">{p.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[#5E6875]">{p.pickup}</span>
                              <Badge variant={p.status === 'boarded' ? 'green' : 'yellow'} size="sm">
                                {p.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#F7F9FC] rounded-xl border border-[#E5EAF0]">
                    <Navigation className="w-8 h-8 text-[#8C9BAE] mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-[#17202A]">Driver is Currently Available</p>
                    <p className="text-xs text-[#5E6875] mt-1">Ready to receive optimized route assignments.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Compliance & Safety */}
            {activeTab === 'compliance' && (
              <div className="space-y-3">
                {driverSafety.length === 0 ? (
                  <div className="p-8 text-center bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <Shield className="w-8 h-8 text-[#0F9F8F] mx-auto mb-2" />
                    <p className="font-bold text-sm text-emerald-900">100% Safety Compliance</p>
                    <p className="text-xs text-emerald-700 mt-1">Zero route violations or SOS flags associated with this driver.</p>
                  </div>
                ) : (
                  driverSafety.map((evt) => (
                    <div key={evt.id} className="p-3 bg-white rounded-xl border border-red-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-600 uppercase">{evt.type || evt.eventType}</span>
                        <span className="text-[10px] text-[#5E6875]">{new Date(evt.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#17202A]">{evt.message || evt.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  )
}
