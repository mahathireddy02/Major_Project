import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Route as RouteIcon,
  ShieldCheck,
  Zap,
  Activity,
  Car,
  Compass,
  CheckCircle2,
  Lock,
  HeartHandshake,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'

const FEATURES = [
  {
    id: 'pooling',
    tag: '01 / SMART POOLING',
    title: 'Topological Corridor Pooling',
    desc: 'Turn separate solo commuter journeys into synchronized high-occupancy rides. CampusFlow clusters students and faculty sharing geographic corridors with sub-minute matchmaking.',
    badge: '3 Solo Requests → 1 Shared Ride',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: Users,
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50 border-cyan-200',
    highlights: [
      'Clustering by route topology rather than straight-line distance',
      'Individual customized fares based on exact road distance contribution',
      'Dynamic seat reservation locks',
    ],
  },
  {
    id: 'insertion',
    tag: '02 / DYNAMIC INSERTION',
    title: 'Sub-Minute Dynamic Stop Insertion',
    desc: 'When on-demand ride requests emerge while a shuttle is already en route, our topological OSRM router dynamically inserts pickup points with a strict detour threshold of under 1.2 minutes.',
    badge: 'Real-Time Detour Cap < 1.2 min',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: RouteIcon,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 border-blue-200',
    highlights: [
      'Zero-disruption schedule integrity for on-board passengers',
      'Live road network topology with turn-by-turn re-routing',
      'Automated passenger ETA synchronization',
    ],
  },
  {
    id: 'verification',
    tag: '03 / INSTITUTIONAL TRUST',
    title: 'Dual-Stage OCR & Domain Verification',
    desc: 'Guaranteed university-exclusive environment. Every commuter is authenticated through institutional email domains (.ac.in / .edu.in) and real-time OCR identity card inspection.',
    badge: '100% Institution Verified',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: ShieldCheck,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-200',
    highlights: [
      'Client-side Tesseract OCR extraction of student ID and roll number',
      'Fuzzy name-matching against university admission rolls',
      'Instant verification badge on passenger rosters',
    ],
  },
  {
    id: 'safety',
    tag: '04 / EMERGENCY SOS',
    title: 'Supervisory Dispatch & Instant SOS',
    desc: 'Live supervisory oversight on every campus corridor. An active speed, deviation, and single-tap SOS panic grid alerts campus security and emergency contacts with real-time GPS telemetry.',
    badge: 'Single-Tap Security Dispatch',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: ShieldAlert,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 border-rose-200',
    highlights: [
      'Automated SOS event logging with coordinates & vehicle telemetry',
      'Female-only cohort filtering for night travel safety',
      'Emergency contact automated notification webhooks',
    ],
  },
]

export const FeatureSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section id="features" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-700 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Autonomous Mobility Architecture</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight">
            Everything you need to move a modern campus.
          </h2>
          <p className="text-base text-slate-600 font-normal">
            Eliminate fragmented campus commutes with an integrated AI pooling and dispatch system
            designed for colleges, universities, and research institutes.
          </p>
        </div>

        {/* 4 Core Value Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-7 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group text-left"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl ${feat.iconBg} border flex items-center justify-center ${feat.iconColor} group-hover:scale-105 transition-transform duration-200 shadow-2xs`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border ${feat.badgeColor}`}
                    >
                      {feat.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-400">
                      {feat.tag}
                    </span>
                    <h3 className="font-heading font-bold text-xl text-slate-900 mt-0.5">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    {feat.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FeatureSection
