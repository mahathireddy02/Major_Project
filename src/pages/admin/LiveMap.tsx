import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  MapPin,
  Navigation,
  Car,
  AlertTriangle,
  Shield,
  CheckCircle2,
  Users,
  Clock,
  Phone,
  RefreshCw,
  Layers,
  Compass,
  ArrowRight,
  ExternalLink,
  RotateCw,
  RotateCcw,
  Sparkles,
  Eye,
  Filter,
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { api } from '../../services/api'
import DispatcherHeader from '../../components/admin/DispatcherHeader'
import CampusMap, { VehicleData } from '../../components/map'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import SeatProgress from '../../components/ui/SeatProgress'
import DetailDrawer from '../../components/admin/DetailDrawer'
import { getRideStatusLabel } from '../../lib/utils'
import type { Ride, Vehicle, Driver } from '../../types'
import toast from 'react-hot-toast'

export default function LiveMap() {
  const rides = useAppStore((s) => s.rides)
  const vehicles = useAppStore((s) => s.vehicles)
  const drivers = useAppStore((s) => s.drivers)
  const recalculateRideRoute = useAppStore((s) => s.recalculateRideRoute)
  const triggerDeviation = useAppStore((s) => s.triggerDeviation)
  const loadDispatcherData = useAppStore((s) => s.loadDispatcherData)

  const [selectedRideId, setSelectedRideId] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'alerts'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRerouting, setIsRerouting] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'manifest' | 'route' | 'telematics'>('manifest')
  const [cameraMode, setCameraMode] = useState<'FOLLOW' | 'OVERVIEW' | 'FREE_EXPLORE'>('FREE_EXPLORE')

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await loadDispatcherData()
      toast.success('Fleet telematics refreshed')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to refresh fleet telematics')
    } finally {
      setIsRefreshing(false)
    }
  }, [loadDispatcherData])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Filter rides
  const activeRides = useMemo(() => {
    return rides.filter((r) => {
      if (filterMode === 'alerts') return r.hasDeviation || r.hasSosAlert
      if (filterMode === 'active') return r.status === 'active' || r.status === 'boarding'
      return r.status !== 'completed' && r.status !== 'cancelled'
    })
  }, [rides, filterMode])

  // Current selected ride
  const selectedRide = useMemo(() => {
    return (
      (selectedRideId ? rides.find((r) => r.id === selectedRideId) : null) ||
      activeRides[0] ||
      rides[0] ||
      null
    )
  }, [rides, selectedRideId, activeRides])

  // Vehicle and Driver for selected ride
  const selectedVehicle = selectedRide ? vehicles.find((v) => v.id === selectedRide.vehicleId) : null
  const selectedDriver = selectedRide ? drivers.find((d) => d.id === selectedRide.driverId) : null

  // Map fleet vehicles format
  const fleetVehicles: VehicleData[] = useMemo(() => {
    return rides
      .filter((r) => r.status !== 'completed' && r.status !== 'cancelled')
      .map((ride) => {
        const v = vehicles.find((veh) => veh.id === ride.vehicleId)
        const d = drivers.find((drv) => drv.id === ride.driverId)
        return {
          id: ride.vehicleId || ride.id,
          name: v ? v.name : 'Campus Shuttle',
          capacity: ride.capacity,
          bookedSeats: ride.bookedSeats,
          status: ride.status === 'active' ? 'ON_TRIP' : 'AVAILABLE',
          lat: ride.currentLat,
          lng: ride.currentLng,
          driverName: d ? d.name : 'Institutional Driver',
          isDeviated: ride.hasDeviation,
          isAlert: ride.hasSosAlert || ride.hasDeviation,
        }
      })
  }, [rides, vehicles, drivers])

  // Map route points
  // Palette for distinct vehicle routes
  const ROUTE_COLORS = [
    '#2563EB', // Blue
    '#059669', // Emerald
    '#7C3AED', // Purple
    '#D97706', // Amber
    '#06B6D4', // Cyan
    '#DC2626', // Red
    '#EA580C', // Orange
    '#4F46E5', // Indigo
  ]

  // All active routes rendered simultaneously on dispatcher map
  const allMultiRoutes = useMemo(() => {
    return activeRides
      .filter(
        (r) =>
          (r.tripRoute?.geometry && r.tripRoute.geometry.length > 1) ||
          (r.routeCoordinates && r.routeCoordinates.length > 1)
      )
      .map((ride, index) => {
        const isSelected = selectedRide?.id === ride.id
        return {
          id: ride.id,
          name: ride.routeName,
          color:
            ride.hasDeviation || ride.hasSosAlert
              ? '#EF4444'
              : ROUTE_COLORS[index % ROUTE_COLORS.length],
          coordinates: ride.tripRoute?.geometry || ride.routeCoordinates || [],
          vehicleId: ride.vehicleId,
          status: getRideStatusLabel(ride.status),
          stops: ride.stops || [],
          isSelected,
        }
      })
  }, [activeRides, selectedRide])

  // Map route points: pickups + ALL individual per-passenger dropoff stops
  const mapPoints = useMemo(() => {
    if (!selectedRide) return []
    const pts: { lat: number; lng: number; label: string; type: 'pickup' | 'destination' }[] = []

    // Add all pickup points
    selectedRide.pickupPoints.forEach((pp) => {
      pts.push({ lat: pp.lat, lng: pp.lng, label: pp.name, type: 'pickup' as const })
    })

    // If we have per-stop data, show each passenger's dropoff separately
    if (selectedRide.stops && selectedRide.stops.length > 0) {
      const dropoffStops = selectedRide.stops.filter(
        (s: any) => s.type === 'DROPOFF' || s.type === 'dropoff' || s.stopType === 'DROPOFF'
      )

      if (dropoffStops.length > 0) {
        dropoffStops.forEach((s: any) => {
          const lat = s.latitude ?? s.lat
          const lng = s.longitude ?? s.lng
          if (lat && lng) {
            pts.push({ lat, lng, label: s.name || s.stopName || 'Dropoff', type: 'destination' as const })
          }
        })
        return pts
      }
    }

    // Fallback: single destination from ride-level field
    if (selectedRide.destinationLat && selectedRide.destinationLng) {
      pts.push({
        lat: selectedRide.destinationLat,
        lng: selectedRide.destinationLng,
        label: selectedRide.destination,
        type: 'destination' as const,
      })
    }

    return pts
  }, [selectedRide])

  const isAlertMode = Boolean(selectedRide?.hasDeviation || selectedRide?.hasSosAlert)

  const handleRecalculateRoute = async () => {
    if (!selectedRide) return
    setIsRerouting(true)
    try {
      if (recalculateRideRoute) {
        await recalculateRideRoute(selectedRide.id)
      } else {
        await api.recalculateRoute(selectedRide.id)
      }
      await loadDispatcherData()
      toast.success(`Route recomputed via OSRM for ${selectedRide.routeName}`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to recalculate route')
    } finally {
      setIsRerouting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <DispatcherHeader
        title="Live Fleet & Mobility Network Map"
        subtitle="Real-time GPS telematics, route telemetry, passenger boarding verification, and deviation containment"
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl mx-auto w-full p-4 lg:p-6 gap-6">
        {/* Left / Center: Interactive Map Area */}
        <div className="flex-1 flex flex-col gap-4 min-h-[500px]">
          {/* Map Top Bar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5EAF0] shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0F9F8F] animate-pulse" />
              <span className="text-xs font-bold text-[#17202A] tracking-wide">
                LIVE GPS TELEMETRY STREAM
              </span>
              <span className="text-xs font-medium text-[#5E6875] hidden sm:inline">
                • {fleetVehicles.length} vehicles transmitting
              </span>
            </div>

            {/* Filter mode toggles */}
            <div className="flex items-center bg-[#F7F9FC] p-1 rounded-xl border border-[#E5EAF0]">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterMode === 'all'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                All Fleet ({rides.filter((r) => r.status !== 'completed' && r.status !== 'cancelled').length})
              </button>
              <button
                onClick={() => setFilterMode('active')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterMode === 'active'
                    ? 'bg-white text-[#0F9F8F] shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                In-Transit ({rides.filter((r) => r.status === 'active').length})
              </button>
              <button
                onClick={() => setFilterMode('alerts')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterMode === 'alerts'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-[#5E6875] hover:text-[#17202A]'
                }`}
              >
                Alerts ({rides.filter((r) => r.hasDeviation || r.hasSosAlert).length})
              </button>
            </div>
          </div>

          {/* Map canvas */}
          <div className="flex-1 min-h-[420px] rounded-2xl overflow-hidden border border-[#E5EAF0] shadow-sm relative bg-slate-100">
            <CampusMap
              points={mapPoints}
              stops={selectedRide?.stops || []}
              routeCoordinates={selectedRide?.tripRoute?.geometry || selectedRide?.routeCoordinates || []}
              multiRoutes={allMultiRoutes}
              selectedRouteId={selectedRide?.id}
              onRouteSelect={(routeId) => setSelectedRideId(routeId)}
              vehicles={fleetVehicles}
              vehicleLat={selectedRide?.currentLat}
              vehicleLng={selectedRide?.currentLng}
              vehicleHeading={selectedVehicle?.heading || 0}
              cameraMode={cameraMode}
              onCameraModeChange={setCameraMode}
              height="100%"
              className="w-full h-full min-h-[450px]"
              interactive
              alertMode={isAlertMode}
            />

            {/* Floating Dispatcher Controls Over Map */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  {selectedRide ? selectedRide.routeName : 'Fleet View'}
                </span>
                {selectedRide?.status && (
                  <Badge size="sm" variant={selectedRide.status === 'active' ? 'green' : 'blue'}>
                    {getRideStatusLabel(selectedRide.status)}
                  </Badge>
                )}
              </div>

              {selectedRide && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isRerouting}
                  onClick={handleRecalculateRoute}
                  className="bg-white/95 backdrop-blur-md shadow-md text-xs h-8 px-2.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={12} className={isRerouting ? 'animate-spin text-[#2563EB]' : ''} />
                  <span>{isRerouting ? 'Rerouting...' : 'Recalculate Route'}</span>
                </Button>
              )}
            </div>

            {/* Camera Focus Controls */}
            <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200 flex items-center gap-1 text-[11px] font-semibold">
              <button
                onClick={() => setCameraMode('FREE_EXPLORE')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  cameraMode === 'FREE_EXPLORE' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Explore Map
              </button>
              <button
                onClick={() => setCameraMode('FOLLOW')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  cameraMode === 'FOLLOW' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Focus Vehicle
              </button>
              <button
                onClick={() => setCameraMode('OVERVIEW')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  cameraMode === 'OVERVIEW' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fit All Fleet
              </button>
            </div>
          </div>

          {/* Bottom quick inspection card */}
          {selectedRide && (
            <Card className="bg-white border-[#E5EAF0] p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#17202A] flex items-center gap-2">
                      {selectedRide.routeName}
                      <Badge
                        variant={
                          selectedRide.status === 'active'
                            ? 'green'
                            : selectedRide.status === 'boarding'
                            ? 'yellow'
                            : 'blue'
                        }
                        size="sm"
                      >
                        {getRideStatusLabel(selectedRide.status)}
                      </Badge>
                    </h4>
                    <p className="text-xs text-[#5E6875] mt-0.5">
                      {selectedRide.pickupPoints.map((p) => p.name).join(' → ')} → {selectedRide.destination}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#5E6875] mb-1">
                      <span>Occupancy</span>
                      <strong className="text-[#17202A]">
                        {selectedRide.bookedSeats} / {selectedRide.capacity} Seats
                      </strong>
                    </div>
                    <SeatProgress
                      filled={selectedRide.bookedSeats}
                      total={selectedRide.capacity}
                      size="sm"
                      showLabel={false}
                      className="w-32"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setShowDrawer(true)
                      setDrawerTab('manifest')
                    }}
                    className="px-3 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Details
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar: Active Rides Roster & Detailed Vehicle Telematics */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          {/* Active Rides List */}
          <Card className="bg-white border-[#E5EAF0] shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-[#E5EAF0] flex items-center justify-between bg-[#F7F9FC]">
              <div>
                <h3 className="font-bold text-sm text-[#17202A]">Active Routes ({activeRides.length})</h3>
                <p className="text-[11px] text-[#5E6875]">Select to focus camera & telematics</p>
              </div>
              <Badge variant="blue" size="sm">{activeRides.length} Live</Badge>
            </div>

            <div className="divide-y divide-[#E5EAF0] overflow-y-auto max-h-[380px]">
              {activeRides.length === 0 ? (
                <div className="p-8 text-center text-[#5E6875]">
                  <Navigation className="w-8 h-8 text-[#8C9BAE] mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-xs text-[#17202A]">No routes match filter</p>
                </div>
              ) : (
                activeRides.map((ride, rIdx) => {
                  const isSelected = selectedRide?.id === ride.id
                  const hasAlert = ride.hasDeviation || ride.hasSosAlert
                  const routeColor = hasAlert ? '#EF4444' : ROUTE_COLORS[rIdx % ROUTE_COLORS.length]

                  return (
                    <button
                      key={ride.id}
                      onClick={() => setSelectedRideId(ride.id)}
                      className={`w-full p-3.5 text-left transition-all cursor-pointer flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-[#DBEAFE]/30 border-l-4 border-[#2563EB]'
                          : 'hover:bg-[#F7F9FC]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                            style={{ backgroundColor: routeColor }}
                          />
                          <span className="font-bold text-xs text-[#17202A] truncate">
                            {ride.routeName}
                          </span>
                        </div>
                        {hasAlert && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> ALERT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#5E6875]">
                        <span className="truncate max-w-[180px]">
                          {ride.pickupPoints[0]?.name || 'Origin'} → {ride.destination}
                        </span>
                        <span className="font-mono">{ride.departureTime}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Badge
                          variant={
                            ride.status === 'active'
                              ? 'green'
                              : ride.status === 'boarding'
                              ? 'yellow'
                              : 'blue'
                          }
                          size="sm"
                          className="text-[10px]"
                        >
                          {getRideStatusLabel(ride.status)}
                        </Badge>
                        <span className="text-[11px] font-semibold text-[#17202A]">
                          {ride.bookedSeats}/{ride.capacity} seats
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </Card>

          {/* Selected Ride Quick Control Dossier */}
          {selectedRide && (
            <Card className="bg-white border-[#E5EAF0] p-4 shadow-sm space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#5E6875] flex items-center justify-between">
                <span>Vehicle & Operator Dossier</span>
                <span className="font-mono text-[#2563EB]">#{selectedRide.id}</span>
              </h4>

              {/* Driver & Vehicle info */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={selectedDriver?.name || 'Driver'} size="sm" />
                    <div>
                      <p className="font-bold text-xs text-[#17202A]">{selectedDriver?.name || 'Assigned Driver'}</p>
                      <p className="text-[11px] text-[#5E6875]">{selectedDriver?.phone || '+1 (555) 019-2831'}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${selectedDriver?.phone || ''}`}
                    className="p-2 rounded-lg bg-white border border-[#E5EAF0] text-[#2563EB] hover:bg-blue-50 transition-colors"
                    title="Call Operator"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#17202A]">{selectedVehicle?.name || 'Electric Shuttle'}</p>
                      <p className="text-[11px] font-mono text-[#5E6875]">{selectedVehicle?.registration || 'CAMPUS-EV'}</p>
                    </div>
                  </div>
                  <Badge variant="green" size="sm">EV ACTIVE</Badge>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5EAF0]">
                <button
                  onClick={handleRecalculateRoute}
                  disabled={isRerouting}
                  className="px-3 py-2 rounded-xl bg-[#F7F9FC] hover:bg-[#DBEAFE]/50 text-[#2563EB] border border-[#E5EAF0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRerouting ? 'animate-spin' : ''}`} />
                  Recalculate Route
                </button>

                <button
                  onClick={() => triggerDeviation(selectedRide.id)}
                  className="px-3 py-2 rounded-xl bg-[#F7F9FC] hover:bg-red-50 text-red-600 border border-[#E5EAF0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Simulate Flag
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      <DetailDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={selectedRide?.routeName || 'Route Telematics'}
        subtitle={`Live Commute Dispatch • Trip #${selectedRide?.id}`}
        badge={{
          label: selectedRide?.status ? getRideStatusLabel(selectedRide.status) : 'Active',
          variant: selectedRide?.status === 'active' ? 'green' : 'blue',
        }}
        tabs={[
          { key: 'manifest', label: `Passenger Manifest (${selectedRide?.passengers?.length || 0})` },
          { key: 'route', label: 'Stops & Waypoints' },
          { key: 'telematics', label: 'Hardware Telematics' },
        ]}
        activeTab={drawerTab}
        onTabChange={(tab) => setDrawerTab(tab as any)}
      >
        {selectedRide && (
          <div className="space-y-5">
            {drawerTab === 'manifest' && (
              <div className="space-y-3">
                <p className="text-xs text-[#5E6875] font-semibold uppercase tracking-wider">
                  Boarding Manifest ({selectedRide.passengers?.length || 0} passengers)
                </p>
                {(!selectedRide.passengers || selectedRide.passengers.length === 0) ? (
                  <div className="p-8 text-center bg-[#F7F9FC] rounded-xl border border-[#E5EAF0]">
                    <Users className="w-8 h-8 text-[#8C9BAE] mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-[#17202A]">No passengers currently assigned</p>
                  </div>
                ) : (
                  selectedRide.passengers.map((p, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-[#E5EAF0] flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#17202A]">{p.name}</p>
                        <p className="text-[11px] text-[#5E6875] mt-0.5">Pickup: {p.pickup} • Seat #{p.seatNo}</p>
                      </div>
                      <Badge variant={p.status === 'boarded' ? 'green' : 'yellow'} size="sm">
                        {p.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {drawerTab === 'route' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {selectedRide.pickupPoints.map((pt, idx) => (
                    <div key={pt.id || idx} className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-[#17202A]">{pt.name}</span>
                      </div>
                      <span className="font-mono text-[#5E6875]">{pt.estimatedPickupTime}</span>
                    </div>
                  ))}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0F9F8F]" />
                      <span className="font-bold text-emerald-900">{selectedRide.destination} (Final Dropoff)</span>
                    </div>
                    <span className="font-mono text-emerald-800">{selectedRide.estimatedArrival}</span>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'telematics' && (
              <div className="space-y-3">
                <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-[#5E6875] uppercase">Current Latitude</p>
                    <p className="font-mono font-bold text-[#17202A] mt-0.5">{selectedRide.currentLat.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5E6875] uppercase">Current Longitude</p>
                    <p className="font-mono font-bold text-[#17202A] mt-0.5">{selectedRide.currentLng.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5E6875] uppercase">Distance to Goal</p>
                    <p className="font-bold text-[#17202A] mt-0.5">{selectedRide.distanceKm || 3.4} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5E6875] uppercase">GPS Signal</p>
                    <p className="font-bold text-[#0F9F8F] mt-0.5">High Precision (RTK Fix)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  )
}