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
}
