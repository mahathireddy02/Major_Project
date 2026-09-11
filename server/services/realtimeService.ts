import { WebSocket } from 'ws'

export type RealtimeEventType =
  | 'RIDE_UPDATED'
  | 'BOOKING_CREATED'
  | 'BOOKING_UPDATED'
  | 'BOOKING_CANCELLED'
  | 'RIDE_STARTED'
  | 'TRIP_STARTED'
  | 'RIDE_COMPLETED'
  | 'TRIP_COMPLETED'
  | 'DRIVER_LOCATION_UPDATED'
  | 'VEHICLE_LOCATION_UPDATED'
  | 'ROUTE_UPDATED'
  | 'STOP_UPDATED'
  | 'RIDE_STATUS_UPDATED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'DRIVER_REACHED_PICKUP'
  | 'DRIVER_ACCEPTED'
  | 'DRIVER_REASSIGNED'
  | 'VEHICLE_REASSIGNED'
  | 'RIDE_CANCELLED'
  | 'RIDE_REQUEST_CREATED'
  | 'RIDE_MATCHED'
  | 'PASSENGER_ADDED'
  | 'PASSENGER_CANCELLED'
  | 'PASSENGER_BOARDED'
  | 'PASSENGER_DROPPED'
  | 'ETA_UPDATED'
  | 'OFF_ROUTE'
  | 'ROUTE_DEVIATION'
  | 'REROUTING'
  | 'ARRIVED_DESTINATION'
  | 'SAFETY_ALERT'
  | 'SAFETY_EVENT_RESOLVED'
  | 'SOS_TRIGGERED'
  | 'SOS_RESOLVED'
  | 'NETWORK_OPTIMIZED'
  | 'RIDE_FULL'
  | 'NOTIFICATION_ADDED'
  | 'RIDE_MESSAGE'
  | 'DEMO_RESET'
  | 'FLEET_RESET'
  | 'PRICING_UPDATED'
  | 'FARE_RECALCULATED'
  | 'VEHICLE_BREAKDOWN'
  | 'RECOVERY_STARTED'
  | 'RECOVERY_COMPLETED'
  | 'RECOVERY_FAILED'


export interface RealtimeMessage {
  type: RealtimeEventType
  payload: any
  timestamp: string
}

class RealtimeService {
  private clients = new Set<WebSocket>()

  addClient(socket: WebSocket) {
    if (!socket) return
    this.clients.add(socket)
    console.log(`[Realtime] Client connected. Total active clients: ${this.clients.size}`)

    if (typeof socket.on === 'function') {
      socket.on('close', () => {
        this.clients.delete(socket)
        console.log(`[Realtime] Client disconnected. Remaining clients: ${this.clients.size}`)
      })

      socket.on('error', (err: any) => {
        console.warn(`[Realtime] Socket error:`, err?.message)
        this.clients.delete(socket)
      })
    }

    // Welcome message
    this.sendToClient(socket, {
      type: 'NOTIFICATION_ADDED',
      payload: { title: 'Connected', message: 'Realtime telematics stream active' },
      timestamp: new Date().toISOString(),
    })
  }

  broadcast(type: RealtimeEventType, payload: any) {
    const message: RealtimeMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    }

    const data = JSON.stringify(message)
    for (const client of this.clients) {
      if (client && client.readyState === (client.OPEN ?? 1)) {
        try {
          client.send(data)
        } catch (err: any) {
          console.error(`[Realtime] Broadcast send failed:`, err?.message)
        }
      }
    }
  }

  sendToClient(socket: WebSocket, message: RealtimeMessage) {
    if (socket && socket.readyState === (socket.OPEN ?? 1)) {
      try {
        socket.send(JSON.stringify(message))
      } catch (err: any) {
        console.error(`[Realtime] sendToClient failed:`, err?.message)
      }
    }
  }
}

export const realtimeService = new RealtimeService()
