import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, RefreshCw, Radio, Bell, Users, Car, MapPin, Navigation,
  Shield, CheckCircle2, ChevronRight, X, Layers, Clock
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'

interface DispatcherHeaderProps {
  title: string
  subtitle: string
  actions?: React.ReactNode
  onRefresh?: () => Promise<void> | void
  isRefreshing?: boolean
}

export default function DispatcherHeader({
  title,
  subtitle,
  actions,
  onRefresh,
  isRefreshing = false,
}: DispatcherHeaderProps) {
  const navigate = useNavigate()
  const students = useAppStore((s) => s.students)
  const drivers = useAppStore((s) => s.drivers)
  const vehicles = useAppStore((s) => s.vehicles)
  const rides = useAppStore((s) => s.rides)
  const bookings = useAppStore((s) => s.bookings)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const currentUser = useAppStore((s) => s.currentUser)
  const adminUser = useAppStore((s) => s.adminUser)

  const [globalSearch, setGlobalSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const activeAlertsCount = safetyEvents.filter((e) => !e.resolved).length

  // Global search filtering across all entities
  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return null
    const q = globalSearch.toLowerCase().trim()

    const matchedStudents = students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.studentId && s.studentId.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q))
    ).slice(0, 4)

    const matchedDrivers = drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        (d.licenseNo && d.licenseNo.toLowerCase().includes(q)) ||
        (d.vehicleRegistration && d.vehicleRegistration.toLowerCase().includes(q))
    ).slice(0, 4)

    const matchedVehicles = vehicles.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.registration.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q)
    ).slice(0, 3)

    const matchedRides = rides.filter(
      (r) =>
        r.routeName.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.pickupPoints.some((p) => p.name.toLowerCase().includes(q))
    ).slice(0, 4)

    const totalMatches =
      matchedStudents.length +
      matchedDrivers.length +
      matchedVehicles.length +
      matchedRides.length

    return {
      students: matchedStudents,
      drivers: matchedDrivers,
      vehicles: matchedVehicles,
      rides: matchedRides,
      total: totalMatches,
    }
  }, [globalSearch, students, drivers, vehicles, rides])

  // Click outside to close search popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const user = currentUser?.role === 'admin' || currentUser?.role === 'dispatcher' ? currentUser : adminUser
  const userName = user?.name || 'Dispatcher'

  return (
    <div className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            {subtitle}
          </p>
        </div>

        {/* Global Search & Operations Telemetry */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Global Operations Search Input */}
          <div ref={searchRef} className="relative min-w-[260px] sm:min-w-[300px]">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search students, drivers, vehicles, routes..."
              className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}

            {/* Global Search Results Dropdown */}
            {searchFocused && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto divide-y divide-slate-100">
                <div className="p-2.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Operations Search ({searchResults.total} matches)</span>
                  <span className="text-[10px] text-slate-400">Click to inspect</span>
                </div>

                {searchResults.total === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No records found matching "{globalSearch}"
                  </div>
                ) : (
                  <>
                    {/* Students */}
                    {searchResults.students.length > 0 && (
                      <div className="p-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1 block">Students</span>
                        {searchResults.students.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              navigate('/admin/students')
                              setSearchFocused(false)
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar name={s.name} size="sm" />
                              <div>
                                <p className="font-semibold text-slate-800">{s.name}</p>
                                <p className="text-[10px] text-slate-400">{s.studentId} · {s.department}</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-300" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Drivers */}
                    {searchResults.drivers.length > 0 && (
                      <div className="p-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1 block">Drivers</span>
                        {searchResults.drivers.map((d) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              navigate('/admin/drivers')
                              setSearchFocused(false)
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar name={d.name} size="sm" />
                              <div>
                                <p className="font-semibold text-slate-800">{d.name}</p>
                                <p className="text-[10px] text-slate-400">{d.vehicleRegistration || 'Staff Driver'}</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-300" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Vehicles */}
                    {searchResults.vehicles.length > 0 && (
                      <div className="p-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1 block">Vehicles</span>
                        {searchResults.vehicles.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => {
                              navigate('/admin/vehicles')
                              setSearchFocused(false)
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Car size={16} className="text-primary-600" />
                              <div>
                                <p className="font-semibold text-slate-800">{v.name}</p>
                                <p className="text-[10px] text-slate-400">{v.registration} · {v.capacity} seats</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-300" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rides */}
                    {searchResults.rides.length > 0 && (
                      <div className="p-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1 block">Routes / Trips</span>
                        {searchResults.rides.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => {
                              navigate('/admin/rides')
                              setSearchFocused(false)
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Navigation size={15} className="text-emerald-600" />
                              <div>
                                <p className="font-semibold text-slate-800">{r.routeName}</p>
                                <p className="text-[10px] text-slate-400">{r.destination} · {r.bookedSeats}/{r.capacity} seats</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-300" />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Real-time Telemetry Live Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px]">Telematics Live</span>
          </div>

          {/* Active Safety Alerts Indicator */}
          {activeAlertsCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/admin/safety')}
              className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-rose-100 transition-colors"
              title="Active Safety Alerts"
            >
              <Shield size={13} className="text-rose-600 animate-pulse" />
              <span>{activeAlertsCount} Alert{activeAlertsCount > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Optional actions slot */}
          {actions}

          {/* Refresh button */}
          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh()}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-primary-600' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
