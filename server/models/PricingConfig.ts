import mongoose, { Schema, Document } from 'mongoose'

export interface IPricingConfig extends Document {
  id: string
  name: string
  baseFare: number
  perKmRate: number
  perMinuteRate: number
  minimumFare: number
  maximumFare: number
  sharedDiscountCap: number
  aiAdjustmentCap: number
  effectiveFrom: Date
  effectiveUntil?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PricingConfigSchema = new Schema<IPricingConfig>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, default: 'Standard Campus Policy' },
    baseFare: { type: Number, required: true, default: 20 },
    perKmRate: { type: Number, required: true, default: 8 },
    perMinuteRate: { type: Number, required: true, default: 1 },
    minimumFare: { type: Number, required: true, default: 30 },
    maximumFare: { type: Number, required: true, default: 500 },
    sharedDiscountCap: { type: Number, required: true, default: 0.30 }, // 30% max discount
    aiAdjustmentCap: { type: Number, required: true, default: 0.10 },   // +/-10% max AI advice
    effectiveFrom: { type: Date, default: Date.now },
    effectiveUntil: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
)

export const PricingConfigModel =
  mongoose.models.PricingConfig || mongoose.model<IPricingConfig>('PricingConfig', PricingConfigSchema)
