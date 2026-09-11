import React, { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin,
  Navigation,
  Crosshair,
  Compass,
  Check,
  X,
  Search,
  Loader2,
  Play,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Ride } from '../../types'
import { geocodingService } from '../../services/geocoding/geocodingService'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import toast from 'react-hot-toast'

export interface SelectedStartPoint {
  name: string
  lat: number
  lng: number
  address?: string
}

interface StartPointSelectorModalProps {
  isOpen: boolean
  ride?: Ride | null
  onConfirm: (startPoint: SelectedStartPoint) => void
  onClose: () => void
  isStarting?: boolean
}

const PRESET_LOCATIONS: { name: string; lat: number; lng: number; desc: string }[] = [
  { name: 'Charminar Bus Stand', lat: 17.3616, lng: 78.4747, desc: 'Old City Hub' },
  { name: 'Koti Bus Station', lat: 17.385, lng: 78.4867, desc: 'Central Transit' },
  { name: 'LB Nagar Junction', lat: 17.3556, lng: 78.5522, desc: 'East Transit Ring' },
  { name: 'Dilsukhnagar Hub', lat: 17.3688, lng: 78.5247, desc: 'Metro Station' },
  { name: 'Secunderabad Station', lat: 17.4399, lng: 78.4983, desc: 'North Transit' },
  { name: 'SRI INDU Campus Main Gate', lat: 17.2063, lng: 78.6015, desc: 'Campus Ground' },
]

export const StartPointSelectorModal: React.FC<StartPointSelectorModalProps> = ({
  isOpen,
  ride,
  onConfirm,
  onClose,
  isStarting = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const defaultInitialLat =
    ride?.currentLat || ride?.startLocationLat || ride?.pickupPoints?.[0]?.lat || 17.3616
  const defaultInitialLng =
    ride?.currentLng || ride?.startLocationLng || ride?.pickupPoints?.[0]?.lng || 78.4747
  const defaultInitialName =
    ride?.startLocation || ride?.pickupPoints?.[0]?.name || 'My Current Location'

  const [selectedPoint, setSelectedPoint] = useState<SelectedStartPoint>({
    name: defaultInitialName,
    lat: defaultInitialLat,
    lng: defaultInitialLng,
  })

  const [isLocatingGps, setIsLocatingGps] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)

  // Reverse geocode when coordinates change via map click
  const resolveCoordinates = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true)
    try {
      const place = await geocodingService.reverseGeocode(lat, lng)
      if (place && place.name) {
        setSelectedPoint({
          name: place.name,
          lat,
          lng,
          address: place.address,
        })
        return
      }
    } catch {
      // ignore
    } finally {
      setIsReverseGeocoding(false)
    }

    setSelectedPoint((prev) => ({
      ...prev,
      name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng,
    }))
  }, [])

  // Initialize or re-center map when opened
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [selectedPoint.lat, selectedPoint.lng],
        zoom: 14,
        zoomControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      // Start marker
      const startIcon = L.divIcon({
        className: 'custom-driver-start-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: #16a34a; color: white; padding: 4px 8px; border-radius: 9999px; font-weight: bold; font-size: 11px; white-space: nowrap; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); border: 2px solid white; display: flex; align-items: center; gap: 4px;">
              <span>🚗</span> Start Point
            </div>
            <div style="width: 14px; height: 14px; background: #16a34a; transform: rotate(45deg); margin-top: -7px; border: 2px solid white;"></div>
          </div>
        `,
        iconSize: [0, 0],
      })

      const marker = L.marker([selectedPoint.lat, selectedPoint.lng], {
        icon: startIcon,
        draggable: true,
      }).addTo(map)

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        resolveCoordinates(pos.lat, pos.lng)
      })

      markerRef.current = marker

      // Map click places marker
      ;(map as any).on('click', (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        resolveCoordinates(lat, lng)
      })

      // Add other ride stops as small reference markers
      ;(ride?.pickupPoints || []).forEach((pp: any, idx: number) => {
        const stopIcon = L.divIcon({
          className: 'custom-stop-pin',
          html: `<div style="background: #2563eb; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${idx + 1}</div>`,
          iconSize: [22, 22],
        })
        L.marker([pp.lat, pp.lng], { icon: stopIcon })
          .addTo(map)
          .bindTooltip(`Pickup: ${pp.name}`)
      })

      // Destination marker
      const destLat = ride?.destinationLat || 17.2063
      const destLng = ride?.destinationLng || 78.6015
      const destName = ride?.destination || 'SRI INDU Campus Main Gate'
      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `<div style="background: #dc2626; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">🏁</div>`,
        iconSize: [22, 22],
      })
      L.marker([destLat, destLng], { icon: destIcon })
        .addTo(map)
        .bindTooltip(`Destination: ${destName}`)

      mapInstanceRef.current = map
    } else {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize()
        mapInstanceRef.current?.setView([selectedPoint.lat, selectedPoint.lng], 14)
        markerRef.current?.setLatLng([selectedPoint.lat, selectedPoint.lng])
      }, 100)
    }
  }, [isOpen, selectedPoint.lat, selectedPoint.lng, ride, resolveCoordinates])

  // Update map when selectedPoint changes
  const applyCoordinate = (lat: number, lng: number, name: string, address?: string) => {
    setSelectedPoint({ name, lat, lng, address })
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15, { animate: true })
      markerRef.current.setLatLng([lat, lng])
    }
  }

  // Handle GPS detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setIsLocatingGps(true)
    toast.loading('Acquiring high-accuracy GPS coordinates...', { id: 'gps-load' })

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        toast.dismiss('gps-load')
        setIsLocatingGps(false)
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        toast.success('Live GPS coordinates locked!', { icon: '🎯' })
        await resolveCoordinates(lat, lng)
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16, { animate: true })
          markerRef.current.setLatLng([lat, lng])
        }
      },
      (err) => {
        toast.dismiss('gps-load')
        setIsLocatingGps(false)
        toast.error(`GPS Error: ${err.message}. Please pick on the map or select a hub.`)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 1000 }
    )
  }

  // Search places
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await geocodingService.searchPlaces(query)
      setSearchResults(results.slice(0, 5))
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up border border-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="green" className="bg-white/20 text-white border-transparent text-[11px]">
                Driver Route Telematics
              </Badge>
              <span className="text-xs text-emerald-100 font-medium">Start Location</span>
            </div>
            <h3 className="font-heading font-bold text-lg sm:text-xl text-white mt-1">
              Where are you starting from?
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Choose your actual vehicle start location to calculate navigation to the first pickup.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isStarting}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Action: Live GPS button */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleDetectGps}
              loading={isLocatingGps}
              className="flex-1 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs py-2.5 shadow-2xs"
            >
              <Crosshair size={15} className="mr-1.5 text-emerald-600 animate-pulse" />
              Use My Current GPS Position
            </Button>
          </div>

          {/* Search place input */}
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search starting location (e.g. Charminar, Koti, Campus Gate)..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              {isSearching && (
                <Loader2 size={15} className="absolute right-3 top-2.5 text-emerald-600 animate-spin" />
              )}
            </div>

            {/* Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 overflow-hidden">
                {searchResults.map((place, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      applyCoordinate(place.lat, place.lng, place.name, place.address)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-xs transition-colors cursor-pointer"
                  >
                    <MapPin size={13} className="text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate">{place.name}</p>
                      {place.address && (
                        <p className="text-[11px] text-slate-400 truncate">{place.address}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preset Chips */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Popular Starting Points:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {/* Predefined pickup 1 */}
              {ride?.pickupPoints?.[0] && (
                <button
                  type="button"
                  onClick={() =>
                    applyCoordinate(
                      ride.pickupPoints[0].lat,
                      ride.pickupPoints[0].lng,
                      ride.pickupPoints[0].name
                    )
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                    selectedPoint.name === ride.pickupPoints[0].name
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>📍</span>
                  <span>{ride.pickupPoints[0].name}</span>
                  <span className="text-[10px] opacity-75 font-normal">(Stop #1)</span>
                </button>
              )}

              {PRESET_LOCATIONS.map((loc) => {
                const isSelected = selectedPoint.name === loc.name
                return (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => applyCoordinate(loc.lat, loc.lng, loc.name, loc.desc)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {loc.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Interactive Leaflet Map for Pinning */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Tap anywhere on map or drag pin to adjust:
              </span>
              {isReverseGeocoding && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" /> Resolving address...
                </span>
              )}
            </div>
            <div className="h-44 sm:h-52 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>
          </div>

          {/* Current Selection & Route Progression Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                1
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Chosen Start Location
                </span>
                <span className="font-bold text-slate-900 text-sm block truncate">
                  {selectedPoint.name}
                </span>
                <span className="text-[10px] text-slate-500">
                  Lat: {selectedPoint.lat.toFixed(4)}, Lng: {selectedPoint.lng.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="border-l-2 border-dashed border-slate-300 ml-3 pl-4 py-1 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600">
                <ArrowRight size={11} className="text-emerald-600" />
                <span>Next: Pickup at <strong>{ride?.pickupPoints?.[0]?.name || 'Campus Corridor Hub'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <ArrowRight size={11} className="text-emerald-600" />
                <span>Final destination: <strong>{ride?.destination || 'SRI INDU Campus Main Gate'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isStarting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="green"
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md text-white font-bold"
            onClick={() => onConfirm(selectedPoint)}
            loading={isStarting}
          >
            <Play size={14} className="fill-current mr-1" />
            Start Ride from Here
          </Button>
        </div>
      </div>
    </div>
  )
}
