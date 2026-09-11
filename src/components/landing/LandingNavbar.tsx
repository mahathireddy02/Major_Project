import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Navigation,
  Sparkles,
  User,
  Car,
  Shield,
  Layers,
  Activity,
  ArrowRight,
} from 'lucide-react'

interface LandingNavbarProps {
  onNavigateSection?: (sectionId: string) => void
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onNavigateSection }) => {
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    } else if (onNavigateSection) {
      onNavigateSection(id)
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-xl shadow-xs border-b border-slate-200/80 py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
              <Zap className="w-5 h-5 fill-white/20 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-xl tracking-tight text-slate-900">
                  Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Flow</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/70">
                  v2.4 AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
                Smart Autonomous Mobility Grid
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-full border border-slate-200/70 backdrop-blur-md">
            <button
              onClick={() => scrollTo('features')}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all duration-150 cursor-pointer"
            >
              Smart Pooling
            </button>
            <button
              onClick={() => scrollTo('showcase')}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all duration-150 cursor-pointer"
            >
              Live Radar
            </button>
            <button
              onClick={() => scrollTo('ecosystem')}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all duration-150 cursor-pointer flex items-center gap-1"
            >
              <span>3D Topology</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            </button>
            <button
              onClick={() => scrollTo('how-it-works')}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all duration-150 cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo('impact')}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all duration-150 cursor-pointer"
            >
              Impact
            </button>
          </nav>

          {/* CTA Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Quick Portal Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
                onBlur={() => setTimeout(() => setPortalDropdownOpen(false), 200)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-all flex items-center gap-1.5 cursor-pointer bg-white"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-600" />
                <span>Portals</span>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    portalDropdownOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {portalDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 divide-y divide-slate-100"
                  >
                    <div className="p-1">
                      <button
                        onClick={() => navigate('/auth/student-faculty')}
                        className="w-full text-left p-2 rounded-xl hover:bg-cyan-50/70 flex items-center gap-2.5 transition-colors group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-800">
                            Student / Faculty
                          </p>
                          <p className="text-[10px] text-slate-400">Institutional booking & rides</p>
                        </div>
                      </button>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => navigate('/auth/driver')}
                        className="w-full text-left p-2 rounded-xl hover:bg-emerald-50/70 flex items-center gap-2.5 transition-colors group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                            Driver Console
                          </p>
                          <p className="text-[10px] text-slate-400">Rosters & route dispatch</p>
                        </div>
                      </button>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => navigate('/auth/dispatcher')}
                        className="w-full text-left p-2 rounded-xl hover:bg-indigo-50/70 flex items-center gap-2.5 transition-colors group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-800">
                            Command & Safety
                          </p>
                          <p className="text-[10px] text-slate-400">Live fleet supervision</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => navigate('/auth/portal?mode=signin')}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={() => navigate('/auth/portal?mode=signup')}
              className="relative group overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => navigate('/auth/portal')}
              className="px-3 py-1.5 text-xs font-bold bg-cyan-600 text-white rounded-lg"
            >
              Enter App
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-2xl border-b border-slate-200 shadow-xl px-4 pt-3 pb-6 space-y-4"
          >
            <div className="space-y-1.5">
              <button
                onClick={() => scrollTo('features')}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Smart Pooling
              </button>
              <button
                onClick={() => scrollTo('showcase')}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Live Radar
              </button>
              <button
                onClick={() => scrollTo('ecosystem')}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                3D Topology
              </button>
              <button
                onClick={() => scrollTo('how-it-works')}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollTo('impact')}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Impact
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/auth/student-faculty')
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-600" />
                  Student & Faculty Portal
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/auth/driver')
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-600" />
                  Driver Fleet Console
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/auth/dispatcher')
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  Dispatcher Command Center
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate('/auth/portal?mode=signin')
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate('/auth/portal?mode=signup')
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl shadow-sm"
                >
                  Register
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default LandingNavbar
