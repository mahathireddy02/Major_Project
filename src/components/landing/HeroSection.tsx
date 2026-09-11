import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Route as RouteIcon,
  Car,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  Compass,
} from 'lucide-react'
import Hero3DScene from './Hero3DScene'

export const HeroSection: React.FC = () => {
  const navigate = useNavigate()

  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* Background Soft Ambient Light Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-12 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-200/40 via-blue-200/30 to-indigo-200/20 rounded-full blur-3xl opacity-70" />
        <div className="absolute top-24 right-1/4 w-[450px] h-[450px] bg-gradient-to-bl from-emerald-200/30 via-teal-200/20 to-cyan-100/30 rounded-full blur-3xl opacity-60" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#0f172a 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 space-y-7 text-left">
            {/* National Innovation Pill */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/90 shadow-2xs backdrop-blur-md"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600"></span>
              </span>
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                AI Mobility Engine
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] font-medium text-slate-500">
                Institutional Pooled Transit
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-2"
            >
              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-[3.5rem] tracking-tight text-slate-900 leading-[1.12]">
                Shared Campus Rides.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">
                  Optimized in Real Time.
                </span>
              </h1>
            </motion.div>

            {/* Sub-headline Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed"
            >
              CampusFlow synchronizes students, faculty, and fleet shuttles through
              topological corridor pooling, sub-minute dynamic stop insertion, and dual-tier
              institutional security verification.
            </motion.p>

            {/* CTAs and Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2"
            >
              <button
                type="button"
                onClick={() => navigate('/auth/portal?mode=signup')}
                className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <span>Launch Commuter Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('showcase')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 shadow-2xs hover:border-slate-300 transition-all duration-200 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-cyan-600" />
                <span>Explore Live Radar</span>
              </button>
            </motion.div>

            {/* Trust Badges Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 font-medium"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Verified .ac.in / .edu ID</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>&lt; 1.2 min Detour Cap</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Live SOS Dispatch</span>
              </div>
            </motion.div>

            {/* Live Active Shuttles Micro-Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/90 shadow-sm backdrop-blur-md flex items-center justify-between gap-4 max-w-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    Sri Indu Express Fleet #101
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Hostel A → Sheriguda Campus · 4/6 Seats Booked
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● EN ROUTE
              </span>
            </motion.div>
          </div>

          {/* Right Column: Interactive 3D Corridor Matrix Scene */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative rounded-3xl bg-gradient-to-b from-white/70 to-slate-50/70 border border-slate-200/90 shadow-xl overflow-hidden backdrop-blur-md"
            >
              {/* Subtle top glare */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
              
              <Hero3DScene />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
