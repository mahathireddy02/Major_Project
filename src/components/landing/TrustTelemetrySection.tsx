import React from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Zap,
  ShieldCheck,
  Leaf,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react'

const STATS = [
  {
    icon: Activity,
    value: '< 85 ms',
    label: 'Dynamic Match Engine',
    desc: 'Topological corridor clustering',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 border-cyan-200/80',
  },
  {
    icon: Clock,
    value: '1.2 min',
    label: 'Max Detour Cap',
    desc: 'Zero-disruption stop insertion',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200/80',
  },
  {
    icon: ShieldCheck,
    value: '100%',
    label: 'Institutional Verification',
    desc: 'University domain & OCR ID cards',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200/80',
  },
  {
    icon: Leaf,
    value: '38.2%',
    label: 'CO₂ Footprint Savings',
    desc: 'High-occupancy pooled corridors',
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-200/80',
  },
]

export const TrustTelemetrySection: React.FC = () => {
  return (
    <section className="py-12 border-y border-slate-200/70 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="text-xs font-mono uppercase font-bold tracking-widest text-slate-400">
            Real-Time Campus Telemetry Metrics
          </p>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mt-1">
            Engineered for high-density academic corridors
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all text-left group cursor-default"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${item.bg} border flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    0{idx + 1}
                  </span>
                </div>
                <div className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
                  {item.value}
                </div>
                <div className="font-semibold text-xs text-slate-800 mt-0.5">
                  {item.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-normal">
                  {item.desc}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default TrustTelemetrySection
