import mongoose, { Schema, Document } from 'mongoose'

export type BookingStatus = 'pending' | 'confirmed' | 'boarded' | 'completed' | 'cancelled'

export interface IBooking extends Document {
  id: string
  studentId: string
  rideId: string
  rideRequestId?: string
  pickup: string
  pickupName?: string
  pickupAddress?: string
  pickupLat?: number
  pickupLng?: number
  destination: string
  destinationName?: string
  destinationAddress?: string
  destinationLat?: number
  destinationLng?: number
  pickupStopId?: string
  dropoffStopId?: string
  seats: number
  fare: number
  seatNo: number
  status: BookingStatus
  matchScore?: number
  bookedAt: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const BookingSchema = new Schema<IBooking>(
  {
    id: { type: String, required: true, unique: true, index: true },
    studentId: { type: String, required: true, index: true },
    rideId: { type: String, required: true, index: true },
    rideRequestId: { type: String },
    pickup: { type: String, required: true },
    pickupName: { type: String },
    pickupAddress: { type: String },
    pickupLat: { type: Number },
    pickupLng: { type: Number },
    destination: { type: String, required: true },
    destinationName: { type: String },
    destinationAddress: { type: String },
    destinationLat: { type: Number },
    destinationLng: { type: Number },
    pickupStopId: { type: String },
    dropoffStopId: { type: String },
    seats: { type: Number, default: 1 },
    fare: { type: Number, required: true },
    seatNo: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'boarded', 'in_transit', 'completed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    matchScore: { type: Number },
    bookedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
)

export const BookingModel = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema)
