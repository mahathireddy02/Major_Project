import mongoose, { Schema, Document } from 'mongoose'

export interface IRating extends Document {
  id: string
  rideId: string
  bookingId?: string
  fromUserId: string
  toUserId: string
  rating: number // 1 - 5
  comment?: string
  createdAt: Date
}

const RatingSchema = new Schema<IRating>(
  {
    id: { type: String, required: true, unique: true, index: true },
    rideId: { type: String, required: true, index: true },
    bookingId: { type: String, index: true },
    fromUserId: { type: String, required: true, index: true },
    toUserId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
)

export const RatingModel =
  mongoose.models.Rating || mongoose.model<IRating>('Rating', RatingSchema)
