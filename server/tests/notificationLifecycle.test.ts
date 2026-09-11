import { describe, it, expect, beforeAll } from 'vitest'
import axios from 'axios'

const API_BASE = 'http://localhost:5000/api'

// Central test helper to fetch notifications via HTTP API from running server
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

describe('CampusFlow — Real-Time Ride Notification Lifecycle Test Suite', () => {
  const studentId = 's1'
  const driverId = 'd1'
  let testRideId = ''
  let createdStopId = ''
  let sosEventId = ''

  beforeAll(async () => {
    const health = await axios.get('http://localhost:5000/health', { timeout: 3000 })
    expect(health.data?.status).toBe('healthy')
  })

  // 1. Student requests a ride -> RIDE_REQUEST_CREATED
  it('1. Ride Request Submitted -> RIDE_REQUEST_CREATED (Student + Dispatcher)', async () => {
    const res = await axios.post(
      `${API_BASE}/ride-requests`,
      {
        userId: studentId,
        pickup: 'Hostel Block 4',
        destination: 'Engineering Campus Gate',
        time: '8:45 AM',
        seats: 1,
        pickupLat: 17.398,
        pickupLng: 78.479,
        destinationLat: 17.387,
        destinationLng: 78.486,
      },
      { headers: { 'x-user-id': studentId, 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.eventType === 'RIDE_REQUEST_CREATED')
    const dispatcherNotif = allNotifs.find((n) => n.eventType === 'RIDE_REQUEST_CREATED')

    expect(studentNotif).toBeDefined()
    expect(dispatcherNotif).toBeDefined()
  })

  // 2. Create Ride and Student Joins -> PASSENGER_ADDED (Student + Driver + Dispatcher)
  it('2. Passenger Joins Pooled Ride -> PASSENGER_ADDED (Student + Driver + Dispatcher)', async () => {
    const rideRes = await axios.post(
      `${API_BASE}/rides`,
      {
        routeName: 'Morning Shuttle #88',
        driverId: driverId,
        vehicleId: 'v1',
        pickupPoints: [{ id: 'pp-1', name: 'Hostel Bay 1', lat: 17.398, lng: 78.479, estimatedPickupTime: '8:45 AM' }],
        destination: 'Main Campus',
        destinationLat: 17.387,
        destinationLng: 78.486,
        departureTime: '8:45 AM',
        capacity: 6,
        bookedSeats: 0,
        passengers: [],
      },
      { headers: { 'Content-Type': 'application/json' } }
    )
    testRideId = rideRes.data.data.id

    const joinRes = await axios.post(
      `${API_BASE}/rides/${testRideId}/join`,
      {
        studentId: studentId,
        pickup: 'Hostel Bay 1',
        destination: 'Main Campus',
        seats: 1,
      },
      { headers: { 'x-user-id': studentId, 'Content-Type': 'application/json' } }
    )

    expect(joinRes.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const driverNotifs = await fetchNotifications({ driverId: driverId, headers: { 'x-driver-id': driverId, 'x-user-id': driverId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && n.eventType === 'PASSENGER_ADDED')
    const driverNotif = driverNotifs.find((n) => n.rideId === testRideId && n.eventType === 'PASSENGER_ADDED')
    const dispatcherNotif = allNotifs.find((n) => n.rideId === testRideId && n.eventType === 'PASSENGER_ADDED')

    expect(studentNotif).toBeDefined()
    expect(driverNotif).toBeDefined()
    expect(dispatcherNotif).toBeDefined()
  })

  // 3. Driver accepts ride -> DRIVER_ACCEPTED (Passenger + Dispatcher)
  it('3. Driver Accepts Ride -> DRIVER_ACCEPTED (Passengers + Dispatcher)', async () => {
    const res = await axios.post(
      `${API_BASE}/driver/rides/${testRideId}/accept`,
      {},
      { headers: { 'x-user-id': driverId, 'x-driver-id': driverId, 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && n.eventType === 'DRIVER_ACCEPTED')
    const dispatcherNotif = allNotifs.find((n) => n.rideId === testRideId && n.eventType === 'DRIVER_ACCEPTED')

    expect(studentNotif).toBeDefined()
    expect(dispatcherNotif).toBeDefined()
  })

  // 4. Driver starts trip -> TRIP_STARTED (Passenger + Driver + Dispatcher)
  it('4. Driver Starts Trip -> TRIP_STARTED (Passengers + Driver + Dispatcher)', async () => {
    const res = await axios.post(
      `${API_BASE}/driver/rides/${testRideId}/start`,
      {},
      { headers: { 'x-user-id': driverId, 'x-driver-id': driverId, 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const driverNotifs = await fetchNotifications({ driverId: driverId, headers: { 'x-driver-id': driverId, 'x-user-id': driverId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && n.eventType === 'TRIP_STARTED')
    const driverNotif = driverNotifs.find((n) => n.rideId === testRideId && n.eventType === 'TRIP_STARTED')
    const dispatcherNotif = allNotifs.find((n) => n.rideId === testRideId && n.eventType === 'TRIP_STARTED')

    expect(studentNotif).toBeDefined()
    expect(driverNotif).toBeDefined()
    expect(dispatcherNotif).toBeDefined()

    const rideInApi = await axios.get(`${API_BASE}/rides/${testRideId}`)
    createdStopId = rideInApi.data?.data?.stops?.[0]?.id || 'stop-1'
  })

  // 5. Driver reaches pickup -> DRIVER_REACHED_PICKUP (Passenger + Driver + Dispatcher)
  it('5. Driver Reaches Pickup -> DRIVER_REACHED_PICKUP (Passenger + Driver + Dispatcher)', async () => {
    const res = await axios.post(
      `${API_BASE}/driver/rides/${testRideId}/stops/${createdStopId}/arrived`,
      {},
      { headers: { 'x-user-id': driverId, 'x-driver-id': driverId, 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const driverNotifs = await fetchNotifications({ driverId: driverId, headers: { 'x-driver-id': driverId, 'x-user-id': driverId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && n.eventType === 'DRIVER_REACHED_PICKUP')
    const driverNotif = driverNotifs.find((n) => n.rideId === testRideId && n.eventType === 'DRIVER_REACHED_PICKUP')
    const dispatcherNotif = allNotifs.find((n) => n.rideId === testRideId && n.eventType === 'DRIVER_REACHED_PICKUP')

    expect(studentNotif).toBeDefined()
    expect(driverNotif).toBeDefined()
    expect(dispatcherNotif).toBeDefined()
  })

  // 6. Passenger boards -> PASSENGER_BOARDED (Passenger + Driver + Dispatcher)
  it('6. Passenger Boards -> PASSENGER_BOARDED (Passenger + Driver + Dispatcher)', async () => {
    const res = await axios.post(
      `${API_BASE}/driver/rides/${testRideId}/stops/${createdStopId}/boarded`,
      {},
      { headers: { 'x-user-id': driverId, 'x-driver-id': driverId, 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const driverNotifs = await fetchNotifications({ driverId: driverId, headers: { 'x-driver-id': driverId, 'x-user-id': driverId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && n.eventType === 'PASSENGER_BOARDED')
    const driverNotif = driverNotifs.find((n) => n.rideId === testRideId && n.eventType === 'PASSENGER_BOARDED')
    const dispatcherNotif = allNotifs.find((n) => n.rideId === testRideId && n.eventType === 'PASSENGER_BOARDED')

    expect(studentNotif).toBeDefined()
    expect(driverNotif).toBeDefined()
    expect(dispatcherNotif).toBeDefined()
  })

  // 7. Route Recalculated by Dispatcher -> ROUTE_UPDATED (Passengers + Driver + Dispatcher)
  it('7. Route Recalculated -> ROUTE_UPDATED (Passengers + Driver + Dispatcher)', async () => {
    const res = await axios.post(
      `${API_BASE}/dispatcher/rides/${testRideId}/recalculate-route`,
      {},
      { headers: { 'x-user-id': 'admin1', 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const driverNotifs = await fetchNotifications({ driverId: driverId, headers: { 'x-driver-id': driverId, 'x-user-id': driverId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && n.eventType === 'ROUTE_UPDATED')
    const driverNotif = driverNotifs.find((n) => n.rideId === testRideId && n.eventType === 'ROUTE_UPDATED')
    const dispatcherNotif = allNotifs.find((n) => n.rideId === testRideId && n.eventType === 'ROUTE_UPDATED')

    expect(studentNotif).toBeDefined()
    expect(driverNotif).toBeDefined()
    expect(dispatcherNotif).toBeDefined()
  })

  // 8. Passenger dropped -> PASSENGER_DROPPED (Passenger + Driver + Dispatcher)
  it('8. Passenger Dropped -> PASSENGER_DROPPED (Passenger + Driver + Dispatcher)', async () => {
    const res = await axios.post(
      `${API_BASE}/driver/passengers`,
      {
        rideId: testRideId,
        studentId: studentId,
        status: 'dropped',
      },
      { headers: { 'x-user-id': driverId, 'x-driver-id': driverId, 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const driverNotifs = await fetchNotifications({ driverId: driverId, headers: { 'x-driver-id': driverId, 'x-user-id': driverId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && n.eventType === 'PASSENGER_DROPPED')
    const driverNotif = driverNotifs.find((n) => n.rideId === testRideId && n.eventType === 'PASSENGER_DROPPED')
    const dispatcherNotif = allNotifs.find((n) => n.rideId === testRideId && n.eventType === 'PASSENGER_DROPPED')

    expect(studentNotif).toBeDefined()
    expect(driverNotif).toBeDefined()
    expect(dispatcherNotif).toBeDefined()
  })

  // 9. Trip Completed -> TRIP_COMPLETED (Passengers + Driver + Dispatcher)
  it('9. Trip Completed -> TRIP_COMPLETED (Passengers + Driver + Dispatcher)', async () => {
    const res = await axios.post(
      `${API_BASE}/driver/rides/${testRideId}/complete`,
      {},
      { headers: { 'x-user-id': driverId, 'x-driver-id': driverId, 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const driverNotifs = await fetchNotifications({ driverId: driverId, headers: { 'x-driver-id': driverId, 'x-user-id': driverId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && n.eventType === 'TRIP_COMPLETED')
    const driverNotif = driverNotifs.find((n) => n.rideId === testRideId && n.eventType === 'TRIP_COMPLETED')
    const dispatcherNotif = allNotifs.find((n) => n.rideId === testRideId && n.eventType === 'TRIP_COMPLETED')

    expect(studentNotif).toBeDefined()
    expect(driverNotif).toBeDefined()
    expect(dispatcherNotif).toBeDefined()
  })

  // 10. Emergency SOS Triggered -> SOS_TRIGGERED (CRITICAL priority to Student + Driver + Dispatcher)
  it('10. SOS Triggered -> SOS_TRIGGERED (CRITICAL priority)', async () => {
    const res = await axios.post(
      `${API_BASE}/safety/sos`,
      {
        rideId: testRideId,
        userId: studentId,
        lat: 17.398,
        lng: 78.479,
      },
      { headers: { 'x-user-id': studentId, 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)
    sosEventId = res.data.data.id

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const driverNotifs = await fetchNotifications({ driverId: driverId, headers: { 'x-driver-id': driverId, 'x-user-id': driverId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && (n.eventType === 'SOS_TRIGGERED' || n.eventType === 'STUDENT_SOS_TRIGGERED'))
    const driverNotif = driverNotifs.find((n) => n.rideId === testRideId && (n.eventType === 'SOS_TRIGGERED' || n.eventType === 'STUDENT_SOS_TRIGGERED'))
    const dispatcherNotif = allNotifs.find((n) => n.rideId === testRideId && (n.eventType === 'SOS_TRIGGERED' || n.eventType === 'STUDENT_SOS_TRIGGERED'))

    expect(studentNotif?.priority).toBe('CRITICAL')
    expect(driverNotif?.priority).toBe('CRITICAL')
    expect(dispatcherNotif?.priority).toBe('CRITICAL')
  })

  // 11. Route Deviation -> ROUTE_DEVIATION (IMPORTANT priority)
  it('11. Route Deviation -> ROUTE_DEVIATION (IMPORTANT priority)', async () => {
    const res = await axios.post(
      `${API_BASE}/safety/route-deviation`,
      {
        rideId: testRideId,
        lat: 17.32,
        lng: 78.40,
      },
      { headers: { 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && n.eventType === 'ROUTE_DEVIATION')
    const dispatcherNotif = allNotifs.find((n) => n.rideId === testRideId && n.eventType === 'ROUTE_DEVIATION')

    expect(studentNotif?.priority).toBe('IMPORTANT')
    expect(dispatcherNotif?.priority).toBe('IMPORTANT')
  })

  // 12. Safety Event Resolved -> SOS_RESOLVED (Student + Driver + Dispatcher)
  it('12. Safety Event Resolved -> SOS_RESOLVED (Student + Driver + Dispatcher)', async () => {
    expect(sosEventId).toBeTruthy()
    const res = await axios.post(
      `${API_BASE}/dispatcher/safety-events/${sosEventId}/resolve`,
      {},
      { headers: { 'x-user-id': 'admin1', 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const driverNotifs = await fetchNotifications({ driverId: driverId, headers: { 'x-driver-id': driverId, 'x-user-id': driverId } })
    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })

    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && n.eventType === 'SOS_RESOLVED')
    const driverNotif = driverNotifs.find((n) => n.rideId === testRideId && n.eventType === 'SOS_RESOLVED')
    const dispatcherNotif = allNotifs.find((n) => n.rideId === testRideId && n.eventType === 'SOS_RESOLVED')

    expect(studentNotif).toBeDefined()
    expect(driverNotif).toBeDefined()
    expect(dispatcherNotif).toBeDefined()
  })

  // 13. Reassign Driver -> DRIVER_REASSIGNED
  it('13. Driver Reassigned -> DRIVER_REASSIGNED', async () => {
    const res = await axios.post(
      `${API_BASE}/dispatcher/rides/${testRideId}/reassign-driver`,
      { driverId: 'd2' },
      { headers: { 'x-user-id': 'admin1', 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const allNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })
    const reassignedNotif = allNotifs.find((n) => n.rideId === testRideId && n.eventType === 'DRIVER_REASSIGNED')

    expect(reassignedNotif).toBeDefined()
  })

  // 14. Cancel Ride by Dispatcher -> RIDE_CANCELLED (IMPORTANT priority)
  it('14. Ride Cancelled by Dispatcher -> RIDE_CANCELLED (IMPORTANT priority)', async () => {
    const res = await axios.post(
      `${API_BASE}/dispatcher/rides/${testRideId}/cancel`,
      { reason: 'Severe weather alert' },
      { headers: { 'x-user-id': 'admin1', 'Content-Type': 'application/json' } }
    )

    expect(res.data.success).toBe(true)

    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const studentNotif = studentNotifs.find((n) => n.rideId === testRideId && n.eventType === 'RIDE_CANCELLED')

    expect(studentNotif?.priority).toBe('IMPORTANT')
  })

  // 15. Targeted Retrieval & Read / Unread Status
  it('15. Targeted Notification Retrieval & Mark as Read', async () => {
    const studentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    expect(studentNotifs.length).toBeGreaterThan(0)

    const dispatcherNotifs = await fetchNotifications({ all: true, headers: { 'x-user-id': 'admin1' } })
    expect(dispatcherNotifs.length).toBeGreaterThanOrEqual(studentNotifs.length)

    const firstNotif = studentNotifs[0]
    const readRes = await axios.post(
      `${API_BASE}/notifications/${firstNotif.id}/read`,
      {},
      { headers: { 'Content-Type': 'application/json' } }
    )
    expect(readRes.data.success).toBe(true)
    expect(readRes.data.data.read).toBe(true)

    const readAllRes = await axios.post(
      `${API_BASE}/notifications/read-all`,
      { userId: studentId },
      { headers: { 'x-user-id': studentId, 'Content-Type': 'application/json' } }
    )
    expect(readAllRes.data.success).toBe(true)

    const updatedStudentNotifs = await fetchNotifications({ userId: studentId, headers: { 'x-user-id': studentId } })
    const unreadCount = updatedStudentNotifs.filter((n) => !n.read).length
    expect(unreadCount).toBe(0)
  })
})
