import { NotificationModel, INotification, NotificationPriority } from '../models/Notification.js'
import { realtimeService } from './realtimeService.js'

export type RideEventType =
  | 'RIDE_REQUEST_CREATED'
  | 'RIDE_MATCHED'
  | 'VEHICLE_ASSIGNED'
  | 'PASSENGER_ADDED'
  | 'BOOKING_CREATED'
  | 'PASSENGER_CANCELLED'
  | 'DRIVER_ACCEPTED'
  | 'DRIVER_DECLINED'
  | 'TRIP_STARTED'
  | 'RIDE_STARTED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_REACHED_PICKUP'
  | 'DRIVER_ARRIVED'
  | 'PASSENGER_BOARDED'
  | 'PASSENGER_NO_SHOW'
  | 'ARRIVED_DESTINATION'
  | 'PASSENGER_DROPPED'
  | 'TRIP_COMPLETED'
  | 'RIDE_COMPLETED'
  | 'ROUTE_UPDATED'
  | 'DRIVER_REASSIGNED'
  | 'VEHICLE_REASSIGNED'
  | 'VEHICLE_UNAVAILABLE'
  | 'VEHICLE_FAILURE'
  | 'RIDE_CANCELLED'
  | 'ROUTE_DEVIATION'
  | 'DEMAND_SPIKE'
  | 'SOS_TRIGGERED'
  | 'SOS_ACKNOWLEDGED'
  | 'SOS_RESOLVED'
  | 'SAFETY_ALERT'
  | 'NETWORK_OPTIMIZED'

export interface RideEventPayload {
  rideId?: string
  bookingId?: string
  studentId?: string
  studentName?: string
  passengerIds?: string[]
  driverId?: string
  driverName?: string
  previousDriverId?: string
  vehicleId?: string
  vehicleName?: string
  vehiclePlate?: string
  previousVehicleId?: string
  routeName?: string
  pickup?: string
  destination?: string
  stopId?: string
  stopName?: string
  fare?: number
  seats?: number
  departureTime?: string
  time?: string
  eta?: string
  reason?: string
  deviationMeters?: number
  createdRideCount?: number
  metadata?: Record<string, any>
  priority?: NotificationPriority
}

interface NotificationTarget {
  userId: string
  studentId?: string
  driverId?: string
  role?: 'STUDENT' | 'DRIVER' | 'DISPATCHER' | 'ADMIN' | 'ALL'
  title: string
  message: string
  type: string
  priority?: NotificationPriority
  rideId?: string
  metadata?: Record<string, any>
}

class NotificationService {
  /**
   * Save a single notification to MongoDB and broadcast via WebSocket
   */
  async createAndSendNotification(target: NotificationTarget, eventType?: string): Promise<INotification> {
    const notifId = `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const priority = target.priority || 'NORMAL'

    const doc = await NotificationModel.create({
      id: notifId,
      userId: target.userId,
      studentId: target.studentId,
      driverId: target.driverId,
      role: target.role?.toLowerCase(),
      type: target.type || 'system',
      priority,
      title: target.title,
      message: target.message,
      read: false,
      rideId: target.rideId,
      eventType: eventType || 'SYSTEM',
      metadata: target.metadata,
    })

    const notifObj = {
      id: doc.id,
      userId: doc.userId,
      studentId: doc.studentId || doc.userId,
      driverId: doc.driverId,
      role: doc.role,
      type: doc.type,
      priority: doc.priority,
      title: doc.title,
      message: doc.message,
      read: doc.read,
      rideId: doc.rideId,
      eventType: doc.eventType,
      metadata: doc.metadata,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    }

    // Real-time broadcast to connected clients
    realtimeService.broadcast('NOTIFICATION_ADDED', notifObj)

    return doc
  }

  /**
   * Central Ride Event Processor:
   * Generates targeted notifications for Student, Driver, and Dispatcher
   */
  async notifyRideEvent(eventType: RideEventType, payload: RideEventPayload): Promise<INotification[]> {
    const notificationsToCreate: NotificationTarget[] = []
    const routeName = payload.routeName || (payload.rideId ? `Ride #${payload.rideId}` : 'Campus Ride')
    const driverName = payload.driverName || 'Assigned Driver'
    const studentName = payload.studentName || 'Student'
    const pickup = payload.pickup || payload.stopName || 'Campus Pickup Stop'
    const destination = payload.destination || 'Campus Destination'
    const rideId = payload.rideId

    switch (eventType) {
      case 'RIDE_REQUEST_CREATED': {
        // 1. Student notification
        if (payload.studentId) {
          notificationsToCreate.push({
            userId: payload.studentId,
            studentId: payload.studentId,
            role: 'STUDENT',
            type: 'request',
            priority: 'NORMAL',
            title: 'Ride Request Submitted',
            message: `Looking for shared rides for ${pickup} → ${destination} at ${payload.time || payload.departureTime || 'requested time'}.`,
            rideId,
            metadata: payload.metadata,
          })
        }
        // 2. Dispatcher notification
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'request',
          priority: 'NORMAL',
          title: 'New Ride Request',
          message: `Ride request from ${studentName}: ${pickup} → ${destination} (${payload.seats || 1} seat(s)).`,
          rideId,
          metadata: payload.metadata,
        })
        break
      }

      case 'RIDE_MATCHED':
      case 'VEHICLE_ASSIGNED': {
        // 1. Student
        if (payload.studentId) {
          notificationsToCreate.push({
            userId: payload.studentId,
            studentId: payload.studentId,
            role: 'STUDENT',
            type: 'match',
            priority: 'NORMAL',
            title: eventType === 'VEHICLE_ASSIGNED' ? 'Vehicle Assigned' : 'Ride Matched!',
            message: `Matched with ${routeName}! Vehicle: ${payload.vehicleName || payload.vehiclePlate || 'Campus Van'}, Departure: ${payload.departureTime || 'Soon'}.`,
            rideId,
          })
        }
        // 2. Driver
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'match',
            priority: 'NORMAL',
            title: eventType === 'VEHICLE_ASSIGNED' ? 'Vehicle Assigned to Trip' : 'New Ride Match Assigned',
            message: `Passenger ${studentName} matched on route ${routeName} at ${pickup}. Vehicle: ${payload.vehicleName || payload.vehiclePlate || 'Assigned'}.`,
            rideId,
          })
        }
        // 3. Dispatcher
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'match',
          priority: 'NORMAL',
          title: eventType === 'VEHICLE_ASSIGNED' ? 'Vehicle Assigned' : 'Ride Matched',
          message: `Ride match established for ${studentName} on ${routeName} (Driver: ${driverName}, Vehicle: ${payload.vehicleName || payload.vehiclePlate || 'Assigned'}).`,
          rideId,
        })
        break
      }

      case 'PASSENGER_ADDED':
      case 'BOOKING_CREATED': {
        const bookingTime =
          payload.time ||
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        // 1. Student
        if (payload.studentId) {
          notificationsToCreate.push({
            userId: payload.studentId,
            studentId: payload.studentId,
            role: 'STUDENT',
            type: 'match',
            priority: 'NORMAL',
            title: 'Booking Confirmed',
            message: `You joined ${routeName}. Pickup at ${pickup}, ${payload.departureTime || 'soon'}. Individual fare: ₹${payload.fare || 25}.`,
            rideId,
            metadata: {
              rideId,
              routeName,
              driverId: payload.driverId,
              driverName,
              studentId: payload.studentId,
              studentName,
              pickup,
              destination,
              departureTime: payload.departureTime,
              bookingTime,
              fare: payload.fare,
            },
          })
        }
        // 2. Driver
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            studentId: payload.studentId,
            role: 'DRIVER',
            type: 'boarding',
            priority: 'NORMAL',
            title: 'New Passenger Added',
            message: `${studentName} booked a seat on ${routeName} for pickup at ${pickup}.`,
            rideId,
            metadata: {
              rideId,
              routeName,
              driverId: payload.driverId,
              driverName,
              studentId: payload.studentId,
              studentName,
              pickup,
              destination,
              departureTime: payload.departureTime,
              bookingTime,
              fare: payload.fare,
            },
          })
        }
        // 3. Dispatcher
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'match',
          priority: 'NORMAL',
          title: 'Passenger Joined Trip',
          message: `${studentName} joined ${routeName} (Driver: ${driverName}, Pickup: ${pickup}).`,
          rideId,
          metadata: {
            rideId,
            routeName,
            driverId: payload.driverId,
            studentId: payload.studentId,
            studentName,
            pickup,
            destination,
          },
        })
        break
      }

      case 'PASSENGER_CANCELLED': {
        // 1. Student
        if (payload.studentId) {
          notificationsToCreate.push({
            userId: payload.studentId,
            studentId: payload.studentId,
            role: 'STUDENT',
            type: 'cancelled',
            priority: 'NORMAL',
            title: 'Booking Cancelled',
            message: `Your booking for ${routeName} has been cancelled.`,
            rideId,
          })
        }
        // 2. Driver
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'cancelled',
            priority: 'NORMAL',
            title: 'Passenger Cancelled',
            message: `Passenger ${studentName} cancelled booking on ${routeName}. Route updated.`,
            rideId,
          })
        }
        // 3. Dispatcher
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'cancelled',
          priority: 'NORMAL',
          title: 'Booking Cancelled',
          message: `${studentName} cancelled booking on ${routeName}.`,
          rideId,
        })
        break
      }

      case 'DRIVER_ACCEPTED': {
        // 1. Passengers
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'trip',
            priority: 'NORMAL',
            title: 'Driver Confirmed Ride',
            message: `Driver ${driverName} accepted your ride ${routeName} and is preparing for departure.`,
            rideId,
          })
        }
        // 2. Dispatcher
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'trip',
          priority: 'NORMAL',
          title: 'Driver Accepted Ride',
          message: `Driver ${driverName} accepted ride ${routeName}.`,
          rideId,
        })
        break
      }

      case 'TRIP_STARTED':
      case 'RIDE_STARTED': {
        // 1. Passengers
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'trip',
            priority: 'NORMAL',
            title: 'Trip Started',
            message: `Driver ${driverName} has started the trip for ${routeName}. Vehicle is en route to pickup points.`,
            rideId,
          })
        }
        // 2. Driver
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'trip',
            priority: 'NORMAL',
            title: 'Trip Started',
            message: `You started the trip for ${routeName}. Navigation is active.`,
            rideId,
          })
        }
        // 3. Dispatcher
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'trip',
          priority: 'NORMAL',
          title: 'Trip Started',
          message: `Driver ${driverName} started trip ${routeName} (Vehicle: ${payload.vehicleName || payload.vehicleId || 'Assigned'}).`,
          rideId,
        })
        break
      }

      case 'DRIVER_ARRIVING': {
        // 1. Passenger at stop
        if (payload.studentId) {
          notificationsToCreate.push({
            userId: payload.studentId,
            studentId: payload.studentId,
            role: 'STUDENT',
            type: 'arriving',
            priority: 'NORMAL',
            title: 'Driver Approaching',
            message: `Driver ${driverName} is approaching your pickup stop ${payload.stopName || pickup}. Please be ready!`,
            rideId,
          })
        }
        // 2. Driver
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'arriving',
            priority: 'NORMAL',
            title: 'Approaching Stop',
            message: `Approaching pickup stop ${payload.stopName || pickup}.`,
            rideId,
          })
        }
        // 3. Dispatcher
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'arriving',
          priority: 'NORMAL',
          title: 'Driver Approaching Stop',
          message: `Vehicle on ${routeName} is approaching ${payload.stopName || pickup}.`,
          rideId,
        })
        break
      }

      case 'DRIVER_REACHED_PICKUP':
      case 'DRIVER_ARRIVED': {
        // 1. Passenger at stop
        if (payload.studentId) {
          notificationsToCreate.push({
            userId: payload.studentId,
            studentId: payload.studentId,
            role: 'STUDENT',
            type: 'arriving',
            priority: 'IMPORTANT',
            title: 'Driver Reached Pickup',
            message: `Your driver has arrived at ${payload.stopName || pickup}! Look for vehicle ${payload.vehicleName || payload.vehiclePlate || 'assigned'}.`,
            rideId,
          })
        }
        // 2. Driver
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'arriving',
            priority: 'NORMAL',
            title: 'Arrived at Pickup',
            message: `You arrived at ${payload.stopName || pickup}. Waiting for passenger to board.`,
            rideId,
          })
        }
        // 3. Dispatcher
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'arriving',
          priority: 'NORMAL',
          title: 'Driver at Pickup Stop',
          message: `Driver ${driverName} reached pickup stop ${payload.stopName || pickup} on ${routeName}.`,
          rideId,
        })
        break
      }

      case 'PASSENGER_BOARDED': {
        // 1. Passenger
        if (payload.studentId) {
          notificationsToCreate.push({
            userId: payload.studentId,
            studentId: payload.studentId,
            role: 'STUDENT',
            type: 'boarding',
            priority: 'NORMAL',
            title: 'Boarding Confirmed',
            message: `You have boarded ${routeName}. Sit back and enjoy your safe ride!`,
            rideId,
          })
        }
        // 2. Driver
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'boarding',
            priority: 'NORMAL',
            title: 'Passenger Boarded',
            message: `${studentName} boarded at ${payload.stopName || pickup}.`,
            rideId,
          })
        }
        // 3. Dispatcher
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'boarding',
          priority: 'NORMAL',
          title: 'Passenger Boarded',
          message: `${studentName} boarded ${routeName} at ${payload.stopName || pickup}.`,
          rideId,
        })
        break
      }

      case 'PASSENGER_NO_SHOW': {
        if (payload.studentId) {
          notificationsToCreate.push({
            userId: payload.studentId,
            studentId: payload.studentId,
            role: 'STUDENT',
            type: 'cancelled',
            priority: 'IMPORTANT',
            title: 'No-Show Recorded',
            message: `Driver waited at ${payload.stopName || pickup} but you were marked as no-show.`,
            rideId,
          })
        }
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'cancelled',
            priority: 'NORMAL',
            title: 'Passenger No-Show',
            message: `Passenger ${studentName} was marked as no-show at ${payload.stopName || pickup}.`,
            rideId,
          })
        }
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'cancelled',
          priority: 'IMPORTANT',
          title: 'Passenger No-Show',
          message: `${studentName} marked as no-show at ${payload.stopName || pickup} on ${routeName}.`,
          rideId,
        })
        break
      }

      case 'ARRIVED_DESTINATION': {
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'trip',
            priority: 'NORMAL',
            title: 'Arrived at Destination',
            message: `Vehicle has arrived at ${destination}. Preparing for drop-off.`,
            rideId,
          })
        }
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'trip',
            priority: 'NORMAL',
            title: 'Arrived at Destination',
            message: `Arrived at destination ${destination}.`,
            rideId,
          })
        }
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'trip',
          priority: 'NORMAL',
          title: 'Vehicle at Destination',
          message: `Vehicle on ${routeName} reached destination ${destination}.`,
          rideId,
        })
        break
      }

      case 'PASSENGER_DROPPED': {
        // 1. Passenger
        if (payload.studentId) {
          notificationsToCreate.push({
            userId: payload.studentId,
            studentId: payload.studentId,
            role: 'STUDENT',
            type: 'dropped',
            priority: 'NORMAL',
            title: 'Drop-Off Completed',
            message: `You have been safely dropped at ${destination}. Thank you for riding CampusFlow!`,
            rideId,
          })
        }
        // 2. Driver
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'dropped',
            priority: 'NORMAL',
            title: 'Passenger Dropped',
            message: `${studentName} dropped at ${destination}.`,
            rideId,
          })
        }
        // 3. Dispatcher
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'dropped',
          priority: 'NORMAL',
          title: 'Passenger Dropped',
          message: `${studentName} safely dropped at ${destination} from ${routeName}.`,
          rideId,
        })
        break
      }

      case 'TRIP_COMPLETED':
      case 'RIDE_COMPLETED': {
        // 1. Passengers
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'trip',
            priority: 'NORMAL',
            title: 'Trip Completed',
            message: `Trip ${routeName} completed. Thank you for choosing CampusFlow!`,
            rideId,
          })
        }
        // 2. Driver
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'trip',
            priority: 'NORMAL',
            title: 'Trip Completed',
            message: `Trip ${routeName} marked COMPLETED. Total passengers served. Well done!`,
            rideId,
          })
        }
        // 3. Dispatcher
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'trip',
          priority: 'NORMAL',
          title: 'Trip Completed',
          message: `Trip ${routeName} completed by Driver ${driverName}. Vehicle released.`,
          rideId,
        })
        break
      }

      case 'ROUTE_UPDATED': {
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'route',
            priority: 'NORMAL',
            title: 'Route Updated',
            message: `Route for ${routeName} has been optimized. Estimated arrival: ${payload.eta || 'calculated'}.`,
            rideId,
          })
        }
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'route',
            priority: 'NORMAL',
            title: 'Route Updated',
            message: `Route for ${routeName} was updated. Follow the updated navigation.`,
            rideId,
          })
        }
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'route',
          priority: 'NORMAL',
          title: 'Route Updated',
          message: `Route recalculated/updated for ${routeName}.`,
          rideId,
        })
        break
      }

      case 'DRIVER_REASSIGNED': {
        // New Driver
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'reassigned',
            priority: 'IMPORTANT',
            title: 'New Ride Assigned',
            message: `Dispatch Control has assigned you to ${routeName}.`,
            rideId,
          })
        }
        // Previous Driver
        if (payload.previousDriverId) {
          notificationsToCreate.push({
            userId: payload.previousDriverId,
            driverId: payload.previousDriverId,
            role: 'DRIVER',
            type: 'reassigned',
            priority: 'NORMAL',
            title: 'Ride Reassigned',
            message: `Ride ${routeName} was reassigned by Dispatch Control.`,
            rideId,
          })
        }
        // Passengers
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'reassigned',
            priority: 'NORMAL',
            title: 'Driver Reassigned',
            message: `Driver for ${routeName} has been updated to ${driverName}.`,
            rideId,
          })
        }
        // Dispatcher
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'reassigned',
          priority: 'NORMAL',
          title: 'Driver Reassigned',
          message: `Driver for ${routeName} reassigned to ${driverName}.`,
          rideId,
        })
        break
      }

      case 'VEHICLE_REASSIGNED': {
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'reassigned',
            priority: 'NORMAL',
            title: 'Vehicle Reassigned',
            message: `Vehicle for ${routeName} has been changed to ${payload.vehicleName || payload.vehicleId}.`,
            rideId,
          })
        }
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'reassigned',
            priority: 'NORMAL',
            title: 'Vehicle Updated',
            message: `Vehicle for your ride ${routeName} is now ${payload.vehicleName || payload.vehicleId}.`,
            rideId,
          })
        }
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'reassigned',
          priority: 'NORMAL',
          title: 'Vehicle Reassigned',
          message: `Vehicle for ${routeName} reassigned to ${payload.vehicleName || payload.vehicleId}.`,
          rideId,
        })
        break
      }

      case 'RIDE_CANCELLED': {
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'cancelled',
            priority: 'IMPORTANT',
            title: 'Ride Cancelled by Dispatch',
            message: `Your ride (${routeName}) was cancelled by Dispatch Control. ${payload.reason ? `Reason: ${payload.reason}` : ''}`,
            rideId,
          })
        }
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'cancelled',
            priority: 'IMPORTANT',
            title: 'Ride Cancelled by Dispatch',
            message: `Ride ${routeName} was cancelled by Dispatch Control. ${payload.reason ? `Reason: ${payload.reason}` : ''}`,
            rideId,
          })
        }
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'cancelled',
          priority: 'IMPORTANT',
          title: 'Ride Cancelled',
          message: `Ride ${routeName} cancelled. ${payload.reason ? `Reason: ${payload.reason}` : ''}`,
          rideId,
        })
        break
      }

      case 'ROUTE_DEVIATION': {
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'safety',
            priority: 'IMPORTANT',
            title: 'Route Deviation Detected',
            message: `Your ride has moved away from the planned route. Campus security is monitoring.`,
            rideId,
          })
        }
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'safety',
            priority: 'IMPORTANT',
            title: 'Route Deviation Alert',
            message: `Vehicle is off the planned route (${payload.deviationMeters || ''}m). Navigation recalculating.`,
            rideId,
          })
        }
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'safety',
          priority: 'IMPORTANT',
          title: '⚠️ Route Deviation Alert',
          message: `Route deviation detected on ${routeName} (${payload.deviationMeters || 'off-route'}m from planned route).`,
          rideId,
        })
        break
      }

      case 'SOS_TRIGGERED': {
        if (payload.studentId) {
          notificationsToCreate.push({
            userId: payload.studentId,
            studentId: payload.studentId,
            role: 'STUDENT',
            type: 'emergency',
            priority: 'CRITICAL',
            title: '🚨 Emergency SOS Broadcast',
            message: `Campus Safety and emergency contacts alerted with live coordinates. Stay calm.`,
            rideId,
          })
        }
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'emergency',
            priority: 'CRITICAL',
            title: '🚨 CRITICAL SOS ALERT',
            message: `Emergency SOS triggered on your active trip ${routeName}! Stop safely and await response.`,
            rideId,
          })
        }
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'emergency',
          priority: 'CRITICAL',
          title: '🚨 CRITICAL SOS ALERT',
          message: `CRITICAL SOS: ${studentName} triggered emergency alarm on ${routeName}. Driver: ${driverName}.`,
          rideId,
        })
        break
      }

      case 'SOS_RESOLVED': {
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'safety',
            priority: 'NORMAL',
            title: 'Emergency Incident Resolved',
            message: `The safety alert on ${routeName} has been resolved by Campus Dispatch.`,
            rideId,
          })
        }
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'safety',
            priority: 'NORMAL',
            title: 'Safety Incident Resolved',
            message: `The safety alert on ${routeName} has been resolved by Dispatch.`,
            rideId,
          })
        }
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'safety',
          priority: 'NORMAL',
          title: 'Safety Event Resolved',
          message: `Safety event for ${routeName} marked RESOLVED.`,
          rideId,
        })
        break
      }

      case 'DRIVER_DECLINED': {
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'cancelled',
          priority: 'IMPORTANT',
          title: 'Driver Declined Assignment',
          message: `Driver ${driverName} declined assignment for ${routeName}. Reassignment required.`,
          rideId,
        })
        break
      }

      case 'VEHICLE_UNAVAILABLE':
      case 'VEHICLE_FAILURE': {
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'safety',
            priority: 'IMPORTANT',
            title: 'Vehicle Service Alert',
            message: `Vehicle assigned to ${routeName} is experiencing an issue. Dispatch Control is reassigning a backup vehicle.`,
            rideId,
          })
        }
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'safety',
            priority: 'IMPORTANT',
            title: 'Vehicle Status Alert',
            message: `Vehicle ${payload.vehicleName || payload.vehicleId || 'assigned'} has been flagged as unavailable / maintenance.`,
            rideId,
          })
        }
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'safety',
          priority: 'IMPORTANT',
          title: '⚠️ Fleet Vehicle Unavailable',
          message: `Vehicle ${payload.vehicleName || payload.vehicleId || 'assigned'} reported unavailable/issue on ${routeName}.`,
          rideId,
        })
        break
      }

      case 'DEMAND_SPIKE': {
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'system',
          priority: 'IMPORTANT',
          title: '📈 Demand Spike Detected',
          message: `High passenger demand detected at ${pickup}. Surge recommendation: Deploy additional fleet units.`,
          rideId,
        })
        break
      }

      case 'SOS_ACKNOWLEDGED': {
        if (payload.studentId) {
          notificationsToCreate.push({
            userId: payload.studentId,
            studentId: payload.studentId,
            role: 'STUDENT',
            type: 'emergency',
            priority: 'CRITICAL',
            title: '🚨 SOS Acknowledged by Dispatch',
            message: `Campus Safety has acknowledged your emergency. Responders are en route. Live coordinates tracking active.`,
            rideId,
          })
        }
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'emergency',
            priority: 'CRITICAL',
            title: '🚨 SOS Acknowledged by Dispatch',
            message: `Dispatch Control has acknowledged active SOS on ${routeName}. Follow safety protocols.`,
            rideId,
          })
        }
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'emergency',
          priority: 'CRITICAL',
          title: '🚨 SOS Incident Acknowledged',
          message: `Dispatcher acknowledged SOS incident for ${studentName} on ${routeName}. Emergency protocol active.`,
          rideId,
        })
        break
      }

      case 'SAFETY_ALERT': {
        const pIds = payload.passengerIds || (payload.studentId ? [payload.studentId] : [])
        for (const pid of pIds) {
          notificationsToCreate.push({
            userId: pid,
            studentId: pid,
            role: 'STUDENT',
            type: 'safety',
            priority: 'IMPORTANT',
            title: payload.reason || 'Campus Safety Alert',
            message: `Safety notice for ${routeName}: ${payload.metadata?.message || 'Please remain seated and follow driver instructions.'}`,
            rideId,
          })
        }
        if (payload.driverId) {
          notificationsToCreate.push({
            userId: payload.driverId,
            driverId: payload.driverId,
            role: 'DRIVER',
            type: 'safety',
            priority: 'IMPORTANT',
            title: payload.reason || 'Safety Advisory',
            message: `Safety alert for ${routeName}: ${payload.metadata?.message || 'Caution advised on route.'}`,
            rideId,
          })
        }
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'safety',
          priority: 'IMPORTANT',
          title: payload.reason || 'Safety Alert Broadcast',
          message: `Safety event on ${routeName}: ${payload.metadata?.message || 'Advisory issued.'}`,
          rideId,
        })
        break
      }

      case 'NETWORK_OPTIMIZED': {
        notificationsToCreate.push({
          userId: 'dispatcher',
          role: 'DISPATCHER',
          type: 'system',
          priority: 'NORMAL',
          title: 'Network Optimization Applied',
          message: `Applied network optimization: created ${payload.createdRideCount || 0} coordinated pooled rides.`,
          rideId,
        })
        break
      }

      default:
        break
    }

    const created: INotification[] = []
    for (const target of notificationsToCreate) {
      try {
        const doc = await this.createAndSendNotification(target, eventType)
        created.push(doc)
      } catch (err: any) {
        console.error(`[NotificationService] Error creating notification for ${target.userId}:`, err?.message)
      }
    }

    return created
  }
}

export const notificationService = new NotificationService()
