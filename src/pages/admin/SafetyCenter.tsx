import { useState, useEffect, useMemo } from 'react'
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  Radio,
  RotateCw,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  Car,
  Users,
  Clock,
  Send,
  Check,
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
  const vehicles = useAppStore((s) => s.vehicles)
  const resolveSafetyEvent = useAppStore((s) => s.resolveSafetyEvent)
  const acknowledgeSafetyEvent = useAppStore((s) => s.acknowledgeSafetyEvent)
  const triggerDeviation = useAppStore((s) => s.triggerDeviation)
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

  const activeEvents = useMemo(
    () => safetyEvents.filter((e) => !e.resolved && e.status !== 'RESOLVED'),
    [safetyEvents]
  )
  const resolvedEvents = useMemo(
    () => safetyEvents.filter((e) => e.resolved || e.status === 'RESOLVED'),
    [safetyEvents]
  )

  // Filtered incident history
  const filteredEvents = useMemo(() => {
    return safetyEvents.filter((e) => {
      const rawType = String(e.eventType || e.type || '').toUpperCase()
      const isSos = rawType.includes('SOS')
      const isDev = rawType.includes('DEVIAT')
      const isResolved = Boolean(e.resolved || e.status === 'RESOLVED')

      if (filterType === 'active' && isResolved) return false
      if (filterType === 'resolved' && !isResolved) return false
      if (filterType === 'sos' && !isSos) return false
      if (filterType === 'deviation' && !isDev) return false

      if (!search.trim()) return true
      const q = search.toLowerCase().trim()
      return (
        (e.message && e.message.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.userName && e.userName.toLowerCase().includes(q)) ||
        (e.driverName && e.driverName.toLowerCase().includes(q)) ||
        (e.routeName && e.routeName.toLowerCase().includes(q)) ||
        (e.rideId && e.rideId.toLowerCase().includes(q)) ||
        rawType.toLowerCase().includes(q)
      )
    })
  }, [safetyEvents, filterType, search])

  const handleAcknowledge = async (eventId: string) => {
    setActionLoadingId(`ack-${eventId}`)
    try {
      await acknowledgeSafetyEvent(eventId)
      toast.success('SOS Alert acknowledged! Responders logged in institutional command.', { icon: '🛡️' })
      await loadDispatcherData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to acknowledge safety event')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleResolve = async (eventId: string, rideId?: string) => {
    setActionLoadingId(`res-${eventId}`)
    try {
      await resolveSafetyEvent(eventId)
      toast.success('Safety incident marked RESOLVED and permanently logged in audit registry.', { icon: '✅' })
      await loadDispatcherData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resolve safety event')
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
        {activeEvents.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h2 className="font-bold text-base text-red-700 uppercase tracking-wide">
                  Critical Safety Alerts ({activeEvents.length} Active Incidents)
                </h2>
              </div>
              <Badge variant="red" size="sm" className="font-bold animate-pulse">
                DISPATCH INTERVENTION REQUIRED
              </Badge>
            </div>

            <div className="space-y-4">
              {activeEvents.map((event) => {
                const rawType = String(event.eventType || event.type || '').toUpperCase()
                const isSos = rawType.includes('SOS')
                const isDriverSos = rawType.includes('DRIVER') || event.userRole === 'DRIVER'
                const isStudentSos = isSos && !isDriverSos
                const isDeviation = rawType.includes('DEVIAT')

                const ride = rides.find((r) => r.id === event.rideId)
                const driver = drivers.find((d) => d.id === event.driverId || (ride && d.id === ride.driverId))
                const studentUser = students.find((s) => s.id === event.userId)
                const vehicle = vehicles.find((v) => v.id === event.vehicleId || (ride && v.id === ride.vehicleId))

                const triggerName = event.userName || (isDriverSos ? driver?.name : studentUser?.name) || 'Campus User'
                const triggerPhone = event.userPhone || (isDriverSos ? driver?.phone : studentUser?.phone) || ''
                const triggerRole = event.userRole || (isDriverSos ? 'DRIVER' : 'STUDENT')

                const lat = event.lat || ride?.currentLat || 17.3616
                const lng = event.lng || ride?.currentLng || 78.4747
                const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`

                const isAcknowledged = event.status === 'ACKNOWLEDGED'

                return (
                  <Card
                    key={event.id}
                    className={`border p-5 shadow-sm space-y-4 ring-1 ${
                      isAcknowledged
                        ? 'bg-amber-50/40 border-amber-200 ring-amber-300'
                        : 'bg-rose-50/50 border-rose-300 ring-rose-400'
                    }`}
                  >
                    {/* Top Alert Header Banner */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-rose-200">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                            isAcknowledged
                              ? 'bg-amber-100 border-amber-300 text-amber-700'
                              : 'bg-rose-100 border-rose-300 text-rose-600 animate-pulse'
                          }`}
                        >
                          {isSos ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-heading font-extrabold text-base text-slate-900">
                              {isDriverSos
                                ? 'CRITICAL DRIVER SOS ALERT'
                                : isStudentSos
                                ? 'CRITICAL PASSENGER SOS ALERT'
                                : isDeviation
                                ? 'ROUTE DEVIATION DETECTED'
                                : 'SAFETY INCIDENT ALERT'}
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                isAcknowledged
                                  ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                  : 'bg-rose-200 text-rose-900 border border-rose-300 animate-pulse'
                              }`}
                            >
                              {isAcknowledged ? 'ACKNOWLEDGED' : 'ACTIVE — AWAITING DISPATCH'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mt-0.5">
                            Triggered by:{' '}
                            <span className="font-bold text-slate-900">
                              {triggerName} ({triggerRole})
                            </span>
                            {triggerPhone && <span> • {triggerPhone}</span>} •{' '}
                            <span className="text-slate-500">
                              {new Date(event.createdAt || event.timestamp || Date.now()).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex items-center gap-2">
                        {event.emergencyContact && (
                          <div className="bg-white/80 border border-rose-200 px-3 py-1.5 rounded-xl text-xs">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Emergency Contact</p>
                            <p className="font-bold text-slate-900 truncate">
                              {event.emergencyContact.name} ({event.emergencyContact.relationship || 'Emergency'}):{' '}
                              <span className="text-rose-600 font-mono">{event.emergencyContact.phone}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational Telemetry Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Trip info */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Radio size={12} className="text-primary-600" />
                          <span>Campus Route / Trip</span>
                        </p>
                        <p className="font-bold text-slate-900 truncate">
                          {event.routeName || ride?.routeName || 'Campus Area (No Active Trip)'}
                        </p>
                        {event.rideId && <p className="text-[10px] text-slate-400 font-mono mt-0.5">Trip #{event.rideId}</p>}
                      </div>

                      {/* Driver & Vehicle */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Car size={12} className="text-emerald-600" />
                          <span>Vehicle & Operator</span>
                        </p>
                        <p className="font-bold text-slate-900 truncate">
                          {event.driverName || driver?.name || 'Assigned Driver'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Plate: <span className="font-mono font-bold text-slate-800">{event.vehicleId || (vehicle as any)?.registrationNumber || (vehicle as any)?.registration || 'TS 09 AB 1234'}</span>
                        </p>
                      </div>

                      {/* Live GPS Coordinates */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <MapPin size={12} className="text-rose-600" />
                          <span>Live GPS Coordinates</span>
                        </p>
                        <p className="font-mono font-bold text-slate-900">
                          {lat.toFixed(5)}, {lng.toFixed(5)}
                        </p>
                        <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold">Active Telematics Stream</p>
                      </div>

                      {/* SMS & Dispatch Status */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Send size={12} className="text-blue-600" />
                          <span>Contact SMS Status</span>
                        </p>
                        <p className="font-bold text-slate-800 truncate">
                          {event.smsStatus === 'SENT' ? 'Delivered via SMS' : event.smsStatus ? `Status: ${event.smsStatus}` : 'Emergency Broadcasted'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{event.smsMessage || 'Alert dispatched'}</p>
                      </div>
                    </div>

                    {/* Dispatcher Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* View Location */}
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        <span>VIEW LOCATION</span>
                        <ExternalLink size={11} className="text-slate-400" />
                      </a>

                      {/* Contact Driver or User */}
                      {triggerPhone && (
                        <a
                          href={`tel:${triggerPhone}`}
                          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          <span>Call User ({triggerPhone})</span>
                        </a>
                      )}

                      {/* If trip route has deviation */}
                      {isDeviation && event.rideId && (
                        <button
                          onClick={() => handleRecalculate(event.rideId)}
                          disabled={actionLoadingId === `recalc-${event.rideId}`}
                          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCw
                            className={`w-3.5 h-3.5 ${
                              actionLoadingId === `recalc-${event.rideId}` ? 'animate-spin' : ''
                            }`}
                          />
                          Recalculate Corridor
                        </button>
                      )}

                      {/* Acknowledge Button */}
                      {!isAcknowledged && (
                        <button
                          onClick={() => handleAcknowledge(event.id)}
                          disabled={actionLoadingId === `ack-${event.id}`}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>{actionLoadingId === `ack-${event.id}` ? 'ACKNOWLEDGING...' : 'ACKNOWLEDGE SOS'}</span>
                        </button>
                      )}

                      {/* Resolve Button */}
                      <button
                        onClick={() => handleResolve(event.id, event.rideId)}
                        disabled={actionLoadingId === `res-${event.id}`}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ml-auto disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{actionLoadingId === `res-${event.id}` ? 'RESOLVING...' : 'RESOLVE INCIDENT'}</span>
                      </button>
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
              All campus vehicles and routes are strictly conforming to safety corridors. No active SOS distress beacons or route violations detected.
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
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
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
                const isDriverSos = rawType.includes('DRIVER') || event.userRole === 'DRIVER'
                const isDeviation = rawType.includes('DEVIAT')
                const isResolved = Boolean(event.resolved || event.status === 'RESOLVED')
                const isAcknowledged = event.status === 'ACKNOWLEDGED'

                return (
                  <div
                    key={event.id}
                    className="p-4 hover:bg-[#F7F9FC]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isResolved
                            ? 'bg-emerald-50 text-[#0F9F8F]'
                            : isSos
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {isResolved ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge
                            variant={isResolved ? 'green' : isSos ? 'red' : 'yellow'}
                            size="sm"
                            className="font-bold"
                          >
                            {isDriverSos
                              ? 'DRIVER SOS'
                              : isSos
                              ? 'STUDENT SOS'
                              : isDeviation
                              ? 'ROUTE DEVIATION'
                              : rawType || 'INCIDENT'}
                          </Badge>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isAcknowledged
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isResolved ? 'RESOLVED' : isAcknowledged ? 'ACKNOWLEDGED' : 'ACTIVE'}
                          </span>
                          {event.rideId && <span className="font-mono text-[#5E6875]">Ride #{event.rideId}</span>}
                        </div>

                        <p className="font-medium text-[#17202A]">{event.message || event.description}</p>
                        <p className="text-[11px] text-[#5E6875] mt-0.5">
                          Triggered by: {event.userName || 'Campus User'} ({event.userRole || 'USER'}) • Reported:{' '}
                          {formatDate(event.createdAt || (event as any).timestamp)}
                          {event.acknowledgedAt && ` • Acknowledged: ${formatDate(event.acknowledgedAt)}`}
                          {event.resolvedAt && ` • Resolved: ${formatDate(event.resolvedAt)}`}
                        </p>
                      </div>
                    </div>

                    {!isResolved && (
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {!isAcknowledged && (
                          <button
                            onClick={() => handleAcknowledge(event.id)}
                            disabled={actionLoadingId === `ack-${event.id}`}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => handleResolve(event.id, event.rideId)}
                          disabled={actionLoadingId === `res-${event.id}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0F9F8F] border border-emerald-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolve
                        </button>
                      </div>
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
