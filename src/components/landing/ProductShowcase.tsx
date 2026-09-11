import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Navigation,
  Users,
  Car,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Activity,
  Compass,
  Sparkles,
  Sliders,
  Bell,
  Eye,
  ShieldAlert,
} from 'lucide-react'

const TABS = [
  { id: 'passenger', label: '1. Passenger Booking & Pooling', icon: Users },
  { id: 'driver', label: '2. Driver Fleet Console', icon: Car },
  { id: 'dispatcher', label: '3. Dispatcher Radar & Safety', icon: ShieldCheck },
]

const SAMPLE_LOCATIONS = [
  { name: 'Kukatpally Metro Hub', lat: 17.4934, lng: 78.3995, fare: 35, solo: 85, savings: '58%', time: '8:15 AM' },
  { name: 'Hostel Block A', lat: 17.398, lng: 78.479, fare: 20, solo: 50, savings: '60%', time: '7:50 AM' },
  { name: 'Secunderabad Junction', lat: 17.4344, lng: 78.5017, fare: 40, solo: 95, savings: '57%', time: '8:05 AM' },
  { name: 'HITEC City Cyber Towers', lat: 17.4504, lng: 78.3808, fare: 45, solo: 110, savings: '59%', time: '8:25 AM' },
]

export const ProductShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('passenger')
  const [selectedLocation, setSelectedLocation] = useState(SAMPLE_LOCATIONS[0])
  const [selectedSeats, setSelectedSeats] = useState(1)
  const [femaleOnlyFilter, setFemaleOnlyFilter] = useState(false)

  return (
    <section id="showcase" className="py-20 lg:py-28 bg-slate-50/70 border-t border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Product Simulator</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight">
            See the mobility system in motion.
          </h2>
          <p className="text-base text-slate-600 font-normal">
            Interact with real application workflows across student commuters, fleet drivers, and campus security dispatchers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-2xl">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Interactive Simulator Shell */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
          {/* Browser Chrome Header */}
          <div className="px-6 py-3.5 bg-slate-100/80 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-3 text-[11px] font-mono text-slate-500 font-semibold hidden sm:inline-block">
                https://campusflow.sriindu.ac.in/app/radar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                TELEMETRY ACTIVE
              </span>
            </div>
          </div>

          {/* Interactive Screen Content */}
          <div className="p-6 sm:p-8 lg:p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'passenger' && (
                <motion.div
                  key="tab-passenger"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left"
                >
                  {/* Left Column: Interactive Booking Form */}
                  <div className="lg:col-span-6 space-y-5">
                    <div>
                      <h3 className="font-heading font-bold text-xl text-slate-900">
                        Smart Pooled Ride Booking
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Select sample pickup points to see live dynamic pricing & corridor pooling.
                      </p>
                    </div>

                    {/* Location Selector Chips */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        1. Select Commuter Pickup Hub:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {SAMPLE_LOCATIONS.map((loc) => {
                          const isSelected = selectedLocation.name === loc.name
                          return (
                            <button
                              key={loc.name}
                              type="button"
                              onClick={() => setSelectedLocation(loc)}
                              className={`p-3 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-cyan-50/80 border-cyan-400 text-cyan-900 shadow-2xs font-bold'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-600' : 'text-slate-400'}`} />
                                <span className="truncate">{loc.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal mt-1">
                                Departure: {loc.time}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Fixed Destination */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                          🏁
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">SRI INDU College of Engg & Tech</p>
                          <p className="text-[10px] text-slate-500">Ibrahimpatnam, Main Academic Complex</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        Primary Hub
                      </span>
                    </div>

                    {/* Seats & Safety Preferences */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Seats Required
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSelectedSeats(s)}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                selectedSeats === s
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {s} Seat{s > 1 ? 's' : ''}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Safety Filter
                        </label>
                        <button
                          type="button"
                          onClick={() => setFemaleOnlyFilter(!femaleOnlyFilter)}
                          className={`w-full py-2 px-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                            femaleOnlyFilter
                              ? 'bg-pink-50 text-pink-700 border-pink-300 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Female Only</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Pricing Engine Result Card */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-50/70 via-blue-50/50 to-indigo-50/40 border border-cyan-200/80 shadow-md space-y-5">
                      <div className="flex items-center justify-between border-b border-cyan-200/60 pb-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase font-bold text-cyan-700 bg-cyan-100/70 px-2 py-0.5 rounded-full">
                            Dynamic Pricing Engine v2.4
                          </span>
                          <h4 className="font-heading font-bold text-lg text-slate-900 mt-1">
                            Live Matched Corridor #101
                          </h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-200">
                          {selectedLocation.savings} SAVINGS
                        </span>
                      </div>

                      {/* Fare Comparison Breakdown */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                          <p className="text-[11px] text-slate-400 font-medium">Standard Solo Fare</p>
                          <p className="font-heading font-extrabold text-2xl text-slate-400 line-through mt-0.5">
                            ₹{selectedLocation.solo * selectedSeats}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">Unpooled private cab</p>
                        </div>

                        <div className="p-3.5 bg-white rounded-xl border border-cyan-300 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-bl-2xl" />
                          <p className="text-[11px] text-cyan-700 font-bold">CampusFlow Pooled Fare</p>
                          <p className="font-heading font-extrabold text-2xl text-cyan-700 mt-0.5">
                            ₹{selectedLocation.fare * selectedSeats}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-bold mt-1">
                            Save ₹{(selectedLocation.solo - selectedLocation.fare) * selectedSeats} today
                          </p>
                        </div>
                      </div>

                      {/* Route Telemetry Metrics */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-blue-600" />
                            Assigned Fleet Shuttle
                          </span>
                          <span className="font-bold text-slate-800">Campus Shuttle Bus #01</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            Dynamic Pickup Detour
                          </span>
                          <span className="font-bold text-emerald-600">+0.8 min (Below 1.2 min cap)</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Rider Verification
                          </span>
                          <span className="font-bold text-emerald-700">100% University Verified</span>
                        </div>
                      </div>

                      {/* Capacity Seat Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>Shuttle Occupancy: 4 / 6 Seats</span>
                          <span className="text-cyan-700 font-bold">67% Pooled</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                          <div className="w-2/3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'driver' && (
                <motion.div
                  key="tab-driver"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left"
                >
                  <div className="lg:col-span-6 space-y-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Driver Dispatch Interface
                      </span>
                      <h3 className="font-heading font-bold text-xl text-slate-900 mt-1">
                        Active Trip: Campus Corridor Route #101
                      </h3>
                      <p className="text-xs text-slate-500">
                        Zero-confusion digital boarding roster with dynamic stop notifications.
                      </p>
                    </div>

                    {/* Stop Sequence Card */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Optimized Stop Progression:
                      </p>
                      <div className="space-y-2">
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-300 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center">
                              ✓
                            </span>
                            <span className="text-xs font-bold text-slate-800">Stop 1: Old City Terminal</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">7:50 AM · 2 Boarded</span>
                        </div>
                        <div className="p-2.5 bg-cyan-50 rounded-xl border border-cyan-300 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[10px] flex items-center justify-center">
                              2
                            </span>
                            <span className="text-xs font-bold text-cyan-950">Stop 2: Banjara Hills Checkpost</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-cyan-700">NEXT STOP · 7:58 AM</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                              3
                            </span>
                            <span className="text-xs font-bold text-slate-800">Stop 3: Sri Indu College Gate</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">8:12 AM Arrival</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Boarding Roster */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-heading font-bold text-sm text-slate-900">
                          Digital Boarding Roster (4 Passengers)
                        </h4>
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          4/6 Verified
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        <div className="py-2.5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">Uday Kiran (21IND0501)</p>
                            <p className="text-[10px] text-slate-400">Seat #1 · Sheriguda Hub</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            BOARDED
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">Priya Sharma (ME21B034)</p>
                            <p className="text-[10px] text-slate-400">Seat #2 · Banjara Hills</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                            WAITING AT STOP
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">Rahul Varma (160123733007)</p>
                            <p className="text-[10px] text-slate-400">Seat #3 · Banjara Hills</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                            WAITING AT STOP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'dispatcher' && (
                <motion.div
                  key="tab-dispatcher"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left"
                >
                  <div className="lg:col-span-12 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">Active Fleet on Grid</p>
                        <p className="font-heading font-extrabold text-2xl text-slate-900 mt-1">20 Vehicles</p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">100% GPS Signal Lock</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">On-Time Schedule Adherence</p>
                        <p className="font-heading font-extrabold text-2xl text-blue-600 mt-1">96.8%</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Avg deviation: 0.8 min</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">Active SOS Panic Incidents</p>
                        <p className="font-heading font-extrabold text-2xl text-emerald-600 mt-1">0 Active</p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">All Zones Monitored</p>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          🛰️
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Automated Route Deviation Watcher</p>
                          <p className="text-[10px] text-slate-400">
                            Continuous monitoring of fleet latitude, longitude, and corridor bounds
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200">
                        SUPERVISORY RADAR RUNNING
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductShowcase
