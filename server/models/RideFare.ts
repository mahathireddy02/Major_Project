import mongoose, { Schema, Document } from 'mongoose'

export type FareCalculationStatus = 'ESTIMATE' | 'CONFIRMED' | 'RECALCULATED' | 'CREDITED' | 'LOCKED'

export interface IFareBreakdown {
  baseFare: number
  distanceFare: number
  durationFare: number
  routeContribution: number
  demandAdjustment: number
  sharedSavings: number
  aiAdjustment: number
  finalFare: number
  finalFarePaise: number
  currency: string
  rates: {
    perKm: number
    perMinute: number
    base: number
    minimumFare: number
    maximumFare: number
  }
  metrics: {
    distanceKm: number
    durationMinutes: number
    routeOverlapPercent: number
    additionalDistanceKm: number
    additionalDurationMinutes: number
    occupancy: number
    capacity: number
    demandTier: string
  }
  explanation: string
  aiAdvice?: {
    recommendedDemandFactor?: number
    recommendedSharedSavingsFactor?: number
    confidence?: number
    reason?: string
    anomaly?: boolean
    appliedAdjustmentPercent?: number
  }
}

export interface IRideFare extends Document {
  id: string
  bookingId: string
  rideId: string
  passengerId?: string
  currency: string
  baseAmount: number
  distanceAmount: number
  timeAmount: number
  routeContributionAmount: number
  sharedSavingsAmount: number
  demandAdjustmentAmount: number
  aiAdjustmentAmount: number
  finalAmount: number
  finalAmountPaise: number
  distanceKm: number
  durationMinutes: number
  routeOverlapPercent: number
  additionalDistanceKm: number
  additionalDurationMinutes: number
  occupancyAtCalculation: number
  pricingVersion: string
  calculationStatus: FareCalculationStatus
  calculationReason?: string
  aiExplanation?: string
  breakdown: IFareBreakdown
  isLocked: boolean
  lockedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const RideFareSchema = new Schema<IRideFare>(
  {
    id: { type: String, required: true, unique: true, index: true },
    bookingId: { type: String, required: true, unique: true, index: true },
    rideId: { type: String, required: true, index: true },
    passengerId: { type: String, index: true },
    currency: { type: String, default: 'INR' },
    baseAmount: { type: Number, required: true, default: 20 },
    distanceAmount: { type: Number, required: true, default: 0 },
    timeAmount: { type: Number, required: true, default: 0 },
    routeContributionAmount: { type: Number, required: true, default: 0 },
    sharedSavingsAmount: { type: Number, required: true, default: 0 },
    demandAdjustmentAmount: { type: Number, required: true, default: 0 },
    aiAdjustmentAmount: { type: Number, required: true, default: 0 },
    finalAmount: { type: Number, required: true },
    finalAmountPaise: { type: Number, required: true },
    distanceKm: { type: Number, required: true, default: 0 },
    durationMinutes: { type: Number, required: true, default: 0 },
    routeOverlapPercent: { type: Number, required: true, default: 0 },
    additionalDistanceKm: { type: Number, required: true, default: 0 },
    additionalDurationMinutes: { type: Number, required: true, default: 0 },
    occupancyAtCalculation: { type: Number, required: true, default: 1 },
    pricingVersion: { type: String, required: true, default: 'v1.0' },
    calculationStatus: {
      type: String,
      enum: ['ESTIMATE', 'CONFIRMED', 'RECALCULATED', 'CREDITED', 'LOCKED'],
      default: 'CONFIRMED',
      index: true,
    },
    calculationReason: { type: String },
    aiExplanation: { type: String },
    breakdown: { type: Schema.Types.Mixed, default: {} },
    isLocked: { type: Boolean, default: true },
    lockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const RideFareModel =
  mongoose.models.RideFare || mongoose.model<IRideFare>('RideFare', RideFareSchema)
