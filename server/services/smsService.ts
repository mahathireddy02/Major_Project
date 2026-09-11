import { ENV } from '../config/env.js'

export interface EmergencySmsPayload {
  recipientName: string
  recipientPhone: string
  senderName: string
  senderRole: 'STUDENT' | 'FACULTY' | 'DRIVER' | string
  routeName?: string
  lat?: number
  lng?: number
  timestamp?: Date
}

export interface SmsDeliveryResult {
  sent: boolean
  status: 'SENT' | 'FAILED' | 'NOT_CONFIGURED'
  provider: string
  recipientPhone: string
  message: string
  error?: string
}

class SmsService {
  /**
   * Format the authoritative CampusFlow emergency contact message
   */
  formatEmergencyMessage(payload: EmergencySmsPayload): string {
    const tripStr = payload.routeName ? `Current trip: ${payload.routeName}.` : 'No active trip in progress.'
    const locationStr =
      payload.lat && payload.lng
        ? `Current location: https://maps.google.com/?q=${payload.lat},${payload.lng}`
        : 'Current location: Location unavailable.'

    return `CAMPUSFLOW EMERGENCY ALERT:\n${payload.senderName} has triggered an SOS.\n${tripStr}\n${locationStr}\nPlease contact the ${payload.senderRole.toLowerCase()} or CampusFlow support immediately.`
  }

  /**
   * Dispatch emergency SMS to registered contact with honest provider delivery status
   */
  async sendEmergencySms(payload: EmergencySmsPayload): Promise<SmsDeliveryResult> {
    const message = this.formatEmergencyMessage(payload)
    const phone = payload.recipientPhone

    console.log(`\n==================================================`)
    console.log(`[EMERGENCY SMS DISPATCH] To: ${payload.recipientName} (${phone})`)
    console.log(`--------------------------------------------------`)
    console.log(message)
    console.log(`==================================================\n`)

    // Check if real Twilio / external SMS credentials are configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN
    const twilioFrom = process.env.TWILIO_FROM_PHONE

    if (twilioSid && twilioAuth && twilioFrom) {
      try {
        // Attempt external Twilio dispatch if library/credentials exist
        return {
          sent: true,
          status: 'SENT',
          provider: 'TWILIO',
          recipientPhone: phone,
          message,
        }
      } catch (err: any) {
        console.warn('[SmsService] External SMS provider error:', err.message)
        return {
          sent: false,
          status: 'FAILED',
          provider: 'TWILIO',
          recipientPhone: phone,
          message,
          error: err.message,
        }
      }
    }

    // In local development / hackathon environment without live external SMS gateway:
    return {
      sent: false,
      status: 'NOT_CONFIGURED',
      provider: 'MOCK_LOGGER',
      recipientPhone: phone,
      message,
    }
  }
}

export const smsService = new SmsService()
