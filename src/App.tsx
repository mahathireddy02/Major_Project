import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Zap, User, Car, Shield, Navigation, LogOut, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { useAppStore } from './store/appStore'

// Layouts & Auth Guard
import { StudentLayout, DriverLayout, AdminLayout } from './components/layout/Layouts'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Auth Pages
import PortalSelect from './pages/auth/PortalSelect'
import StudentFacultyAuth from './pages/auth/StudentFacultyAuth'
import DriverAuth from './pages/auth/DriverAuth'
import DispatcherAuth from './pages/auth/DispatcherAuth'

// Student Pages
import Landing from './pages/student/Landing'
import Login from './pages/student/Login'
import Home from './pages/student/Home'
import BookRide from './pages/student/BookRide'
import MatchingResults from './pages/student/MatchingResults'
import RideDetail from './pages/student/RideDetail'
import BookingConfirmation from './pages/student/BookingConfirmation'
import ActiveRide from './pages/student/ActiveRide'
import LiveTracking from './pages/student/LiveTracking'
import RideHistory from './pages/student/RideHistory'
import StudentProfile from './pages/student/Profile'
import Notifications from './pages/student/Notifications'
import Safety from './pages/student/Safety'

// Driver Pages
import DriverDashboard from './pages/driver/Dashboard'
import CurrentTrip from './pages/driver/CurrentTrip'
import IncomingRequest from './pages/driver/IncomingRequest'
import PassengerList from './pages/driver/PassengerList'
import DriverProfile from './pages/driver/Profile'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import LiveMap from './pages/admin/LiveMap'
import AdminActiveRides from './pages/admin/ActiveRides'
import RideMatching from './pages/admin/RideMatching'
import VehicleManagement from './pages/admin/VehicleManagement'
import UserManagement from './pages/admin/UserManagement'
import SafetyCenter from './pages/admin/SafetyCenter'
import Analytics from './pages/admin/Analytics'
import DemoControls from './pages/admin/DemoControls'
import DispatcherProfile from './pages/admin/Profile'
import RideRequests from './pages/admin/RideRequests'
import StudentsManagement from './pages/admin/StudentsManagement'
import FacultyManagement from './pages/admin/FacultyManagement'
import DriversManagement from './pages/admin/DriversManagement'
import ChatBot from './components/chat/ChatBot'

function RoleSwitcher() {
  const navigate = useNavigate()
  const location = useLocation()
  const role = useAppStore((s) => s.role)
  const setRole = useAppStore((s) => s.setRole)
  const logout = useAppStore((s) => s.logout)
  const token = useAppStore((s) => s.token)
  const currentStudent = useAppStore((s) => s.currentStudent())
  const currentDriver = useAppStore((s) => s.currentDriver())
  const adminUser = useAppStore((s) => s.adminUser)

  const isAuthPage = location.pathname.startsWith('/auth') || location.pathname === '/' || location.pathname === '/student/landing'
  const isStudent = location.pathname.startsWith('/student')
  const isDriver = location.pathname.startsWith('/driver')
  const isAdmin = location.pathname.startsWith('/admin')

  const activeUser = role === 'admin' ? adminUser : role === 'driver' ? currentDriver : currentStudent
  const verificationStatus: string = (activeUser as any)?.verificationStatus === 'REJECTED' ? 'REJECTED' : 'VERIFIED'

  // Hide floating role switcher on portals with dedicated top navigation
  if (isAuthPage || isDriver || isStudent || isAdmin) return null

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-200">
      {verificationStatus && (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
            verificationStatus === 'VERIFIED'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : verificationStatus === 'REJECTED'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
          title={`Account Status: ${verificationStatus}`}
        >
          {verificationStatus === 'VERIFIED' && <CheckCircle2 size={10} />}
          {verificationStatus === 'PENDING' && <Clock size={10} />}
          {verificationStatus === 'REJECTED' && <AlertTriangle size={10} />}
          {verificationStatus}
        </span>
      )}

      <button
        onClick={() => {
          logout()
          navigate('/auth/student-faculty')
        }}
        className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
        title="Sign Out"
      >
        <LogOut size={12} />
        Sign Out
      </button>
    </div>
  )
}

export default function App() {
  const initBackend = useAppStore((s) => s.initBackend)

  useEffect(() => {
    initBackend()
  }, [initBackend])

  return (
    <HashRouter>
      <Toaster
        position="top-right"
        containerClassName="pointer-events-none"
        toastOptions={{
          style: {
            pointerEvents: 'auto',
          },
        }}
      />
      <RoleSwitcher />
      <ChatBot />

      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />
        <Route path="/student/landing" element={<Landing />} />

        {/* Phase 1 Auth & Portal Routes */}
        <Route path="/auth/portal" element={<PortalSelect />} />
        <Route path="/auth/student-faculty" element={<StudentFacultyAuth />} />
        <Route path="/auth/driver" element={<DriverAuth />} />
        <Route path="/auth/dispatcher" element={<DispatcherAuth />} />
        <Route path="/student/login" element={<Navigate to="/auth/student-faculty" replace />} />

        {/* Student & Faculty Views with Protected Route */}
        <Route element={<ProtectedRoute allowedRoles={['student', 'faculty', 'admin']} />}>
          <Route element={<StudentLayout />}>
            <Route path="/student/home" element={<Home />} />
            <Route path="/student/book" element={<Navigate to="/student/home" replace />} />
            <Route path="/student/matching" element={<MatchingResults />} />
            <Route path="/student/ride/:id" element={<RideDetail />} />
            <Route path="/student/confirmation/:id" element={<BookingConfirmation />} />
            <Route path="/student/active" element={<ActiveRide />} />
            <Route path="/student/rides" element={<RideHistory />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/notifications" element={<Notifications />} />
            <Route path="/student/safety" element={<Safety />} />
          </Route>
          {/* Fullscreen Live Tracking */}
          <Route path="/student/live" element={<LiveTracking />} />
        </Route>

        {/* Driver Views with Protected Route */}
        <Route element={<ProtectedRoute allowedRoles={['driver', 'admin']} />}>
          <Route element={<DriverLayout />}>
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/driver/trip" element={<CurrentTrip />} />
            <Route path="/driver/request" element={<IncomingRequest />} />
            <Route path="/driver/passengers" element={<PassengerList />} />
            <Route path="/driver/profile" element={<DriverProfile />} />
          </Route>
        </Route>

        {/* Dispatcher / Admin Views with Protected Route */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/map" element={<LiveMap />} />
            <Route path="/admin/requests" element={<RideRequests />} />
            <Route path="/admin/students" element={<StudentsManagement />} />
            <Route path="/admin/faculty" element={<FacultyManagement />} />
            <Route path="/admin/drivers" element={<DriversManagement />} />
            <Route path="/admin/rides" element={<AdminActiveRides />} />
            <Route path="/admin/matching" element={<RideMatching />} />
            <Route path="/admin/vehicles" element={<VehicleManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/safety" element={<SafetyCenter />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/profile" element={<DispatcherProfile />} />
            <Route path="/admin/demo" element={<DemoControls />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}