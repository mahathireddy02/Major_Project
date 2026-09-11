import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navigation, Users, Car, Shield, ArrowRight, ArrowLeft } from 'lucide-react'
import Card from '../../components/ui/Card'

export default function PortalSelect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'signup'

  const portals = [
    {
      id: 'student-faculty',
      title: 'Student / Faculty',
      badge: 'COMMUTER PORTAL',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Users,
      iconColor: 'bg-blue-500 text-white',
      description: 'Book shared campus rides, track shuttles in real-time, and commute sustainably with fellow campus members.',
      link: `/auth/student-faculty?mode=${mode}`,
      cta: mode === 'signup' ? 'Register as Student/Faculty' : 'Sign In as Student/Faculty',
    },
    {
      id: 'driver',
      title: 'Driver',
      badge: 'OPERATIONS',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Car,
      iconColor: 'bg-emerald-600 text-white',
      description: 'Access assigned ride pools, navigate optimized pickup routes, and manage digital passenger boarding rosters.',
      link: `/auth/driver?mode=${mode}`,
      cta: mode === 'signup' ? 'Register as Driver' : 'Sign In as Driver',
    },
    {
      id: 'dispatcher',
      title: 'Dispatcher',
      badge: 'COMMAND CENTER',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Shield,
      iconColor: 'bg-slate-900 text-white',
      description: 'Full operational fleet monitoring, real-time demand telemetry, route deviation alarms, and system administration.',
      link: `/auth/dispatcher`,
      cta: 'Dispatcher Sign In',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-primary-500 selection:text-white">
      {/* Top Bar */}
      <header className="px-6 py-4 bg-white border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            title="CampusFlow Home"
            className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm">
              <Navigation size={18} />
            </div>
            <span className="font-heading font-bold text-slate-900 text-base">
              Campus<span className="text-primary-600">Flow</span>
            </span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Home
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-lg mx-auto mb-10">
          <span className="text-xs font-bold text-primary-600 tracking-wider uppercase mb-1 block">
            Select Your Role
          </span>
          <h1 className="font-heading font-extrabold text-3xl text-slate-900 tracking-tight">
            Choose your portal
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Select your campus role to proceed with {mode === 'signup' ? 'registration' : 'sign in'}
          </p>
        </div>

        {/* 3 Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {portals.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.id}
                onClick={() => navigate(p.link)}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-400 transition-all duration-200 cursor-pointer flex flex-col justify-between group text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${p.iconColor} shadow-sm group-hover:scale-105 transition-transform`}>
                      <Icon size={22} />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>

                  <h2 className="font-heading font-bold text-lg text-slate-900 group-hover:text-primary-600 transition-colors">
                    {p.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-primary-600 group-hover:translate-x-1 transition-transform">
                  <span>{p.cta}</span>
                  <ArrowRight size={15} />
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Footer Note */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        University verified authentication platform · Secure RBAC & Document Verification
      </footer>
    </div>
  )
}
