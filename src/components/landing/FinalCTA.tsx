import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Zap,
  User,
  Car,
  Shield,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

export const FinalCTA: React.FC = () => {
  const navigate = useNavigate()

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-white via-cyan-50/30 to-blue-50/40 border-t border-slate-200/80 relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-cyan-200/40 via-blue-200/30 to-indigo-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-800"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>HackSankalp 2026 National Prototype</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-[1.15]">
            Ready to experience{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">
              the future of campus transit?
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal">
            Join students, faculty, and fleet drivers building a greener, safer, and fully synchronized campus mobility network.
          </p>
        </motion.div>

        {/* Action Button Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
        >
          <button
            type="button"
            onClick={() => navigate('/auth/portal?mode=signup')}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>Launch Commuter Portal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/auth/portal?mode=signin')}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-2xs hover:border-slate-300 transition-all duration-200 cursor-pointer"
          >
            Sign In with University SSO
          </button>
        </motion.div>

        {/* 3 Portal Shortcut Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-4 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            onClick={() => navigate('/auth/student-faculty')}
            className="px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-cyan-700 hover:border-cyan-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <User className="w-3.5 h-3.5 text-cyan-600" />
            <span>Student & Faculty</span>
          </button>

          <button
            onClick={() => navigate('/auth/driver')}
            className="px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Car className="w-3.5 h-3.5 text-emerald-600" />
            <span>Driver Fleet</span>
          </button>

          <button
            onClick={() => navigate('/auth/dispatcher')}
            className="px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:border-indigo-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dispatcher Command</span>
          </button>
        </motion.div>
      </div>
    </section>
  )
}

export default FinalCTA
