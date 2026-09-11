import { FavoritePlace, PlaceResult } from './types'

const RECENT_PLACES_KEY = 'campus_mobility_recent_places_v1'

export const DEFAULT_FAVORITES: FavoritePlace[] = [
  {
    id: 'fav-college',
    label: 'College',
    name: 'SRI INDU College of Engg & Tech',
    address: 'Ibrahimpatnam, Hyderabad, Telangana',
    lat: 17.2063,
    lng: 78.6015,
    icon: 'college',
  },
  {
    id: 'fav-home',
    label: 'Home',
    name: 'Kukatpally Housing Board (KPHB)',
    address: 'Kukatpally, Hyderabad, Telangana',
    lat: 17.4934,
    lng: 78.3995,
    icon: 'home',
  },
  {
    id: 'fav-station',
    label: 'Station',
    name: 'Secunderabad Railway Station',
    address: 'Secunderabad, Hyderabad, Telangana',
    lat: 17.4344,
    lng: 78.5017,
    icon: 'station',
  },
  {
    id: 'fav-hostel',
    label: 'Hostel Zone',
    name: 'Campus Hostel Block A',
    address: 'North Campus Hub, Hyderabad',
    lat: 17.398,
    lng: 78.479,
    icon: 'hostel',
  },
]

export function getRecentPlaces(): PlaceResult[] {
  try {
    const raw = localStorage.getItem(RECENT_PLACES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, 5) : []
  } catch {
    return []
  }
}

export function saveRecentPlace(place: PlaceResult): void {
  try {
    const recents = getRecentPlaces()
    const filtered = recents.filter((p) => p.id !== place.id && (p.lat !== place.lat || p.lng !== place.lng))
    const updated = [place, ...filtered].slice(0, 6)
    localStorage.setItem(RECENT_PLACES_KEY, JSON.stringify(updated))
  } catch {
    // Ignore storage quota errors
  }
}

export function clearRecentPlaces(): void {
  try {
    localStorage.removeItem(RECENT_PLACES_KEY)
  } catch {
    // Ignore
  }
}
