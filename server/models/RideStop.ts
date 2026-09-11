import mongoose, { Schema, Document } from 'mongoose'

export type StopType = 'PICKUP' | 'DROPOFF'

export interface IRideStop extends Document {
  id: string
  rideId: string
  bookingId?: string
  studentId?: string
  stopOrder: number
  stopType: StopType
  locationName: string
  address?: string
  lat: number
  lng: number
  estimatedArrival?: string
  actualArrival?: Date
  status: 'PENDING' | 'UPCOMING' | 'ARRIVING' | 'ARRIVED' | 'BOARDED' | 'COMPLETED' | 'DROPPED_OFF' | 'DEPARTED' | 'SKIPPED'
  createdAt: Date
}

const RideStopSchema = new Schema<IRideStop>(
  {
    id: { type: String, required: true, unique: true, index: true },
    rideId: { type: String, required: true, index: true },
    bookingId: { type: String },
    studentId: { type: String },
    stopOrder: { type: Number, required: true },
    stopType: { type: String, enum: ['PICKUP', 'DROPOFF'], required: true },
    locationName: { type: String, required: true },
    address: { type: String },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    estimatedArrival: { type: String },
    actualArrival: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'UPCOMING', 'ARRIVING', 'ARRIVED', 'BOARDED', 'COMPLETED', 'DROPPED_OFF', 'DEPARTED', 'SKIPPED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
)

export const RideStopModel = mongoose.models.RideStop || mongoose.model<IRideStop>('RideStop', RideStopSchema)
