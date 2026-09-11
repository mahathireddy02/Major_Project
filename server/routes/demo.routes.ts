import { FastifyPluginAsync } from 'fastify'
import { RideModel } from '../models/Ride.js'
import { BookingModel } from '../models/Booking.js'
import { NotificationModel } from '../models/Notification.js'
import { UserModel } from '../models/User.js'
import { realtimeService } from '../services/realtimeService.js'
import { safetyService } from '../services/safetyService.js'
import { seedDatabase } from '../seeds/seed.js'

import { notificationService } from '../services/notificationService.js'

let trafficActive = false

export const demoRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Fill next seat on Ride #102 (or requested ride)
  fastify.post('/fill-seat', async (request, reply) => {
    const { rideId = 'ride-102' } = (request.body as { rideId?: string }) || {}
    const ride = await RideModel.findOne({ id: rideId })
    if (!ride) {
      return reply.status(404).send({ success: false, error: { message: 'Ride not found' } })
    }

    if (ride.bookedSeats >= ride.capacity) {
      return reply.status(409).send({ success: false, error: { message: 'Ride already full' } })
    }

    const nextSeat = ride.bookedSeats + 1
    const student = await UserModel.findOne({ role: 'STUDENT', id: { $nin: ride.passengers.map((p: any) => p.studentId) } })
    const studentId = student?.id || `s-demo-${Date.now().toString().slice(-4)}`
    const studentName = student?.name || 'Demo Student'
    const pickup = ride.pickupPoints[0]?.name || 'Hostel A'

    ride.bookedSeats += 1
    ride.passengers.push({
      studentId,
      name: studentName,
      pickup,
      status: 'waiting',
      seatNo: nextSeat,
    })

    if (ride.bookedSeats >= ride.capacity) {
      ride.status = 'full'
      realtimeService.broadcast('RIDE_FULL', { rideId })
    }
    await ride.save()

    // Add booking record
    await BookingModel.create({
      id: `b-demo-${Date.now()}`,
      studentId,
      rideId,
      pickup,
      destination: ride.destination,
      seats: 1,
      fare: ride.fare,
      seatNo: nextSeat,
      status: 'confirmed',
      bookedAt: new Date(),
    })

    const driverUser = await UserModel.findOne({ id: ride.driverId })
    await notificationService.notifyRideEvent('PASSENGER_ADDED', {
      rideId,
      routeName: ride.routeName,
      driverId: ride.driverId,
      driverName: driverUser?.name || 'Driver',
      studentId,
      studentName,
      pickup,
      destination: ride.destination,
      departureTime: ride.departureTime,
      fare: ride.fare,
    })

    realtimeService.broadcast('BOOKING_CREATED', { ride, studentName })
    realtimeService.broadcast('RIDE_UPDATED', { ride })

    return { success: true, data: ride }
  })

  // 2. Cancel last passenger on Ride #102
  fastify.post('/cancel-passenger', async (request, reply) => {
    const { rideId = 'ride-102' } = (request.body as { rideId?: string }) || {}
    const ride = await RideModel.findOne({ id: rideId })
    if (!ride || ride.passengers.length === 0) {
      return reply.status(400).send({ success: false, error: { message: 'No passengers to cancel' } })
    }

    const removedPassenger = ride.passengers.pop()!
    ride.bookedSeats = Math.max(0, ride.bookedSeats - 1)
    if (ride.status === 'full') {
      ride.status = 'boarding'
    }
    await ride.save()

    await BookingModel.updateOne(
      { rideId, studentId: removedPassenger.studentId, status: 'confirmed' },
      { status: 'cancelled' }
    )

    const driverUser = await UserModel.findOne({ id: ride.driverId })
    await notificationService.notifyRideEvent('PASSENGER_CANCELLED', {
      rideId,
      routeName: ride.routeName,
      driverId: ride.driverId,
      driverName: driverUser?.name || 'Driver',
      studentId: removedPassenger.studentId,
      studentName: removedPassenger.name,
    })

    realtimeService.broadcast('BOOKING_CANCELLED', { rideId, studentId: removedPassenger.studentId })
    realtimeService.broadcast('RIDE_UPDATED', { ride })

    return { success: true, data: ride }
  })

  // 3. Add simulated student request arriving in the system
  fastify.post('/add-student', async () => {
    const randomStudents = ['Karthik Naidu', 'Sneha Reddy', 'Rohit Kumar', 'Aditya Menon', 'Shreya Joshi']
    const name = randomStudents[Math.floor(Math.random() * randomStudents.length)]
    const reqId = `req-demo-${Date.now()}`

    const notifs = await notificationService.notifyRideEvent('RIDE_REQUEST_CREATED', {
      studentId: 's1',
      studentName: name,
      pickup: 'Hostel Zone',
      destination: 'Main Campus Gate',
      time: '8:45 AM',
      seats: 1,
      metadata: { requestId: reqId },
    })

    return { success: true, data: notifs[0] }
  })

  // 4. Trigger route deviation
  fastify.post('/trigger-deviation', async (request) => {
    const { rideId = 'ride-105' } = (request.body as { rideId?: string }) || {}
    // Simulated coordinate on unplanned detour
    const result = await safetyService.checkRouteDeviation(rideId, 17.3825, 78.4715)
    return { success: true, data: result }
  })

  // 5. Trigger SOS
  fastify.post('/trigger-sos', async (request) => {
    const { rideId = 'ride-102', userId = 's1' } = (request.body as { rideId?: string; userId?: string }) || {}
    const event = await safetyService.triggerSOS(rideId, userId)
    return { success: true, data: event }
  })

  // 6. Toggle traffic simulation
  fastify.post('/traffic', async () => {
    trafficActive = !trafficActive
    realtimeService.broadcast('ROUTE_UPDATED', {
      trafficActive,
      message: trafficActive
        ? 'Traffic simulation active. Autonomous dynamic rerouting engaged.'
        : 'Traffic simulation stopped.',
    })
    return { success: true, data: { trafficActive } }
  })

  // 7. Reset entire database back to initial clean demo state
  fastify.post('/reset', async () => {
    trafficActive = false
    await seedDatabase()
    realtimeService.broadcast('DEMO_RESET', { message: 'Database reset to initial demo state' })
    return { success: true, message: 'Database successfully reseeded to clean demo baseline' }
  })
}
