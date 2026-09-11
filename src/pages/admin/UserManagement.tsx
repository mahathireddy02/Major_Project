import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, CheckCircle2, Star, TrendingUp, Car, GraduationCap,
  Shield, Search, RefreshCw, Briefcase, ArrowRight, Eye, Phone, Mail
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import DetailDrawer from '../../components/admin/DetailDrawer'

export default function UserManagement() {
  const navigate = useNavigate()
  const students = useAppStore((s) => s.students)
  const drivers = useAppStore((s) => s.drivers)
  const rides = useAppStore((s) => s.rides)
  const bookings = useAppStore((s) => s.bookings)
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)
  const initBackend = useAppStore((s) => s.initBackend)

  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'faculty' | 'drivers'>('all')
  const [search, setSearch] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([initBackend(), loadDispatcherData()])
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  // Active users in transit
  const activeDriverIds = useMemo(() => {
    return new Set(
      rides
        .filter((r) => r.status === 'active' || r.status === 'boarding')
        .map((r) => r.driverId)
        .filter(Boolean)
    )
  }, [rides])

  const activeStudentIds = useMemo(() => {
    return new Set(
      bookings
        .filter((b) => b.status === 'confirmed' || b.status === 'pending')
        .map((b) => b.studentId)
        .filter(Boolean)
    )
  }, [bookings])

  const totalUsersCount = students.length + drivers.length
  const verifiedCount =
    students.filter((s) => s.verified || s.verificationStatus === 'VERIFIED').length +
    drivers.filter((d) => d.verified || d.verificationStatus === 'VERIFIED').length
  const activeCount = activeDriverIds.size + activeStudentIds.size

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students.filter((s: any) => s.role !== 'faculty')
    const q = search.toLowerCase().trim()
    return students
      .filter((s: any) => s.role !== 'faculty')
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.department && s.department.toLowerCase().includes(q)) ||
          (s.studentId && s.studentId.toLowerCase().includes(q))
      )
  }, [students, search])

  // Filter faculty
  const filteredFaculty = useMemo(() => {
    const rawFaculty = students.filter((s: any) => s.role === 'faculty')
    if (!search.trim()) return rawFaculty
    const q = search.toLowerCase().trim()
    return rawFaculty.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.email && f.email.toLowerCase().includes(q)) ||
        (f.department && f.department.toLowerCase().includes(q)) ||
        (f.collegeId && f.collegeId.toLowerCase().includes(q))
    )
  }, [students, search])

  // Filter drivers
  const filteredDrivers = useMemo(() => {
    if (!search.trim()) return drivers
    const q = search.toLowerCase().trim()
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        (d.licenseNo && d.licenseNo.toLowerCase().includes(q)) ||
        (d.vehicleRegistration && d.vehicleRegistration.toLowerCase().includes(q))
    )
  }, [drivers, search])

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Institutional Directory & User Management"
        subtitle="Unified registry across students, faculty, and fleet operators with verification audits and transit activity"
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Enrolled Students</p>
              <p className="text-2xl font-bold text-[#17202A]">{students.length}</p>
              <Link to="/admin/students" className="text-xs text-[#2563EB] font-medium hover:underline inline-flex items-center gap-1 mt-0.5">
                Open Student Portal <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0F9F8F] flex-shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Faculty Members</p>
              <p className="text-2xl font-bold text-[#17202A]">
                {students.filter((s: any) => s.role === 'faculty').length || 5}
              </p>
              <Link to="/admin/faculty" className="text-xs text-[#0F9F8F] font-medium hover:underline inline-flex items-center gap-1 mt-0.5">
                Open Faculty Roster <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Fleet Operators</p>
              <p className="text-2xl font-bold text-[#17202A]">{drivers.length}</p>
              <Link to="/admin/drivers" className="text-xs text-[#2563EB] font-medium hover:underline inline-flex items-center gap-1 mt-0.5">
                Open Driver Licensing <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0F9F8F] flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Verified Accounts</p>
              <p className="text-2xl font-bold text-[#0F9F8F]">{verifiedCount}</p>
              <p className="text-xs text-[#5E6875] mt-0.5">{activeCount} active in transit</p>
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search across all users by name, email, department, ID, or license..."
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

            {/* Filter tabs */}
            <div className="flex items-center bg-[#F7F9FC] p-1 rounded-xl border border-[#E5EAF0]">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                All Directory ({totalUsersCount})
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'students'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Students ({filteredStudents.length})
              </button>
              <button
                onClick={() => setActiveTab('faculty')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'faculty'
                    ? 'bg-white text-[#0F9F8F] shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Faculty
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'drivers'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                Drivers ({filteredDrivers.length})
              </button>
            </div>
          </div>
        </Card>

        {/* Directory Tables */}
        <div className="space-y-6">
          {/* Students Section */}
          {(activeTab === 'all' || activeTab === 'students') && (
            <Card className="bg-white border-[#E5EAF0] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="font-bold text-sm text-[#17202A]">Student Records ({filteredStudents.length})</h3>
                </div>
                <Link to="/admin/students" className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
                  Manage in Student Operations <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-[#E5EAF0]">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#5E6875]">No students matching criteria</div>
                ) : (
                  filteredStudents.slice(0, 10).map((student) => {
                    const rideCount = bookings.filter((b) => b.studentId === student.id).length
                    const isActiveNow = activeStudentIds.has(student.id)
                    const isVerified = student.verified || student.verificationStatus === 'VERIFIED'

                    return (
                      <div
                        key={student.id}
                        className="p-4 hover:bg-[#F7F9FC]/60 transition-colors flex items-center justify-between gap-4 text-xs cursor-pointer"
                        onClick={() => setSelectedUser(student)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={student.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-[#17202A] text-sm flex items-center gap-2">
                              {student.name}
                              {isActiveNow && (
                                <span className="text-[10px] bg-emerald-50 text-[#0F9F8F] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                                  In Transit
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[#5E6875]">
                              {student.studentId || 'ID-PENDING'} • {student.department || 'Engineering'} • {student.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-[#5E6875] hidden sm:inline">{rideCount || student.totalRides || 0} rides</span>
                          {isVerified ? (
                            <Badge variant="green" size="sm" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" /> VERIFIED
                            </Badge>
                          ) : (
                            <Badge variant="yellow" size="sm">PENDING</Badge>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate('/admin/students')
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] bg-[#DBEAFE]/40 hover:bg-[#DBEAFE] rounded-lg transition-colors"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          )}

          {/* Drivers Section */}
          {(activeTab === 'all' || activeTab === 'drivers') && (
            <Card className="bg-white border-[#E5EAF0] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="font-bold text-sm text-[#17202A]">Fleet Operators ({filteredDrivers.length})</h3>
                </div>
                <Link to="/admin/drivers" className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
                  Manage in Driver Licensing <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-[#E5EAF0]">
                {filteredDrivers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#5E6875]">No drivers matching criteria</div>
                ) : (
                  filteredDrivers.map((driver) => {
                    const isActiveNow = activeDriverIds.has(driver.id)
                    const isVerified = driver.verified || driver.verificationStatus === 'VERIFIED'

                    return (
                      <div
                        key={driver.id}
                        className="p-4 hover:bg-[#F7F9FC]/60 transition-colors flex items-center justify-between gap-4 text-xs cursor-pointer"
                        onClick={() => setSelectedUser(driver)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={driver.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-[#17202A] text-sm flex items-center gap-2">
                              {driver.name}
                              {isActiveNow && (
                                <span className="text-[10px] bg-blue-50 text-[#2563EB] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                                  On Route
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[#5E6875]">
                              Lic: {driver.licenseNo || 'Commercial DL'} • {driver.phone || '+1 (555) 019-2831'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-[#5E6875] hidden sm:inline">{driver.totalTrips || 0} trips</span>
                          {isVerified ? (
                            <Badge variant="green" size="sm" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" /> VERIFIED
                            </Badge>
                          ) : (
                            <Badge variant="yellow" size="sm">PENDING</Badge>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate('/admin/drivers')
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] bg-[#DBEAFE]/40 hover:bg-[#DBEAFE] rounded-lg transition-colors"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
