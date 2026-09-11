import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Award, Building2, CheckCircle2, Sparkles } from 'lucide-react'

const INSTITUTIONS = [
  {
    name: 'Sri Indu College of Engg & Tech',
    location: 'Ibrahimpatnam, Hyderabad',
    badge: 'Primary Deployment Hub',
  },
  {
    name: 'Telangana University Network Corridor',
    location: 'Greater Hyderabad Region',
    badge: 'Regional Topology Grid',
  },
  {
    name: 'Hyderabad Transit Integration',
    location: 'Metro & Railway Nodes',
    badge: 'Multimodal Hub Connectors',
  },
]

export const SocialProofSection: React.FC = () => {
  return (
    <section id="impact" className="py-16 lg:py-24 bg-white border-t border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Institutional Impact & Deployment</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Built for real-world campus topologies.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Validated against real Hyderabad commuter travel patterns, road networks, and university schedules.
          </p>
        </div>

        {/* Institution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INSTITUTIONS.map((inst, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="p-6 rounded-3xl bg-slate-50/70 border border-slate-200/90 text-left space-y-3 hover:bg-white hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  {inst.badge}
                </span>
                <h3 className="font-heading font-bold text-base text-slate-900 mt-2">
                  {inst.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{inst.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SocialProofSection
