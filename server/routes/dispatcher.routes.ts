import { FastifyPluginAsync } from 'fastify'
import { RideModel } from '../models/Ride.js'
import { VehicleModel } from '../models/Vehicle.js'
import { UserModel } from '../models/User.js'
import { SafetyEventModel } from '../models/SafetyEvent.js'
import { BookingModel } from '../models/Booking.js'
import { NotificationModel } from '../models/Notification.js'
import { AuditLogModel } from '../models/AuditLog.js'
import { requireRoles } from '../middleware/auth.js'
import { realtimeService } from '../services/realtimeService.js'
import { notificationService } from '../services/notificationService.js'
import { routingService } from '../services/routingService.js'
import { RideFareModel } from '../models/RideFare.js'
import { pricingEngine } from '../services/pricingEngine.js'

export const dispatcherRoutes: FastifyPluginAsync = async (fastify) => {
  // Enforce Dispatcher / Admin RBAC on all dispatcher endpoints
  fastify.addHook('preHandler', requireRoles(['DISPATCHER', 'ADMIN']))

  // 1. Command center live analytics & KPIs (100% database-driven)
  fastify.get('/dashboard', async (request) => {
    const [totalStudents, rides, vehicles, drivers, activeEvents, pendingBookings, auditLogs] = await Promise.all([
      UserModel.countDocuments({ role: 'STUDENT' }),
      RideModel.find({}).sort({ createdAt: -1 }),
      VehicleModel.find({}).sort({ name: 1 }),
      UserModel.find({ role: 'DRIVER' }).sort({ name: 1 }),
      SafetyEventModel.find({ resolved: false }).sort({ createdAt: -1 }),
      BookingModel.find({ status: 'pending' }).sort({ createdAt: -1 }),
      AuditLogModel.find({}).sort({ timestamp: -1 }).limit(20),
    ])

    const activeRides = rides.filter((r) => r.status !== 'completed' && r.status !== 'cancelled')
    const runningVehicles = activeRides.filter((r) => r.status === 'active' || r.status === 'boarding').length

    let totalCapacity = 0
    let totalBooked = 0
    let availableSeats = 0

    for (const r of activeRides) {
      totalCapacity += r.capacity
      totalBooked += r.bookedSeats
      availableSeats += Math.max(0, r.capacity - r.bookedSeats)
    }

    const avgOccupancy = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0

    // Fetch real-time dynamic pricing fleet metrics
    const fleetPricing = await pricingEngine.getFleetMetrics()

    return {
      success: true,
      data: {
        kpis: {
          activeStudents: totalStudents,
          activeRides: activeRides.length,
          availableSeats,
          vehiclesRunning: runningVehicles,
          totalVehicles: vehicles.length,
          totalDrivers: drivers.length,
          activeSafetyAlerts: activeEvents.length,
          pendingRequests: pendingBookings.length,
          estimatedSavings: fleetPricing.averageSharedSavings * (fleetPricing.totalPassengersCount || 1),
          avgOccupancy,
          totalRevenue: fleetPricing.totalRevenue,
          averageFarePerPassenger: fleetPricing.averageFarePerPassenger,
          averageSharedSavings: fleetPricing.averageSharedSavings,
          demandLevel: fleetPricing.demandLevel,
        },
        alerts: activeEvents,
        activeRides,
        vehicles,
        drivers,
        pendingRequests: pendingBookings,
        auditLogs,
      },
    }
  })

  // 2. List all rides
  fastify.get('/rides', async () => {
    const rides = await RideModel.find({}).sort({ createdAt: -1 })
    return { success: true, data: rides }
  })

  // 3. Get single ride detailed view
  fastify.get('/rides/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const ride = await RideModel.findOne({ id })
    if (!ride) {
      return reply.status(404).send({ success: false, error: { message: 'Ride not found' } })
    }

    const [driver, vehicle, bookings, fares] = await Promise.all([
      UserModel.findOne({ id: ride.driverId }),
      VehicleModel.findOne({ id: ride.vehicleId }),
      BookingModel.find({ rideId: id }),
      RideFareModel.find({ rideId: id }),
    ])

    return {
      success: true,
      data: {
        ride,
        driver,
        vehicle,
        bookings,
        fares,
      },
    }
  })

  // 4. List all vehicles
  fastify.get('/vehicles', async () => {
    const vehicles = await VehicleModel.find({}).sort({ name: 1 })
    return { success: true, data: vehicles }
  })

  // 5. List all drivers
  fastify.get('/drivers', async () => {
    const drivers = await UserModel.find({ role: 'DRIVER' }).sort({ name: 1 })
    return { success: true, data: drivers }
  })

  // 6. List active safety alerts
  fastify.get('/alerts', async () => {
    const alerts = await SafetyEventModel.find({ resolved: false }).sort({ createdAt: -1 })
    return { success: true, data: alerts }
  })

  // 7. List pending ride requests
  fastify.get('/requests', async () => {
    const pending = await BookingModel.find({ status: 'pending' }).sort({ createdAt: -1 })
    return { success: true, data: pending }
  })

  // 8. Reassign Driver to Ride
  fastify.post('/rides/:rideId/reassign-driver', async (request, reply) => {
    const { rideId } = request.params as { rideId: string }
    const { driverId } = (request.body as { driverId?: string }) || {}
    const dispatcherId = (request.headers['x-user-id'] as string) || 'admin1'

    if (!driverId) {
      return reply.status(400).send({ success: false, error: { message: 'driverId is required' } })
    }

    const driver = await UserModel.findOne({ id: driverId, role: 'DRIVER' })
    if (!driver) {
      return reply.status(404).send({ success: false, error: { message: 'Driver not found' } })
    }

    const currentRide = await RideModel.findOne({ id: rideId })
    if (!currentRide) {
      return reply.status(404).send({ success: false, error: { message: 'Ride not found' } })
    }

    const previousDriverId = currentRide.driverId

    const updatedRide = await RideModel.findOneAndUpdate(
      { id: rideId },
      { driverId },
      { new: true }
    )

    // Central Notification: Driver Reassigned
    const passengerIds = (currentRide.passengers || []).map((p: any) => p.studentId).filter(Boolean)
    await notificationService.notifyRideEvent('DRIVER_REASSIGNED', {
      rideId,
      routeName: updatedRide?.routeName || currentRide.routeName,
      driverId,
      driverName: driver.name,
      previousDriverId,
      passengerIds,
    })

    // Log Audit Event
    const auditLog = await AuditLogModel.create({
      id: `audit-${Date.now()}`,
      dispatcherId,
      action: 'REASSIGN_DRIVER',
      rideId,
      targetType: 'DRIVER',
      targetId: driverId,
      metadata: { previousDriverId, newDriverId: driverId, driverName: driver.name },
      timestamp: new Date(),
    })

    realtimeService.broadcast('DRIVER_REASSIGNED', { rideId, previousDriverId, newDriverId: driverId, ride: updatedRide })
    realtimeService.broadcast('RIDE_UPDATED', { ride: updatedRide })

    return { success: true, data: { ride: updatedRide, auditLog } }
  })

  // 9. Reassign Vehicle to Ride
  fastify.post('/rides/:rideId/reassign-vehicle', async (request, reply) => {
    const { rideId } = request.params as { rideId: string }
    const { vehicleId } = (request.body as { vehicleId?: string }) || {}
    const dispatcherId = (request.headers['x-user-id'] as string) || 'admin1'

    if (!vehicleId) {
      return reply.status(400).send({ success: false, error: { message: 'vehicleId is required' } })
    }

    const vehicle = await VehicleModel.findOne({ id: vehicleId })
    if (!vehicle) {
      return reply.status(404).send({ success: false, error: { message: 'Vehicle not found' } })
    }

    const currentRide = await RideModel.findOne({ id: rideId })
    if (!currentRide) {
      return reply.status(404).send({ success: false, error: { message: 'Ride not found' } })
    }

    if (vehicle.capacity < currentRide.bookedSeats) {
      return reply.status(400).send({
        success: false,
        error: { message: `Vehicle capacity (${vehicle.capacity}) is lower than booked seats (${currentRide.bookedSeats})` },
      })
    }

    const previousVehicleId = currentRide.vehicleId

    const updatedRide = await RideModel.findOneAndUpdate(
      { id: rideId },
      { vehicleId, capacity: vehicle.capacity },
      { new: true }
    )

    // Central Notification: Vehicle Reassigned
    const passengerIds = (currentRide.passengers || []).map((p: any) => p.studentId).filter(Boolean)
    await notificationService.notifyRideEvent('VEHICLE_REASSIGNED', {
      rideId,
      routeName: updatedRide?.routeName || currentRide.routeName,
      driverId: currentRide.driverId,
      vehicleId,
      vehicleName: vehicle.name,
      previousVehicleId,
      passengerIds,
    })

    // Log Audit Event
    const auditLog = await AuditLogModel.create({
      id: `audit-${Date.now()}`,
      dispatcherId,
      action: 'REASSIGN_VEHICLE',
      rideId,
      targetType: 'VEHICLE',
      targetId: vehicleId,
      metadata: { previousVehicleId, newVehicleId: vehicleId, vehicleName: vehicle.name },
      timestamp: new Date(),
    })

    realtimeService.broadcast('VEHICLE_REASSIGNED', { rideId, previousVehicleId, newVehicleId: vehicleId, ride: updatedRide })
    realtimeService.broadcast('RIDE_UPDATED', { ride: updatedRide })

    return { success: true, data: { ride: updatedRide, auditLog } }
  })

  // 10. Cancel Ride
  fastify.post('/rides/:rideId/cancel', async (request, reply) => {
    const { rideId } = request.params as { rideId: string }
    const { reason } = (request.body as { reason?: string }) || {}
    const dispatcherId = (request.headers['x-user-id'] as string) || 'admin1'

    const ride = await RideModel.findOne({ id: rideId })
    if (!ride) {
      return reply.status(404).send({ success: false, error: { message: 'Ride not found' } })
    }

    const updatedRide = await RideModel.findOneAndUpdate(
      { id: rideId },
      { status: 'cancelled' },
      { new: true }
    )

    // Update associated bookings
    await BookingModel.updateMany({ rideId }, { status: 'cancelled' })

    // Central Notification: Ride Cancelled by Dispatch
    const passengerIds = (ride.passengers || []).map((p: any) => p.studentId).filter(Boolean)
    await notificationService.notifyRideEvent('RIDE_CANCELLED', {
      rideId,
      routeName: ride.routeName,
      driverId: ride.driverId,
      passengerIds,
      reason,
    })

    // Log Audit Event
    const auditLog = await AuditLogModel.create({
      id: `audit-${Date.now()}`,
      dispatcherId,
      action: 'CANCEL_RIDE',
      rideId,
      targetType: 'RIDE',
      targetId: rideId,
      metadata: { routeName: ride.routeName, reason: reason || 'Cancelled by Dispatch Control' },
      timestamp: new Date(),
    })

    realtimeService.broadcast('RIDE_CANCELLED', { rideId, ride: updatedRide })
    realtimeService.broadcast('RIDE_UPDATED', { ride: updatedRide })

    return { success: true, data: { ride: updatedRide, auditLog } }
  })

  // 11. Recalculate Route using OSRM Routing Engine
  fastify.post('/rides/:rideId/recalculate-route', async (request, reply) => {
    const { rideId } = request.params as { rideId: string }
    const dispatcherId = (request.headers['x-user-id'] as string) || 'admin1'

    const ride = await RideModel.findOne({ id: rideId })
    if (!ride) {
      return reply.status(404).send({ success: false, error: { message: 'Ride not found' } })
    }

    const waypoints: [number, number][] = [
      [ride.currentLat || ride.destinationLat, ride.currentLng || ride.destinationLng],
      ...ride.pickupPoints.map((pp: any) => [pp.lat, pp.lng] as [number, number]),
      [ride.destinationLat, ride.destinationLng],
    ]

    const osrmRoute = await routingService.getRoute(waypoints)
    const updatedRide = await RideModel.findOneAndUpdate(
      { id: rideId },
      {
        routeCoordinates: osrmRoute.geometry,
        distanceKm: Number((osrmRoute.distanceMeters / 1000).toFixed(1)),
        estimatedArrival: `${Math.round(osrmRoute.durationSeconds / 60)} mins`,
      },
      { new: true }
    )

    // Central Notification: Route Recalculated
    const passengerIds = (ride.passengers || []).map((p: any) => p.studentId).filter(Boolean)
    await notificationService.notifyRideEvent('ROUTE_UPDATED', {
      rideId,
      routeName: ride.routeName,
      driverId: ride.driverId,
      passengerIds,
      eta: updatedRide?.estimatedArrival,
    })

    // Log Audit Event
    const auditLog = await AuditLogModel.create({
      id: `audit-${Date.now()}`,
      dispatcherId,
      action: 'RECALCULATE_ROUTE',
      rideId,
      targetType: 'RIDE',
      targetId: rideId,
      metadata: { distanceKm: updatedRide?.distanceKm, durationSeconds: osrmRoute.durationSeconds },
      timestamp: new Date(),
    })

    realtimeService.broadcast('ROUTE_UPDATED', { rideId, ride: updatedRide })
    realtimeService.broadcast('RIDE_UPDATED', { ride: updatedRide })

    return { success: true, data: { ride: updatedRide, auditLog } }
  })

  // 12. Resolve Safety Event
  fastify.post('/safety-events/:id/resolve', async (request, reply) => {
    const { id } = request.params as { id: string }
    const dispatcherId = (request.headers['x-user-id'] as string) || 'admin1'

    const event = await SafetyEventModel.findOne({ id })
    if (!event) {
      return reply.status(404).send({ success: false, error: { message: 'Safety event not found' } })
    }

    event.resolved = true
    event.resolvedAt = new Date()
    event.resolvedBy = dispatcherId
    await event.save()

    // If ride associated, check if all alerts resolved
    if (event.rideId) {
      const remainingAlerts = await SafetyEventModel.countDocuments({ rideId: event.rideId, resolved: false })
      if (remainingAlerts === 0) {
        await RideModel.findOneAndUpdate({ id: event.rideId }, { hasDeviation: false, hasSosAlert: false })
      }
      const associatedRide = await RideModel.findOne({ id: event.rideId })
      if (associatedRide) {
        const passengerIds = (associatedRide.passengers || []).map((p: any) => p.studentId).filter(Boolean)
        const driverUser = await UserModel.findOne({ id: associatedRide.driverId })
        await notificationService.notifyRideEvent('SOS_RESOLVED', {
          rideId: event.rideId,
          routeName: associatedRide.routeName,
          driverId: associatedRide.driverId,
          driverName: driverUser?.name || 'Driver',
          studentId: event.userId,
          passengerIds,
        })
      }
    }

    // Log Audit Event
    const auditLog = await AuditLogModel.create({
      id: `audit-${Date.now()}`,
      dispatcherId,
      action: 'RESOLVE_SAFETY_ALERT',
      rideId: event.rideId,
      targetType: 'SAFETY_EVENT',
      targetId: id,
      metadata: { eventType: event.type, rideId: event.rideId },
      timestamp: new Date(),
    })

    realtimeService.broadcast('SAFETY_EVENT_RESOLVED', { eventId: id, event })

    return { success: true, data: { event, auditLog } }
  })

  // 13. Audit Log stream
  fastify.get('/audit-log', async () => {
    const logs = await AuditLogModel.find({}).sort({ timestamp: -1 }).limit(50)
    return { success: true, data: logs }
  })

  // 14. Real Analytics — computed from actual DB records
  fastify.get('/analytics', async () => {
    const [allBookings, allRides, allVehicles] = await Promise.all([
      BookingModel.find({}).sort({ bookedAt: -1 }).limit(2000),
      RideModel.find({}).sort({ createdAt: -1 }).limit(2000),
      VehicleModel.find({}),
    ])

    const totalRequests = allBookings.length
    const sharedRides = allRides.filter((r) => r.bookedSeats > 1).length
    const vehiclesUsed = new Set(allRides.filter((r) => r.vehicleId).map((r) => r.vehicleId)).size
    const totalCapacity = allRides.reduce((acc, r) => acc + (r.capacity || 6), 0)
    const totalBooked = allRides.reduce((acc, r) => acc + (r.bookedSeats || 0), 0)
    const avgOccupancy = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
    const estimatedSavings = sharedRides * 480 + totalRequests * 25

    // Demand by hour from booking timestamps
    const hourCounts: Record<number, number> = {}
    for (const b of allBookings) {
      const h = new Date(b.bookedAt || b.createdAt).getHours()
      hourCounts[h] = (hourCounts[h] || 0) + 1
    }
    const demandByHour = Array.from({ length: 24 }, (_, h) => {
      const label = h < 12 ? `${h === 0 ? 12 : h}:00 AM` : `${h === 12 ? 12 : h - 12}:00 PM`
      return { time: label, requests: hourCounts[h] || 0 }
    }).filter((d) => d.requests > 0)

    // Top pickup zones from booking pickup field
    const pickupCount: Record<string, number> = {}
    for (const b of allBookings) {
      if (b.pickup) {
        const zone = b.pickup.split(',')[0].trim() // Use first part of address
        pickupCount[zone] = (pickupCount[zone] || 0) + 1
      }
    }
    const sortedZones = Object.entries(pickupCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
    const maxZoneCount = sortedZones[0]?.[1] || 1
    const topPickupZones = sortedZones.map(([zone, count]) => ({
      zone,
      count,
      pct: Math.round((count / maxZoneCount) * 100),
    }))

    // Occupancy trend by day of week from completed rides
    const dayOccupancy: Record<number, { total: number; count: number }> = {}
    for (const r of allRides.filter((r) => r.status === 'completed' || r.bookedSeats > 0)) {
      const day = new Date((r as any).createdAt || Date.now()).getDay()
      if (!dayOccupancy[day]) dayOccupancy[day] = { total: 0, count: 0 }
      const occ = r.capacity > 0 ? Math.round((r.bookedSeats / r.capacity) * 100) : 0
      dayOccupancy[day].total += occ
      dayOccupancy[day].count += 1
    }
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const occupancyTrend = DAYS.map((day, idx) => ({
      day,
      pct: dayOccupancy[idx]
        ? Math.round(dayOccupancy[idx].total / dayOccupancy[idx].count)
        : 0,
    })).filter((d) => d.pct > 0)

    return {
      success: true,
      data: {
        totalRequests,
        sharedRides,
        vehiclesUsed: vehiclesUsed || allVehicles.length,
        vehicleReduction: totalRequests > 0 ? Math.round(Math.max(0, (totalRequests - (vehiclesUsed || allVehicles.length)) / totalRequests) * 100) : 0,
        avgOccupancy,
        estimatedSavings,
        totalStudents: await UserModel.countDocuments({ role: 'STUDENT' }),
        demandByHour,
        topPickupZones,
        occupancyTrend,
      },
    }
  })

  // 15. Re-open scheduled campus routes
  fastify.post('/fleet/reset-schedule', async (request) => {
    const scheduledIds = ['ride-101', 'ride-102', 'ride-103', 'ride-104', 'ride-106', 'ride-202']
    const result = await RideModel.updateMany(
      { id: { $in: scheduledIds } },
      {
        $set: {
          status: 'waiting',
          hasSosAlert: false,
          hasDeviation: false,
          passengers: [],
          bookedSeats: 0,
        },
      }
    )

    await AuditLogModel.create({
      id: `audit-${Date.now()}`,
      dispatcherId: (request.headers['x-user-id'] as string) || 'admin1',
      action: 'RESET_SCHEDULED_FLEET',
      targetType: 'FLEET',
      targetId: 'scheduled-campus-fleet',
      metadata: { modifiedCount: result.modifiedCount, scheduledIds },
      timestamp: new Date(),
    })

    const updatedRides = await RideModel.find({ id: { $in: scheduledIds } })
    realtimeService.broadcast('FLEET_RESET', { count: result.modifiedCount, rides: updatedRides })
    realtimeService.broadcast('RIDE_UPDATED', { rides: updatedRides })

    return {
      success: true,
      data: { modifiedCount: result.modifiedCount, rides: updatedRides },
      message: `Successfully re-opened ${result.modifiedCount} scheduled campus routes to waiting status.`,
    }
  })
}

