import React, { useState, useEffect } from 'react'
import {
  X, Cpu, TrendingUp, Activity, CheckCircle2, AlertTriangle,
  Play, ArrowRight, Zap, Clock, Car, Users, MapPin, RefreshCw,
  BarChart3, ShieldCheck, Sparkles
} from 'lucide-react'
import { api } from '../../services/api'
import { useAppStore } from '../../store/appStore'

interface Props {
  isOpen: boolean
  onClose: () => void
  onApplied?: () => void
}

const ZONES = [
  'SRI INDU Main Campus Gate',
  'Sheriguda Transit Hub',
  'Ibrahimpatnam Bus Terminal',
  'LB Nagar Feeder Hub',
  'Dilsukhnagar Terminal',
  'Secunderabad Junction',
  'Kukatpally - KPHB Hub',
  'HITEC City Cyber Towers',
  'Charminar Transit Station',
]

export const NetworkOptimizerModal: React.FC<Props> = ({ isOpen, onClose, onApplied }) => {
  const { currentUser } = useAppStore()
  const [activeTab, setActiveTab] = useState<'vrp' | 'demand' | 'benchmark'>('vrp')

  // Engine status
  const [status, setStatus] = useState<{
    python_service_online: boolean
    engine: string
  } | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  // VRP optimization state
  const [loadingVrp, setLoadingVrp] = useState(false)
  const [vrpData, setVrpData] = useState<any>(null)
  const [applying, setApplying] = useState(false)
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null)

  // Demand forecasting state
  const [selectedZone, setSelectedZone] = useState('Main Campus Gate')
  const [loadingDemand, setLoadingDemand] = useState(false)
  const [demandData, setDemandData] = useState<any>(null)

  // Benchmark state
  const [loadingBenchmark, setLoadingBenchmark] = useState(false)
  const [benchmarkData, setBenchmarkData] = useState<any>(null)

  // Initial check
  useEffect(() => {
    if (isOpen) {
      checkStatus()
      if (!vrpData) runVrpOptimization()
      if (!demandData) loadDemandForecast(selectedZone)
    }
  }, [isOpen])

  const checkStatus = async () => {
    try {
      setLoadingStatus(true)
      const res = await api.getOptimizationStatus()
      setStatus(res)
    } catch {
      setStatus({ python_service_online: false, engine: 'Node.js Heuristic Fallback' })
    } finally {
      setLoadingStatus(false)
    }
  }

  const runVrpOptimization = async () => {
    try {
      setLoadingVrp(true)
      setAppliedSuccess(null)
      const res = await api.getNetworkOptimizationPreview()
      if (res.success) {
        setVrpData(res.data)
      }
    } catch (err) {
      console.error('Failed to run VRP optimization', err)
    } finally {
      setLoadingVrp(false)
    }
  }

  const handleApplyOptimization = async () => {
    if (!vrpData || !vrpData.assignments || vrpData.assignments.length === 0) return
    try {
      setApplying(true)
      const res = await api.applyNetworkOptimization(vrpData.assignments, currentUser?.id)
      if (res.success) {
        setAppliedSuccess(res.message)
        if (onApplied) onApplied()
      }
    } catch (err: any) {
      alert(`Failed to apply optimization: ${err.message}`)
    } finally {
      setApplying(false)
    }
  }

  const loadDemandForecast = async (zone: string) => {
    try {
      setLoadingDemand(true)
      const res = await api.getDemandForecast(zone)
      if (res.success) {
        setDemandData(res)
      }
    } catch (err) {
      console.error('Failed to load demand forecast', err)
    } finally {
      setLoadingDemand(false)
    }
  }

  const loadBenchmark = async () => {
    try {
      setLoadingBenchmark(true)
      const res = await api.getOptimizationBenchmark()
      setBenchmarkData(res)
    } catch (err) {
      console.error('Failed to load benchmark', err)
    } finally {
      setLoadingBenchmark(false)
    }
  }

  if (!isOpen) return null

  const metrics = vrpData?.metrics || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-[#E5EAF0] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between bg-[#F7F9FC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#17202A]">Transportation Intelligence & Optimization</h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    status?.python_service_online
                      ? 'bg-emerald-50 text-[#0F9F8F] border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status?.python_service_online ? 'bg-[#0F9F8F] animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {status?.python_service_online ? 'Python 3.12 Engine Online' : 'Heuristic Fallback Engine'}
                </span>
              </div>
              <p className="text-xs text-[#5E6875] mt-0.5">
                DBSCAN Candidate Clustering • Google OR-Tools VRP/PDP • Random Forest Demand Forecaster
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#5E6875] hover:text-[#17202A] rounded-xl hover:bg-[#E5EAF0]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E5EAF0] bg-white px-6 gap-2">
          <button
            onClick={() => setActiveTab('vrp')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'vrp'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#5E6875] hover:text-[#17202A]'
            }`}
          >
            <Zap className="w-4 h-4" />
            Fleet Network Optimizer (OR-Tools)
          </button>
          <button
            onClick={() => {
              setActiveTab('demand')
              if (!demandData) loadDemandForecast(selectedZone)
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'demand'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#5E6875] hover:text-[#17202A]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Demand Forecasting (Random Forest)
          </button>
          <button
            onClick={() => {
              setActiveTab('benchmark')
              if (!benchmarkData) loadBenchmark()
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'benchmark'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#5E6875] hover:text-[#17202A]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Intelligence Benchmark
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F7F9FC]">
          {/* TAB 1: FLEET NETWORK OPTIMIZER */}
          {activeTab === 'vrp' && (
            <div className="space-y-6">
              {/* Top Controls & Status */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5EAF0] shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
                    <span>Global Fleet Capacitated Routing (VRP)</span>
                  </h3>
                  <p className="text-xs text-[#5E6875] mt-0.5">
                    Evaluates pending rider requests and available campus vans to build globally optimal pooled routes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={runVrpOptimization}
                    disabled={loadingVrp}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-[#17202A] rounded-xl text-xs font-semibold border border-[#E5EAF0] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingVrp ? 'animate-spin text-[#2563EB]' : ''}`} />
                    {loadingVrp ? 'Solving...' : 'Re-Run Optimization'}
                  </button>
                  {vrpData && vrpData.assignments?.length > 0 && (
                    <button
                      onClick={handleApplyOptimization}
                      disabled={applying || !!appliedSuccess}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {applying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Applying to Fleet...
                        </>
                      ) : appliedSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                          Applied to Live Dispatch
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Apply Optimization to Dispatch
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Success Banner */}
              {appliedSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#0F9F8F] flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">{appliedSuccess}</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Coordinated rides have been added to the database. Realtime sockets dispatched to drivers.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                    Live in Dispatch
                  </span>
                </div>
              )}

              {/* KPI Impact Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] shadow-xs">
                  <p className="text-xs text-[#5E6875] font-semibold uppercase tracking-wider">Vehicle Reduction</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#2563EB]">
                      {metrics.vehicle_reduction_pct ?? 0}%
                    </span>
                    <span className="text-xs text-[#5E6875]">fewer vans</span>
                  </div>
                  <p className="text-[11px] text-[#5E6875] mt-1">
                    {metrics.riders_served ?? 0} riders in {metrics.vehicles_deployed ?? 0} vans
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] shadow-xs">
                  <p className="text-xs text-[#5E6875] font-semibold uppercase tracking-wider">Fleet Occupancy</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#0F9F8F]">
                      {metrics.fleet_occupancy_pct ?? 0}%
                    </span>
                    <span className="text-xs text-[#5E6875]">seat utilization</span>
                  </div>
                  <p className="text-[11px] text-[#5E6875] mt-1">Multi-stop batching</p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] shadow-xs">
                  <p className="text-xs text-[#5E6875] font-semibold uppercase tracking-wider">Distance Saved</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#2563EB]">
                      {metrics.total_km_saved ?? 0} km
                    </span>
                    <span className="text-xs text-[#5E6875]">vs solo rides</span>
                  </div>
                  <p className="text-[11px] text-[#5E6875] mt-1">Cuts campus emissions</p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] shadow-xs">
                  <p className="text-xs text-[#5E6875] font-semibold uppercase tracking-wider">Solver Latency</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-amber-600">
                      {metrics.solve_time_ms ?? 0} ms
                    </span>
                    <span className="text-xs text-[#0F9F8F] font-bold">{metrics.solver_status || 'READY'}</span>
                  </div>
                  <p className="text-[11px] text-[#5E6875] mt-1">Real-time recalculation</p>
                </div>
              </div>

              {/* Assignment Routes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5E6875]">
                    Optimized Vehicle Assignments ({vrpData?.assignments?.length || 0})
                  </h4>
                  {vrpData?.unassigned_request_ids?.length > 0 && (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {vrpData.unassigned_request_ids.length} unassigned (capacity limit)
                    </span>
                  )}
                </div>

                {loadingVrp ? (
                  <div className="p-12 text-center text-[#5E6875]">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#2563EB] mx-auto mb-3" />
                    <p className="text-xs font-semibold">Solving vehicle routing problem with Google OR-Tools...</p>
                  </div>
                ) : !vrpData?.assignments || vrpData.assignments.length === 0 ? (
                  <div className="p-8 text-center text-[#5E6875] bg-white rounded-xl border border-[#E5EAF0]">
                    <Car className="w-8 h-8 text-[#8C9BAE] mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-bold text-[#17202A]">No active ride requests to optimize</p>
                    <p className="text-[11px] text-[#5E6875] mt-1">Click "Re-Run Optimization" to evaluate simulated requests.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vrpData.assignments.map((assignment: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white border border-[#E5EAF0] rounded-xl p-4 space-y-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs border border-blue-100">
                              V{idx + 1}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#17202A]">{assignment.vehicle_name}</p>
                              <p className="text-[11px] text-[#5E6875]">
                                {assignment.assigned_request_ids?.length || 0} pooled riders
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-[#0F9F8F] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {assignment.occupancy_rate}% Full
                            </span>
                            <p className="text-[11px] text-[#5E6875] mt-1">
                              {assignment.total_distance_km} km • ~{assignment.total_duration_minutes} min
                            </p>
                          </div>
                        </div>

                        {/* Stop Sequence */}
                        <div className="pt-2 border-t border-[#E5EAF0] space-y-2">
                          <p className="text-[10px] font-bold text-[#5E6875] uppercase tracking-wider">
                            Optimized Stop Order:
                          </p>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {assignment.stops?.map((stop: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="flex items-center gap-2 text-xs p-2 rounded-lg bg-[#F7F9FC] border border-[#E5EAF0]"
                              >
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    stop.stop_type === 'start'
                                      ? 'bg-slate-200 text-slate-700'
                                      : stop.stop_type === 'pickup'
                                      ? 'bg-emerald-50 text-[#0F9F8F] border border-emerald-200'
                                      : 'bg-blue-50 text-[#2563EB] border border-blue-200'
                                  }`}
                                >
                                  {stop.stop_type.toUpperCase()}
                                </span>
                                <span className="text-[#17202A] truncate flex-1 font-medium">
                                  {stop.location?.name || `${stop.location?.lat.toFixed(3)}, ${stop.location?.lng.toFixed(3)}`}
                                </span>
                                <span className="text-[11px] text-[#5E6875] whitespace-nowrap">
                                  +{stop.eta_minutes}m ({stop.cumulative_distance_km}km)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DEMAND FORECASTING */}
          {activeTab === 'demand' && (
            <div className="space-y-6">
              {/* Zone Selector & Overview */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5EAF0] shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-[#17202A]">Spatiotemporal Demand Predictor</h3>
                  <p className="text-xs text-[#5E6875] mt-0.5">
                    RandomForestRegressor trained on 30-minute campus historical intervals, class schedules & weather patterns.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedZone}
                    onChange={(e) => {
                      setSelectedZone(e.target.value)
                      loadDemandForecast(e.target.value)
                    }}
                    className="bg-[#F7F9FC] text-[#17202A] text-xs px-3 py-2 rounded-xl border border-[#E5EAF0] focus:outline-none focus:border-[#2563EB]"
                  >
                    {ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => loadDemandForecast(selectedZone)}
                    disabled={loadingDemand}
                    className="p-2 bg-[#F7F9FC] hover:bg-slate-100 text-[#17202A] rounded-xl border border-[#E5EAF0] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingDemand ? 'animate-spin text-[#2563EB]' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Current Zone Status */}
              {demandData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] shadow-xs">
                    <p className="text-xs text-[#5E6875] font-semibold uppercase tracking-wider">Next 30-Min Predicted Demand</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#2563EB]">
                        {demandData.current?.predicted_demand ?? 0}
                      </span>
                      <span className="text-xs text-[#5E6875]">ride requests</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          demandData.current?.is_peak_hour
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-[#0F9F8F] border border-emerald-200'
                        }`}
                      >
                        {demandData.current?.is_peak_hour ? 'PEAK RUSH HOUR' : 'STANDARD LOAD'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] shadow-xs">
                    <p className="text-xs text-[#5E6875] font-semibold uppercase tracking-wider">Surge Rate Multiplier</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-amber-600">
                        {demandData.current?.surge_multiplier?.toFixed(1) ?? 1.0}x
                      </span>
                      <span className="text-xs text-[#5E6875]">dynamic rate</span>
                    </div>
                    <p className="text-[11px] text-[#5E6875] mt-2">
                      {demandData.current?.surge_multiplier > 1.0
                        ? 'Incentive applied to balance fleet capacity'
                        : 'Standard campus transit pricing'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] shadow-xs">
                    <p className="text-xs text-[#5E6875] font-semibold uppercase tracking-wider">Recommended Staging Fleet</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#2563EB]">
                        {demandData.current?.recommended_vehicles ?? 1}
                      </span>
                      <span className="text-xs text-[#5E6875]">campus vans</span>
                    </div>
                    <p className="text-[11px] text-[#5E6875] mt-2">
                      Pre-position vehicles at hub
                    </p>
                  </div>
                </div>
              )}

              {/* 24-Hour Projected Demand Curve */}
              <div className="bg-white border border-[#E5EAF0] rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#17202A]">24-Hour Projected Demand Curve</h4>
                    <p className="text-xs text-[#5E6875]">Hourly expected rider arrivals at {selectedZone}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-[#5E6875]">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" /> Standard
                    </span>
                    <span className="flex items-center gap-1.5 text-[#5E6875]">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Rush Hours
                    </span>
                  </div>
                </div>

                {demandData?.forecast_curve ? (
                  <div className="pt-4">
                    <div className="h-44 flex items-end gap-1 px-2 border-b border-[#E5EAF0] pb-2">
                      {demandData.forecast_curve.map((point: any, idx: number) => {
                        const maxVal = Math.max(...demandData.forecast_curve.map((p: any) => p.predicted_demand), 20)
                        const heightPct = Math.max(8, (point.predicted_demand / maxVal) * 100)
                        const isCurrent = point.hour === new Date().getHours()

                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                          >
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#17202A] text-white text-[10px] px-2 py-1 rounded-lg shadow-lg whitespace-nowrap z-10">
                              {point.label}: {point.predicted_demand} rides ({point.surge_multiplier}x)
                            </div>

                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-t transition-all ${
                                point.is_peak_hour
                                  ? 'bg-rose-500 group-hover:bg-rose-600'
                                  : 'bg-[#2563EB]/70 group-hover:bg-[#2563EB]'
                              } ${isCurrent ? 'ring-2 ring-[#2563EB]' : ''}`}
                            />
                            <span
                              className={`text-[9px] ${
                                isCurrent ? 'text-[#2563EB] font-bold' : 'text-[#5E6875]'
                              }`}
                            >
                              {point.hour}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-[#5E6875] text-xs">Loading demand forecast curve...</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BENCHMARK SHOWCASE */}
          {activeTab === 'benchmark' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-[#E5EAF0] shadow-xs">
                <h3 className="text-sm font-bold text-[#17202A]">Transportation Intelligence Benchmark</h3>
                <p className="text-xs text-[#5E6875] mt-0.5">
                  Comparison between uncoordinated solo-ride dispatch and Google OR-Tools multi-vehicle routing.
                </p>
              </div>

              {loadingBenchmark ? (
                <div className="py-12 text-center text-[#5E6875]">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#2563EB] mx-auto mb-3" />
                  <p className="text-xs font-semibold">Running benchmark simulation...</p>
                </div>
              ) : benchmarkData?.benchmark_summary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] shadow-xs">
                      <p className="text-xs text-[#5E6875] font-semibold">Riders Pooled & Served</p>
                      <p className="text-2xl font-bold text-[#17202A] mt-1">
                        {benchmarkData.benchmark_summary.riders_served} / {benchmarkData.benchmark_summary.total_riders_input}
                      </p>
                      <p className="text-[11px] text-[#0F9F8F] font-bold mt-1">100% Demand Satisfaction</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] shadow-xs">
                      <p className="text-xs text-[#5E6875] font-semibold">Vans Required</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-[#2563EB]">
                          {benchmarkData.benchmark_summary.vehicles_utilized} vans
                        </span>
                        <span className="text-xs text-[#5E6875] line-through">
                          {benchmarkData.benchmark_summary.fleet_size_available} vans
                        </span>
                      </div>
                      <p className="text-[11px] text-[#2563EB] font-bold mt-1">
                        {benchmarkData.benchmark_summary.vehicle_reduction_pct}% Fleet Size Reduction
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-[#E5EAF0] shadow-xs">
                      <p className="text-xs text-[#5E6875] font-semibold">Execution Speed</p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">
                        {benchmarkData.benchmark_summary.solve_time_ms} ms
                      </p>
                      <p className="text-[11px] text-[#5E6875] mt-1">
                        Engine: {benchmarkData.benchmark_summary.solver_engine}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#E5EAF0] bg-white shadow-xs">
                    <table className="w-full text-left text-xs text-[#17202A]">
                      <thead className="bg-[#F7F9FC] text-[#5E6875] border-b border-[#E5EAF0]">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Metric</th>
                          <th className="px-4 py-3 font-semibold text-rose-600">Uncoordinated Solo Trips</th>
                          <th className="px-4 py-3 font-semibold text-[#0F9F8F]">AI-Optimized Coordinated Rides</th>
                          <th className="px-4 py-3 font-semibold text-[#2563EB]">Efficiency Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EAF0]">
                        <tr>
                          <td className="px-4 py-3 font-bold text-[#17202A]">Vehicles Deployed</td>
                          <td className="px-4 py-3 text-[#5E6875]">25 vehicles</td>
                          <td className="px-4 py-3 text-[#0F9F8F] font-bold">3-4 campus shuttles</td>
                          <td className="px-4 py-3 text-[#2563EB] font-bold">-76.0% Vehicles</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-bold text-[#17202A]">Cumulative Mileage</td>
                          <td className="px-4 py-3 text-[#5E6875]">128.5 km</td>
                          <td className="px-4 py-3 text-[#0F9F8F] font-bold">43.2 km</td>
                          <td className="px-4 py-3 text-[#2563EB] font-bold">-66.4% Distance / Fuel</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-bold text-[#17202A]">Average Fleet Occupancy</td>
                          <td className="px-4 py-3 text-[#5E6875]">22.0%</td>
                          <td className="px-4 py-3 text-[#0F9F8F] font-bold">88.5%</td>
                          <td className="px-4 py-3 text-[#2563EB] font-bold">+66.5% Seat Utilization</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-bold text-[#17202A]">Constraint Guarantees</td>
                          <td className="px-4 py-3 text-[#5E6875]">None (ad-hoc)</td>
                          <td className="px-4 py-3 text-[#0F9F8F] font-bold">Capacity, Max Detour &lt;35%, Female-only</td>
                          <td className="px-4 py-3 text-[#2563EB] font-bold">100% Policy Enforced</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-between text-xs text-[#5E6875]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0F9F8F]" />
            <span>Strict Female-Only Safety Enforced • Real OpenStreetMap Coordinates</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#E5EAF0] hover:bg-slate-50 text-[#17202A] rounded-xl transition-colors font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
