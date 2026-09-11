import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, User, Mail, Building, Clock, MapPin, Zap, Car, Users,
  CheckCircle2, LogOut, RefreshCw, AlertTriangle, ExternalLink, Activity, Briefcase, FileText
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'

export default function DispatcherProfile() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const logout = useAppStore((s) => s.logout)
  const rides = useAppStore((s) => s.rides)
  const vehicles = useAppStore((s) => s.vehicles)
  const students = useAppStore((s) => s.students)
  const drivers = useAppStore((s) => s.drivers)
  const safetyEvents = useAppStore((s) => s.safetyEvents)
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const activeRides = rides.filter((r) => r.status !== 'completed' && r.status !== 'cancelled')
  const runningVehicles = activeRides.filter((r) => r.status === 'active' || r.status === 'boarding').length
  const activeAlerts = safetyEvents.filter((e) => !e.resolved).length

  const displayName = currentUser?.name || 'Chief Dispatch Officer'
  const displayEmail = currentUser?.email || 'operations@campusflow.edu'
  const displayRole = (currentUser?.role || 'DISPATCHER').toUpperCase()
  const verificationStatus = currentUser?.verificationStatus === 'REJECTED' ? 'REJECTED' : 'VERIFIED'

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Operations Command Profile & Authorization"
        subtitle="Operational command identity, dispatcher security clearance, jurisdiction, and supervisory overview"
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* Main Profile Card */}
        <Card className="bg-white border-[#E5EAF0] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E5EAF0]">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar name={displayName} size="xl" className="bg-[#2563EB] text-white text-xl font-bold ring-4 ring-blue-50" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0F9F8F] rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-xl text-[#17202A]">{displayName}</h2>
                  <Badge variant="blue" size="sm">{displayRole}</Badge>
                  <Badge variant="green" size="sm" className="gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> {verificationStatus}
                  </Badge>
                </div>
                <p className="text-xs text-[#5E6875] mt-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                  {displayEmail}
                </p>
                <p className="text-xs text-[#5E6875] mt-0.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#2563EB]" />
                  SRI INDU College of Engineering & Technology • Central Transportation Dispatch
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate('/admin/dashboard')}
                className="w-full md:w-auto flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4" /> Command Center
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  logout()
                  navigate('/auth/portal')
                }}
                className="text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Live Supervision Stats */}
          <div className="pt-6">
            <h3 className="text-xs font-bold text-[#5E6875] uppercase tracking-wider mb-4">
              Current Fleet Operations Under Supervision
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-[#F7F9FC] rounded-xl p-3 border border-[#E5EAF0]">
                <span className="text-xs text-[#5E6875] flex items-center gap-1"><Car className="w-3.5 h-3.5 text-[#2563EB]" /> Running Vans</span>
                <p className="text-xl font-bold text-[#17202A] mt-1">{runningVehicles}</p>
              </div>
              <div className="bg-[#F7F9FC] rounded-xl p-3 border border-[#E5EAF0]">
                <span className="text-xs text-[#5E6875] flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-[#0F9F8F]" /> Active Routes</span>
                <p className="text-xl font-bold text-[#17202A] mt-1">{activeRides.length}</p>
              </div>
              <div className="bg-[#F7F9FC] rounded-xl p-3 border border-[#E5EAF0]">
                <span className="text-xs text-[#5E6875] flex items-center gap-1"><Users className="w-3.5 h-3.5 text-[#2563EB]" /> Students</span>
                <p className="text-xl font-bold text-[#17202A] mt-1">{students.length}</p>
              </div>
              <div className="bg-[#F7F9FC] rounded-xl p-3 border border-[#E5EAF0]">
                <span className="text-xs text-[#5E6875] flex items-center gap-1"><Car className="w-3.5 h-3.5 text-[#2563EB]" /> Drivers</span>
                <p className="text-xl font-bold text-[#17202A] mt-1">{drivers.length}</p>
              </div>
              <div className="bg-[#F7F9FC] rounded-xl p-3 border border-[#E5EAF0]">
                <span className="text-xs text-[#5E6875] flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Safety Alerts</span>
                <p className={`text-xl font-bold mt-1 ${activeAlerts > 0 ? 'text-red-600' : 'text-[#17202A]'}`}>{activeAlerts}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Operational Credentials & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border-[#E5EAF0] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5EAF0]">
              <Shield className="w-5 h-5 text-[#2563EB]" />
              <h3 className="font-bold text-sm text-[#17202A]">Security Clearance & Access Tier</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#E5EAF0]">
                <span className="text-[#5E6875]">Security Clearance</span>
                <span className="font-semibold text-[#17202A]">Administrative Tier-1 (Full Operational Control)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E5EAF0]">
                <span className="text-[#5E6875]">Jurisdiction</span>
                <span className="font-semibold text-[#17202A]">Campus Transportation & Safety Telematics</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E5EAF0]">
                <span className="text-[#5E6875]">Real-time Telematics Stream</span>
                <span className="font-semibold text-[#0F9F8F] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F9F8F] animate-pulse" /> Connected (Fastify WebSocket)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E5EAF0]">
                <span className="text-[#5E6875]">Database Source of Truth</span>
                <span className="font-semibold text-[#17202A]">MongoDB Atlas (Live Multi-Tenant Cluster)</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#5E6875]">Session Status</span>
                <span className="font-semibold text-[#0F9F8F]">Authenticated & Encrypted</span>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-[#E5EAF0] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5EAF0]">
              <Clock className="w-5 h-5 text-[#2563EB]" />
              <h3 className="font-bold text-sm text-[#17202A]">Operations Center Navigation</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Command Center', desc: 'KPIs & live fleet', to: '/admin/dashboard' },
                { label: 'Live Mobility Map', desc: 'Realtime GPS tracking', to: '/admin/map' },
                { label: 'Ride Requests', desc: 'Corridor submissions', to: '/admin/requests' },
                { label: 'Student Directory', desc: 'Verification & rosters', to: '/admin/students' },
                { label: 'Faculty Commute', desc: 'Priority departments', to: '/admin/faculty' },
                { label: 'Fleet Drivers', desc: 'Commercial licenses', to: '/admin/drivers' },
                { label: 'Vehicle Telematics', desc: 'Specs & battery', to: '/admin/vehicles' },
                { label: 'Safety Operations', desc: 'SOS beacons & alerts', to: '/admin/safety' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.to)}
                  className="p-3 rounded-xl border border-[#E5EAF0] hover:border-[#2563EB]/40 bg-[#F7F9FC] hover:bg-[#DBEAFE]/30 text-left transition-all cursor-pointer group"
                >
                  <p className="font-bold text-[#17202A] group-hover:text-[#2563EB]">{item.label}</p>
                  <p className="text-[10px] text-[#5E6875] mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
