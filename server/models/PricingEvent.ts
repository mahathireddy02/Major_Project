import mongoose, { Schema, Document } from 'mongoose'

export type PricingEventType =
  | 'INITIAL_CALCULATION'
  | 'PASSENGER_JOINED'
  | 'PASSENGER_CANCELLED'
  | 'ROUTE_RECALCULATED'
  | 'VEHICLE_CHANGED'
  | 'CAPACITY_CHANGED'
  | 'DEMAND_UPDATED'
  | 'MANUAL_DISPATCH_ADJUSTMENT'
  | 'PRICE_RECALCULATED'

export interface IPricingEvent extends Document {
  id: string
  rideId: string
  bookingId?: string
  eventType: PricingEventType
  oldAmount?: number
  newAmount: number
  trigger: string
  reason?: string
  inputSnapshot: any
  calculationSnapshot: any
  createdAt: Date
}

const PricingEventSchema = new Schema<IPricingEvent>(
  {
    id: { type: String, required: true, unique: true, index: true },
    rideId: { type: String, required: true, index: true },
    bookingId: { type: String, index: true },
    eventType: {
      type: String,
      enum: [
        'INITIAL_CALCULATION',
        'PASSENGER_JOINED',
        'PASSENGER_CANCELLED',
        'ROUTE_RECALCULATED',
        'VEHICLE_CHANGED',
        'CAPACITY_CHANGED',
        'DEMAND_UPDATED',
        'MANUAL_DISPATCH_ADJUSTMENT',
        'PRICE_RECALCULATED',
      ],
      required: true,
      index: true,
    },
    oldAmount: { type: Number },
    newAmount: { type: Number, required: true },
    trigger: { type: String, required: true },
    reason: { type: String },
    inputSnapshot: { type: Schema.Types.Mixed, default: {} },
    calculationSnapshot: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const PricingEventModel =
  mongoose.models.PricingEvent || mongoose.model<IPricingEvent>('PricingEvent', PricingEventSchema)
