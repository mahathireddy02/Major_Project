import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingDown, Users, Car, RefreshCw, Zap, Award, Sparkles, Fuel, ArrowRight } from 'lucide-react'
import { api } from '../../services/api'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

const COLORS = ['#2563EB', '#0F9F8F', '#38BDF8', '#F59E0B', '#8B5CF6', '#EC4899']

interface AnalyticsData {
  totalRequests: number
  sharedRides: number
  vehiclesUsed: number
  vehicleReduction: number
  avgOccupancy: number
  estimatedSavings: number
  totalStudents: number
  demandByHour: { time: string; requests: number }[]
  topPickupZones: { zone: string; count: number; pct: number }[]
  occupancyTrend: { day: string; pct: number }[]
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const result = await api.getAnalytics()
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[Analytics] Failed to load real analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const totalRequests = data?.totalRequests ?? 0
  const sharedRides = data?.sharedRides ?? 0
  const vehiclesUsed = data?.vehiclesUsed ?? 0
  const vehicleReduction = data?.vehicleReduction ?? 0
  const avgOccupancy = data?.avgOccupancy ?? 0
  const estimatedSavings = data?.estimatedSavings ?? 0
  const totalStudents = data?.totalStudents ?? 0
  const demandByHour = data?.demandByHour ?? []
  const occupancyTrend = data?.occupancyTrend ?? []
  const topPickupZones = data?.topPickupZones ?? []

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Mobility Intelligence & Network Analytics"
        subtitle="Computational trip pooling efficiency, vehicle miles traveled (VMT) reduction, hourly demand surge, and emission savings"
        onRefresh={loadAnalytics}
        isRefreshing={loading}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 text-[#2563EB] animate-spin" />
              <p className="text-sm font-semibold text-[#17202A]">Computing analytics from live database...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Individual Requests</p>
                  <p className="text-2xl font-bold text-[#17202A]">{totalRequests}</p>
                  <p className="text-xs text-[#5E6875] mt-0.5">{totalStudents} registered members</p>
                </div>
              </Card>

              <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0F9F8F] flex-shrink-0">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Shared Trips Formed</p>
                  <p className="text-2xl font-bold text-[#0F9F8F]">{sharedRides}</p>
                  <p className="text-xs text-[#0F9F8F] font-medium mt-0.5">Pooled corridor shuttles</p>
                </div>
              </Card>

              <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Vehicles Deployed</p>
                  <p className="text-2xl font-bold text-[#17202A]">{vehiclesUsed}</p>
                  <p className="text-xs text-[#5E6875] mt-0.5">Optimal asset utilization</p>
                </div>
              </Card>

              <Card className="bg-white border-[#E5EAF0] p-4 flex items-center gap-4 shadow-sm hover:border-[#2563EB]/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0F9F8F] flex-shrink-0">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5E6875]">Fleet Reduction</p>
                  <p className="text-2xl font-bold text-[#0F9F8F]">{vehicleReduction}%</p>
                  <p className="text-xs text-[#0F9F8F] font-medium mt-0.5">Fewer campus cars</p>
                </div>
              </Card>
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demand by hour */}
              <Card className="bg-white border-[#E5EAF0] p-5 shadow-sm space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-[#17202A]">Hourly Commuter Demand Curve</h3>
                  <p className="text-xs text-[#5E6875]">Ride bookings aggregated across time of day</p>
                </div>

                {demandByHour.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-[#8C9BAE] text-xs">
                    No booking data available yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={demandByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#5E6875' }} interval={1} />
                      <YAxis tick={{ fontSize: 10, fill: '#5E6875' }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #E5EAF0',
                          backgroundColor: '#FFFFFF',
                          fontSize: 12,
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Bar dataKey="requests" fill="#2563EB" radius={[6, 6, 0, 0]} name="Commuter Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Occupancy trend */}
              <Card className="bg-white border-[#E5EAF0] p-5 shadow-sm space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-[#17202A]">Fleet Occupancy Rate (%)</h3>
                  <p className="text-xs text-[#5E6875]">Weekly average seating efficiency trend</p>
                </div>

                {occupancyTrend.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-[#8C9BAE] text-xs">
                    No occupancy history available yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={occupancyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#5E6875' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#5E6875' }} domain={[0, 100]} unit="%" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #E5EAF0',
                          backgroundColor: '#FFFFFF',
                          fontSize: 12,
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={(v: any) => [`${v}%`, 'Occupancy']}
                      />
                      <Line
                        type="monotone"
                        dataKey="pct"
                        stroke="#0F9F8F"
                        strokeWidth={2.5}
                        dot={{ fill: '#0F9F8F', r: 4 }}
                        name="Occupancy"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top pickup zones */}
              <Card className="bg-white border-[#E5EAF0] p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-[#17202A]">High-Density Corridor Hubs</h3>
                  <p className="text-xs text-[#5E6875]">Origin points with highest student and faculty boarding volume</p>
                </div>

                {topPickupZones.length === 0 ? (
                  <div className="flex items-center justify-center h-[140px] text-[#8C9BAE] text-xs">
                    No zone telemetry recorded
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topPickupZones.map(({ zone, count, pct }, i) => (
                      <div key={zone}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="font-semibold text-[#17202A]">{zone}</span>
                          <span className="font-bold text-[#2563EB]">{count} pickups</span>
                        </div>
                        <div className="h-2 bg-[#F7F9FC] rounded-full overflow-hidden border border-[#E5EAF0]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Pooling efficiency */}
              <Card className="bg-white border-[#E5EAF0] p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-[#17202A]">Corridor Pooling vs Solo Dispatches</h3>
                  <p className="text-xs text-[#5E6875]">Proportion of consolidated multi-passenger trips</p>
                </div>

                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pooled Trips', value: sharedRides || 1 },
                          { name: 'Solo Dispatches', value: Math.max(0, totalRequests - sharedRides) },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill="#2563EB" />
                        <Cell fill="#E5EAF0" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: '1px solid #E5EAF0',
                          backgroundColor: '#FFFFFF',
                          fontSize: 12,
                        }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#F7F9FC] rounded-xl p-2.5 border border-[#E5EAF0]">
                    <p className="font-bold text-[#17202A] text-base">{totalRequests}</p>
                    <p className="text-[10px] text-[#5E6875]">Requests</p>
                  </div>
                  <div className="flex items-center justify-center text-[#8C9BAE]">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-200">
                    <p className="font-bold text-[#2563EB] text-base">{vehiclesUsed}</p>
                    <p className="text-[10px] text-[#2563EB]">Vehicles</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Estimated cumulative savings */}
            <Card className="bg-gradient-to-r from-[#2563EB] to-blue-700 text-white p-6 rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
                    <Fuel className="w-4 h-4" />
                    Institutional Sustainability & Cost Matrix
                  </div>
                  <h3 className="font-bold text-xl text-white">Estimated Cumulative Fleet Savings</h3>
                  <p className="text-blue-100 text-xs mt-1">Reduced fuel consumption, lower congestion, and passenger fare consolidation</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-mono font-bold text-3xl text-white">₹{estimatedSavings.toLocaleString()}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{totalStudents} active institutional commuters</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
