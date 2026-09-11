import mongoose, { Schema, Document } from 'mongoose'

export type SafetyEventType = 'ROUTE_DEVIATION' | 'SOS' | 'PANIC' | 'DRIVER_DELAY' | 'OTHER'

export interface ISafetyEvent extends Document {
  id: string
  rideId: string
  userId?: string
  vehicleId?: string
  eventType: SafetyEventType
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  lat?: number
  lng?: number
  message: string
  status: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING'
  resolved: boolean
  resolvedAt?: Date
  createdAt: Date
}

const SafetyEventSchema = new Schema<ISafetyEvent>(
  {
    id: { type: String, required: true, unique: true, index: true },
    rideId: { type: String, required: true, index: true },
    userId: { type: String },
    vehicleId: { type: String },
    eventType: {
      type: String,
      enum: ['ROUTE_DEVIATION', 'SOS', 'PANIC', 'DRIVER_DELAY', 'OTHER'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    lat: { type: Number },
    lng: { type: Number },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'RESOLVED', 'INVESTIGATING'],
      default: 'ACTIVE',
      index: true,
    },
    resolved: { type: Boolean, default: false, index: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
)

export const SafetyEventModel = mongoose.models.SafetyEvent || mongoose.model<ISafetyEvent>('SafetyEvent', SafetyEventSchema)
