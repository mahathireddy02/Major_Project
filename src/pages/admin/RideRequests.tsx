import { useState, useEffect, useMemo } from 'react'
import {
  Layers, Search, RefreshCw, Filter, CheckCircle2, Clock, MapPin,
  Users, Car, ArrowRight, X, AlertCircle, Eye, Calendar
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import DetailDrawer from '../../components/admin/DetailDrawer'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import { formatDate } from '../../lib/utils'
import type { Booking, Ride } from '../../types'

const STATUS_FILTERS = ['All', 'Requested', 'Matched', 'Pooled', 'Assigned', 'In Trip', 'Completed', 'Cancelled']

export default function RideRequests() {
  const bookings = useAppStore((s) => s.bookings)
  const students = useAppStore((s) => s.students)
  const rides = useAppStore((s) => s.rides)
  const vehicles = useAppStore((s) => s.vehicles)
  const drivers = useAppStore((s) => s.drivers)
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

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

  // Enhanced Requests mapping
  const enrichedRequests = useMemo(() => {
    return bookings.map((b) => {
      const student = students.find((s) => s.id === b.studentId)
      const ride = rides.find((r) => r.id === b.rideId)
      const vehicle = ride ? vehicles.find((v) => v.id === ride.vehicleId) : null
      const driver = ride ? drivers.find((d) => d.id === ride.driverId) : null

      // Derive display status
      let displayStatus = b.status.toUpperCase()
      if (b.status === 'confirmed') {
        if (ride?.status === 'active') displayStatus = 'IN TRIP'
        else if (ride?.status === 'boarding') displayStatus = 'BOARDING'
        else displayStatus = 'ASSIGNED'
      } else if (b.status === 'pending') {
        displayStatus = ride ? 'POOLED' : 'REQUESTED'
      }

      return {
        ...b,
        student,
        ride,
        vehicle,
        driver,
        displayStatus,
      }
    })
  }, [bookings, students, rides, vehicles, drivers])

  // Filter & Search
  const filteredRequests = useMemo(() => {
    return enrichedRequests.filter((item) => {
      if (statusFilter !== 'All') {
        if (statusFilter.toLowerCase() !== item.displayStatus.toLowerCase()) {
          return false
        }
      }
      if (!search.trim()) return true
      const q = search.toLowerCase().trim()
      return (
        item.id.toLowerCase().includes(q) ||
        (item.student?.name && item.student.name.toLowerCase().includes(q)) ||
        (item.student?.studentId && item.student.studentId.toLowerCase().includes(q)) ||
        item.pickup.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q)
      )
    })
  }, [enrichedRequests, statusFilter, search])

  const getStatusBadgeVariant = (status: string) => {
    const s = status.toUpperCase()
    if (s === 'IN TRIP' || s === 'COMPLETED') return 'green'
    if (s === 'ASSIGNED' || s === 'POOLED' || s === 'MATCHED') return 'blue'
    if (s === 'BOARDING' || s === 'REQUESTED' || s === 'PENDING') return 'yellow'
    if (s === 'CANCELLED') return 'red'
    return 'slate'
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Ride Requests Management"
        subtitle="Live commuter ride aggregation, route matching status, and vehicle assignments"
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      />

      <main className="p-6 max-w-7xl mx-auto w-full flex-1 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Requests</span>
            <p className="text-2xl font-heading font-bold text-slate-900">{bookings.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">Active / In Trip</span>
            <p className="text-2xl font-heading font-bold text-emerald-700">
              {enrichedRequests.filter((r) => r.displayStatus === 'IN TRIP' || r.displayStatus === 'ASSIGNED').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">Pending Match</span>
            <p className="text-2xl font-heading font-bold text-amber-700">
              {enrichedRequests.filter((r) => r.displayStatus === 'REQUESTED' || r.displayStatus === 'POOLED').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Completed Trips</span>
            <p className="text-2xl font-heading font-bold text-slate-900">
              {enrichedRequests.filter((r) => r.displayStatus === 'COMPLETED').length}
            </p>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {STATUS_FILTERS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by student, pickup, destination..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-slate-800"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Request ID</th>
                  <th className="px-5 py-3.5">Passenger</th>
                  <th className="px-5 py-3.5">Pickup Corridor</th>
                  <th className="px-5 py-3.5">Destination</th>
                  <th className="px-5 py-3.5">Seats / Fare</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned Fleet</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <Layers size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm">No ride requests found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try adjusting your status filter or search query.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">
                        #{item.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={item.student?.name || 'Student'} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-900">{item.student?.name || 'Student'}</p>
                            <p className="text-[11px] text-slate-400">{item.student?.studentId || item.student?.department || 'Rider'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <MapPin size={13} className="text-primary-600 shrink-0" />
                          <span className="truncate max-w-[140px]" title={item.pickup}>{item.pickup}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="truncate max-w-[140px] block font-medium" title={item.destination}>{item.destination}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-900">{item.seatNo ? `Seat #${item.seatNo}` : '1 Seat'}</span>
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {item.fare != null && item.fare > 0 ? `₹${item.fare}` : '—'}
                          {item.isPriceLocked && <span className="ml-1 text-[9px] text-emerald-600 font-semibold" title="Price Locked">🔒</span>}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={getStatusBadgeVariant(item.displayStatus)} size="sm">
                          {item.displayStatus}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {item.vehicle ? (
                          <div>
                            <p className="font-semibold text-slate-800">{item.vehicle.name}</p>
                            <p className="text-[10px] text-slate-400">{item.driver?.name || 'Assigned Driver'}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Slide-over Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={`Request #${selectedBooking?.id?.slice(-6).toUpperCase()}`}
        subtitle="Ride Aggregation & Passenger Manifest Detail"
        badge={
          selectedBooking && (
            <Badge variant={getStatusBadgeVariant((selectedBooking as any).displayStatus || 'REQUESTED')} size="sm">
              {(selectedBooking as any).displayStatus || 'REQUESTED'}
            </Badge>
          )
        }
      >
        {selectedBooking && (
          <div className="space-y-6 text-xs">
            {/* Passenger Profile */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Passenger Information</span>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={(selectedBooking as any).student?.name || 'Student'} size="md" />
                <div>
                  <h4 className="font-heading font-bold text-slate-900 text-sm">{(selectedBooking as any).student?.name || 'Student'}</h4>
                  <p className="text-slate-500">{(selectedBooking as any).student?.email || 'student@campusflow.io'}</p>
                  <p className="text-slate-400 text-[11px]">ID: {(selectedBooking as any).student?.studentId || 'N/A'} · Year {(selectedBooking as any).student?.year || 1}</p>
                </div>
              </div>
            </div>

            {/* Journey Route Details */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Journey Corridor</span>
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-600 mt-1" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Pickup Coordinate</span>
                  <p className="font-semibold text-slate-900 text-sm">{selectedBooking.pickup}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Destination</span>
                  <p className="font-semibold text-slate-900 text-sm">{selectedBooking.destination}</p>
                </div>
              </div>
            </div>

            {/* Vehicle & Trip Assignment */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Fleet</span>
              {(selectedBooking as any).vehicle ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Vehicle</span>
                    <span className="font-semibold text-slate-800">{(selectedBooking as any).vehicle.name} ({(selectedBooking as any).vehicle.registration})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Driver</span>
                    <span className="font-semibold text-slate-800">{(selectedBooking as any).driver?.name || 'Staff Driver'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Route Name</span>
                    <span className="font-semibold text-slate-800">{(selectedBooking as any).ride?.routeName || 'Campus Corridor'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic">No vehicle assigned yet. Automatic cluster solver active.</p>
              )}
            </div>

            {/* Booking Metadata */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Booked At:</span>
                <span className="font-mono text-slate-700">{formatDate(selectedBooking.bookedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Fare:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedBooking.fare != null && selectedBooking.fare > 0 ? `₹${selectedBooking.fare}` : '—'}
                  {selectedBooking.isPriceLocked && <span className="ml-1.5 text-xs text-emerald-600 font-normal">🔒 Locked</span>}
                </span>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  )
}
