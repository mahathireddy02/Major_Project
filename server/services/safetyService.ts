import { SafetyEventModel, ISafetyEvent } from '../models/SafetyEvent.js'
import { RideModel } from '../models/Ride.js'
import { UserModel } from '../models/User.js'
import { EmergencyContactModel } from '../models/EmergencyContact.js'
import { NotificationModel } from '../models/Notification.js'
import { realtimeService } from './realtimeService.js'
import { notificationService } from './notificationService.js'
import { haversineDistanceMeters } from './routingService.js'
import { ENV } from '../config/env.js'

// Minimum distance from a point to a line segment
function distancePointToSegmentMeters(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  if (dx === 0 && dy === 0) {
    return haversineDistanceMeters(px, py, x1, y1)
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  const projX = x1 + t * dx
  const projY = y1 + t * dy

  return haversineDistanceMeters(px, py, projX, projY)
}

export class SafetyService {
  /**
   * Check if vehicle is off the planned route
   */
  async checkRouteDeviation(
    rideId: string,
    currentLat: number,
    currentLng: number
  ): Promise<{ hasDeviation: boolean; minDistanceMeters: number }> {
    const ride = await RideModel.findOne({ id: rideId })
    if (!ride || !ride.routeCoordinates || ride.routeCoordinates.length < 2) {
      return { hasDeviation: false, minDistanceMeters: 0 }
    }

    let minDistance = Infinity
    for (let i = 0; i < ride.routeCoordinates.length - 1; i++) {
      const [lat1, lng1] = ride.routeCoordinates[i]
      const [lat2, lng2] = ride.routeCoordinates[i + 1]
      const d = distancePointToSegmentMeters(currentLat, currentLng, lat1, lng1, lat2, lng2)
      if (d < minDistance) minDistance = d
    }

    const hasDeviation = minDistance > ENV.ROUTE_DEVIATION_THRESHOLD_METERS

    if (hasDeviation && !ride.hasDeviation) {
      ride.hasDeviation = true
      await ride.save()

      // Create Safety Event
      const eventId = `se-${Date.now()}`
      const safetyEvent = await SafetyEventModel.create({
        id: eventId,
        rideId,
        vehicleId: ride.vehicleId,
        eventType: 'ROUTE_DEVIATION',
        severity: 'HIGH',
        lat: currentLat,
        lng: currentLng,
        message: `Route deviation detected on ${ride.routeName} (${Math.round(minDistance)}m from planned route).`,
        status: 'ACTIVE',
        resolved: false,
      })

      // Centralized Safety Event Notification: Route Deviation
      const passengerIds = (ride.passengers || []).map((p: any) => p.studentId).filter(Boolean)
      const driverUser = await UserModel.findOne({ id: ride.driverId })

      await notificationService.notifyRideEvent('ROUTE_DEVIATION', {
        rideId,
        routeName: ride.routeName,
        driverId: ride.driverId,
        driverName: driverUser?.name || 'Driver',
        passengerIds,
        deviationMeters: Math.round(minDistance),
      })

      realtimeService.broadcast('SAFETY_ALERT', {
        rideId,
        safetyEvent,
        ride,
      })
    }

    return { hasDeviation, minDistanceMeters: Math.round(minDistance) }
  }

  /**
   * Trigger emergency SOS workflow
   */
  async triggerSOS(
    rideId: string,
    userId: string,
    lat?: number,
    lng?: number
  ): Promise<any> {
    const ride = await RideModel.findOne({ id: rideId })
    if (ride) {
      ride.hasSosAlert = true
      await ride.save()
    }

    const student = await UserModel.findOne({ id: userId })
    const emergencyContact = await EmergencyContactModel.findOne({ userId })
    const driver = ride ? await UserModel.findOne({ id: ride.driverId }) : null

    const eventId = `sos-${Date.now()}`
    const contactInfoStr = emergencyContact
      ? `${emergencyContact.name} (${emergencyContact.relationship}, ${emergencyContact.phone})`
      : 'None registered'

    const safetyEvent = await SafetyEventModel.create({
      id: eventId,
      rideId,
      userId,
      vehicleId: ride?.vehicleId,
      eventType: 'SOS',
      severity: 'CRITICAL',
      lat: lat || ride?.currentLat || 17.398,
      lng: lng || ride?.currentLng || 78.479,
      message: `CRITICAL SOS: ${student?.name || userId} triggered emergency alarm on ${ride?.routeName || rideId}. Driver: ${driver?.name || 'Assigned Driver'}. Emergency Contact: ${contactInfoStr}.`,
      status: 'ACTIVE',
      resolved: false,
    })

    // Centralized Critical SOS Notification
    await notificationService.notifyRideEvent('SOS_TRIGGERED', {
      rideId,
      routeName: ride?.routeName || `Ride #${rideId}`,
      driverId: ride?.driverId,
      driverName: driver?.name || 'Driver',
      studentId: userId,
      studentName: student?.name || userId,
      priority: 'CRITICAL',
    })

    // Notify connected clients via WebSockets / Realtime
    realtimeService.broadcast('SAFETY_ALERT', {
      rideId,
      safetyEvent,
      ride,
      student,
      driver,
      emergencyContact,
    })

    return {
      ...safetyEvent.toObject(),
      student: student ? { name: student.name, phone: student.phone, department: student.department } : null,
      driver: driver ? { name: driver.name, phone: driver.phone, rating: driver.rating } : null,
      emergencyContact: emergencyContact ? { name: emergencyContact.name, relationship: emergencyContact.relationship, phone: emergencyContact.phone } : null,
    }
  }

  /**
   * Resolve safety event
   */
  async resolveEvent(eventId: string): Promise<ISafetyEvent | null> {
    const event = await SafetyEventModel.findOne({ id: eventId })
    if (!event) return null

    event.resolved = true
    event.status = 'RESOLVED'
    event.resolvedAt = new Date()
    await event.save()

    // If no more active events on this ride, clear ride deviation flag
    const remaining = await SafetyEventModel.countDocuments({
      rideId: event.rideId,
      resolved: false,
    })

    const ride = await RideModel.findOne({ id: event.rideId })

    if (remaining === 0 && ride) {
      ride.hasDeviation = false
      ride.hasSosAlert = false
      await ride.save()
    }

    if (ride) {
      const passengerIds = (ride.passengers || []).map((p: any) => p.studentId).filter(Boolean)
      const driverUser = await UserModel.findOne({ id: ride.driverId })
      await notificationService.notifyRideEvent('SOS_RESOLVED', {
        rideId: event.rideId,
        routeName: ride.routeName,
        driverId: ride.driverId,
        driverName: driverUser?.name || 'Driver',
        studentId: event.userId,
        passengerIds,
      })
    }

    realtimeService.broadcast('SAFETY_ALERT', {
      eventId,
      resolved: true,
      rideId: event.rideId,
    })

    return event
  }
}

export const safetyService = new SafetyService()
