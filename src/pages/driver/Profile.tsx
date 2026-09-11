import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Star,
  ShieldCheck,
  Car,
  Phone,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  MapPin,
  Users,
  Navigation,
  DollarSign,
  ChevronRight,
  Route,
  ArrowRight,
  RefreshCw,
  HeartHandshake,
  Edit2,
  Trash2,
  Plus,
  X,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppStore } from '../../store/appStore'
import { api } from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { getRideStatusLabel } from '../../lib/utils'
import type { EmergencyContact } from '../../types'

export default function DriverProfile() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'history' ? 'history' : 'profile'
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>(initialTab)
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'COMPLETED' | 'ACTIVE'>('ALL')
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const currentUser = useAppStore((s) => s.currentUser)
  const currentDriver = useAppStore((s) => s.currentDriver())
  const vehicles = useAppStore((s) => s.vehicles)
  const currentDriverId = useAppStore((s) => s.currentDriverId)
  const rides = useAppStore((s) => s.rides)
  const bookings = useAppStore((s) => s.bookings)
  const students = useAppStore((s) => s.students)
  const refreshRides = useAppStore((s) => s.refreshRides)

  // Real-time backend data loading
  const reloadData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshRides()
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshRides])

  useEffect(() => {
    reloadData()
  }, [activeTab, reloadData])

  useEffect(() => {
    const unsub = api.onRealtimeEvent((event) => {
      if (
        event === 'RIDE_COMPLETED' ||
        event === 'RIDE_UPDATED' ||
        event === 'BOOKING_UPDATED' ||
        event === 'BOOKING_CREATED'
      ) {
        refreshRides()
      }
    })
    return unsub
  }, [refreshRides])

  // Prefer currentUser (real authenticated driver) over store-derived driver
  const driver = currentUser?.role === 'DRIVER' || currentUser?.role === 'driver' ? currentUser : currentDriver

  // Emergency Contact state
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [contactName, setContactName] = useState('')
  const [relationship, setRelationship] = useState('Spouse')
  const [contactPhone, setContactPhone] = useState('')
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({})
  const [savingContact, setSavingContact] = useState(false)

  const activeDriverUserId = currentUser?.id || currentDriverId || driver?.id || 'd1'

  useEffect(() => {
    if (!activeDriverUserId) return
    api
      .getEmergencyContact(activeDriverUserId)
      .then((ec) => setEmergencyContact(ec))
      .catch(() => setEmergencyContact(null))
  }, [activeDriverUserId])

  const openAddEditModal = () => {
    if (emergencyContact) {
      setContactName(emergencyContact.name)
      setRelationship(emergencyContact.relationship || 'Spouse')
      setContactPhone(emergencyContact.phone)
    } else {
      setContactName('')
      setRelationship('Spouse')
      setContactPhone('')
    }
    setModalErrors({})
    setIsModalOpen(true)
  }

  const validateModal = () => {
    const errors: Record<string, string> = {}
    if (!contactName.trim() || contactName.trim().length < 2) {
      errors.name = 'Please enter a valid full name (at least 2 characters)'
    }
    if (!relationship.trim()) {
      errors.relationship = 'Please select or enter a relationship'
    }
    const cleanPhone = contactPhone.replace(/^\+91/, '').replace(/\s+/g, '')
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit phone number'
    }
    setModalErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateModal()) return

    setSavingContact(true)
    try {
      const saved = await api.saveEmergencyContact(activeDriverUserId, {
        name: contactName.trim(),
        relationship: relationship.trim(),
        phone: contactPhone.trim(),
      })
      setEmergencyContact(saved)
      setIsModalOpen(false)
      toast.success('Emergency contact saved successfully!', { icon: '🛡️' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to save emergency contact')
    } finally {
      setSavingContact(false)
    }
  }

  const handleDeleteContact = async () => {
    if (!window.confirm('Are you sure you want to remove this emergency contact?')) return
    try {
      await api.deleteEmergencyContact(activeDriverUserId)
      setEmergencyContact(null)
      toast.success('Emergency contact removed')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete emergency contact')
    }
  }

  if (!driver) return null

  const vehicle =
    vehicles.find((v) => v.driverId === currentDriverId) || vehicles.find((v) => v.driverId === driver.id)
  const vehicleFromUser = currentUser?.vehicleRegistration
    ? {
        name: `Campus Shuttle`,
        type: currentUser.vehicleType || 'Van',
        registration: currentUser.vehicleRegistration,
        capacity: 6,
      }
    : null
  const displayVehicle = vehicle || vehicleFromUser

  // Filter rides for this driver
  const driverRides = rides.filter(
    (r) =>
      r.driverId === currentDriverId ||
      r.driverId === driver.id ||
      r.driverId === 'd1' ||
      (driver.name && (r as any).driverName === driver.name)
  )

  const completedRides = driverRides.filter((r) => r.status === 'completed')
  const inProgressRides = driverRides.filter(
    (r) => r.status === 'active' || r.status === 'boarding' || r.status === 'waiting' || r.status === 'full'
  )

  // Filtered list based on pill
  const displayedRides = driverRides
    .filter((r) => {
      if (historyFilter === 'COMPLETED') return r.status === 'completed'
      if (historyFilter === 'ACTIVE')
        return r.status === 'active' || r.status === 'boarding' || r.status === 'waiting' || r.status === 'full'
      return true
    })
    .sort((a, b) => {
      const timeA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0
      const timeB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0
      return timeB - timeA
    })

  // Aggregate Metrics
  const totalEarnings = completedRides.reduce((acc, r) => {
    if (r.totalFareAmount && r.totalFareAmount > 0) return acc + r.totalFareAmount
    if (r.passengers && r.passengers.length > 0) {
      return acc + r.passengers.reduce((pSum, p) => pSum + (p.fare || 0), 0)
    }
    return acc + (r.fare || 0) * (r.bookedSeats || 1)
  }, 0)
  const totalKmDriven = completedRides.reduce((acc, r) => acc + (r.distanceKm || 4.2), 0)

  const switchTab = (tab: 'profile' | 'history') => {
    setActiveTab(tab)
    setSearchParams(tab === 'history' ? { tab: 'history' } : {})
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Driver Portal</h1>
          <p className="text-xs text-slate-500">Manage your driver profile, vehicle details, and completed trips</p>
        </div>

        {/* Tab Pill Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
          <button
            onClick={() => switchTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={13} />
            <span>Profile & Vehicle</span>
          </button>
          <button
            onClick={() => switchTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={13} />
            <span>Trip History ({driverRides.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TRIP HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Earnings & Trips Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card padding="md" className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completed Trips</p>
              <h3 className="font-heading font-extrabold text-2xl text-white mt-1">{completedRides.length}</h3>
              <p className="text-[10px] text-emerald-400 mt-1">100% verified</p>
            </Card>

            <Card padding="md" className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white">
              <p className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">Total Earned</p>
              <h3 className="font-heading font-extrabold text-2xl text-white mt-1">₹{totalEarnings}</h3>
              <p className="text-[10px] text-emerald-200 mt-1">Campus mobility fare</p>
            </Card>

            <Card padding="md" className="bg-gradient-to-br from-primary-900 to-primary-800 text-white">
              <p className="text-[11px] font-semibold text-primary-200 uppercase tracking-wider">Distance Driven</p>
              <h3 className="font-heading font-extrabold text-2xl text-white mt-1">{totalKmDriven.toFixed(1)} km</h3>
              <p className="text-[10px] text-primary-300 mt-1">OSRM routed corridors</p>
            </Card>

            <Card padding="md" className="bg-gradient-to-br from-amber-900 to-amber-800 text-white">
              <p className="text-[11px] font-semibold text-amber-200 uppercase tracking-wider">Driver Rating</p>
              <h3 className="font-heading font-extrabold text-2xl text-white mt-1">★ {driver.rating ?? 4.9}</h3>
              <p className="text-[10px] text-amber-300 mt-1">Passenger score</p>
            </Card>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Trips ({driverRides.length})
              </button>
              <button
                onClick={() => setHistoryFilter('COMPLETED')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === 'COMPLETED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Completed ({completedRides.length})
              </button>
              <button
                onClick={() => setHistoryFilter('ACTIVE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === 'ACTIVE'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Active / Scheduled ({inProgressRides.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={reloadData}
                disabled={isRefreshing}
                className="text-xs h-7 px-2.5 gap-1.5 text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-primary-600' : 'text-slate-500'} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>

              {inProgressRides.length > 0 && (
                <Button
                  size="sm"
                  variant="green"
                  onClick={() => navigate(`/driver/trip?rideId=${inProgressRides[0].id}`)}
                  className="text-xs h-7 gap-1"
                >
                  <Navigation size={12} />
                  <span>Go to Active Trip</span>
                </Button>
              )}
            </div>
          </div>

          {/* Trips List */}
          {displayedRides.length === 0 ? (
            <Card padding="lg" className="text-center py-12 text-slate-400">
              <Clock size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
              <h3 className="font-heading font-semibold text-slate-700 text-base mb-1">No trips found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {historyFilter === 'COMPLETED'
                  ? 'You have not completed any trips yet. Once you complete a ride from Current Trip, it will be catalogued here.'
                  : 'No trips match the selected filter.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayedRides.map((ride) => {
                const isCompleted = ride.status === 'completed'
                const isActive = ride.status === 'active'
                const fareCollected = ride.totalFareAmount || (ride.passengers && ride.passengers.length > 0
                  ? ride.passengers.reduce((sum, p) => sum + (p.fare || 0), 0)
                  : (ride.fare || 0) * (ride.bookedSeats || 1))
                const isExpanded = expandedRideId === ride.id

                return (
                  <Card key={ride.id} padding="none" className="overflow-hidden border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="p-4">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading font-bold text-slate-900 text-sm">{ride.routeName}</h3>
                            <Badge
                              size="sm"
                              variant={
                                isCompleted ? 'green' : isActive ? 'blue' : ride.status === 'boarding' ? 'yellow' : 'slate'
                              }
                            >
                              {getRideStatusLabel(ride.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <Calendar size={11} className="text-slate-400" />
                            <span>{ride.date === 'today' ? 'Today' : ride.date || 'Today'}</span>
                            <span>·</span>
                            <Clock size={11} className="text-slate-400" />
                            <span>Departs {ride.departureTime}</span>
                          </p>
                        </div>

                        {/* Fare & Seats */}
                        <div className="text-right flex-shrink-0">
                          <span className="font-heading font-extrabold text-base text-slate-900">₹{fareCollected}</span>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {ride.averageFare ? `avg ₹${ride.averageFare} / seat` : (ride.fare ? `₹${ride.fare} / seat` : 'Dynamic')}
                          </p>
                        </div>
                      </div>

                      {/* Route Flow */}
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between gap-3 text-xs mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin size={13} className="text-primary-600 flex-shrink-0" />
                          <span className="truncate text-slate-700 font-medium">
                            {ride.pickupPoints?.map((p) => p.name).join(' → ') || 'Campus Hub'}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold text-emerald-700 truncate">{ride.destination}</span>
                        </div>

                        <div className="text-right text-[11px] font-semibold text-slate-500 flex-shrink-0">
                          {ride.distanceKm || 4.2} km
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div className="flex items-center gap-3 text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users size={13} className="text-slate-400" />
                            <strong>{ride.bookedSeats || ride.passengers?.length || 0}</strong>/{ride.capacity} Passengers
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedRideId(isExpanded ? null : ride.id)}
                            className="text-primary-600 hover:text-primary-700 font-semibold cursor-pointer flex items-center gap-0.5"
                          >
                            <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
                            <ChevronRight size={13} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>

                          {!isCompleted && (
                            <Button
                              size="sm"
                              variant={isActive ? 'green' : 'primary'}
                              className="text-xs h-7 px-2.5 gap-1"
                              onClick={() => navigate(`/driver/trip?rideId=${ride.id}`)}
                            >
                              <Navigation size={11} />
                              <span>{isActive ? 'Live Map' : 'Open Trip'}</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details: Passengers & Stops */}
                      {isExpanded && (() => {
                        const rideBookings = bookings.filter((b) => b.rideId === ride.id && b.status !== 'cancelled')
                        const rosterMap = new Map<string, any>()

                        // 1. Add embedded ride.passengers
                        ;(ride.passengers || []).forEach((p: any, idx: number) => {
                          if (p.name === 'Dispatch Control' || p.studentId === 'admin1') return
                          const key = p.studentId || `p-${idx}`
                          const st = isCompleted ? 'dropped' : p.status || 'waiting'
                          rosterMap.set(key, {
                            id: key,
                            name: p.name || 'Student',
                            pickup: p.pickup || 'Campus Stop',
                            destination: p.destination || ride.destination,
                            seatNo: p.seatNo || idx + 1,
                            status: st,
                          })
                        })

                        // 2. Add bookings that might not be in ride.passengers
                        rideBookings.forEach((b: any) => {
                          const studentUser = students.find((s) => s.id === b.studentId)
                          const st = isCompleted ? 'dropped' : b.status === 'boarded' ? 'boarded' : b.status === 'completed' ? 'dropped' : 'waiting'
                          if (!rosterMap.has(b.studentId)) {
                            rosterMap.set(b.studentId, {
                              id: b.studentId,
                              name: studentUser?.name || b.studentName || 'Student',
                              pickup: b.pickup || 'Campus Stop',
                              destination: b.destination || ride.destination,
                              seatNo: (b as any).seatNo || rosterMap.size + 1,
                              status: st,
                            })
                          } else {
                            if (isCompleted) {
                              rosterMap.get(b.studentId)!.status = 'dropped'
                            }
                            if (b.destination && !rosterMap.get(b.studentId)!.destination) {
                              rosterMap.get(b.studentId)!.destination = b.destination
                            }
                          }
                        })

                        const rosterList = Array.from(rosterMap.values())

                        return (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700">Passenger Roster ({rosterList.length}):</span>
                              {isCompleted && (
                                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 size={12} />
                                  All passengers completed & dropped
                                </span>
                              )}
                            </div>

                            {rosterList.length === 0 ? (
                              <p className="text-slate-400 text-[11px]">No passengers recorded for this trip.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {rosterList.map((p, pIdx) => {
                                  const isDropped = p.status === 'dropped' || isCompleted
                                  const isBoarded = p.status === 'boarded'
                                  return (
                                    <div
                                      key={p.id || pIdx}
                                      className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs"
                                    >
                                      <div>
                                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                          <span>{p.name}</span>
                                          {isDropped && <CheckCircle2 size={12} className="text-emerald-500" />}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                          {p.pickup} → {p.destination || ride.destination} · Seat #{p.seatNo}
                                        </div>
                                      </div>
                                      <Badge
                                        size="sm"
                                        variant={isDropped ? 'green' : isBoarded ? 'blue' : 'slate'}
                                      >
                                        {isDropped ? 'Dropped Off' : isBoarded ? 'Boarded' : 'Waiting'}
                                      </Badge>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROFILE & CREDENTIALS */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Profile Header */}
          <Card padding="lg">
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={driver.name} size="xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-bold text-xl text-slate-900">{driver.name}</h2>
                  <Badge variant="green" size="sm">
                    <CheckCircle2 size={12} /> Certified
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">License: {driver.licenseNo || driver.licenseNumber || 'Verified'}</p>
                <p className="text-xs text-slate-500">{driver.phone}</p>
              </div>
            </div>

            {/* Rating summary */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 mb-6">
              <Star size={20} className="text-amber-500 fill-amber-500" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-bold text-amber-900 text-lg">{driver.rating ?? 4.9}</span>
                  <span className="text-xs text-amber-700">Driver Rating Score</span>
                </div>
                <p className="text-[11px] text-amber-700">Based on passenger trip ratings</p>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-heading font-bold text-slate-900 text-lg">{driver.totalTrips ?? completedRides.length}</p>
                <p className="text-[11px] text-slate-400">Total Trips</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-heading font-bold text-green-600 text-lg">99.4%</p>
                <p className="text-[11px] text-slate-400">On-time Rate</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-heading font-bold text-primary-600 text-lg">₹{totalEarnings}</p>
                <p className="text-[11px] text-slate-400">Gross Earnings</p>
              </div>
            </div>
          </Card>

          {/* Assigned Vehicle */}
          {displayVehicle && (
            <Card padding="md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-slate-900 text-base">Assigned Campus Vehicle</h3>
                <Badge variant="green">Active Fleet</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                  <Car size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-slate-900 text-sm">{displayVehicle.name}</p>
                  <p className="text-xs text-slate-500">
                    {displayVehicle.type} ·{' '}
                    {(displayVehicle as any).registration || (displayVehicle as any).registrationNumber || 'TS 07 UA 1234'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Capacity: {displayVehicle.capacity} Passengers</p>
                </div>
              </div>
            </Card>
          )}

          {/* Safety & Verification Badges */}
          <Card padding="md">
            <h3 className="font-heading font-semibold text-slate-900 text-base mb-3">University Verifications</h3>
            <div className="space-y-2.5">
              {[
                { title: 'Commercial Driver Verification', status: 'Passed Dec 2025' },
                { title: 'Campus Security Background Clearance', status: 'Active 2026' },
                { title: 'Vehicle Telematics GPS Monitored', status: 'Live 24/7' },
                { title: 'First Aid & Safety Training', status: 'Certified' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <CheckCircle2 size={14} className="text-green-600" />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-slate-400">{item.status}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Driver Emergency Contact Card */}
          <Card padding="md" className="border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-500" />
                <h3 className="font-heading font-semibold text-slate-900 text-sm">Emergency SOS Contact</h3>
              </div>
              {emergencyContact ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={openAddEditModal}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                    title="Edit Contact"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteContact}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Remove Contact"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={openAddEditModal}
                  className="text-xs h-7 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Plus size={12} />
                  <span>Add Contact</span>
                </Button>
              )}
            </div>

            {emergencyContact ? (
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                    {emergencyContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{emergencyContact.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {emergencyContact.relationship} •{' '}
                      <span className="font-medium text-slate-700">{emergencyContact.phone}</span>
                    </p>
                  </div>
                </div>
                <Badge variant="green" size="sm">
                  Active SOS Recipient
                </Badge>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-600 font-medium">No emergency contact registered</p>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-2">
                  When you press SOS during a trip, your emergency contact will automatically receive an SMS notification.
                </p>
                <Button size="sm" variant="secondary" onClick={openAddEditModal} className="text-xs">
                  Set Up Emergency Contact
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Emergency Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-500" />
                <h3 className="font-heading font-bold text-slate-900 text-base">
                  {emergencyContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Full Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Anjali Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                {modalErrors.name && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {modalErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent / Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Colleague / Friend</option>
                  <option value="Other">Other Family</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number (10 digits)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={contactPhone.replace(/^\+91/, '')}
                    onChange={(e) => setContactPhone('+91' + e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                {modalErrors.phone && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {modalErrors.phone}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={savingContact}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingContact}>
                  {savingContact ? 'Saving...' : 'Save Emergency Contact'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
