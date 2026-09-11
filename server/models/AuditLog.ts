import mongoose, { Schema, Document } from 'mongoose'

export interface IAuditLog extends Document {
  id: string
  dispatcherId: string
  action: string
  rideId?: string
  targetType: string
  targetId: string
  metadata?: any
  timestamp: Date
}

const AuditLogSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    dispatcherId: { type: String, required: true },
    action: { type: String, required: true },
    rideId: { type: String },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
