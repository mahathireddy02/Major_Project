import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_mobility',
  OSRM_BASE_URL: process.env.OSRM_BASE_URL || 'https://router.project-osrm.org',
  JWT_SECRET: process.env.JWT_SECRET || 'campus-mobility-hackathon-secret-key-2026',
  AUTHORIZED_COLLEGE_DOMAINS: (
    process.env.AUTHORIZED_COLLEGE_DOMAINS ||
    'campusflow.io'
  )
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),
  DISPATCHER_USERNAME: process.env.DISPATCHER_USERNAME || 'dispatcher@campusflow.io',
  DISPATCHER_PASSWORD: process.env.DISPATCHER_PASSWORD || 'CampusFlowAdmin2026!',
  MAX_DETOUR_PERCENT: parseFloat(process.env.MAX_DETOUR_PERCENT || '15'),
  MAX_EXTRA_TIME_MINUTES: parseFloat(process.env.MAX_EXTRA_TIME_MINUTES || '5'),
  ROUTE_DEVIATION_THRESHOLD_METERS: parseFloat(process.env.ROUTE_DEVIATION_THRESHOLD_METERS || '150'),

  // DeepSeek AI Advisory Service
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  DEEPSEEK_TIMEOUT_MS: parseInt(process.env.DEEPSEEK_TIMEOUT_MS || '10000', 10),
  DEEPSEEK_ENABLED: process.env.DEEPSEEK_ENABLED !== 'false',

  // Dynamic Pricing Engine Defaults
  PRICING_BASE_FARE: parseFloat(process.env.PRICING_BASE_FARE || '20'),
  PRICING_PER_KM: parseFloat(process.env.PRICING_PER_KM || '8'),
  PRICING_PER_MINUTE: parseFloat(process.env.PRICING_PER_MINUTE || '1'),
  PRICING_MIN_FARE: parseFloat(process.env.PRICING_MIN_FARE || '30'),
  PRICING_MAX_FARE: parseFloat(process.env.PRICING_MAX_FARE || '500'),
  PRICING_SHARED_DISCOUNT_MAX: parseFloat(process.env.PRICING_SHARED_DISCOUNT_MAX || '0.30'),
  PRICING_DETOUR_MAX_PERCENT: parseFloat(process.env.PRICING_DETOUR_MAX_PERCENT || '20'),
  PRICING_AI_ADJUSTMENT_MAX_PERCENT: parseFloat(process.env.PRICING_AI_ADJUSTMENT_MAX_PERCENT || '10'),
  PRICING_CURRENCY: process.env.PRICING_CURRENCY || 'INR',

  // Twilio SMS & OTP Configuration
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_PHONE || '',
  TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID || '',
  SOS_ALERT_PHONE_NUMBER: process.env.SOS_ALERT_PHONE_NUMBER || '',
}

