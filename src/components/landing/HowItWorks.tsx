import React from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  MapPin,
  Zap,
  Navigation,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react'

const STEPS = [
  {
    step: '01',
    title: 'Verify University Identity',
    desc: 'Sign in with your institutional .ac.in / .edu email and upload your student or faculty ID card for instant automated OCR verification.',
    icon: GraduationCap,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 border-cyan-200',
  },
  {
    step: '02',
    title: 'Set Pickup or GPS Pin',
    desc: 'Enter your pickup address, tap on the interactive campus map, or use device GPS. Pickup starts completely empty with zero hardcoded defaults.',
    icon: MapPin,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    step: '03',
    title: 'Instant Corridor Pooling',
    desc: 'Our greedy matching engine pairs your request with high-occupancy shuttle corridors, calculates fair shared pricing, and secures your seat.',
    icon: Zap,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200',
  },
  {
    step: '04',
    title: 'Board & Track Live in Transit',
    desc: 'Track your shuttle in real-time with OSRM route geometry, digital boarding pass confirmation, and single-tap security SOS protection.',
    icon: Navigation,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
  },
]

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-slate-50/70 border-t border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Seamless Commuter Experience</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight">
            How CampusFlow works in 4 simple steps.
          </h2>
          <p className="text-base text-slate-600 font-normal">
            From verified institutional onboarding to real-time pooled drop-off at your academic block.
          </p>
        </div>

        {/* 4 Connected Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.12 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-black text-2xl text-slate-300 group-hover:text-cyan-600 transition-colors">
                      {step.step}
                    </span>
                    <div
                      className={`w-11 h-11 rounded-2xl ${step.bg} border flex items-center justify-center ${step.color} group-hover:scale-105 transition-transform shadow-2xs`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 group-hover:text-slate-700 transition-colors">
                  <span>Step {idx + 1} of 4</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
