import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MapPin,
  Search,
  X,
  Clock,
  Navigation,
  Loader2,
  Home,
  GraduationCap,
  Train,
  Building,
  Check,
  Map,
} from 'lucide-react'
import { PlaceResult, FavoritePlace } from '../../services/geocoding/types'
import { geocodingService } from '../../services/geocoding/geocodingService'
import {
  getRecentPlaces,
  saveRecentPlace,
  DEFAULT_FAVORITES,
} from '../../services/geocoding/placeHistory'

export interface LocationSearchInputProps {
  label: string
  placeholder?: string
  value: string
  selectedPlace?: PlaceResult | null
  onSelectPlace: (place: PlaceResult) => void
  onClear?: () => void
  onUseCurrentLocation?: () => void
  onChooseOnMap?: () => void
  error?: string
  iconColor?: string
  autoFocus?: boolean
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  placeholder = 'Search a place, college, station, or locality...',
  value,
  selectedPlace,
  onSelectPlace,
  onClear,
  onUseCurrentLocation,
  onChooseOnMap,
  error,
  iconColor = 'text-blue-500',
  autoFocus = false,
}) => {
  const [inputValue, setInputValue] = useState(value || '')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([])
  const [recentPlaces, setRecentPlaces] = useState<PlaceResult[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<any>(null)

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  // Load recent places on mount
  useEffect(() => {
    setRecentPlaces(getRecentPlaces())
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced place search
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const results = await geocodingService.searchPlaces(query)
      setSuggestions(results)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setInputValue(text)
    setIsOpen(true)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(text)
    }, 320)
  }

  const handleSelect = (place: PlaceResult) => {
    setInputValue(place.name)
    setIsOpen(false)
    saveRecentPlace(place)
    setRecentPlaces(getRecentPlaces())
    onSelectPlace(place)
  }

  const handleClear = () => {
    setInputValue('')
    setSuggestions([])
    setIsOpen(false)
    if (onClear) onClear()
    inputRef.current?.focus()
  }

  const handleFavoriteClick = (fav: FavoritePlace) => {
    const place: PlaceResult = {
      id: fav.id,
      name: fav.name,
      address: fav.address,
      lat: fav.lat,
      lng: fav.lng,
      type: fav.icon,
    }
    handleSelect(place)
  }

  const getFavoriteIcon = (icon: string) => {
    switch (icon) {
      case 'home':
        return <Home className="w-3.5 h-3.5 text-indigo-500" />
      case 'college':
        return <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
      case 'station':
        return <Train className="w-3.5 h-3.5 text-amber-500" />
      default:
        return <Building className="w-3.5 h-3.5 text-slate-500" />
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        <span className="flex items-center gap-1.5">
          <MapPin className={`w-4 h-4 ${iconColor}`} />
          {label}
        </span>
      </label>

      {/* Input container */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full pl-9 pr-16 py-2.5 rounded-xl border text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
            error ? 'border-red-400' : 'border-slate-200 shadow-sm'
          }`}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {onChooseOnMap && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onChooseOnMap()
              }}
              className="p-1 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
              title="Select location on map (Rapido style)"
            >
              <Map className="w-4 h-4" />
            </button>
          )}

          {onUseCurrentLocation && (
            <button
              type="button"
              onClick={() => {
                onUseCurrentLocation()
                setIsOpen(false)
              }}
              className="p-1 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              title="Use current GPS location"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-80 flex flex-col divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Quick Action: Choose on Map (Rapido / Uber style) */}
          {onChooseOnMap && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onChooseOnMap()
              }}
              className="w-full px-4 py-2.5 text-left text-xs font-semibold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-emerald-100"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Map className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  Set location on map
                  <span className="text-[9px] uppercase font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded tracking-wider">
                    Interactive
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-normal">
                  Drag map pin to select exact pickup or drop point
                </div>
              </div>
            </button>
          )}

          {/* Quick Action: Use Current Location */}
          {onUseCurrentLocation && (
            <button
              type="button"
              onClick={() => {
                onUseCurrentLocation()
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50/80 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Use my current GPS location</span>
            </button>
          )}

          {/* Quick Favorite Chips (when query is short or empty) */}
          {(!inputValue || inputValue.length < 2) && (
            <div className="p-3 bg-slate-50/70">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Favorites
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {DEFAULT_FAVORITES.map((fav) => (
                  <button
                    key={fav.id}
                    type="button"
                    onClick={() => handleFavoriteClick(fav)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-all shadow-2xs cursor-pointer"
                  >
                    {getFavoriteIcon(fav.icon)}
                    <span className="font-medium">{fav.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {(!inputValue || inputValue.length < 2) && recentPlaces.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Recent Places</span>
              </div>
              <div className="divide-y divide-slate-50">
                {recentPlaces.map((recent) => (
                  <button
                    key={recent.id}
                    type="button"
                    onClick={() => handleSelect(recent)}
                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {recent.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {recent.address}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {inputValue && inputValue.length >= 2 && (
            <div className="overflow-y-auto max-h-56 divide-y divide-slate-100">
              {loading && suggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Searching locations across Hyderabad...</span>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item) => {
                  const isSelected = selectedPlace?.name === item.name
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-blue-50/60 flex items-start gap-3 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/80' : ''
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {item.name}
                          </p>
                          {item.type && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">
                              {item.type}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.address}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="p-5 text-center">
                  <p className="text-xs font-semibold text-slate-700">No exact location found</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Try searching: "Kukatpally", "SRI INDU College", "Secunderabad", or click on the map.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LocationSearchInput
