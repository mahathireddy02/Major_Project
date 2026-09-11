export type RideStatus =
  | 'waiting'
  | 'boarding'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'full'

export type UserRole = 'student' | 'faculty' | 'driver' | 'admin'

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'pending' | 'boarded' | 'in_transit'

export type SafetyEventType = 'sos' | 'deviation' | 'resolved'

export interface BaseUser {
  id: string
  name: string
  email?: string
  phone: string
  avatar: string
  role: UserRole
  rating: number
  totalRides?: number
  isVerified?: boolean
  verificationStatus?: VerificationStatus
  collegeName?: string
  rollNumber?: string
  collegeId?: string
  department?: string
  year?: number
  idCardPhoto?: string
  profilePhoto?: string
  gender?: 'Female' | 'Male' | 'Other' | 'Prefer not to say' | string
  detectedName?: string
  nameMatchStatus?: 'MATCHED' | 'MISMATCH' | 'NOT_CHECKED'
}

export interface Student extends BaseUser {
  studentId: string
  department: string
  year: number
  totalRides: number
  verified: boolean
  role: 'student'
}

export interface Faculty extends BaseUser {
  collegeId: string
  department: string
  role: 'faculty'
}

export interface Driver extends BaseUser {
  totalTrips: number
  verified: boolean
  licenseNo: string
  role: 'driver'
  vehicleId: string
  vehicleRegistration?: string
  vehicleType?: string
  licensePhoto?: string
  rcPhoto?: string
}

export interface Vehicle {
  id: string
  name: string
  type: string
  registration: string
  capacity: number
  driverId: string
  color: string
  verified: boolean
  rating: number
  totalTrips: number
  heading?: number
  speed?: number
  currentLat?: number
  currentLng?: number
  locationUpdatedAt?: string
}

export type StopType = 'PICKUP' | 'DROPOFF'
export type StopStatus = 'UPCOMING' | 'ARRIVING' | 'ARRIVED' | 'BOARDED' | 'COMPLETED'

export interface RouteStop {
  id: string
  bookingId?: string
  studentId?: string
  type: StopType
  name: string
  address?: string
  latitude: number
  longitude: number
  sequence: number
  status: StopStatus
  estimatedArrival?: string
}

export interface RouteStep {
  instruction: string
  distanceMeters: number
  durationSeconds: number
  maneuverType: string
  roadName?: string
}

export type TripRouteStatus =
  | 'PLANNED'
  | 'NAVIGATING'
  | 'OFF_ROUTE'
  | 'REROUTING'
  | 'ARRIVING'
  | 'COMPLETED'

export interface TripRoute {
  id: string
  rideId: string
  version: number
  origin: { lat: number; lng: number; name?: string }
  destination: { lat: number; lng: number; name?: string }
  stops: RouteStop[]
  geometry: [number, number][]
  distanceMeters: number
  durationSeconds: number
  remainingDistanceMeters: number
  remainingDurationSeconds: number
  progressPercent: number
  currentStopIndex: number
  status: TripRouteStatus
  steps?: RouteStep[]
}

export type MapCameraMode = 'FOLLOW' | 'OVERVIEW' | 'FREE_EXPLORE'

export interface LiveTripState {
  ride: Ride
  driver?: Driver
  vehicle?: Vehicle
  route: TripRoute
  stops: RouteStop[]
  progress: {
    percent: number
    distanceTraveledMeters: number
    remainingDistanceMeters: number
    remainingDurationSeconds: number
    etaString: string
    isOffRoute: boolean
    deviationMeters: number
  }
  currentStop: RouteStop | null
  nextManeuver?: RouteStep
  status: string
  isSimulated?: boolean
}

export interface PickupPoint {
  id: string
  name: string
  lat: number
  lng: number
  estimatedPickupTime: string
}

export interface Passenger {
  id?: string
  studentId: string
  userId?: string
  name: string
  pickup: string
  destination?: string
  status: 'waiting' | 'boarded' | 'dropped'
  seatNo: number
  fare?: number
  isPriceLocked?: boolean
  fareId?: string
  bookingId?: string
  fareBreakdown?: FareBreakdown
}

export interface Ride {
  id: string
  routeName: string
  driverId: string
  vehicleId: string
  pickupPoints: PickupPoint[]
  stops?: RouteStop[]
  tripRoute?: TripRoute
  destination: string
  destinationLat: number
  destinationLng: number
  departureTime: string
  estimatedArrival: string
  capacity: number
  bookedSeats: number
  passengers: Passenger[]
  status: RideStatus
  fare: number
  totalFareAmount?: number
  averageFare?: number
  totalSharedSavings?: number
  demandLevel?: 'LOW' | 'NORMAL' | 'HIGH'
  routeCoordinates: [number, number][]
  currentLat: number
  currentLng: number
  distanceKm: number
  distanceMeters?: number
  durationSeconds?: number
  hasDeviation: boolean
  hasSosAlert: boolean
  date: string
}

export interface Booking {
  id: string
  studentId: string
  studentName?: string
  rideId: string
  pickup: string
  pickupName?: string
  pickupAddress?: string
  pickupLat?: number
  pickupLng?: number
  destination: string
  destinationName?: string
  destinationAddress?: string
  destinationLat?: number
  destinationLng?: number
  pickupStopId?: string
  dropoffStopId?: string
  status: BookingStatus
  fare: number
  fareId?: string
  fareBreakdown?: FareBreakdown
  isPriceLocked?: boolean
  pricingVersion?: string
  seatNo: number
  bookedAt: string
  bookingTime?: string
  completedAt?: string
}

export interface Notification {
  id: string
  studentId: string
  driverId?: string
  userId?: string
  type: 'match' | 'full' | 'arriving' | 'safety' | 'system' | 'promo' | string
  title: string
  message: string
  read: boolean
  createdAt: string
  rideId?: string
}

export interface SafetyEvent {
  id: string
  rideId: string
  type?: SafetyEventType | string
  eventType?: SafetyEventType | string
  message: string
  description?: string
  severity?: string
  createdAt: string
  timestamp?: string | Date
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
}

export interface AdminUser {
  id: string
  name: string
  role: 'admin'
  avatar: string
}

export interface EmergencyContact {
  id?: string
  userId: string
  name: string
  relationship: string
  phone: string
  isPrimary?: boolean
}

export interface UserStats {
  role?: string
  totalRides: number
  completedRides: number
  upcomingRides?: number
  activeRides?: number
  cancelledRides?: number
  totalSaved?: number
  passengersServed?: number
  earnings?: number
  rating: number
}

export interface FareBreakdown {
  baseFare: number
  distanceFare: number
  durationFare: number
  routeContribution: number
  demandAdjustment: number
  sharedSavings: number
  aiAdjustment: number
  finalFare: number
  finalFarePaise: number
  currency: string
  rates: {
    perKm: number
    perMinute: number
    base: number
    minimumFare: number
    maximumFare: number
  }
  metrics: {
    distanceKm: number
    durationMinutes: number
    routeOverlapPercent: number
    additionalDistanceKm: number
    additionalDurationMinutes: number
    occupancy: number
    capacity: number
    demandTier: string
  }
  explanation: string
  aiAdvice?: {
    recommendedDemandFactor?: number
    recommendedSharedSavingsFactor?: number
    confidence?: number
    reason?: string
    anomaly?: boolean
    appliedAdjustmentPercent?: number
    source?: string
  }
}

export interface RideFare {
  id: string
  bookingId: string
  rideId: string
  passengerId?: string
  currency: string
  baseAmount: number
  distanceAmount: number
  timeAmount: number
  routeContributionAmount: number
  sharedSavingsAmount: number
  demandAdjustmentAmount: number
  aiAdjustmentAmount: number
  finalAmount: number
  finalAmountPaise: number
  distanceKm: number
  durationMinutes: number
  routeOverlapPercent: number
  additionalDistanceKm: number
  additionalDurationMinutes: number
  occupancyAtCalculation: number
  pricingVersion: string
  calculationStatus: 'ESTIMATE' | 'CONFIRMED' | 'RECALCULATED' | 'CREDITED' | 'LOCKED'
  calculationReason?: string
  aiExplanation?: string
  breakdown: FareBreakdown
  isLocked: boolean
  lockedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PricingEvent {
  id: string
  rideId: string
  bookingId?: string
  eventType:
    | 'INITIAL_CALCULATION'
    | 'PASSENGER_JOINED'
    | 'PASSENGER_CANCELLED'
    | 'ROUTE_RECALCULATED'
    | 'VEHICLE_CHANGED'
    | 'CAPACITY_CHANGED'
    | 'DEMAND_UPDATED'
    | 'MANUAL_DISPATCH_ADJUSTMENT'
    | 'PRICE_RECALCULATED'
  oldAmount?: number
  newAmount: number
  trigger: string
  reason?: string
  inputSnapshot?: any
  calculationSnapshot?: any
  createdAt: string
}

export interface PricingConfig {
  id: string
  name: string
  baseFare: number
  perKmRate: number
  perMinuteRate: number
  minimumFare: number
  maximumFare: number
  sharedDiscountCap: number
  aiAdjustmentCap: number
  effectiveFrom?: string
  effectiveUntil?: string
  isActive: boolean
}

export interface FleetPricingMetrics {
  averageFarePerPassenger: number
  totalRevenue: number
  averageSharedSavings: number
  seatUtilization: number
  activeRidesCount: number
  totalPassengersCount: number
  demandLevel: 'LOW' | 'NORMAL' | 'HIGH'
}

export interface FareEstimateResult {
  currency: string
  estimatedFare: number
  estimateRange: { min: number; max: number }
  distanceKm: number
  durationMinutes: number
  sharedSavings: number
  routeOverlapPercent: number
  breakdown: FareBreakdown
  explanation: string
  pricingVersion: string
  isHaversineFallback?: boolean
}


