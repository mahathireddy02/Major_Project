import mongoose, { Schema, Document } from 'mongoose'

export type NotificationType =
  | 'match'
  | 'full'
  | 'arriving'
  | 'safety'
  | 'system'
  | 'promo'
  | 'trip'
  | 'request'
  | 'boarding'
  | 'dropped'
  | 'cancelled'
  | 'route'
  | 'sos'
  | 'alert'
  | 'emergency'
  | 'delay'
  | 'reassigned'
  | string

export type NotificationPriority = 'NORMAL' | 'IMPORTANT' | 'CRITICAL'

export interface INotification extends Document {
  id: string
  userId: string
  studentId?: string
  driverId?: string
  role?: string
  type: NotificationType
  priority?: NotificationPriority
  title: string
  message: string
  read: boolean
  metadata?: Record<string, any>
  rideId?: string
  eventType?: string
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    studentId: { type: String, index: true },
    driverId: { type: String, index: true },
    role: { type: String, index: true },
    type: {
      type: String,
      default: 'system',
      index: true,
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'IMPORTANT', 'CRITICAL'],
      default: 'NORMAL',
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
    rideId: { type: String, index: true },
    eventType: { type: String, index: true },
  },
  { timestamps: true }
)

export const NotificationModel =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)
