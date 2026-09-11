import { useState, useEffect, useMemo } from 'react'
import {
  Shield, AlertTriangle, CheckCircle2, Phone, Map, MapPin,
  RefreshCw, Search, Radio, UserCheck, Flame, RotateCw, ExternalLink, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppStore } from '../../store/appStore'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import { formatDate } from '../../lib/utils'
import type { SafetyEvent } from '../../types'

export default function SafetyCenter() {
  const rides = useAppStore((s) => s.rides)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const drivers = useAppStore((s) => s.drivers)
  const students = useAppStore((s) => s.students)
  const resolveDeviation = useAppStore((s) => s.resolveDeviation)
  const resolveSafetyEvent = useAppStore((s) => s.resolveSafetyEvent)
  const triggerDeviation = useAppStore((s) => s.triggerDeviation)
  const triggerSOS = useAppStore((s) => s.triggerSOS)
  const recalculateRideRoute = useAppStore((s) => s.recalculateRideRoute)
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'active' | 'sos' | 'deviation' | 'resolved'>('all')
  const [search, setSearch] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

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

  const activeEvents = useMemo(() => safetyEvents.filter((e) => !e.resolved), [safetyEvents])
  const resolvedEvents = useMemo(() => safetyEvents.filter((e) => e.resolved), [safetyEvents])
  const alertRides = useMemo(() => rides.filter((r) => r.hasDeviation || r.hasSosAlert), [rides])

  // Filtered incident history
  const filteredEvents = useMemo(() => {
    return safetyEvents.filter((e) => {
      const rawType = String(e.eventType || e.type || '').toUpperCase()
      const isSos = rawType.includes('SOS')
      const isDev = rawType.includes('DEVIAT')

      if (filterType === 'active' && e.resolved) return false
      if (filterType === 'resolved' && !e.resolved) return false
      if (filterType === 'sos' && !isSos) return false
      if (filterType === 'deviation' && !isDev) return false

      if (!search.trim()) return true
      const q = search.toLowerCase().trim()
      return (
        (e.message && e.message.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.rideId && e.rideId.toLowerCase().includes(q)) ||
        rawType.toLowerCase().includes(q)
      )
    })
  }, [safetyEvents, filterType, search])

  const handleResolve = async (rideId: string, eventId: string) => {
    setActionLoadingId(eventId)
    try {
      if (resolveSafetyEvent) {
        await resolveSafetyEvent(eventId)
      } else {
        await resolveDeviation(rideId, eventId)
      }
      toast.success('Safety event marked resolved and logged in institutional audit')
      await loadDispatcherData()
    } catch (err: any) {
      toast.error('Failed to resolve safety event')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRecalculate = async (rideId: string) => {
    setActionLoadingId(`recalc-${rideId}`)
    try {
      await recalculateRideRoute(rideId)
      toast.success('Optimal corridor route recalculated and dispatched to driver GPS')
      await loadDispatcherData()
    } catch (err: any) {
      toast.error('Failed to recalculate route')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Safety Operations & Emergency Command"
        subtitle="Active SOS beacons, real-time route deviation containment, emergency responder escalations, and incident audit log"
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-red-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Active Incidents</p>
              <p className="text-2xl font-bold text-red-600">{activeEvents.length}</p>
              <p className="text-xs text-red-600 font-medium mt-0.5">Requiring Intervention</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Monitored Fleet</p>
              <p className="text-2xl font-bold text-[#17202A]">100%</p>
              <p className="text-xs text-[#0F9F8F] font-medium mt-0.5">Continuous GPS Geofencing</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Route Deviations</p>
              <p className="text-2xl font-bold text-[#17202A]">
                {rides.filter((r) => r.hasDeviation).length}
              </p>
              <p className="text-xs text-[#5E6875] mt-0.5">Active off-corridor alerts</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0F9F8F] flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Resolved Today</p>
              <p className="text-2xl font-bold text-[#0F9F8F]">{resolvedEvents.length}</p>
              <p className="text-xs text-[#5E6875] mt-0.5">Audit logged incidents</p>
            </div>
          </Card>
        </div>

        {/* Prominent Active SOS & Deviation Containment Area */}
        {alertRides.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h2 className="font-bold text-base text-red-700 uppercase tracking-wide">
                  Critical Safety Alerts ({alertRides.length} Active Vehicles)
                </h2>
              </div>
              <Badge variant="red" size="sm" className="font-bold animate-pulse">
                DISPATCH INTERVENTION REQUIRED
              </Badge>
            </div>

            <div className="space-y-3">
              {alertRides.map((ride) => {
                const event = safetyEvents.find((e) => e.rideId === ride.id && !e.resolved)
                const driver = drivers.find((d) => d.id === ride.driverId)

                return (
                  <Card
                    key={ride.id}
                    className="bg-red-50/40 border-red-200 p-5 shadow-sm space-y-4 ring-1 ring-red-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-red-200/70">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center text-red-600 flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-[#17202A]">{ride.routeName}</h3>
                            <Badge variant="red" size="sm" className="font-bold">
                              {ride.hasSosAlert ? 'EMERGENCY SOS BEACON' : 'ROUTE DEVIATION DETECTED'}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#5E6875] mt-0.5">
                            Trip ID: <span className="font-mono font-bold text-[#17202A]">{ride.id}</span> • Departure: {ride.departureTime}
                          </p>
                        </div>
                      </div>

                      {driver && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-red-200">
                          <Avatar name={driver.name} size="xs" />
                          <div className="text-xs">
                            <p className="font-bold text-[#17202A]">{driver.name}</p>
                            <p className="text-[11px] text-[#5E6875]">{driver.phone || '+1 (555) 019-2831'}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Incident Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-red-100">
                        <p className="text-[10px] font-bold text-[#5E6875] uppercase tracking-wider mb-1">
                          Planned Campus Corridor
                        </p>
                        <p className="font-medium text-[#17202A]">
                          {ride.pickupPoints.map((p) => p.name).join(' → ')} → {ride.destination}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-red-100">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">
                          Incident Telematics Trigger
                        </p>
                        <p className="font-bold text-red-700">
                          {event?.message || event?.description || 'Vehicle drifted > 450m from designated campus path'}
                        </p>
                      </div>
                    </div>

                    {/* Dispatcher Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={`tel:${driver?.phone || ''}`}
                        className="px-3.5 py-2 rounded-xl bg-white border border-[#E5EAF0] text-[#17202A] hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                        Call Operator
                      </a>

                      <button
                        onClick={() => handleRecalculate(ride.id)}
                        disabled={actionLoadingId === `recalc-${ride.id}`}
                        className="px-3.5 py-2 rounded-xl bg-white border border-[#E5EAF0] text-[#2563EB] hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${actionLoadingId === `recalc-${ride.id}` ? 'animate-spin' : ''}`} />
                        Recalculate Corridor
                      </button>

                      {event && (
                        <button
                          onClick={() => handleResolve(ride.id, event.id)}
                          disabled={actionLoadingId === event.id}
                          className="px-3.5 py-2 rounded-xl bg-[#0F9F8F] text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ml-auto"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Incident Resolved
                        </button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : (
          <Card className="bg-emerald-50/60 border-emerald-200 p-8 text-center shadow-sm space-y-2">
            <CheckCircle2 className="w-10 h-10 text-[#0F9F8F] mx-auto" />
            <h3 className="font-bold text-base text-emerald-950">Campus Fleet Operating Safely</h3>
            <p className="text-xs text-emerald-800 max-w-md mx-auto">
              All vehicles are strictly conforming to planned campus corridors. No active SOS beacons or route violations detected.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => triggerDeviation(rides[0]?.id || 'ride-102')}
                className="cursor-pointer text-xs"
              >
                Simulate Route Deviation (Test)
              </Button>
            </div>
          </Card>
        )}

        {/* Safety Incident History & Audit Log */}
        <Card className="bg-white border-[#E5EAF0] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E5EAF0] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#F7F9FC]">
            <div>
              <h3 className="font-bold text-sm text-[#17202A]">Safety Incident Registry & Audit Log</h3>
              <p className="text-[11px] text-[#5E6875]">Complete institutional record of SOS beacons, deviations, and dispatch actions</p>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6875]" />
                <input
                  type="text"
                  placeholder="Filter incidents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs bg-white border border-[#E5EAF0] rounded-xl text-[#17202A] placeholder-[#8C9BAE] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center bg-white p-1 rounded-xl border border-[#E5EAF0]">
                {(['all', 'active', 'sos', 'deviation', 'resolved'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                      filterType === tab
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'text-[#5E6875] hover:text-[#17202A]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#E5EAF0]">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-[#5E6875]">
                <Shield className="w-8 h-8 text-[#8C9BAE] mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-xs text-[#17202A]">No incidents match the selected filter</p>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const rawType = String(event.eventType || event.type || '').toUpperCase()
                const isSos = rawType.includes('SOS')
                const isDeviation = rawType.includes('DEVIAT')

                return (
                  <div
                    key={event.id}
                    className="p-4 hover:bg-[#F7F9FC]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          event.resolved
                            ? 'bg-emerald-50 text-[#0F9F8F]'
                            : isSos
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {event.resolved ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={event.resolved ? 'green' : isSos ? 'red' : 'yellow'}
                            size="sm"
                            className="font-bold"
                          >
                            {isSos ? 'SOS EMERGENCY' : isDeviation ? 'ROUTE DEVIATION' : rawType || 'INCIDENT'}
                          </Badge>
                          {event.resolved && (
                            <span className="text-[11px] font-semibold text-[#0F9F8F]">
                              RESOLVED
                            </span>
                          )}
                          <span className="font-mono text-[#5E6875]">Ride #{event.rideId}</span>
                        </div>

                        <p className="font-medium text-[#17202A]">{event.message || event.description}</p>
                        <p className="text-[11px] text-[#5E6875] mt-0.5">
                          Reported: {formatDate(event.createdAt || (event as any).timestamp)}
                          {event.resolvedAt && ` • Resolved: ${formatDate(event.resolvedAt)}`}
                        </p>
                      </div>
                    </div>

                    {!event.resolved && (
                      <button
                        onClick={() => handleResolve(event.rideId, event.id)}
                        disabled={actionLoadingId === event.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0F9F8F] border border-emerald-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-center"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
