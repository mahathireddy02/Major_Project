import mongoose, { Schema, Document } from 'mongoose'

export type RecoveryStatus =
  | 'PENDING'
  | 'SEARCHING'
  | 'ASSIGNED'
  | 'ROUTE_RECALCULATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'MANUAL_INTERVENTION_REQUIRED'

export interface ICandidateSnapshot {
  vehicleId: string
  vehicleName: string
  driverId: string
  driverName: string
  score: number
  distanceKm: number
  etaMinutes: number
  spareSeats: number
  routeOverlapPercent: number
  passengerDelayMinutes: number
  rejectionReason?: string
}

export interface IRideRecoveryEvent extends Document {
  id: string
  rideId: string
  oldVehicleId: string
  oldDriverId: string
  replacementVehicleId?: string
  replacementDriverId?: string
  trigger: 'DRIVER_REPORTED' | 'DISPATCHER_MANUAL' | 'TELEMETRY_FAILURE'
  breakdownLatitude: number
  breakdownLongitude: number
  breakdownTimestamp: Date
  recoveryStartedAt: Date
  recoveryCompletedAt?: Date
  status: RecoveryStatus
  failureReason?: string
  candidateSnapshot: ICandidateSnapshot[]
  pricingPolicy: string
  transferredPassengerCount: number
  recoveryMetrics?: {
    detectionTimeMs?: number
    searchTimeMs?: number
    assignTimeMs?: number
    rerouteTimeMs?: number
    totalDurationMs?: number
  }
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const CandidateSnapshotSchema = new Schema(
  {
    vehicleId: { type: String, required: true },
    vehicleName: { type: String, required: true },
    driverId: { type: String, required: true },
    driverName: { type: String, required: true },
    score: { type: Number, required: true },
    distanceKm: { type: Number, required: true },
    etaMinutes: { type: Number, required: true },
    spareSeats: { type: Number, required: true },
    routeOverlapPercent: { type: Number, default: 0 },
    passengerDelayMinutes: { type: Number, default: 0 },
    rejectionReason: { type: String },
  },
  { _id: false }
)

const RideRecoveryEventSchema = new Schema<IRideRecoveryEvent>(
  {
    id: { type: String, required: true, unique: true, index: true },
    rideId: { type: String, required: true, index: true },
    oldVehicleId: { type: String, required: true, index: true },
    oldDriverId: { type: String, required: true, index: true },
    replacementVehicleId: { type: String, index: true },
    replacementDriverId: { type: String, index: true },
    trigger: {
      type: String,
      enum: ['DRIVER_REPORTED', 'DISPATCHER_MANUAL', 'TELEMETRY_FAILURE'],
      default: 'DRIVER_REPORTED',
    },
    breakdownLatitude: { type: Number, required: true },
    breakdownLongitude: { type: Number, required: true },
    breakdownTimestamp: { type: Date, required: true, default: Date.now },
    recoveryStartedAt: { type: Date, required: true, default: Date.now },
    recoveryCompletedAt: { type: Date },
    status: {
      type: String,
      enum: [
        'PENDING',
        'SEARCHING',
        'ASSIGNED',
        'ROUTE_RECALCULATING',
        'COMPLETED',
        'FAILED',
        'MANUAL_INTERVENTION_REQUIRED',
      ],
      default: 'PENDING',
      index: true,
    },
    failureReason: { type: String },
    candidateSnapshot: [CandidateSnapshotSchema],
    pricingPolicy: { type: String, default: 'PRICE_LOCKED' },
    transferredPassengerCount: { type: Number, default: 0 },
    recoveryMetrics: {
      detectionTimeMs: { type: Number },
      searchTimeMs: { type: Number },
      assignTimeMs: { type: Number },
      rerouteTimeMs: { type: Number },
      totalDurationMs: { type: Number },
    },
    notes: { type: String },
  },
  { timestamps: true }
)

export const RideRecoveryEventModel =
  mongoose.models.RideRecoveryEvent ||
  mongoose.model<IRideRecoveryEvent>('RideRecoveryEvent', RideRecoveryEventSchema)