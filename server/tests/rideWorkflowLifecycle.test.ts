import { describe, it, expect, beforeAll } from 'vitest'
import axios from 'axios'

const API_BASE = 'http://localhost:5000/api'

async function fetchNotifications(options: {
  userId?: string
  studentId?: string
  driverId?: string
  role?: string
  all?: boolean
  headers?: Record<string, string>
}) {
  const params: Record<string, string> = {}
  if (options.userId) params.userId = options.userId
  if (options.studentId) params.studentId = options.studentId
  if (options.driverId) params.driverId = options.driverId
  if (options.role) params.role = options.role
  if (options.all) params.all = 'true'

  const res = await axios.get(`${API_BASE}/notifications`, {
    params,
    headers: options.headers || { 'x-user-id': 'admin1' },
  })
  return (res.data?.data || []) as any[]
}

describe('CampusFlow — Full End-to-End Ride Lifecycle & Multi-Stakeholder Notification Workflow', () => {
  const studentA = 's1' // Uday Kiran
  const studentB = 's2' // Ananya Sharma
  const driverA = 'd1'  // Rahul Kumar
  const driverB = 'd2'  // Suresh Reddy
  let rideId = ''
  let stop1Id = ''
  let sosEventId = ''

  beforeAll(async () => {
    const health = await axios.get('http://localhost:5000/health', { timeout: 3000 })
    expect(health.data?.status).toBe('healthy')
  })

  it('1. SEARCHING & RIDE REQUEST: Student submits shared ride search -> RIDE_REQUEST_CREATED (Student + Dispatcher)', async () => {
    const reqRes = await axios.post(
      `${API_BASE}/ride-requests`,
      {
        userId: studentA,
        pickup: 'Charminar',
        destination: 'Sri Indu College of Engineering & Technology',
        time: '8:30 AM',
        seats: 1,
        pickupLat: 17.3616,
        pickupLng: 78.4747,
        destinationLat: 17.2063,
        destinationLng: 78.6015,
      },
      { headers: { 'x-user-id': studentA, 'Content-Type': 'application/json' } }
    )
    expect(reqRes.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentA, headers: { 'x-user-id': studentA } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const sNotif = studentNotifs.find((n) => n.eventType === 'RIDE_REQUEST_CREATED' && n.message.includes('Charminar'))
    const dNotif = allNotifs.find((n) => n.eventType === 'RIDE_REQUEST_CREATED' && n.message.includes('Charminar'))

    expect(sNotif).toBeDefined()
    expect(sNotif?.title).toContain('Ride Request')
    expect(dNotif).toBeDefined()
    expect(dNotif?.message).toContain('Charminar')
  })

  it('2. MATCHED & JOINED: Passenger A joins pooled ride -> PASSENGER_ADDED (Student A + Driver A + Dispatcher)', async () => {
    const rideRes = await axios.post(
      `${API_BASE}/rides`,
      {
        routeName: 'Campus Route #102',
        driverId: driverA,
        vehicleId: 'v1',
        pickupPoints: [
          { id: 'pp-1', name: 'Charminar', lat: 17.3616, lng: 78.4747, estimatedPickupTime: '8:30 AM' },
          { id: 'pp-2', name: 'LB Nagar Hub', lat: 17.3457, lng: 78.5522, estimatedPickupTime: '8:45 AM' },
        ],
        destination: 'Sri Indu College of Engineering & Technology',
        destinationLat: 17.2063,
        destinationLng: 78.6015,
        departureTime: '8:30 AM',
        capacity: 6,
        bookedSeats: 0,
        passengers: [],
      },
      { headers: { 'Content-Type': 'application/json' } }
    )
    rideId = rideRes.data.data.id

    const joinRes = await axios.post(
      `${API_BASE}/rides/${rideId}/join`,
      {
        studentId: studentA,
        pickup: 'Charminar',
        destination: 'Sri Indu College of Engineering & Technology',
        seats: 1,
      },
      { headers: { 'x-user-id': studentA, 'Content-Type': 'application/json' } }
    )
    expect(joinRes.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentA, headers: { 'x-user-id': studentA } })
    const driverNotifs = await fetchNotifications({ driverId: driverA, headers: { 'x-driver-id': driverA, 'x-user-id': driverA } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const sNotif = studentNotifs.find((n) => n.rideId === rideId && n.eventType === 'PASSENGER_ADDED')
    const dNotif = driverNotifs.find((n) => n.rideId === rideId && n.eventType === 'PASSENGER_ADDED')
    const dispNotif = allNotifs.find((n) => n.rideId === rideId && n.eventType === 'PASSENGER_ADDED')

    expect(sNotif).toBeDefined()
    expect(sNotif?.title).toBe('Booking Confirmed')
    expect(dNotif).toBeDefined()
    expect(dNotif?.title).toBe('New Passenger Added')
    expect(dispNotif).toBeDefined()
  })

  it('3. MULTI-PASSENGER POOL: Passenger B joins same ride -> PASSENGER_ADDED (Student B + Driver A + Dispatcher, NOT Student A)', async () => {
    const joinRes = await axios.post(
      `${API_BASE}/rides/${rideId}/join`,
      {
        studentId: studentB,
        pickup: 'LB Nagar Hub',
        destination: 'Sri Indu College of Engineering & Technology',
        seats: 1,
      },
      { headers: { 'x-user-id': studentB, 'Content-Type': 'application/json' } }
    )
    expect(joinRes.data.success).toBe(true)

    const studentBNotifs = await fetchNotifications({ userId: studentB, headers: { 'x-user-id': studentB } })
    const studentANotifs = await fetchNotifications({ userId: studentA, headers: { 'x-user-id': studentA } })

    // Student B gets their booking confirmation
    const sBNotif = studentBNotifs.find((n) => n.rideId === rideId && n.studentId === studentB && n.eventType === 'PASSENGER_ADDED')
    expect(sBNotif).toBeDefined()

    // Student A does NOT receive Student B's private booking notification
    const sANotifForB = studentANotifs.find((n) => n.rideId === rideId && n.studentId === studentB)
    expect(sANotifForB).toBeUndefined()
  })

  it('4. DRIVER ACCEPTED: Driver A accepts trip -> DRIVER_ACCEPTED (All pooled passengers + Dispatcher)', async () => {
    const acceptRes = await axios.post(
      `${API_BASE}/driver/rides/${rideId}/accept`,
      {},
      { headers: { 'x-user-id': driverA, 'x-driver-id': driverA, 'Content-Type': 'application/json' } }
    )
    expect(acceptRes.data.success).toBe(true)

    const sANotifs = await fetchNotifications({ userId: studentA, headers: { 'x-user-id': studentA } })
    const sBNotifs = await fetchNotifications({ userId: studentB, headers: { 'x-user-id': studentB } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    expect(sANotifs.some((n) => n.rideId === rideId && n.eventType === 'DRIVER_ACCEPTED')).toBe(true)
    expect(sBNotifs.some((n) => n.rideId === rideId && n.eventType === 'DRIVER_ACCEPTED')).toBe(true)
    expect(allNotifs.some((n) => n.rideId === rideId && n.eventType === 'DRIVER_ACCEPTED')).toBe(true)
  })

  it('5. TRIP STARTED: Driver starts navigation -> TRIP_STARTED (Passengers + Driver + Dispatcher)', async () => {
    const startRes = await axios.post(
      `${API_BASE}/driver/rides/${rideId}/start`,
      { startLat: 17.3616, startLng: 78.4747, startLocation: 'Charminar Depot' },
      { headers: { 'x-user-id': driverA, 'x-driver-id': driverA, 'Content-Type': 'application/json' } }
    )
    expect(startRes.data.success).toBe(true)

    const sANotifs = await fetchNotifications({ userId: studentA, headers: { 'x-user-id': studentA } })
    const dNotifs = await fetchNotifications({ driverId: driverA, headers: { 'x-driver-id': driverA, 'x-user-id': driverA } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    expect(sANotifs.some((n) => n.rideId === rideId && n.eventType === 'TRIP_STARTED')).toBe(true)
    expect(dNotifs.some((n) => n.rideId === rideId && n.eventType === 'TRIP_STARTED')).toBe(true)
    expect(allNotifs.some((n) => n.rideId === rideId && n.eventType === 'TRIP_STARTED')).toBe(true)
  })

  it('6. DRIVER REACHED PICKUP: Driver arrives at Stop 1 -> DRIVER_REACHED_PICKUP (Student A + Driver + Dispatcher)', async () => {
    const liveRes = await axios.get(`${API_BASE}/rides/${rideId}/live`)
    expect(liveRes.data.success).toBe(true)
    const stops = liveRes.data.data.stops || []
    expect(stops.length).toBeGreaterThan(0)
    stop1Id = stops[0].id

    const arrRes = await axios.post(
      `${API_BASE}/driver/rides/${rideId}/stops/${stop1Id}/arrived`,
      {},
      { headers: { 'x-user-id': driverA, 'x-driver-id': driverA, 'Content-Type': 'application/json' } }
    )
    expect(arrRes.data.success).toBe(true)

    const sANotifs = await fetchNotifications({ userId: studentA, headers: { 'x-user-id': studentA } })
    const dNotifs = await fetchNotifications({ driverId: driverA, headers: { 'x-driver-id': driverA, 'x-user-id': driverA } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const sNotif = sANotifs.find((n) => n.rideId === rideId && (n.eventType === 'DRIVER_REACHED_PICKUP' || n.eventType === 'DRIVER_ARRIVED'))
    expect(sNotif).toBeDefined()
    expect(sNotif?.priority).toBe('IMPORTANT')
    expect(dNotifs.some((n) => n.rideId === rideId && (n.eventType === 'DRIVER_REACHED_PICKUP' || n.eventType === 'DRIVER_ARRIVED'))).toBe(true)
    expect(allNotifs.some((n) => n.rideId === rideId && (n.eventType === 'DRIVER_REACHED_PICKUP' || n.eventType === 'DRIVER_ARRIVED'))).toBe(true)
  })

  it('7. PASSENGER BOARDED: Student A boards vehicle -> PASSENGER_BOARDED (Student A + Driver + Dispatcher)', async () => {
    const boardRes = await axios.post(
      `${API_BASE}/driver/rides/${rideId}/stops/${stop1Id}/boarded`,
      {},
      { headers: { 'x-user-id': driverA, 'x-driver-id': driverA, 'Content-Type': 'application/json' } }
    )
    expect(boardRes.data.success).toBe(true)

    const sANotifs = await fetchNotifications({ userId: studentA, headers: { 'x-user-id': studentA } })
    const dNotifs = await fetchNotifications({ driverId: driverA, headers: { 'x-driver-id': driverA, 'x-user-id': driverA } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    expect(sANotifs.some((n) => n.rideId === rideId && n.eventType === 'PASSENGER_BOARDED')).toBe(true)
    expect(dNotifs.some((n) => n.rideId === rideId && n.eventType === 'PASSENGER_BOARDED')).toBe(true)
    expect(allNotifs.some((n) => n.rideId === rideId && n.eventType === 'PASSENGER_BOARDED')).toBe(true)
  })

  it('8. PASSENGER DROPPED: Student A dropped at destination -> PASSENGER_DROPPED (Student A + Driver + Dispatcher)', async () => {
    const dropRes = await axios.post(
      `${API_BASE}/driver/passengers`,
      { rideId, studentId: studentA, status: 'dropped' },
      { headers: { 'x-user-id': driverA, 'x-driver-id': driverA, 'Content-Type': 'application/json' } }
    )
    expect(dropRes.data.success).toBe(true)

    const sANotifs = await fetchNotifications({ userId: studentA, headers: { 'x-user-id': studentA } })
    const dNotifs = await fetchNotifications({ driverId: driverA, headers: { 'x-driver-id': driverA, 'x-user-id': driverA } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    expect(sANotifs.some((n) => n.rideId === rideId && n.eventType === 'PASSENGER_DROPPED')).toBe(true)
    expect(dNotifs.some((n) => n.rideId === rideId && n.eventType === 'PASSENGER_DROPPED')).toBe(true)
    expect(allNotifs.some((n) => n.rideId === rideId && n.eventType === 'PASSENGER_DROPPED')).toBe(true)
  })

  it('9. TRIP COMPLETED: Remaining passenger dropped / Trip completed -> TRIP_COMPLETED (All passengers + Driver + Dispatcher)', async () => {
    const dropBRes = await axios.post(
      `${API_BASE}/driver/passengers`,
      { rideId, studentId: studentB, status: 'dropped' },
      { headers: { 'x-user-id': driverA, 'x-driver-id': driverA, 'Content-Type': 'application/json' } }
    )
    expect(dropBRes.data.success).toBe(true)

    const sANotifs = await fetchNotifications({ userId: studentA, headers: { 'x-user-id': studentA } })
    const sBNotifs = await fetchNotifications({ userId: studentB, headers: { 'x-user-id': studentB } })
    const dNotifs = await fetchNotifications({ driverId: driverA, headers: { 'x-driver-id': driverA, 'x-user-id': driverA } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    expect(sANotifs.some((n) => n.rideId === rideId && (n.eventType === 'TRIP_COMPLETED' || n.eventType === 'RIDE_COMPLETED'))).toBe(true)
    expect(sBNotifs.some((n) => n.rideId === rideId && (n.eventType === 'TRIP_COMPLETED' || n.eventType === 'RIDE_COMPLETED'))).toBe(true)
    expect(dNotifs.some((n) => n.rideId === rideId && (n.eventType === 'TRIP_COMPLETED' || n.eventType === 'RIDE_COMPLETED'))).toBe(true)
    expect(allNotifs.some((n) => n.rideId === rideId && (n.eventType === 'TRIP_COMPLETED' || n.eventType === 'RIDE_COMPLETED'))).toBe(true)
  })

  it('10. SAFETY SOS: Emergency triggered -> SOS_TRIGGERED (CRITICAL priority for Student, Driver, Dispatcher)', async () => {
    const sosRes = await axios.post(
      `${API_BASE}/safety/sos`,
      { rideId, userId: studentA, lat: 17.3616, lng: 78.4747 },
      { headers: { 'x-user-id': studentA, 'Content-Type': 'application/json' } }
    )
    expect(sosRes.data.success).toBe(true)
    sosEventId = sosRes.data.data.id

    const sANotifs = await fetchNotifications({ userId: studentA, headers: { 'x-user-id': studentA } })
    const dNotifs = await fetchNotifications({ driverId: driverA, headers: { 'x-driver-id': driverA, 'x-user-id': driverA } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const sNotif = sANotifs.find((n) => n.rideId === rideId && n.eventType === 'SOS_TRIGGERED')
    const dNotif = dNotifs.find((n) => n.rideId === rideId && n.eventType === 'SOS_TRIGGERED')
    const dispNotif = allNotifs.find((n) => n.rideId === rideId && n.eventType === 'SOS_TRIGGERED')

    expect(sNotif?.priority).toBe('CRITICAL')
    expect(dNotif?.priority).toBe('CRITICAL')
    expect(dispNotif?.priority).toBe('CRITICAL')
  })

  it('11. SAFETY RESOLUTION: Dispatcher resolves SOS -> SOS_RESOLVED (Student, Driver, Dispatcher)', async () => {
    const resRes = await axios.post(
      `${API_BASE}/safety/events/${sosEventId}/resolve`,
      {},
      { headers: { 'x-user-id': 'admin1', 'Content-Type': 'application/json' } }
    )
    expect(resRes.data.success).toBe(true)

    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })
    expect(allNotifs.some((n) => n.rideId === rideId && n.eventType === 'SOS_RESOLVED')).toBe(true)
  })

  it('12. DISPATCHER REASSIGNMENT: Driver reassigned -> DRIVER_REASSIGNED (Old Driver, New Driver, Passengers, Dispatcher)', async () => {
    const reassignRes = await axios.post(
      `${API_BASE}/dispatcher/rides/${rideId}/reassign-driver`,
      { driverId: driverB },
      { headers: { 'x-user-id': 'admin1', 'Content-Type': 'application/json' } }
    )
    expect(reassignRes.data.success).toBe(true)

    const oldDriverNotifs = await fetchNotifications({ driverId: driverA, headers: { 'x-driver-id': driverA, 'x-user-id': driverA } })
    const newDriverNotifs = await fetchNotifications({ driverId: driverB, headers: { 'x-driver-id': driverB, 'x-user-id': driverB } })

    expect(oldDriverNotifs.some((n) => n.rideId === rideId && n.eventType === 'DRIVER_REASSIGNED')).toBe(true)
    expect(newDriverNotifs.some((n) => n.rideId === rideId && n.eventType === 'DRIVER_REASSIGNED')).toBe(true)
  })
})
