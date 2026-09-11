import mongoose, { Schema, Document } from 'mongoose'

export type RideRequestStatus = 'SEARCHING' | 'MATCHED' | 'ASSIGNED' | 'CANCELLED' | 'COMPLETED'

export interface IRideRequest extends Document {
  id: string
  userId: string
  pickupName: string
  pickupAddress?: string
  pickupLat: number
  pickupLng: number
  destinationName: string
  destinationAddress?: string
  destinationLat: number
  destinationLng: number
  requestedTime: string
  seatsRequested: number
  status: RideRequestStatus
  matchedRideId?: string
  createdAt: Date
  updatedAt: Date
}

const RideRequestSchema = new Schema<IRideRequest>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    pickupName: { type: String, required: true },
    pickupAddress: { type: String },
    pickupLat: { type: Number, required: true },
    pickupLng: { type: Number, required: true },
    destinationName: { type: String, required: true },
    destinationAddress: { type: String },
    destinationLat: { type: Number, required: true },
    destinationLng: { type: Number, required: true },
    requestedTime: { type: String, required: true },
    seatsRequested: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ['SEARCHING', 'MATCHED', 'ASSIGNED', 'CANCELLED', 'COMPLETED'],
      default: 'SEARCHING',
      index: true,
    },
    matchedRideId: { type: String },
  },
  { timestamps: true }
)

export const RideRequestModel = mongoose.models.RideRequest || mongoose.model<IRideRequest>('RideRequest', RideRequestSchema)
