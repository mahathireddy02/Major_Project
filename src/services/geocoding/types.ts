export interface PlaceResult {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type?: string
  district?: string
  city?: string
  state?: string
}

export interface LocationPoint {
  name: string
  address?: string
  latitude: number
  longitude: number
  placeId?: string
}

export interface FavoritePlace {
  id: string
  label: string
  name: string
  address: string
  lat: number
  lng: number
  icon: 'home' | 'college' | 'work' | 'station' | 'airport' | 'hostel'
}
