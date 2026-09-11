import mongoose, { Schema, Document } from 'mongoose'

export interface IVehicleLocationHistory extends Document {
  id: string
  vehicleId: string
  rideId?: string
  driverId: string
  latitude: number
  longitude: number
  heading?: number
  speed?: number
  accuracy?: number
  timestamp: Date
}

const VehicleLocationHistorySchema = new Schema<IVehicleLocationHistory>(
  {
    id: { type: String, required: true, unique: true, index: true },
    vehicleId: { type: String, required: true, index: true },
    rideId: { type: String, index: true },
    driverId: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    accuracy: { type: Number, default: 5 },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
)

export const VehicleLocationHistoryModel =
  mongoose.models.VehicleLocationHistory ||
  mongoose.model<IVehicleLocationHistory>('VehicleLocationHistory', VehicleLocationHistorySchema)
