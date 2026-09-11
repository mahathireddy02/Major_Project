import mongoose, { Schema, Document } from 'mongoose'

export type UserRole = 'STUDENT' | 'FACULTY' | 'DRIVER' | 'DISPATCHER' | 'ADMIN'
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'
export type NameMatchStatus = 'MATCHED' | 'MISMATCH' | 'NOT_CHECKED'

export interface IUser extends Document {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  passwordHash?: string
  studentId?: string
  rollNumber?: string
  collegeName?: string
  collegeId?: string
  department?: string
  year?: number
  avatar: string
  rating: number
  totalRides: number
  isVerified: boolean
  verificationStatus: VerificationStatus
  idCardPhoto?: string
  profilePhoto?: string
  licenseNumber?: string
  licensePhoto?: string
  rcPhoto?: string
  vehicleRegistration?: string
  vehicleType?: string
  detectedName?: string
  nameMatchStatus?: NameMatchStatus
  gender?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, default: '' },
    role: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'DRIVER', 'DISPATCHER', 'ADMIN'],
      default: 'STUDENT',
      index: true,
    },
    passwordHash: { type: String },
    studentId: { type: String },
    rollNumber: { type: String },
    collegeName: { type: String, default: 'Campus University' },
    collegeId: { type: String },
    department: { type: String, default: 'General' },
    year: { type: Number, default: 1 },
    avatar: { type: String, default: 'U' },
    rating: { type: Number, default: 4.8 },
    totalRides: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: true },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'VERIFIED',
      index: true,
    },
    idCardPhoto: { type: String },
    profilePhoto: { type: String },
    licenseNumber: { type: String },
    licensePhoto: { type: String },
    rcPhoto: { type: String },
    vehicleRegistration: { type: String },
    vehicleType: { type: String },
    detectedName: { type: String },
    nameMatchStatus: {
      type: String,
      enum: ['MATCHED', 'MISMATCH', 'NOT_CHECKED'],
      default: 'NOT_CHECKED',
    },
    gender: { type: String, default: 'Prefer not to say' },
  },
  { timestamps: true }
)

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

