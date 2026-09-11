import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import {
  Navigation,
  Users,
  Cpu,
  Route as RouteIcon,
  Car,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  AlertTriangle,
  Layers,
  ChevronDown,
  Sparkles,
  Activity,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  MapPin
} from 'lucide-react'

interface StoryState {
  id: number
  key: string
  label: string
  eyebrow: string
  headline: string[]
  description: string
  tag?: string
  highlights?: { title: string; subtitle: string }[]
}

const STORY_STATES: StoryState[] = [
  {
    id: 0,
    key: 'hero',
    label: 'Overview',
    eyebrow: 'SMART CAMPUS MOBILITY',
    headline: ['MOVE', 'SMARTER.'],
    description: 'AI-powered campus mobility that connects riders, optimizes routes, and dynamically dispatches vehicles in real time.',
  },
  {
    id: 1,
    key: 'pooling',
    label: 'Smart Pooling',
    eyebrow: '01 / SMART POOLING',
    headline: ['SHARE THE', 'JOURNEY.'],
    description: 'Turn separate journeys into optimized shared rides. CampusFlow groups students and faculty traveling similar corridors into high-occupancy pools.',
    tag: '3 Solo Requests → 1 Shared Route',
  },
  {
    id: 2,
    key: 'dispatch',
    label: 'Dynamic Dispatch',
    eyebrow: '02 / DYNAMIC DISPATCH',
    headline: ['THE NETWORK', 'ADAPTS.'],
    description: 'When demand changes, CampusFlow dynamically reassigns vehicles and pickup points with zero-detour route recalculations.',
    tag: 'Real-Time Stop Insertion (+1.2 min)',
  },
  {
    id: 3,
    key: 'optimization',
    label: 'Optimization',
    eyebrow: '03 / ROUTE OPTIMIZATION',
    headline: ['OPTIMIZE', 'EVERY JOURNEY.'],
    description: 'CampusFlow treats campus mobility as a real-time optimization problem—synchronizing riders, vehicles, and topological road networks.',
    highlights: [
      { title: 'PEOPLE', subtitle: 'Passenger intents, schedules & detour tolerance' },
      { title: 'VEHICLES', subtitle: 'Live capacity, battery range & turnaround time' },
      { title: 'ROUTES', subtitle: 'Multi-stop topological campus road graph' },
    ],
  },
  {
    id: 4,
    key: 'safety',
    label: 'Safety',
    eyebrow: '04 / SAFER TRIPS',
    headline: ['TRAVEL WITH', 'CONFIDENCE.'],
    description: 'Institution-verified access and live supervisory oversight built directly into every campus ride.',
    highlights: [
      { title: 'VERIFIED USERS', subtitle: 'University SSO & student ID validation' },
      { title: 'VERIFIED VEHICLES', subtitle: 'Licensed fleet & digital boarding rosters' },
      { title: 'LIVE TRIP MONITORING', subtitle: 'GPS corridor tracking & speed supervision' },
      { title: 'SOS PROTECTION', subtitle: 'Single-tap campus security alert dispatch' },
    ],
  },
  {
    id: 5,
    key: 'network',
    label: 'Live Network',
    eyebrow: '05 / LIVE NETWORK',
    headline: ['SEE THE', 'CAMPUS MOVE.'],
    description: 'CampusFlow is continuously coordinating movement across the campus—connecting hostels, academic circles, transit hubs, and research parks.',
    tag: 'Active Campus Telemetry Grid',
  },
  {
    id: 6,
    key: 'cta',
    label: 'Get Started',
    eyebrow: 'CAMPUSFLOW',
    headline: ['READY TO', 'MOVE SMARTER?'],
    description: 'Build a safer, more efficient campus mobility network.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const [activeStateIndex, setActiveStateIndex] = useState(0)
  const [scrollPercent, setScrollPercent] = useState(0)

  // Use framer-motion scroll listener attached to container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setScrollPercent(Math.round(latest * 100))
    const numStates = STORY_STATES.length
    const calculatedIndex = Math.min(
      Math.floor(latest * numStates),
      numStates - 1
    )
    if (calculatedIndex !== activeStateIndex) {
      setActiveStateIndex(calculatedIndex)
    }
  })

  const currentState = STORY_STATES[activeStateIndex]

  const handleSignIn = () => {
    navigate('/auth/portal?mode=signin')
  }

  const handleGetStarted = () => {
    navigate('/auth/portal?mode=signup')
  }

  // Jump to specific state in timeline
  const jumpToState = (index: number) => {
    if (!containerRef.current) return
    const containerTop = containerRef.current.offsetTop
    const totalHeight = containerRef.current.scrollHeight - window.innerHeight
    const targetScroll = containerTop + (index / (STORY_STATES.length - 1)) * totalHeight
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    })
  }

  const jumpToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#F7F9FC]"
      style={{ height: '650vh' }}
    >
      {/* ─────────────────────────────────────────────────────────────
          LIGHT FIXED VIEWPORT STAGE (STICKY TOP-0 H-SCREEN)
      ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#F7F9FC] text-[#17202A] flex flex-col justify-between select-none">
        {/* 1. PERSISTENT LIGHT AMBIENT WORLD (Subtle Grid, Soft Tint Glow) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          {/* Subtle luminous ambient backdrop */}
          <motion.div
            animate={{
              scale: activeStateIndex === 6 ? [1, 1.15, 1] : 1,
              opacity: activeStateIndex === 6 ? 0.45 : 0.25,
              backgroundColor:
                activeStateIndex === 6
                  ? '#DBEAFE' // Soft blue on CTA
                  : activeStateIndex === 4
                  ? '#DFF7F3' // Soft teal on Safety
                  : activeStateIndex === 2
                  ? '#E0F2FE' // Sky on Dynamic Dispatch
                  : '#EFF6FF', // Soft primary blue
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[600px] blur-[140px] rounded-full"
          />

          {/* Clean Light Coordinate Grid */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `radial-gradient(circle, #2563EB 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Subtle real-world map contour lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.04]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M-100,220 Q450,80 950,320 T1950,220"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
            />
            <path
              d="M-100,480 Q550,240 1150,580 T2050,420"
              fill="none"
              stroke="#0F9F8F"
              strokeWidth="2"
            />
            <path
              d="M-100,720 Q650,440 1250,820 T2150,620"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* 2. PERSISTENT MINIMAL LIGHT NAVBAR */}
        <header className="relative z-40 px-5 sm:px-8 py-3.5 flex items-center justify-between border-b border-[#E5EAF0] bg-white/80 backdrop-blur-md">
          {/* Logo */}
          <button
            type="button"
            onClick={jumpToTop}
            title="CampusFlow Home"
            className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-xl py-1 px-1.5 -ml-1.5"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] group-hover:bg-[#1D4ED8] flex items-center justify-center text-white shadow-sm shadow-blue-500/20 transition-all group-hover:scale-105">
              <Navigation size={16} className="group-hover:rotate-6 transition-transform text-white" />
            </div>
            <span className="font-heading font-extrabold text-lg tracking-tight text-[#17202A]">
              Campus<span className="text-[#2563EB]">Flow</span>
            </span>
          </button>

          {/* Timeline State Pills (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#F1F4F8] border border-[#E5EAF0] rounded-full px-2 py-1">
            {STORY_STATES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => jumpToState(idx)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activeStateIndex === idx
                    ? 'bg-white text-[#2563EB] shadow-sm font-bold border border-[#E5EAF0]'
                    : 'text-[#5E6875] hover:text-[#17202A] hover:bg-white/60'
                }`}
              >
                {`0${idx + 1} ${s.label}`}
              </button>
            ))}
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSignIn}
              className="text-xs sm:text-sm font-semibold text-[#5E6875] hover:text-[#17202A] px-3.5 py-2 rounded-xl hover:bg-[#F1F4F8] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={handleGetStarted}
              className="text-xs sm:text-sm font-bold bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-blue-800 text-white px-4 py-2 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] flex items-center gap-1.5 group"
            >
              <span>Get Started</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </header>

        {/* 3. CENTRAL STAGE: STORY CONTENT + EVOLVING LIGHT MOBILITY VISUAL */}
        <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-5 sm:px-8 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12 overflow-hidden py-4 sm:py-6">
          {/* LEFT: IN-PLACE STORY CONTENT */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left justify-center min-h-[280px] sm:min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentState.id}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -20, scale: 0.99 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col items-start"
              >
                {/* Eyebrow / State pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB] text-xs font-mono font-semibold mb-3.5 tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                  <span>{currentState.eyebrow}</span>
                </div>

                {/* Main Headline */}
                <h1 className="font-heading font-black text-[clamp(2.3rem,5.2vw,5.2rem)] tracking-tight leading-[0.95] text-[#17202A] uppercase mb-4 sm:mb-5 select-none">
                  {currentState.headline.map((line, lIdx) => (
                    <span key={lIdx} className="block">
                      {line === 'SMARTER.' || line === 'JOURNEY.' || line === 'ADAPTS.' || line === 'JOURNEY.' || line === 'CONFIDENCE.' || line === 'MOVE.' ? (
                        <span className="text-[#2563EB] font-black">
                          {line}
                        </span>
                      ) : (
                        line
                      )}
                    </span>
                  ))}
                </h1>

                {/* Subtitle Description */}
                <p className="text-sm sm:text-base md:text-lg text-[#5E6875] font-normal leading-relaxed max-w-xl mb-6">
                  {currentState.description}
                </p>

                {/* Optional Tag or Highlights */}
                {currentState.tag && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E5EAF0] text-xs font-mono font-bold text-[#2563EB] shadow-sm mb-6">
                    <Sparkles size={13} className="text-[#2563EB]" />
                    <span>{currentState.tag}</span>
                  </div>
                )}

                {currentState.highlights && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg mb-6">
                    {currentState.highlights.map((h, hIdx) => (
                      <div
                        key={hIdx}
                        className="p-3 rounded-xl bg-white border border-[#E5EAF0] text-left shadow-sm"
                      >
                        <span className="text-xs font-bold font-mono text-[#2563EB] block mb-0.5">
                          {h.title}
                        </span>
                        <p className="text-[11px] text-[#5E6875] leading-snug">{h.subtitle}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hero / CTA Action Buttons */}
                {(activeStateIndex === 0 || activeStateIndex === 6) && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-sm pt-2">
                    <button
                      type="button"
                      onClick={handleGetStarted}
                      className="px-7 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-blue-800 text-white font-bold text-sm shadow-sm shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                    >
                      <span>Get Started</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSignIn}
                      className="px-6 py-3.5 rounded-xl border border-[#E5EAF0] hover:border-[#CBD5E1] text-[#17202A] hover:bg-white bg-white/70 font-semibold text-sm transition-all shadow-sm flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: DYNAMIC LIGHT MOBILITY VISUALIZATION */}
          <div className="w-full lg:w-1/2 flex items-center justify-center relative">
            <div className="w-full aspect-[4/3] max-h-[360px] sm:max-h-[420px] bg-white rounded-3xl border border-[#E5EAF0] p-4 sm:p-6 shadow-md shadow-slate-200/50 relative overflow-hidden flex items-center justify-center">
              {/* Internal light coordinate grid */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: `radial-gradient(circle, #2563EB 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* DYNAMIC LIGHT SVG TOPOLOGY (TRANSFORMS BY STATE) */}
              <svg
                className="w-full h-full relative z-10"
                viewBox="0 0 600 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="lightRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#93C5FD" />
                    <stop offset="50%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#0F9F8F" />
                  </linearGradient>
                </defs>

                {/* ── STATE 0 & 6: Clean Baseline Network (Hostel, Campus Gate, Tech Block, Station) ── */}
                {(activeStateIndex === 0 || activeStateIndex === 6) && (
                  <g>
                    {/* Road corridors */}
                    <path
                      d="M 80 260 C 180 140, 320 320, 420 180 C 480 100, 520 140, 520 140"
                      stroke="#E2E8F0"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M 80 260 C 180 140, 320 320, 420 180 C 480 100, 520 140, 520 140"
                      stroke="url(#lightRouteGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="10 5"
                      fill="none"
                    >
                      {!prefersReducedMotion && (
                        <animate
                          attributeName="stroke-dashoffset"
                          from="150"
                          to="0"
                          dur="6s"
                          repeatCount="indefinite"
                        />
                      )}
                    </path>

                    {/* Node 1: Hostel */}
                    <g transform="translate(80, 260)">
                      <circle r="16" fill="#DBEAFE" className="animate-ping" style={{ animationDuration: '3.5s' }} />
                      <circle r="8" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                      <text x="0" y="-14" textAnchor="middle" fill="#17202A" fontSize="11" fontWeight="700" fontFamily="Inter">Hostel Quad</text>
                    </g>
                    {/* Node 2: Tech Hub */}
                    <g transform="translate(420, 180)">
                      <circle r="8" fill="#FFFFFF" stroke="#0F9F8F" strokeWidth="2.5" />
                      <text x="0" y="-14" textAnchor="middle" fill="#17202A" fontSize="11" fontWeight="700" fontFamily="Inter">Campus Hub</text>
                    </g>
                    {/* Node 3: Gate */}
                    <g transform="translate(520, 140)">
                      <circle r="9" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                      <text x="0" y="-14" textAnchor="middle" fill="#17202A" fontSize="11" fontWeight="700" fontFamily="Inter">Main Terminal</text>
                    </g>

                    {/* Moving Vehicle */}
                    <g>
                      {!prefersReducedMotion ? (
                        <animateMotion
                          path="M 80 260 C 180 140, 320 320, 420 180 C 480 100, 520 140, 520 140"
                          dur="7s"
                          repeatCount="indefinite"
                          rotate="auto"
                        />
                      ) : (
                        <g transform="translate(420, 180)" />
                      )}
                      <circle r="14" fill="#DBEAFE" />
                      <rect x="-12" y="-8" width="24" height="16" rx="4" fill="#2563EB" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="-4" cy="0" r="1.5" fill="#ffffff" />
                      <circle cx="4" cy="0" r="1.5" fill="#93C5FD" />
                    </g>
                  </g>
                )}

                {/* ── STATE 1: SMART POOLING (3 Requests Merging into 1 Shared Route) ── */}
                {activeStateIndex === 1 && (
                  <g>
                    {/* Student A vector */}
                    <path d="M 80 100 Q 200 120 300 200" stroke="#2563EB" strokeWidth="2" strokeDasharray="5 4" />
                    {/* Student B vector */}
                    <path d="M 80 200 Q 200 200 300 200" stroke="#0284C7" strokeWidth="2" strokeDasharray="5 4" />
                    {/* Student C vector */}
                    <path d="M 80 300 Q 200 280 300 200" stroke="#0F9F8F" strokeWidth="2" strokeDasharray="5 4" />
                    
                    {/* Outgoing Pooled Route */}
                    <path d="M 300 200 C 400 200, 480 160, 520 140" stroke="#0F9F8F" strokeWidth="4" />

                    {/* Student A Node */}
                    <g transform="translate(80, 100)">
                      <circle r="6" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
                      <text x="14" y="4" fill="#5E6875" fontSize="11" fontWeight="600" fontFamily="Inter">Rider A (Hostel 1)</text>
                    </g>
                    {/* Student B Node */}
                    <g transform="translate(80, 200)">
                      <circle r="6" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
                      <text x="14" y="4" fill="#5E6875" fontSize="11" fontWeight="600" fontFamily="Inter">Rider B (Library)</text>
                    </g>
                    {/* Student C Node */}
                    <g transform="translate(80, 300)">
                      <circle r="6" fill="#FFFFFF" stroke="#0F9F8F" strokeWidth="2" />
                      <text x="14" y="4" fill="#5E6875" fontSize="11" fontWeight="600" fontFamily="Inter">Rider C (Hostel 4)</text>
                    </g>

                    {/* Central Smart Pool Hub Node */}
                    <g transform="translate(300, 200)">
                      <circle r="22" fill="#DBEAFE" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                      <circle r="14" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                      <text x="0" y="32" textAnchor="middle" fill="#2563EB" fontSize="11" fontWeight="700" fontFamily="Inter">SMART POOL (3 in 1)</text>
                    </g>

                    {/* Dispatched Vehicle */}
                    <g transform="translate(450, 170)">
                      <rect x="-14" y="-9" width="28" height="18" rx="4" fill="#0F9F8F" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="0" y="24" textAnchor="middle" fill="#0F9F8F" fontSize="10" fontWeight="700" fontFamily="Inter">Shared Van</text>
                    </g>
                  </g>
                )}

                {/* ── STATE 2: DYNAMIC DISPATCH (New Request Real-Time Insertion) ── */}
                {activeStateIndex === 2 && (
                  <g>
                    {/* Original Route (faint gray) */}
                    <path d="M 80 200 L 520 200" stroke="#E2E8F0" strokeWidth="3" strokeDasharray="5 5" />
                    
                    {/* Recalculated Dynamic Route */}
                    <path
                      d="M 80 200 C 160 200, 220 90, 300 90 C 380 90, 440 200, 520 200"
                      stroke="#2563EB"
                      strokeWidth="3.5"
                      fill="none"
                    />

                    {/* Start Node */}
                    <g transform="translate(80, 200)">
                      <circle r="7" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
                      <text x="0" y="22" textAnchor="middle" fill="#5E6875" fontSize="11" fontWeight="600" fontFamily="Inter">Start Node</text>
                    </g>

                    {/* NEW REQUEST INTERCEPT NODE */}
                    <g transform="translate(300, 90)">
                      <circle r="20" fill="#FEF3C7" className="animate-ping" style={{ animationDuration: '2s' }} />
                      <circle r="10" fill="#FFFFFF" stroke="#D97706" strokeWidth="2.5" />
                      <text x="0" y="-16" textAnchor="middle" fill="#D97706" fontSize="11" fontWeight="700" fontFamily="Inter">NEW DEMAND</text>
                      <text x="0" y="28" textAnchor="middle" fill="#5E6875" fontSize="10" fontWeight="600" fontFamily="Inter">Pickup Added (+1.2m)</text>
                    </g>

                    {/* Destination Node */}
                    <g transform="translate(520, 200)">
                      <circle r="7" fill="#FFFFFF" stroke="#0F9F8F" strokeWidth="2" />
                      <text x="0" y="22" textAnchor="middle" fill="#5E6875" fontSize="11" fontWeight="600" fontFamily="Inter">Destination</text>
                    </g>

                    {/* Moving Vehicle traversing dynamic trajectory */}
                    <g>
                      {!prefersReducedMotion ? (
                        <animateMotion
                          path="M 80 200 C 160 200, 220 90, 300 90 C 380 90, 440 200, 520 200"
                          dur="5.5s"
                          repeatCount="indefinite"
                          rotate="auto"
                        />
                      ) : (
                        <g transform="translate(300, 90)" />
                      )}
                      <rect x="-12" y="-8" width="24" height="16" rx="4" fill="#2563EB" stroke="#ffffff" strokeWidth="1.5" />
                    </g>
                  </g>
                )}

                {/* ── STATE 3: OPTIMIZATION (PEOPLE, VEHICLES, ROUTES Converging) ── */}
                {activeStateIndex === 3 && (
                  <g>
                    {/* Triangle connecting vectors */}
                    <polygon points="300,90 150,290 450,290" stroke="#CBD5E1" strokeWidth="2" fill="none" strokeDasharray="5 5" />
                    
                    {/* Node 1: PEOPLE */}
                    <g transform="translate(300, 90)">
                      <circle r="22" fill="#DBEAFE" />
                      <circle r="13" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
                      <text x="0" y="4" textAnchor="middle" fill="#2563EB" fontSize="10" fontWeight="bold">P</text>
                      <text x="0" y="-20" textAnchor="middle" fill="#17202A" fontSize="12" fontWeight="700" fontFamily="Inter">PEOPLE</text>
                    </g>

                    {/* Node 2: VEHICLES */}
                    <g transform="translate(150, 290)">
                      <circle r="22" fill="#DFF7F3" />
                      <circle r="13" fill="#FFFFFF" stroke="#0F9F8F" strokeWidth="2" />
                      <text x="0" y="4" textAnchor="middle" fill="#0F9F8F" fontSize="10" fontWeight="bold">V</text>
                      <text x="0" y="30" textAnchor="middle" fill="#17202A" fontSize="12" fontWeight="700" fontFamily="Inter">VEHICLES</text>
                    </g>

                    {/* Node 3: ROUTES */}
                    <g transform="translate(450, 290)">
                      <circle r="22" fill="#DBEAFE" />
                      <circle r="13" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
                      <text x="0" y="4" textAnchor="middle" fill="#2563EB" fontSize="10" fontWeight="bold">R</text>
                      <text x="0" y="30" textAnchor="middle" fill="#17202A" fontSize="12" fontWeight="700" fontFamily="Inter">ROUTES</text>
                    </g>

                    {/* Central Solver Hub */}
                    <g transform="translate(300, 225)">
                      <circle r="26" fill="#F1F4F8" stroke="#2563EB" strokeWidth="2" />
                      <text x="0" y="4" textAnchor="middle" fill="#2563EB" fontSize="10" fontWeight="800" fontFamily="Inter">SOLVER</text>
                    </g>
                  </g>
                )}

                {/* ── STATE 4: SAFETY (Highlighted Active Monitored Corridor) ── */}
                {activeStateIndex === 4 && (
                  <g>
                    {/* Safety Corridor Boundary */}
                    <path d="M 100 200 Q 300 120 500 200" stroke="#DFF7F3" strokeWidth="22" strokeLinecap="round" fill="none" />
                    <path d="M 100 200 Q 300 120 500 200" stroke="#0F9F8F" strokeWidth="3" strokeLinecap="round" fill="none" />

                    {/* Active Radar Sweep Indicator */}
                    <g transform="translate(300, 160)">
                      <circle r="34" fill="#DFF7F3" className="animate-ping" style={{ animationDuration: '3s' }} />
                      <circle r="22" fill="none" stroke="#0F9F8F" strokeWidth="1" strokeDasharray="3 3" />
                      <rect x="-14" y="-9" width="28" height="18" rx="4" fill="#0F9F8F" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="0" y="-30" textAnchor="middle" fill="#0F9F8F" fontSize="11" fontWeight="700" fontFamily="Inter">LIVE SUPERVISION</text>
                      <text x="0" y="32" textAnchor="middle" fill="#5E6875" fontSize="10" fontWeight="500" fontFamily="Inter">GPS Locked · SOS Protection</text>
                    </g>

                    <g transform="translate(100, 200)">
                      <circle r="7" fill="#FFFFFF" stroke="#0F9F8F" strokeWidth="2" />
                      <text x="0" y="22" textAnchor="middle" fill="#5E6875" fontSize="10" fontFamily="Inter">Verified Pickup</text>
                    </g>
                    <g transform="translate(500, 200)">
                      <circle r="7" fill="#FFFFFF" stroke="#0F9F8F" strokeWidth="2" />
                      <text x="0" y="22" textAnchor="middle" fill="#5E6875" fontSize="10" fontFamily="Inter">Verified Drop</text>
                    </g>
                  </g>
                )}

                {/* ── STATE 5: LIVE CAMPUS NETWORK (Full Multi-Shuttle Grid) ── */}
                {activeStateIndex === 5 && (
                  <g>
                    {/* Multi-loop campus roads */}
                    <path d="M 80 120 L 260 120 L 260 280 L 80 280 Z" stroke="#E2E8F0" strokeWidth="6" fill="none" />
                    <path d="M 260 120 L 520 80 L 520 280 L 260 280" stroke="#E2E8F0" strokeWidth="6" fill="none" />
                    
                    {/* Active Loop A */}
                    <path d="M 80 120 L 260 120 L 260 280 L 80 280 Z" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="8 4" fill="none" />
                    {/* Active Loop B */}
                    <path d="M 260 120 L 520 80 L 520 280 L 260 280" stroke="#0F9F8F" strokeWidth="2.5" strokeDasharray="8 4" fill="none" />

                    {/* Moving Shuttle 1 */}
                    <g>
                      {!prefersReducedMotion && (
                        <animateMotion path="M 80 120 L 260 120 L 260 280 L 80 280 Z" dur="6s" repeatCount="indefinite" />
                      )}
                      <rect x="-8" y="-6" width="16" height="12" rx="3" fill="#2563EB" stroke="#ffffff" strokeWidth="1" />
                    </g>
                    {/* Moving Shuttle 2 */}
                    <g>
                      {!prefersReducedMotion && (
                        <animateMotion path="M 260 120 L 520 80 L 520 280 L 260 280 Z" dur="8s" repeatCount="indefinite" />
                      )}
                      <rect x="-8" y="-6" width="16" height="12" rx="3" fill="#0F9F8F" stroke="#ffffff" strokeWidth="1" />
                    </g>

                    {/* Nodes */}
                    <g transform="translate(80, 120)"><circle r="5" fill="#2563EB" /><text x="0" y="-10" textAnchor="middle" fill="#5E6875" fontSize="10">Hostel</text></g>
                    <g transform="translate(260, 120)"><circle r="5" fill="#2563EB" /><text x="0" y="-10" textAnchor="middle" fill="#5E6875" fontSize="10">Tech Hub</text></g>
                    <g transform="translate(520, 80)"><circle r="5" fill="#0F9F8F" /><text x="0" y="-10" textAnchor="middle" fill="#5E6875" fontSize="10">Station</text></g>
                    <g transform="translate(260, 280)"><circle r="5" fill="#2563EB" /><text x="0" y="18" textAnchor="middle" fill="#5E6875" fontSize="10">Library</text></g>
                    <g transform="translate(520, 280)"><circle r="5" fill="#0F9F8F" /><text x="0" y="18" textAnchor="middle" fill="#5E6875" fontSize="10">Main Gate</text></g>
                  </g>
                )}
              </svg>

              {/* Bottom State Badge Overlay */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 bg-white/95 border border-[#E5EAF0] px-3 py-1 rounded-lg shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                  <span className="text-[11px] font-mono text-[#5E6875]">
                    State 0{activeStateIndex + 1} / 07 · {currentState.label}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#5E6875] bg-white/95 border border-[#E5EAF0] px-2.5 py-1 rounded-lg shadow-sm">
                  <Activity size={12} className="text-[#2563EB]" />
                  <span>Mobility Live Simulation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM TIMELINE CONTROLLER & SCROLL INDICATOR */}
        <footer className="relative z-40 px-5 sm:px-8 py-3.5 border-t border-[#E5EAF0] bg-white/80 backdrop-blur-md flex items-center justify-between">
          {/* Scroll instruction / timeline status */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#5E6875] uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <span>SCROLL TO EXPLORE</span>
              <ChevronDown size={14} className="text-[#2563EB] animate-bounce" />
            </span>
            <span className="hidden sm:inline text-[#CBD5E1]">·</span>
            <span className="hidden sm:inline text-xs font-mono text-[#8A94A3]">
              {scrollPercent}% explored
            </span>
          </div>

          {/* Mini progress bar */}
          <div className="w-32 sm:w-48 bg-[#E5EAF0] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#2563EB] h-full transition-all duration-150"
              style={{ width: `${Math.max(scrollPercent, 5)}%` }}
            />
          </div>

          {/* Quick jump navigation button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => jumpToState(Math.min(activeStateIndex + 1, STORY_STATES.length - 1))}
              disabled={activeStateIndex === STORY_STATES.length - 1}
              className="px-3 py-1 rounded-lg bg-[#F1F4F8] hover:bg-[#E5EAF0] border border-[#E5EAF0] text-xs font-mono font-semibold text-[#17202A] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
