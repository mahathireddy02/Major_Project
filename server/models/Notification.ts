import mongoose, { Schema, Document } from 'mongoose'

export type NotificationType = 'match' | 'full' | 'arriving' | 'safety' | 'system' | 'promo'

export interface INotification extends Document {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  metadata?: Record<string, any>
  rideId?: string
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['match', 'full', 'arriving', 'safety', 'system', 'promo'],
      default: 'system',
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
    rideId: { type: String },
  },
  { timestamps: true }
)

export const NotificationModel =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)
