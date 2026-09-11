import { FastifyPluginAsync } from 'fastify'
import { RideModel } from '../models/Ride.js'
import { BookingModel } from '../models/Booking.js'
import { NotificationModel } from '../models/Notification.js'
import { UserModel } from '../models/User.js'
import { realtimeService } from '../services/realtimeService.js'
import { safetyService } from '../services/safetyService.js'
import { seedDatabase } from '../seeds/seed.js'

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

    ride.bookedSeats += 1
    ride.passengers.push({
      studentId,
      name: studentName,
      pickup: ride.pickupPoints[0]?.name || 'Hostel A',
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
      pickup: ride.pickupPoints[0]?.name || 'Hostel A',
      destination: ride.destination,
      seats: 1,
      fare: ride.fare,
      seatNo: nextSeat,
      status: 'confirmed',
      bookedAt: new Date(),
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

    realtimeService.broadcast('BOOKING_CANCELLED', { rideId, studentId: removedPassenger.studentId })
    realtimeService.broadcast('RIDE_UPDATED', { ride })

    return { success: true, data: ride }
  })

  // 3. Add simulated student request arriving in the system
  fastify.post('/add-student', async () => {
    const randomStudents = ['Karthik Naidu', 'Sneha Reddy', 'Rohit Kumar', 'Aditya Menon', 'Shreya Joshi']
    const name = randomStudents[Math.floor(Math.random() * randomStudents.length)]

    const notif = await NotificationModel.create({
      id: `n-demo-${Date.now()}`,
      userId: 's1',
      type: 'system',
      title: 'New Student Booking Request',
      message: `${name} requested a ride from Hostel Zone to Main Campus.`,
    })

    realtimeService.broadcast('NOTIFICATION_ADDED', { notification: notif })
    return { success: true, data: notif }
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
