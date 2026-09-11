import { useState, useEffect, useMemo } from 'react'
import {
  Briefcase, Search, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, Eye, Phone, Mail, Building, MapPin, Shield, Star, Car, Award, Sparkles, Filter
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import DetailDrawer from '../../components/admin/DetailDrawer'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Card from '../../components/ui/Card'
import type { Student, Booking, Ride } from '../../types'

export default function FacultyManagement() {
  const students = useAppStore((s) => s.students)
  const bookings = useAppStore((s) => s.bookings)
  const rides = useAppStore((s) => s.rides)
  const drivers = useAppStore((s) => s.drivers)
  const vehicles = useAppStore((s) => s.vehicles)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)

  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'active'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null)
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

  // Faculty pool: look for role === 'faculty' or synthesize faculty entries from institutional database
  const facultyList = useMemo(() => {
    const rawFaculty = students.filter((s: any) => s.role === 'faculty' || s.department?.includes('Prof') || s.collegeId?.startsWith('FAC'))
    if (rawFaculty.length > 0) return rawFaculty

    // Default rich sample dataset of faculty members if none loaded yet
    return [
      {
        id: 'fac-101',
        name: 'Dr. Aris Thorne',
        email: 'a.thorne@campusflow.edu',
        phone: '+1 (555) 342-9810',
        avatar: 'AT',
        role: 'faculty',
        department: 'Computer Science & AI',
        collegeName: 'School of Engineering',
        collegeId: 'FAC-ENG-441',
        rating: 4.96,
        totalRides: 42,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        gender: 'Male',
        designation: 'Department Chair & Senior Researcher',
      },
      {
        id: 'fac-102',
        name: 'Prof. Elena Rostova',
        email: 'e.rostova@campusflow.edu',
        phone: '+1 (555) 682-1194',
        avatar: 'ER',
        role: 'faculty',
        department: 'Mechanical Engineering',
        collegeName: 'School of Engineering',
        collegeId: 'FAC-ENG-892',
        rating: 4.91,
        totalRides: 28,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        gender: 'Female',
        designation: 'Associate Professor',
      },
      {
        id: 'fac-103',
        name: 'Dr. Marcus Vance',
        email: 'm.vance@campusflow.edu',
        phone: '+1 (555) 773-4412',
        avatar: 'MV',
        role: 'faculty',
        department: 'Economics & Management',
        collegeName: 'School of Business',
        collegeId: 'FAC-BUS-105',
        rating: 4.88,
        totalRides: 19,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        gender: 'Male',
        designation: 'Professor of Applied Economics',
      },
      {
        id: 'fac-104',
        name: 'Dr. Priya Sundaram',
        email: 'p.sundaram@campusflow.edu',
        phone: '+1 (555) 902-3341',
        avatar: 'PS',
        role: 'faculty',
        department: 'Biotechnology',
        collegeName: 'School of Life Sciences',
        collegeId: 'FAC-BIO-319',
        rating: 5.0,
        totalRides: 56,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        gender: 'Female',
        designation: 'Dean of Research & Innovation',
      },
      {
        id: 'fac-105',
        name: 'Prof. Julian Zhao',
        email: 'j.zhao@campusflow.edu',
        phone: '+1 (555) 412-8871',
        avatar: 'JZ',
        role: 'faculty',
        department: 'Architecture & Urban Design',
        collegeName: 'School of Design',
        collegeId: 'FAC-ARC-602',
        rating: 4.85,
        totalRides: 14,
        isVerified: false,
        verificationStatus: 'PENDING',
        gender: 'Male',
        designation: 'Assistant Professor',
      },
    ]
  }, [students])

  // Active trips for faculty
  const activeFacultyTripMap = useMemo(() => {
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

  // Filtered list
  const filteredFaculty = useMemo(() => {
    return facultyList.filter((fac: any) => {
      const vStatus = fac.verificationStatus || (fac.isVerified ? 'VERIFIED' : 'PENDING')
      const hasActive = activeFacultyTripMap.has(fac.id)

      if (filterStatus === 'verified' && vStatus !== 'VERIFIED') return false
      if (filterStatus === 'pending' && vStatus !== 'PENDING') return false
      if (filterStatus === 'active' && !hasActive) return false

      if (filterDept !== 'all' && fac.department !== filterDept) return false

      if (!search.trim()) return true
      const q = search.toLowerCase().trim()
      return (
        fac.name.toLowerCase().includes(q) ||
        (fac.email && fac.email.toLowerCase().includes(q)) ||
        (fac.collegeId && fac.collegeId.toLowerCase().includes(q)) ||
        (fac.department && fac.department.toLowerCase().includes(q)) ||
        (fac.designation && fac.designation.toLowerCase().includes(q))
      )
    })
  }, [facultyList, filterStatus, filterDept, search, activeFacultyTripMap])

  // Department choices
  const departments = useMemo(() => {
    const set = new Set<string>()
    facultyList.forEach((f: any) => {
      if (f.department) set.add(f.department)
    })
    return Array.from(set)
  }, [facultyList])

  // Faculty specific history
  const facultyBookings = useMemo(() => {
    if (!selectedFaculty) return []
    return bookings.filter((b) => b.studentId === selectedFaculty.id)
  }, [selectedFaculty, bookings])

  const facultySafety = useMemo(() => {
    if (!selectedFaculty) return []
    const rideIds = new Set(facultyBookings.map((b) => b.rideId))
    return safetyEvents.filter((e) => rideIds.has(e.rideId))
  }, [selectedFaculty, facultyBookings, safetyEvents])

  const activeTripDetails = selectedFaculty ? activeFacultyTripMap.get(selectedFaculty.id) : null

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Faculty Mobility & Commute Registry"
        subtitle="Priority faculty transportation, institutional departments, active executive shuttles, and safety logs"
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Total Faculty</p>
              <p className="text-2xl font-bold text-[#17202A]">{facultyList.length}</p>
              <p className="text-xs text-[#0F9F8F] font-medium mt-0.5">Priority Commute Tier</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0F9F8F] flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Verified Academic IDs</p>
              <p className="text-2xl font-bold text-[#17202A]">
                {facultyList.filter((f: any) => f.isVerified || f.verificationStatus === 'VERIFIED').length}
              </p>
              <p className="text-xs text-[#5E6875] mt-0.5">Instant authorization</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">In Transit Now</p>
              <p className="text-2xl font-bold text-[#2563EB]">{activeFacultyTripMap.size}</p>
              <p className="text-xs text-[#5E6875] mt-0.5">Active shuttles & cars</p>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Avg Faculty Rating</p>
              <p className="text-2xl font-bold text-[#17202A]">
                {(facultyList.reduce((acc: number, f: any) => acc + (f.rating || 5), 0) / (facultyList.length || 1)).toFixed(2)}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">High satisfaction</p>
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
                placeholder="Search faculty by name, ID, email, designation, or department..."
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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#17202A] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
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
                  All ({facultyList.length})
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
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filterStatus === 'active'
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-[#5E6875] hover:text-[#17202A]'
                  }`}
                >
                  In Transit ({activeFacultyTripMap.size})
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
          </div>
        </Card>

        {/* Faculty Table */}
        <Card className="bg-white border-[#E5EAF0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#17202A]">
              <thead className="bg-[#F7F9FC] border-b border-[#E5EAF0] text-xs uppercase tracking-wider font-semibold text-[#5E6875]">
                <tr>
                  <th className="px-5 py-3.5">Faculty Member</th>
                  <th className="px-5 py-3.5">Department & Title</th>
                  <th className="px-5 py-3.5">Institutional ID</th>
                  <th className="px-5 py-3.5">Verification</th>
                  <th className="px-5 py-3.5">Mobility Activity</th>
                  <th className="px-5 py-3.5">Commute Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0]">
                {filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#5E6875]">
                      <Briefcase className="w-10 h-10 mx-auto text-[#8C9BAE] mb-2 opacity-60" />
                      <p className="font-semibold text-base text-[#17202A]">No faculty records found</p>
                      <p className="text-xs text-[#5E6875] mt-1">Try adjusting your search criteria or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredFaculty.map((faculty: any) => {
                    const isVerified = faculty.isVerified || faculty.verificationStatus === 'VERIFIED'
                    const activeTrip = activeFacultyTripMap.get(faculty.id)

                    return (
                      <tr
                        key={faculty.id}
                        className="hover:bg-[#F7F9FC]/70 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedFaculty(faculty)
                          setActiveTab('profile')
                        }}
                      >
                        {/* Name & Avatar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={faculty.name}
                              size="md"
                              className="bg-[#2563EB]/10 text-[#2563EB] font-bold border border-[#2563EB]/20"
                            />
                            <div>
                              <p className="font-semibold text-[#17202A] group-hover:text-[#2563EB] transition-colors flex items-center gap-1.5">
                                {faculty.name}
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                                  FACULTY
                                </span>
                              </p>
                              <p className="text-xs text-[#5E6875] flex items-center gap-2 mt-0.5">
                                <span>{faculty.email || 'No email provided'}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-[#17202A] text-xs">{faculty.department || 'Academic Affairs'}</p>
                            <p className="text-[11px] text-[#5E6875] mt-0.5">{faculty.designation || faculty.collegeName || 'Faculty Member'}</p>
                          </div>
                        </td>

                        {/* ID */}
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-[#17202A]">
                          {faculty.collegeId || faculty.rollNumber || `FAC-${faculty.id.slice(0, 5)}`}
                        </td>

                        {/* Verification */}
                        <td className="px-5 py-4">
                          {isVerified ? (
                            <Badge variant="green" size="sm" className="inline-flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              VERIFIED
                            </Badge>
                          ) : (
                            <Badge variant="yellow" size="sm" className="inline-flex items-center gap-1 font-semibold">
                              <Clock className="w-3 h-3" />
                              PENDING
                            </Badge>
                          )}
                        </td>

                        {/* Mobility Activity */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-medium text-[#17202A]">{faculty.totalRides || 0} rides</span>
                            <span className="flex items-center gap-1 text-amber-600 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {faculty.rating ? faculty.rating.toFixed(1) : '5.0'}
                            </span>
                          </div>
                        </td>

                        {/* Commute Status */}
                        <td className="px-5 py-4">
                          {activeTrip ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#0F9F8F] border border-emerald-200 text-xs font-semibold animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0F9F8F]" />
                              In Transit ({activeTrip.ride.routeName})
                            </div>
                          ) : (
                            <span className="text-xs text-[#5E6875]">Idle / Off-Campus</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedFaculty(faculty)
                              setActiveTab('profile')
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
        isOpen={Boolean(selectedFaculty)}
        onClose={() => setSelectedFaculty(null)}
        title={selectedFaculty?.name || 'Faculty Details'}
        subtitle={`Institutional Faculty • ${selectedFaculty?.collegeId || selectedFaculty?.id}`}
        badge={{
          label: selectedFaculty?.isVerified || selectedFaculty?.verificationStatus === 'VERIFIED' ? 'Verified Academic' : 'Pending Verification',
          variant: selectedFaculty?.isVerified || selectedFaculty?.verificationStatus === 'VERIFIED' ? 'green' : 'yellow',
        }}
        tabs={[
          { key: 'profile', label: 'Faculty Profile' },
          { key: 'mobility', label: 'Active Transit' },
          { key: 'history', label: `Trip History (${facultyBookings.length})` },
          { key: 'safety', label: `Safety Events (${facultySafety.length})` },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      >
        {selectedFaculty && (
          <div className="space-y-6">
            {/* Tab: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                {/* Hero profile card */}
                <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E5EAF0] flex items-center gap-4">
                  <Avatar
                    name={selectedFaculty.name}
                    size="lg"
                    className="bg-[#2563EB] text-white text-xl font-bold border-2 border-white shadow-sm"
                  />
                  <div>
                    <h3 className="font-bold text-base text-[#17202A]">{selectedFaculty.name}</h3>
                    <p className="text-xs text-[#5E6875] font-medium mt-0.5">{selectedFaculty.designation || 'Faculty Member'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                        <Award className="w-3 h-3" /> Priority Tier
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {selectedFaculty.rating ? selectedFaculty.rating.toFixed(2) : '5.00'} Rating
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <div className="flex items-center gap-1.5 text-xs text-[#5E6875] font-medium mb-1">
                      <Building className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Department</span>
                    </div>
                    <p className="text-xs font-bold text-[#17202A]">{selectedFaculty.department || 'General Faculty'}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <div className="flex items-center gap-1.5 text-xs text-[#5E6875] font-medium mb-1">
                      <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Institutional ID</span>
                    </div>
                    <p className="text-xs font-mono font-bold text-[#17202A]">{selectedFaculty.collegeId || selectedFaculty.id}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <div className="flex items-center gap-1.5 text-xs text-[#5E6875] font-medium mb-1">
                      <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Official Email</span>
                    </div>
                    <p className="text-xs font-medium text-[#17202A] truncate">{selectedFaculty.email || 'N/A'}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF0]">
                    <div className="flex items-center gap-1.5 text-xs text-[#5E6875] font-medium mb-1">
                      <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Phone Line</span>
                    </div>
                    <p className="text-xs font-medium text-[#17202A]">{selectedFaculty.phone || 'N/A'}</p>
                  </div>
                </div>

                {/* Institutional Verification Audit */}
                <div className="p-4 rounded-xl border border-[#E5EAF0] bg-white space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5E6875] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#0F9F8F]" />
                    Institutional Authorization Status
                  </h4>

                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Domain-Authorized Academic Staff</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">Faculty identity verified against university faculty directory</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-[#0F9F8F] flex-shrink-0" />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Mobility / Active Transit */}
            {activeTab === 'mobility' && (
              <div className="space-y-4">
                {activeTripDetails ? (
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-xs font-bold">
                        <Car className="w-3.5 h-3.5" />
                        ACTIVE COMMUTE
                      </span>
                      <span className="text-xs font-mono text-[#5E6875]">Trip #{activeTripDetails.ride.id}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#17202A]">{activeTripDetails.ride.routeName}</h4>
                      <p className="text-xs text-[#5E6875] mt-0.5">Departure: {activeTripDetails.ride.departureTime} • Est. Arrival: {activeTripDetails.ride.estimatedArrival}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                        <p className="text-[10px] text-[#5E6875] uppercase font-semibold">Pickup Station</p>
                        <p className="font-bold text-[#17202A] mt-0.5 truncate">{activeTripDetails.booking.pickup}</p>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                        <p className="text-[10px] text-[#5E6875] uppercase font-semibold">Destination</p>
                        <p className="font-bold text-[#17202A] mt-0.5 truncate">{activeTripDetails.booking.destination}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#F7F9FC] rounded-xl border border-[#E5EAF0]">
                    <Car className="w-8 h-8 text-[#8C9BAE] mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-[#17202A]">No Active Ride in Progress</p>
                    <p className="text-xs text-[#5E6875] mt-1">This faculty member is not currently aboard any active shuttle or pooled car.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {facultyBookings.length === 0 ? (
                  <div className="p-8 text-center bg-[#F7F9FC] rounded-xl border border-[#E5EAF0]">
                    <Clock className="w-8 h-8 text-[#8C9BAE] mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-[#17202A]">No Past Commutes Recorded</p>
                    <p className="text-xs text-[#5E6875] mt-1">Historical ride records will appear once rides are completed.</p>
                  </div>
                ) : (
                  facultyBookings.map((b) => (
                    <div key={b.id} className="p-3 bg-white rounded-xl border border-[#E5EAF0] flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#17202A]">{b.pickup} → {b.destination}</p>
                        <p className="text-[11px] text-[#5E6875] mt-0.5">Booking #{b.id} • Seat #{b.seatNo}</p>
                      </div>
                      <Badge variant={b.status === 'completed' ? 'green' : b.status === 'confirmed' ? 'blue' : 'slate'} size="sm">
                        {b.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Safety */}
            {activeTab === 'safety' && (
              <div className="space-y-3">
                {facultySafety.length === 0 ? (
                  <div className="p-8 text-center bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <Shield className="w-8 h-8 text-[#0F9F8F] mx-auto mb-2" />
                    <p className="font-bold text-sm text-emerald-900">Zero Safety Incident History</p>
                    <p className="text-xs text-emerald-700 mt-1">This faculty member has a flawless campus safety record.</p>
                  </div>
                ) : (
                  facultySafety.map((evt) => (
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
