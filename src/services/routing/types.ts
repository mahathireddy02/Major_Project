export interface Coordinate {
  lat: number
  lng: number
}

export interface RouteLeg {
  distanceMeters: number
  durationSeconds: number
  start: Coordinate
  end: Coordinate
  summary?: string
}

export interface RouteStep {
  instruction: string
  distanceMeters: number
  durationSeconds: number
  name: string
}

export interface RouteResult {
  distanceMeters: number
  durationSeconds: number
  geometry: [number, number][] // [lat, lng] format for Leaflet
  legs: RouteLeg[]
  steps?: RouteStep[]
  isFallback?: boolean
}

export interface TableResult {
  durations: number[][] // in seconds
  distances?: number[][] // in meters
}

export interface MapMatchResult {
  distanceMeters: number
  durationSeconds: number
  geometry: [number, number][]
  confidence: number
}

export interface DetourResult {
  bestOrder: Coordinate[]
  bestIndices: number[]
  originalDurationSeconds: number
  newDurationSeconds: number
  extraDurationSeconds: number
  extraDistanceMeters: number
  percentDetour: number
  isAcceptable: boolean
}

export interface RouteCompatibilityResult {
  score: number
  routeCompatible: boolean
  overlapPercent: number
  extraMinutes: number
  reasons: string[]
}
