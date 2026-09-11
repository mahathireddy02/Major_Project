import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ShieldCheck, Heart, Github, ExternalLink } from 'lucide-react'

export const LandingFooter: React.FC = () => {
  const navigate = useNavigate()

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                <Zap className="w-4 h-4 fill-white/20" />
              </div>
              <span className="font-heading font-black text-lg tracking-tight text-white">
                Campus<span className="text-cyan-400">Flow</span>
              </span>
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                HackSankalp 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              AI-driven campus mobility platform synchronizing commuter intents, high-occupancy pooled corridors, and dynamic fleet telemetry in real time.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Campus Corridors Operational</span>
            </div>
          </div>

          {/* Portals Col */}
          <div className="text-left space-y-2.5">
            <h4 className="text-xs font-bold font-heading uppercase tracking-wider text-slate-200">
              Access Portals
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => navigate('/auth/student-faculty')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Student & Faculty Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/auth/driver')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Driver Fleet Console
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/auth/dispatcher')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Dispatcher Command Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/auth/portal')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Unified Role Selector
                </button>
              </li>
            </ul>
          </div>

          {/* Core Modules Col */}
          <div className="text-left space-y-2.5">
            <h4 className="text-xs font-bold font-heading uppercase tracking-wider text-slate-200">
              Technology Architecture
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li className="text-slate-400">Topological Greedy Pooling</li>
              <li className="text-slate-400">Sub-Minute Detour Insertion</li>
              <li className="text-slate-400">OCR Student ID Verification</li>
              <li className="text-slate-400">OSRM Road Geometry Engine</li>
              <li className="text-slate-400">Single-Tap SOS Panic Grid</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 CampusFlow. Built for Sri Indu College of Engineering & Technology.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Fastify + React + R3F 3D Engine</span>
            <span>·</span>
            <span>Zero Detour Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
