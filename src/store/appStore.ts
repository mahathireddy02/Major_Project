import { create } from 'zustand'
import type {
  Student,
  Driver,
  Ride,
  Booking,
  Notification,
  SafetyEvent,
  AdminUser,
  Vehicle,
} from '../types'
import { api } from '../services/api'

type Role = 'student' | 'faculty' | 'driver' | 'admin'

export function normalizeSafetyEvent(e: any): SafetyEvent {
  if (!e) return e
  const rawType = e.eventType || e.type || 'OTHER'
  const rawSeverity = e.severity || 'HIGH'
  const rawMsg = e.message || e.description || 'Safety incident reported'
  const rawCreatedAt = e.createdAt || e.timestamp || new Date().toISOString()

  return {
    id: e.id || e._id || `se-${Date.now()}`,
    rideId: e.rideId || '',
    type: String(rawType).toLowerCase(),
    eventType: String(rawType).toUpperCase(),
    message: rawMsg,
    description: rawMsg,
    severity: String(rawSeverity).toUpperCase(),
    createdAt: typeof rawCreatedAt === 'string' ? rawCreatedAt : new Date(rawCreatedAt).toISOString(),
    timestamp: rawCreatedAt,
    resolved: Boolean(e.resolved || e.status === 'RESOLVED'),
    resolvedAt: e.resolvedAt,
    resolvedBy: e.resolvedBy,
    userId: e.userId,
    vehicleId: e.vehicleId,
    lat: e.lat,
    lng: e.lng,
    status: e.status || (e.resolved ? 'RESOLVED' : 'ACTIVE'),
  } as SafetyEvent
}

interface SimState {
  trafficActive: boolean
  demoMessage: string | null
}

interface AppState {
  // Auth
  role: Role
  token: string | null
  currentUser: any | null
  currentStudentId: string
  currentDriverId: string
  backendReady: boolean

  // Data
  students: Student[]
  drivers: Driver[]
  vehicles: Vehicle[]
  rides: Ride[]
  bookings: Booking[]
  notifications: Notification[]
  safetyEvents: SafetyEvent[]
  adminUser: AdminUser
  auditLogs: any[]

  // Simulation
  sim: SimState

  // Computed helpers
  currentStudent: () => Student | undefined
  currentDriver: () => Driver | undefined

  // Lifecycle
  initBackend: () => Promise<void>

  // Actions — Auth
  setRole: (role: Role) => void
  loginAsStudent: (studentId: string) => void
  loginAsDriver: (driverId: string) => void
  login: (credentials: { email?: string; username?: string; phone?: string; password?: string; role?: string; userId?: string }) => Promise<{ success: boolean; role: Role; user: any }>
  registerStudent: (data: any) => Promise<{ user: any; token: string; ocrResult: any }>
  registerFaculty: (data: any) => Promise<{ user: any; token: string; ocrResult: any }>
  registerDriver: (data: any) => Promise<{ user: any; token: string; ocrResult: any }>
  logout: () => void

  joinRide: (rideId: string, studentId: string, pickup: string, destination: string, pickupCoords?: { lat: number; lng: number }, destinationCoords?: { lat: number; lng: number }, pickupAddress?: string, destinationAddress?: string, genderPreference?: string) => Promise<Booking | null>
  createRide: (
    pickup: string,
    destination: string,
    time: string,
    seats: number,
    studentId: string,
    pickupCoords?: { lat: number; lng: number },
    destinationCoords?: { lat: number; lng: number },
    genderPreference?: string
  ) => Promise<Ride>
  cancelBooking: (bookingId: string) => Promise<void>

  // Actions — Driver
  acceptRide: (rideId: string) => Promise<void>
  startRide: (rideId: string, startLocation?: { name?: string; lat: number; lng: number }) => Promise<void>
  completeRide: (rideId: string) => Promise<void>
  refreshRides: () => Promise<void>
  updatePassengerStatus: (rideId: string, studentId: string, status: 'boarded' | 'dropped') => Promise<void>

  // Actions — Dispatcher
  loadDispatcherData: () => Promise<any>
  reassignDriver: (rideId: string, driverId: string) => Promise<void>
  reassignVehicle: (rideId: string, vehicleId: string) => Promise<void>
  cancelRideByDispatcher: (rideId: string, reason?: string) => Promise<void>
  recalculateRideRoute: (rideId: string) => Promise<void>
  resolveSafetyEvent: (eventId: string) => Promise<void>
  resetScheduledFleet: () => Promise<any>
  loadAuditLog: () => Promise<void>

  // Actions — Safety
  triggerSOS: (rideId: string, studentId: string) => Promise<void>
  triggerDeviation: (rideId: string) => Promise<void>
  resolveDeviation: (rideId: string, eventId: string) => Promise<void>

  // Actions — Notifications
  markNotificationRead: (notifId: string) => Promise<void>
  markAllRead: () => Promise<void>
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void

  // Actions — Demo Controls (backed by real MongoDB API)
  fillNextSeat: (rideId?: string) => Promise<void>
  cancelPassenger: (rideId?: string) => Promise<void>
  addStudentRequest: () => Promise<void>
  simulateTraffic: () => Promise<void>
  resetDemo: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State — empty; populated by initBackend() from real MongoDB
  role: (localStorage.getItem('campusflow_role') as Role) || 'student',
  token: localStorage.getItem('campusflow_token') || null,
  currentUser: null,
  currentStudentId: localStorage.getItem('campusflow_user_id') || '',
  currentDriverId: localStorage.getItem('campusflow_driver_id') || '',
  backendReady: false,
  students: [],
  drivers: [],
  vehicles: [],
  rides: [],
  bookings: [],
  notifications: [],
  safetyEvents: [],
  adminUser: { id: 'admin1', name: 'Dispatch Control', role: 'admin', avatar: 'DC' },
  auditLogs: [],
  sim: { trafficActive: false, demoMessage: null },

  // Computed — prefer currentUser (real authenticated user) over store list
  currentStudent: () => {
    const cu = get().currentUser
    if (cu && (cu.role === 'student' || cu.role === 'STUDENT' || cu.role === 'faculty' || cu.role === 'FACULTY')) return cu as any
    return get().students.find((s) => s.id === get().currentStudentId)
  },
  currentDriver: () => {
    const cu = get().currentUser
    if (cu && (cu.role === 'driver' || cu.role === 'DRIVER')) return cu as any
    return get().drivers.find((d) => d.id === get().currentDriverId)
  },

  // Bootstrap backend data & setup WebSocket stream
  initBackend: async () => {
    try {
      api.setAuth(get().currentStudentId, get().currentDriverId, get().token)
      api.initWebSocket()

      // Listen to real-time events from Fastify backend
      api.onRealtimeEvent((event, payload) => {
        console.log('[Store] Realtime event received:', event, payload)
        if ((event === 'RIDE_UPDATED' || event === 'RIDE_CREATED' || event === 'RIDE_STARTED' || event === 'RIDE_COMPLETED' || event === 'RIDE_CANCELLED' || event === 'DRIVER_ACCEPTED' || event === 'DRIVER_REASSIGNED' || event === 'VEHICLE_REASSIGNED' || event === 'ROUTE_UPDATED') && payload?.ride) {
          const isCompleted = event === 'RIDE_COMPLETED' || payload.ride.status === 'completed'
          set((state) => ({
            rides: state.rides.some((r) => r.id === payload.ride.id)
              ? state.rides.map((r) => (r.id === payload.ride.id ? { ...r, ...payload.ride } : r))
              : [payload.ride, ...state.rides],
            ...(isCompleted
              ? {
                  bookings: state.bookings.map((b) =>
                    b.rideId === payload.ride.id ? { ...b, status: 'completed' as const } : b
                  ),
                }
              : {}),
          }))
        } else if (event === 'BOOKING_CREATED') {
          if (payload?.booking) {
            set((state) => ({
              bookings: [payload.booking, ...state.bookings.filter((b) => b.id !== payload.booking.id)],
            }))
          }
          if (payload?.ride) {
            set((state) => ({
              rides: state.rides.map((r) => (r.id === payload.ride.id ? { ...r, ...payload.ride } : r)),
            }))
          }
        } else if (event === 'BOOKING_UPDATED') {
          if (payload?.booking) {
            set((state) => ({
              bookings: state.bookings.map((b) => (b.id === payload.booking.id ? { ...b, ...payload.booking } : b)),
            }))
          } else if (payload?.rideId && payload?.status) {
            set((state) => ({
              bookings: state.bookings.map((b) =>
                b.rideId === payload.rideId ? { ...b, status: payload.status as any } : b
              ),
            }))
          }
        } else if (event === 'BOOKING_CANCELLED') {
          if (payload?.bookingId) {
            set((state) => ({
              bookings: state.bookings.map((b) => (b.id === payload.bookingId ? { ...b, status: 'cancelled' as const } : b)),
            }))
          }
          if (payload?.ride) {
            set((state) => ({
              rides: state.rides.map((r) => (r.id === payload.ride.id ? { ...r, ...payload.ride } : r)),
            }))
          }
        } else if (event === 'SAFETY_ALERT' || event === 'SAFETY_ALERT_CREATED' || event === 'SOS_CREATED') {
          if (payload?.safetyEvent) {
            const normalized = normalizeSafetyEvent(payload.safetyEvent)
            set((state) => ({
              safetyEvents: [normalized, ...state.safetyEvents.filter((e) => e.id !== normalized.id)],
            }))
          }
          if (payload?.ride) {
            set((state) => ({
              rides: state.rides.map((r) => (r.id === payload.ride.id ? { ...r, ...payload.ride } : r)),
            }))
          }
        } else if (event === 'SAFETY_EVENT_RESOLVED') {
          if (payload?.event) {
            const normalized = normalizeSafetyEvent(payload.event)
            set((state) => ({
              safetyEvents: state.safetyEvents.map((e) => (e.id === normalized.id ? normalized : e)),
            }))
          }
        } else if (event === 'VEHICLE_LOCATION_UPDATED') {
          if (payload?.rideId && payload?.lat && payload?.lng) {
            set((state) => ({
              rides: state.rides.map((r) =>
                r.id === payload.rideId
                  ? {
                      ...r,
                      currentLat: payload.lat,
                      currentLng: payload.lng,
                      estimatedArrival: payload.progress?.etaString || r.estimatedArrival,
                    }
                  : r
              ),
              vehicles: state.vehicles.map((v) =>
                v.id === payload.vehicleId
                  ? {
                      ...v,
                      currentLat: payload.lat,
                      currentLng: payload.lng,
                      heading: payload.heading ?? v.heading,
                      speed: payload.speed ?? v.speed,
                    }
                  : v
              ),
            }))
          }
        } else if (event === 'STOP_UPDATED') {
          if (payload?.rideId && payload?.stop) {
            set((state) => ({
              rides: state.rides.map((r) => {
                if (r.id !== payload.rideId) return r
                const updatedStops = (r.stops || []).map((s) =>
                  s.id === payload.stop.id ? { ...s, ...payload.stop } : s
                )
                return { ...r, stops: updatedStops }
              }),
            }))
          }
        } else if (event === 'ROUTE_UPDATED') {
          if (payload?.rideId && payload?.route) {
            set((state) => ({
              rides: state.rides.map((r) =>
                r.id === payload.rideId
                  ? {
                      ...r,
                      tripRoute: payload.route,
                      stops: payload.stops || r.stops,
                      routeCoordinates: payload.route.geometry || r.routeCoordinates,
                    }
                  : r
              ),
            }))
          }
        } else if (event === 'DEMO_RESET') {
          get().initBackend()
        }
      })

      // Fetch initial data from real MongoDB
      const currentStudentId = get().currentStudentId
      const [backendRides, backendEvents, backendNotifs, backendUsers, backendBookings, backendVehicles] = await Promise.all([
        api.getRides().catch(() => []),
        api.getSafetyEvents().catch(() => []),
        api.getNotifications().catch(() => []),
        api.getAllUsers().catch(() => []),
        (currentStudentId ? api.getUserBookings(currentStudentId).catch(() => []) : Promise.resolve([])),
        api.getVehicles().catch(() => []),
      ])

      const realStudents = (backendUsers || [])
        .filter((u: any) => u.role?.toUpperCase() === 'STUDENT' || u.role?.toUpperCase() === 'FACULTY')
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          studentId: u.studentId || u.rollNumber || u.id,
          department: u.department || 'Engineering',
          year: u.year || 1,
          phone: u.phone || '',
          avatar: u.avatar || (u.name ? u.name.slice(0, 2).toUpperCase() : 'U'),
          rating: u.rating || 4.8,
          totalRides: u.totalRides || 0,
          verified: u.isVerified !== false && u.verificationStatus !== 'REJECTED',
          role: 'student' as const,
          email: u.email,
          collegeName: u.collegeName,
          rollNumber: u.rollNumber,
          gender: u.gender,
          verificationStatus: u.verificationStatus === 'REJECTED' ? 'REJECTED' : (u.verificationStatus || 'VERIFIED'),
          nameMatchStatus: u.nameMatchStatus || 'MATCHED',
        }))

      const realDrivers = (backendUsers || [])
        .filter((u: any) => u.role?.toUpperCase() === 'DRIVER')
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          phone: u.phone || '',
          avatar: u.avatar || (u.name ? u.name.slice(0, 2).toUpperCase() : 'D'),
          rating: u.rating || 4.8,
          totalTrips: u.totalTrips || u.totalRides || 0,
          verified: u.isVerified !== false && u.verificationStatus !== 'REJECTED',
          licenseNo: u.licenseNumber || '',
          role: 'driver' as const,
          vehicleId: u.vehicleId || '',
          email: u.email,
          vehicleRegistration: u.vehicleRegistration,
          vehicleType: u.vehicleType,
          gender: u.gender,
          verificationStatus: u.verificationStatus === 'REJECTED' ? 'REJECTED' : (u.verificationStatus || 'VERIFIED'),
          nameMatchStatus: u.nameMatchStatus || 'MATCHED',
        }))

      set({
        rides: backendRides || [],
        safetyEvents: (backendEvents || []).map(normalizeSafetyEvent),
        notifications: backendNotifs || [],
        bookings: backendBookings || [],
        students: realStudents,
        drivers: realDrivers,
        vehicles: backendVehicles || [],
        backendReady: true,
      })

      // If user is logged in, fetch profile and update currentUser + ID fields
      if (get().token) {
        try {
          const profile = await api.getMe()
          if (profile) {
            const isDriver = profile.role?.toUpperCase() === 'DRIVER'
            const isStudent = profile.role?.toUpperCase() === 'STUDENT' || profile.role?.toUpperCase() === 'FACULTY'
            set({
              currentUser: profile,
              currentStudentId: isStudent ? profile.id : get().currentStudentId,
              currentDriverId: isDriver ? profile.id : get().currentDriverId,
            })
          }
        } catch {
          // token expired or invalid — don't overwrite
        }
      }
    } catch (err) {
      console.warn('[Store] Backend not yet connected:', err)
      set({ backendReady: true }) // mark ready even on failure so UI doesn't hang
    }
  },

  // Auth
  setRole: (role: Role) => {
    localStorage.setItem('campusflow_role', role)
    set({ role })
  },
  loginAsStudent: (studentId: string) => {
    localStorage.setItem('campusflow_user_id', studentId)
    localStorage.setItem('campusflow_role', 'student')
    api.setAuth(studentId, get().currentDriverId)
    set({ currentStudentId: studentId, role: 'student' })
  },
  loginAsDriver: (driverId: string) => {
    localStorage.setItem('campusflow_driver_id', driverId)
    localStorage.setItem('campusflow_role', 'driver')
    api.setAuth(get().currentStudentId, driverId)
    set({ currentDriverId: driverId, role: 'driver' })
  },
  login: async (credentials) => {
    try {
      const res = await api.login(credentials)
      const mappedRole: Role =
        res.role.toLowerCase() === 'admin' || res.role.toLowerCase() === 'dispatcher'
          ? 'admin'
          : (res.role.toLowerCase() as Role)

      localStorage.setItem('campusflow_role', mappedRole)
      localStorage.setItem('campusflow_token', res.token)
      if (res.user?.id) localStorage.setItem('campusflow_user_id', res.user.id)
      api.setAuth(res.user?.id || get().currentStudentId, mappedRole === 'driver' ? res.user?.id : get().currentDriverId, res.token)

      set({
        currentUser: res.user,
        token: res.token,
        role: mappedRole,
        currentStudentId: res.user?.id || get().currentStudentId,
        currentDriverId: mappedRole === 'driver' ? res.user?.id : get().currentDriverId,
      })

      return { success: true, role: mappedRole, user: res.user }
    } catch (err: any) {
      // If the backend responded with an error (e.g., 401 Incorrect password, 404 User not found), rethrow immediately!
      if (err.status || err.code || err.message?.includes('password') || err.message?.includes('account')) {
        throw err
      }

      // Fallback only if backend server is completely offline / unreachable
      const fallbackUser = get().students.find(
        (s) => s.email === credentials.email || s.id === credentials.userId
      )
      if (fallbackUser) {
        set({
          currentUser: fallbackUser,
          currentStudentId: fallbackUser.id,
          role: 'student',
        })
        return { success: true, role: 'student', user: fallbackUser }
      }
      throw err
    }
  },
  registerStudent: async (data) => {
    try {
      const res = await api.registerStudent(data)
      api.setAuth(res.user.id, get().currentDriverId, res.token)
      set((state) => ({
        students: [res.user, ...state.students],
        currentUser: res.user,
        currentStudentId: res.user.id,
        token: res.token,
        role: 'student',
      }))
      return res
    } catch (err: any) {
      console.error('[Store] registerStudent error:', err)
      const errorMsg = err.message || 'Cannot reach backend server on port 5000. Please ensure the backend is running.'
      throw new Error(errorMsg)
    }
  },
  registerFaculty: async (data) => {
    try {
      const res = await api.registerFaculty(data)
      api.setAuth(res.user.id, get().currentDriverId, res.token)
      set((state) => ({
        currentUser: res.user,
        currentStudentId: res.user.id,
        token: res.token,
        role: 'faculty',
      }))
      return res
    } catch (err: any) {
      console.error('[Store] registerFaculty error:', err)
      const errorMsg = err.message || 'Cannot reach backend server on port 5000. Please ensure the backend is running.'
      throw new Error(errorMsg)
    }
  },
  registerDriver: async (data) => {
    try {
      const res = await api.registerDriver(data)
      api.setAuth(get().currentStudentId, res.user.id, res.token)
      set((state) => ({
        drivers: [res.user, ...state.drivers],
        currentUser: res.user,
        currentDriverId: res.user.id,
        token: res.token,
        role: 'driver',
      }))
      return res
    } catch (err: any) {
      console.error('[Store] registerDriver error:', err)
      const errorMsg = err.message || 'Cannot reach backend server on port 5000. Please ensure the backend is running.'
      throw new Error(errorMsg)
    }
  },
  logout: () => {
    localStorage.removeItem('campusflow_token')
    localStorage.removeItem('campusflow_role')
    localStorage.removeItem('campusflow_user_id')
    localStorage.removeItem('campusflow_driver_id')
    api.setToken(null)
    set({
      token: null,
      currentUser: null,
      role: 'student',
      currentStudentId: '',
      currentDriverId: '',
      rides: [],
      bookings: [],
      notifications: [],
      safetyEvents: [],
    })
  },

  // Join Ride
  joinRide: async (
    rideId: string,
    studentId: string,
    pickup: string,
    destination: string,
    pickupCoords?: { lat: number; lng: number },
    destinationCoords?: { lat: number; lng: number },
    pickupAddress?: string,
    destinationAddress?: string,
    genderPreference?: string
  ) => {
    try {
      const res = await api.joinRide(rideId, studentId, pickup, destination, 1, pickupCoords, destinationCoords, pickupAddress, destinationAddress, genderPreference)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === res.ride.id ? res.ride : r)),
        bookings: [res.booking, ...state.bookings],
      }))
      return res.booking
    } catch (err: any) {
      console.error('[Store] joinRide error:', err.message)
      throw err
    }
  },

  // Create Ride
  createRide: async (
    pickup: string,
    destination: string,
    time: string,
    seats: number,
    studentId: string,
    pickupCoords?: { lat: number; lng: number },
    destinationCoords?: { lat: number; lng: number },
    genderPreference?: string
  ) => {
    try {
      const pLat = pickupCoords?.lat || 17.398
      const pLng = pickupCoords?.lng || 78.479
      const dLat = destinationCoords?.lat || 17.387
      const dLng = destinationCoords?.lng || 78.486
      const student = get().students.find((s) => s.id === studentId)
      const isFemaleOnly = genderPreference === 'FEMALE_ONLY'
      const newRide = await api.createRide({
        pickupPoints: [{ id: `pp-${Date.now()}`, name: pickup, lat: pLat, lng: pLng, estimatedPickupTime: time }],
        destination,
        destinationLat: dLat,
        destinationLng: dLng,
        departureTime: time,
        bookedSeats: seats,
        capacity: 6,
        fare: 25,
        isFemaleOnly,
        genderPreference: isFemaleOnly ? 'FEMALE_ONLY' : 'ANYONE',
        passengers: [{
          studentId,
          name: student?.name || 'Student',
          pickup,
          destination,
          status: 'waiting',
          seatNo: 1,
          gender: student?.gender || 'Other',
          genderPreference: isFemaleOnly ? 'FEMALE_ONLY' : 'ANYONE',
        }],
      })
      set((state) => ({
        rides: [newRide, ...state.rides],
      }))
      return newRide
    } catch (err: any) {
      console.error('[Store] createRide error:', err.message)
      throw err
    }
  },

  // Cancel Booking
  cancelBooking: async (bookingId: string) => {
    const booking = get().bookings.find((b) => b.id === bookingId)
    if (!booking) return
    try {
      await api.cancelBooking(booking.rideId, booking.studentId)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b)),
      }))
    } catch (err: any) {
      console.error('[Store] cancelBooking error:', err.message)
    }
  },

  // Driver Actions
  acceptRide: async (rideId: string) => {
    try {
      const updated = await api.acceptDriverRide(rideId)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? updated : r)),
      }))
    } catch (err: any) {
      console.error('[Store] acceptRide error:', err.message)
    }
  },

  startRide: async (rideId: string, startLocation?: { name?: string; lat: number; lng: number }) => {
    try {
      const updated = await api.startRide(rideId, startLocation)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? updated : r)),
      }))
    } catch (err: any) {
      console.error('[Store] startRide error:', err.message)
      throw err
    }
  },

  completeRide: async (rideId: string) => {
    try {
      const updated = await api.completeRide(rideId)
      set((state) => ({
        rides: state.rides.map((r) =>
          r.id === rideId
            ? {
                ...r,
                ...updated,
                status: 'completed',
                passengers: (updated.passengers && updated.passengers.length > 0
                  ? updated.passengers
                  : r.passengers || []
                ).map((p: any) => ({ ...p, status: 'dropped' })),
              }
            : r
        ),
        bookings: state.bookings.map((b) =>
          b.rideId === rideId ? { ...b, status: 'completed' as const } : b
        ),
      }))
    } catch (err: any) {
      console.error('[Store] completeRide error:', err.message)
      throw err
    }
  },

  refreshRides: async () => {
    try {
      const freshRides = await api.getRides()
      if (Array.isArray(freshRides)) {
        set({ rides: freshRides })
      }
    } catch (err: any) {
      console.warn('[Store] refreshRides warning:', err.message)
    }
  },

  updatePassengerStatus: async (rideId: string, studentId: string, status: 'boarded' | 'dropped') => {
    try {
      const updated = await api.updatePassengerStatus(rideId, studentId, status)
      const newBookingStatus = status === 'boarded' ? 'boarded' : 'completed'
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? updated : r)),
        bookings: state.bookings.map((b) =>
          b.rideId === rideId && b.studentId === studentId ? { ...b, status: newBookingStatus as any } : b
        ),
      }))
    } catch (err: any) {
      console.error('[Store] updatePassengerStatus error:', err.message)
      throw err
    }
  },

  // Actions — Dispatcher
  loadDispatcherData: async () => {
    try {
      const data = await api.getDispatcherDashboard()

      // Normalize drivers returned by dispatcher dashboard (same shape as UserModel DRIVER docs)
      const normalizedDrivers = (data.drivers || []).map((u: any) => ({
        id: u.id || u._id,
        name: u.name,
        phone: u.phone || '',
        avatar: u.avatar || (u.name ? u.name.slice(0, 2).toUpperCase() : 'D'),
        rating: u.rating || 4.8,
        totalTrips: u.totalTrips || u.totalRides || 0,
        verified: u.isVerified !== false,
        licenseNo: u.licenseNumber || u.licenseNo || '',
        role: 'driver' as const,
        vehicleId: u.vehicleId || '',
        email: u.email,
      }))

      // Normalize vehicles returned by dispatcher dashboard
      const normalizedVehicles = (data.vehicles || []).map((v: any) => ({
        id: v.id || v._id,
        name: v.name,
        type: v.vehicleType || v.type || 'Mini Van',
        registration: v.registrationNumber || v.registration || '',
        capacity: v.capacity,
        driverId: v.driverId || '',
        color: v.color || '#0891B2',
        verified: v.isVerified !== false,
        rating: v.rating || 4.8,
        totalTrips: v.totalTrips || 0,
        status: v.status || 'AVAILABLE',
        heading: v.heading,
        speed: v.speed,
        currentLat: v.currentLat,
        currentLng: v.currentLng,
      }))

      set((state) => ({
        rides: data.activeRides?.length ? data.activeRides : state.rides,
        vehicles: normalizedVehicles.length ? normalizedVehicles : state.vehicles,
        drivers: normalizedDrivers.length ? normalizedDrivers : state.drivers,
        safetyEvents: (data.alerts || []).map(normalizeSafetyEvent),
        auditLogs: data.auditLogs || state.auditLogs,
      }))
      return data
    } catch (err: any) {
      console.error('[Store] loadDispatcherData error:', err.message)
      throw err
    }
  },

  reassignDriver: async (rideId: string, driverId: string) => {
    try {
      const res = await api.reassignDriver(rideId, driverId)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? res.ride : r)),
        auditLogs: res.auditLog ? [res.auditLog, ...state.auditLogs] : state.auditLogs,
      }))
    } catch (err: any) {
      console.error('[Store] reassignDriver error:', err.message)
      throw err
    }
  },

  reassignVehicle: async (rideId: string, vehicleId: string) => {
    try {
      const res = await api.reassignVehicle(rideId, vehicleId)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? res.ride : r)),
        auditLogs: res.auditLog ? [res.auditLog, ...state.auditLogs] : state.auditLogs,
      }))
    } catch (err: any) {
      console.error('[Store] reassignVehicle error:', err.message)
      throw err
    }
  },

  cancelRideByDispatcher: async (rideId: string, reason?: string) => {
    try {
      const res = await api.cancelRideByDispatcher(rideId, reason)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? res.ride : r)),
        auditLogs: res.auditLog ? [res.auditLog, ...state.auditLogs] : state.auditLogs,
      }))
    } catch (err: any) {
      console.error('[Store] cancelRideByDispatcher error:', err.message)
      throw err
    }
  },

  recalculateRideRoute: async (rideId: string) => {
    try {
      const res = await api.recalculateRideRoute(rideId)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? res.ride : r)),
        auditLogs: res.auditLog ? [res.auditLog, ...state.auditLogs] : state.auditLogs,
      }))
    } catch (err: any) {
      console.error('[Store] recalculateRideRoute error:', err.message)
      throw err
    }
  },

  resolveSafetyEvent: async (eventId: string) => {
    try {
      const res = await api.resolveSafetyEvent(eventId)
      const resolvedEvent: SafetyEvent = normalizeSafetyEvent((res as any)?.event || res)
      set((state) => ({
        safetyEvents: state.safetyEvents.map((e) => (e.id === eventId ? resolvedEvent : e)),
        auditLogs: (res as any)?.auditLog ? [(res as any).auditLog, ...state.auditLogs] : state.auditLogs,
      }))
    } catch (err: any) {
      console.error('[Store] resolveSafetyEvent error:', err.message)
      throw err
    }
  },

  resetScheduledFleet: async () => {
    try {
      const res = await api.resetScheduledFleet()
      if (res.rides) {
        set((state) => ({
          rides: state.rides.map((r) => {
            const found = res.rides.find((u: any) => u.id === r.id)
            return found ? { ...r, ...found } : r
          }),
        }))
      }
      await get().loadDispatcherData()
      return res
    } catch (err: any) {
      console.error('[Store] resetScheduledFleet error:', err.message)
      throw err
    }
  },

  loadAuditLog: async () => {
    try {
      const logs = await api.getDispatcherAuditLog()
      set({ auditLogs: logs })
    } catch (err: any) {
      console.error('[Store] loadAuditLog error:', err.message)
    }
  },

  // Safety Actions
  triggerSOS: async (rideId: string, studentId: string) => {
    try {
      const event = await api.triggerSOS(rideId, studentId)
      const normalized = normalizeSafetyEvent(event)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? { ...r, hasSosAlert: true } : r)),
        safetyEvents: [normalized, ...state.safetyEvents.filter((e) => e.id !== normalized.id)],
      }))
    } catch (err: any) {
      console.error('[Store] triggerSOS error:', err.message)
    }
  },

  triggerDeviation: async (rideId: string) => {
    try {
      await api.triggerDeviation(rideId)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? { ...r, hasDeviation: true } : r)),
      }))
    } catch (err: any) {
      console.error('[Store] triggerDeviation error:', err.message)
    }
  },

  resolveDeviation: async (rideId: string, eventId: string) => {
    try {
      const res = await api.resolveSafetyEvent(eventId)
      const resolvedEvent: SafetyEvent = normalizeSafetyEvent((res as any)?.event || res)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? { ...r, hasDeviation: false, hasSosAlert: false } : r)),
        safetyEvents: state.safetyEvents.map((e) => (e.id === eventId ? resolvedEvent : e)),
      }))
    } catch (err: any) {
      console.error('[Store] resolveDeviation error:', err.message)
    }
  },

  // Notifications
  markNotificationRead: async (notifId: string) => {
    try {
      await api.markNotificationRead(notifId)
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n)),
      }))
    } catch (err: any) {
      console.error('[Store] markNotificationRead error:', err.message)
    }
  },

  markAllRead: async () => {
    try {
      await api.markAllNotificationsRead()
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }))
    } catch (err: any) {
      console.error('[Store] markAllRead error:', err.message)
    }
  },

  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => {
    const newN: Notification = {
      ...n,
      id: `n-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ notifications: [newN, ...state.notifications] }))
  },

  // Demo Controls
  fillNextSeat: async (rideId = 'ride-102') => {
    try {
      const updated = await api.demoFillSeat(rideId)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? updated : r)),
      }))
    } catch (err: any) {
      console.error('[Store] demo fillNextSeat error:', err.message)
    }
  },

  cancelPassenger: async (rideId = 'ride-102') => {
    try {
      const updated = await api.demoCancelPassenger(rideId)
      set((state) => ({
        rides: state.rides.map((r) => (r.id === rideId ? updated : r)),
      }))
    } catch (err: any) {
      console.error('[Store] demo cancelPassenger error:', err.message)
    }
  },

  addStudentRequest: async () => {
    try {
      const notif = await api.demoAddStudent()
      set((state) => ({
        notifications: [notif, ...state.notifications],
      }))
    } catch (err: any) {
      console.error('[Store] demo addStudentRequest error:', err.message)
    }
  },

  simulateTraffic: async () => {
    try {
      const res = await api.demoTraffic()
      set((state) => ({
        sim: {
          trafficActive: res.trafficActive,
          demoMessage: res.trafficActive
            ? 'Traffic simulation active. Autonomous dynamic rerouting engaged.'
            : null,
        },
      }))
    } catch (err: any) {
      console.error('[Store] demo simulateTraffic error:', err.message)
    }
  },

  resetDemo: async () => {
    try {
      await api.demoReset()
      await get().initBackend()
    } catch (err: any) {
      console.error('[Store] demo resetDemo error:', err.message)
    }
  },
}))
