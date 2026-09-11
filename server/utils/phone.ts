/**
 * Reusable Phone Number Normalization Utility
 * Normalizes phone numbers to standard E.164 format (+91XXXXXXXXXX)
 * Specifically handles Indian 10-digit mobile numbers with/without leading 0, +91, 91, dashes, or spaces.
 */

export function normalizePhoneNumber(rawPhone: string, defaultCountryCode: string = '+91'): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return ''
  }

  const trimmed = rawPhone.trim()

  // Remove whitespace, hyphens, brackets, parentheses
  let cleaned = trimmed.replace(/[\s\-().]/g, '')

  // If already starts with '+', validate and return
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '')
    return digits ? '+' + digits : ''
  }

  // Handle leading 00 (international notation e.g., 0091...)
  if (cleaned.startsWith('00')) {
    const digits = cleaned.slice(2).replace(/\D/g, '')
    return digits ? '+' + digits : ''
  }

  // Handle single leading 0 (domestic STD notation in India e.g., 09876543210)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1)
  }

  const digitsOnly = cleaned.replace(/\D/g, '')

  // If 10 digits (Standard Indian Mobile number), prepend default country code (+91)
  if (digitsOnly.length === 10) {
    const prefix = defaultCountryCode.startsWith('+') ? defaultCountryCode : '+' + defaultCountryCode
    return prefix + digitsOnly
  }

  // If 12 digits starting with 91 (Indian number without plus), add plus
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return '+' + digitsOnly
  }

  // Generic fallback: if digits found, return with '+'
  return digitsOnly ? '+' + digitsOnly : ''
}

export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone)
  const digits = normalized.replace(/\D/g, '')
  return normalized.startsWith('+') && digits.length >= 10 && digits.length <= 15
}
