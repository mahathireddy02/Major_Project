import React, { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, Check, Locate, MapPin, Navigation, X, Loader2 } from 'lucide-react'
import { PlaceResult } from '../../services/geocoding/types'
import { geocodingService } from '../../services/geocoding/geocodingService'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

export interface MapLocationPickerModalProps {
  isOpen: boolean
  mode: 'pickup' | 'destination'
  initialLocation?: { lat: number; lng: number } | null
  onConfirm: (place: PlaceResult) => void
  onClose: () => void
}

export const MapLocationPickerModal: React.FC<MapLocationPickerModalProps> = ({
  isOpen,
  mode,
  initialLocation,
  onConfirm,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const debounceTimerRef = useRef<any>(null)

  const initLat = initialLocation?.lat ?? 17.385
  const initLng = initialLocation?.lng ?? 78.486

  const [currentCoords, setCurrentCoords] = useState<[number, number]>([initLat, initLng])
  const [resolvedPlace, setResolvedPlace] = useState<PlaceResult | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)

  // Fetch address for center point
  const fetchAddressAtCoords = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true)
    try {
      const place = await geocodingService.reverseGeocode(lat, lng)
      setResolvedPlace(place)
    } catch {
      setResolvedPlace({
        id: `map-loc-${lat}-${lng}`,
        name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        address: 'Selected map location, Hyderabad',
        lat,
        lng,
        type: 'map_pin',
      })
    } finally {
      setIsGeocoding(false)
    }
  }, [])

  // Initialize map once when modal opens
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return

    // If already created, ensure leaflet sizes itself correctly and return
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize()
      }, 100)
      return
    }

    const initialCenter: [number, number] = [initLat, initLng]
    setCurrentCoords(initialCenter)

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 16,
      zoomControl: false,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map)

    mapInstanceRef.current = map

    // Trigger initial reverse geocode
    fetchAddressAtCoords(initialCenter[0], initialCenter[1])

    // Invalidate size once DOM container is rendered
    setTimeout(() => {
      map.invalidateSize()
    }, 150)

    // Update location when map center moves (Rapido style center pin)
    const handleMove = () => {
      const center = map.getCenter()
      setCurrentCoords([center.lat, center.lng])

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchAddressAtCoords(center.lat, center.lng)
      }, 350)
    }

    map.on('movestart', () => {
      setIsGeocoding(true)
    })
    map.on('move', () => {
      setIsGeocoding(true)
    })
    map.on('moveend', handleMove)

    // Allow clicking on map to pan center
    map.on('click', (e: L.LeafletMouseEvent) => {
      map.panTo(e.latlng, { animate: true })
    })

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      map.remove()
      mapInstanceRef.current = null
    }
  }, [isOpen])

  // Locate me button handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17, { animate: true })
        }
        toast.success('Centered on your GPS position!')
      },
      (err) => {
        toast.error('Could not get GPS location. Drag the map to set location.')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleConfirm = () => {
    if (!resolvedPlace) {
      const fallbackPlace: PlaceResult = {
        id: `map-pin-${currentCoords[0]}-${currentCoords[1]}`,
        name: `Selected Location`,
        address: `${currentCoords[0].toFixed(4)}, ${currentCoords[1].toFixed(4)}`,
        lat: currentCoords[0],
        lng: currentCoords[1],
        type: 'pin',
      }
      onConfirm(fallbackPlace)
    } else {
      onConfirm(resolvedPlace)
    }
    onClose()
  }

  if (!isOpen) return null

  const isPickup = mode === 'pickup'
  const pinColor = isPickup ? '#16a34a' : '#dc2626'
  const pinTitle = isPickup ? 'Set Pickup point' : 'Set Destination point'

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="relative w-full h-full md:max-w-2xl md:h-[650px] bg-white md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header Bar */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-200 flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className={`w-4 h-4 ${isPickup ? 'text-green-600' : 'text-red-600'}`} />
                {isPickup ? 'Select Pickup on Map' : 'Select Destination on Map'}
              </h2>
              <p className="text-xs text-slate-500">Drag map to position pin</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map View Container */}
        <div className="relative flex-1 w-full overflow-hidden">
          {/* Leaflet Container */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Rapido Fixed Center Pin */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10 -translate-y-5">
            {/* Floating Tooltip Pill */}
            <div className="absolute -top-10 bg-slate-900/90 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-bounce">
              <span>{pinTitle}</span>
            </div>

            {/* Target Pin */}
            <div className="relative flex flex-col items-center">
              <div
                style={{ backgroundColor: pinColor }}
                className="w-10 h-10 rounded-full border-3 border-white shadow-2xl flex items-center justify-center text-white text-lg font-bold"
              >
                {isPickup ? '📍' : '🏁'}
              </div>
              <div className="w-1.5 h-3.5 bg-slate-800 rounded-full -mt-0.5" />
              <div className="w-3.5 h-1.5 bg-black/40 rounded-full filter blur-[1px]" />
            </div>
          </div>

          {/* Locate Me Floating Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            className="absolute bottom-5 right-4 z-10 p-3 bg-white text-slate-800 hover:text-blue-600 rounded-2xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            title="Locate my position"
          >
            <Locate className="w-5 h-5 text-blue-600" />
          </button>
        </div>

        {/* Rapido-Style Bottom Sheet / Confirmation Card */}
        <div className="p-4 md:p-5 bg-white border-t border-slate-200 shadow-2xl z-20">
          <div className="flex items-start gap-3 mb-4">
            <div
              style={{ backgroundColor: isPickup ? '#dcfce7' : '#fee2e2' }}
              className="p-2.5 rounded-xl shrink-0"
            >
              <MapPin
                style={{ color: isPickup ? '#16a34a' : '#dc2626' }}
                className="w-5 h-5"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {isPickup ? 'Pickup Location' : 'Destination Point'}
                </span>
                {isGeocoding && (
                  <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Locating...
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-base truncate mt-0.5">
                {resolvedPlace ? resolvedPlace.name : 'Loading address...'}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {resolvedPlace ? resolvedPlace.address : 'Move map to pinpoint location'}
              </p>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
              isPickup
                ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30'
                : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>CONFIRM {isPickup ? 'PICKUP' : 'DESTINATION'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MapLocationPickerModal
