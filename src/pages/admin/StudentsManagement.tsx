import { useState, useEffect, useMemo } from 'react'
import {
  GraduationCap, Search, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, X, Eye, Phone, Mail, Building, MapPin, Shield, ShieldCheck, Star, Car, Layers
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import DetailDrawer from '../../components/admin/DetailDrawer'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Card from '../../components/ui/Card'
import type { Student, Booking, Ride } from '../../types'

export default function StudentsManagement() {
  const students = useAppStore((s) => s.students)
  const bookings = useAppStore((s) => s.bookings)
  const rides = useAppStore((s) => s.rides)
  const drivers = useAppStore((s) => s.drivers)
  const vehicles = useAppStore((s) => s.vehicles)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)

  const [search, setSearch] = useState('')
  const [filterVerification, setFilterVerification] = useState<'all' | 'verified' | 'pending' | 'rejected' | 'active'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'mobility' | 'history' | 'safety'>('profile')

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

  // Identify students currently on an active trip
  const activeStudentTripMap = useMemo(() => {
    const map = new Map<string, { booking: Booking; ride: Ride }>()
    bookings.forEach((b) => {
      if (b.status === 'confirmed' || b.status === 'pending') {
        const ride = rides.find((r) => r.id === b.rideId && (r.status === 'active' || r.status === 'boarding' || r.status === 'waiting'))
        if (ride) {
          map.set(b.studentId, { booking: b, ride })
        }
      }
    })
    return map
  }, [bookings, rides])

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const vStatus = student.verificationStatus || (student.verified ? 'VERIFIED' : 'PENDING')
      const hasActive = activeStudentTripMap.has(student.id)

      if (filterVerification === 'verified' && vStatus !== 'VERIFIED') return false
      if (filterVerification === 'pending' && vStatus !== 'PENDING') return false
      if (filterVerification === 'rejected' && vStatus !== 'REJECTED') return false
      if (filterVerification === 'active' && !hasActive) return false

      if (!search.trim()) return true
      const q = search.toLowerCase().trim()
      return (
        student.name.toLowerCase().includes(q) ||
        (student.email && student.email.toLowerCase().includes(q)) ||
        (student.studentId && student.studentId.toLowerCase().includes(q)) ||
        (student.department && student.department.toLowerCase().includes(q)) ||
        (student.collegeName && student.collegeName.toLowerCase().includes(q))
      )
    })
  }, [students, filterVerification, search, activeStudentTripMap])

  // Student specific history & safety
  const studentBookings = useMemo(() => {
    if (!selectedStudent) return []
    return bookings.filter((b) => b.studentId === selectedStudent.id)
  }, [selectedStudent, bookings])

  const studentSafety = useMemo(() => {
    if (!selectedStudent) return []
    const studentRideIds = new Set(studentBookings.map((b) => b.rideId))
    return safetyEvents.filter((e) => studentRideIds.has(e.rideId))
  }, [selectedStudent, studentBookings, safetyEvents])

  const activeTripDetails = selectedStudent ? activeStudentTripMap.get(selectedStudent.id) : null

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Student Operations Directory"
        subtitle="Institutional student registry, verification audits, ride rosters, and safety supervision"
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      />

      <main className="p-6 max-w-7xl mx-auto w-full flex-1 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Enrolled</span>
            <p className="text-2xl font-heading font-bold text-slate-900">{students.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">Verified Accounts</span>
            <p className="text-2xl font-heading font-bold text-emerald-700">
              {students.filter((s) => s.verificationStatus === 'VERIFIED' || s.verified).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider block mb-1">Active in Transit</span>
            <p className="text-2xl font-heading font-bold text-primary-700">
              {activeStudentTripMap.size}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">Pending Review</span>
            <p className="text-2xl font-heading font-bold text-amber-700">
              {students.filter((s) => s.verificationStatus === 'PENDING' && !s.verified).length}
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: `All (${students.length})` },
              { id: 'verified', label: 'Verified' },
              { id: 'pending', label: 'Pending' },
              { id: 'active', label: `Active Trip (${activeStudentTripMap.size})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterVerification(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  filterVerification === tab.id
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll no, email, branch..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-slate-800"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Roll Number / ID</th>
                  <th className="px-5 py-3.5">Department & College</th>
                  <th className="px-5 py-3.5">Verification</th>
                  <th className="px-5 py-3.5">Transit Status</th>
                  <th className="px-5 py-3.5">Rating / Rides</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <GraduationCap size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm">No student records found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or search keywords.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const isVerified = s.verificationStatus === 'VERIFIED' || s.verified
                    const isActiveTrip = activeStudentTripMap.has(s.id)
                    const rideCount = bookings.filter((b) => b.studentId === s.id).length

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={s.name} size="sm" />
                            <div>
                              <p className="font-semibold text-slate-900">{s.name}</p>
                              <p className="text-[11px] text-slate-400">{s.email || 'campus.edu'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-medium text-slate-800">
                          {s.studentId || s.rollNumber || 'N/A'}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">{s.department || 'Engineering'}</p>
                          <p className="text-[11px] text-slate-400">{s.collegeName || 'Campus University'}</p>
                        </td>
                        <td className="px-5 py-4">
                          {isVerified ? (
                            <Badge variant="green" size="sm">
                              <CheckCircle2 size={10} /> Verified
                            </Badge>
                          ) : (
                            <Badge variant="yellow" size="sm">
                              <Clock size={10} /> Pending
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {isActiveTrip ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary-50 text-[#2563EB] border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                              On Route
                            </span>
                          ) : (
                            <span className="text-slate-400">Idle</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 text-slate-700">
                            <Star size={12} className="text-amber-400 fill-amber-400" />
                            <span className="font-semibold">{s.rating || 4.9}</span>
                            <span className="text-slate-300 mx-0.5">·</span>
                            <span className="text-slate-500">{rideCount} rides</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(s)
                              setActiveTab('profile')
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Slide-over Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.name || 'Student Profile'}
        subtitle={`${selectedStudent?.studentId || 'N/A'} · ${selectedStudent?.department || 'Engineering'}`}
        badge={
          selectedStudent?.verificationStatus === 'VERIFIED' || selectedStudent?.verified ? (
            <Badge variant="green" size="sm"><CheckCircle2 size={10} /> Verified</Badge>
          ) : (
            <Badge variant="yellow" size="sm">Pending</Badge>
          )
        }
      >
        {selectedStudent && (
          <div className="space-y-6 text-xs">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 gap-4">
              {[
                { id: 'profile', label: 'Profile' },
                { id: 'mobility', label: 'Active Mobility' },
                { id: 'history', label: `Trip History (${studentBookings.length})` },
                { id: 'safety', label: `Safety (${studentSafety.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-2.5 font-semibold text-xs border-b-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-[#2563EB] text-[#2563EB]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <Avatar name={selectedStudent.name} size="lg" />
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-sm">{selectedStudent.name}</h3>
                    <p className="text-slate-500">{selectedStudent.email}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{selectedStudent.phone || '+91 ••••••••••'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Academic Credentials</span>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Institution</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.collegeName || 'Campus University'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Student Roll No</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedStudent.studentId || selectedStudent.rollNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Department</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.department}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Academic Year</span>
                    <span className="font-semibold text-slate-800">Year {selectedStudent.year || 1}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Mobility */}
            {activeTab === 'mobility' && (
              <div className="space-y-4">
                {activeTripDetails ? (
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#2563EB] uppercase tracking-wider text-[11px]">Active Trip Details</span>
                      <Badge variant="blue" size="sm">{activeTripDetails.ride.status.toUpperCase()}</Badge>
                    </div>
                    <div className="text-slate-800 space-y-1">
                      <p className="font-semibold">{activeTripDetails.ride.routeName}</p>
                      <p className="text-slate-500 text-[11px]">Pickup: {activeTripDetails.booking.pickup} → {activeTripDetails.booking.destination}</p>
                      <p className="text-slate-500 text-[11px]">Departure: {activeTripDetails.ride.departureTime}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                    <Car size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">No Active Ride in Progress</p>
                    <p className="text-[11px] text-slate-400">Student is currently not in transit.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: History */}
            {activeTab === 'history' && (
              <div className="space-y-2.5">
                {studentBookings.length === 0 ? (
                  <p className="text-slate-400 p-4 text-center">No past bookings found</p>
                ) : (
                  studentBookings.map((b) => (
                    <div key={b.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{b.pickup} → {b.destination}</p>
                        <p className="text-[10px] text-slate-400">Fare: ₹{b.fare} · {b.status.toUpperCase()}</p>
                      </div>
                      <Badge variant={b.status === 'completed' ? 'green' : b.status === 'cancelled' ? 'red' : 'blue'} size="sm">
                        {b.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: Safety */}
            {activeTab === 'safety' && (
              <div className="space-y-2.5">
                {studentSafety.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <ShieldCheck size={24} className="text-emerald-500 mx-auto mb-1" />
                    <p className="font-semibold text-emerald-800">Clean Safety Record</p>
                    <p className="text-[11px] text-emerald-600">No SOS or route deviation incidents recorded.</p>
                  </div>
                ) : (
                  studentSafety.map((ev) => (
                    <div key={ev.id} className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                      <p className="font-semibold text-rose-800">{ev.message || 'Safety Alert'}</p>
                      <p className="text-[10px] text-rose-600 mt-0.5">{ev.resolved ? 'Resolved' : 'Active Alert'}</p>
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
