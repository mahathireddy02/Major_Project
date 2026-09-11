import mongoose, { Schema, Document } from 'mongoose'

export type VehicleStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'ON_TRIP'
  | 'OFFLINE'
  | 'MAINTENANCE'
  | 'BREAKDOWN'
  | 'OUT_OF_SERVICE'

export interface IVehicle extends Document {
  id: string
  driverId: string
  name: string
  vehicleType: string
  registrationNumber: string
  capacity: number
  status: VehicleStatus
  verificationStatus: boolean
  currentLat: number
  currentLng: number
  heading?: number
  speed?: number
  locationUpdatedAt?: Date
  color: string
  rating: number
  totalTrips: number
  createdAt: Date
  updatedAt: Date
}

const VehicleSchema = new Schema<IVehicle>(
  {
    id: { type: String, required: true, unique: true, index: true },
    driverId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    vehicleType: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    capacity: { type: Number, required: true, default: 6 },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ASSIGNED', 'ON_TRIP', 'OFFLINE', 'MAINTENANCE', 'BREAKDOWN', 'OUT_OF_SERVICE'],
      default: 'AVAILABLE',
      index: true,
    },
    verificationStatus: { type: Boolean, default: true },
    currentLat: { type: Number, default: 17.398 },
    currentLng: { type: Number, default: 78.479 },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    locationUpdatedAt: { type: Date, default: Date.now },
    color: { type: String, default: '#0891B2' },
    rating: { type: Number, default: 4.8 },
    totalTrips: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const VehicleModel = mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', VehicleSchema)
