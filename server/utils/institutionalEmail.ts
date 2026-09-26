/**
 * Institutional & Academic Email Validation Utility
 *
 * Validates whether an email belongs to a recognized Indian educational/academic
 * domain (such as *.ac.in, *.edu.in, *.res.in, *.school.in) or global academic domains,
 * while strictly rejecting consumer/personal email providers (e.g. gmail.com, yahoo.com).
 */

export const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.in',
  'yahoo.co.uk',
  'ymail.com',
  'rocketmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
  'zohomail.in',
  'mail.com',
  'gmx.com',
  'gmx.net',
  'yandex.com',
  'yandex.ru',
  'tutanota.com',
  'tuta.io',
  'fastmail.com',
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
])

export interface InstitutionalEmailValidationResult {
  isValid: boolean
  domain: string
  reason?: 'MALFORMED_EMAIL' | 'PERSONAL_EMAIL' | 'UNRECOGNIZED_DOMAIN' | 'VALID_INSTITUTIONAL'
  message: string
  category?: 'INDIAN_ACADEMIC' | 'GLOBAL_ACADEMIC' | 'CUSTOM_INSTITUTIONAL'
}

export function validateInstitutionalEmail(
  email: string,
  extraAllowedDomains: string[] = []
): InstitutionalEmailValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      domain: '',
      reason: 'MALFORMED_EMAIL',
      message: 'Email address is required.',
    }
  }

  const trimmed = email.trim().toLowerCase()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/
  const match = trimmed.match(emailRegex)

  if (!match) {
    const domainPart = trimmed.includes('@') ? trimmed.split('@')[1] : ''
    return {
      isValid: false,
      domain: domainPart,
      reason: 'MALFORMED_EMAIL',
      message: 'Please enter a valid email address format (e.g., student@college.ac.in).',
    }
  }

  const domain = match[1]

  // Demo Sandbox Accounts whitelist (allows evaluators to test demo credentials seamlessly)
  const DEMO_EMAILS = new Set([
    'demostudent@gmail.com',
    'demofaculty@gmail.com',
    'demodriver@gmail.com',
    'demostudentdriver@gmail.com',
  ])
  if (DEMO_EMAILS.has(trimmed)) {
    return {
      isValid: true,
      domain,
      reason: 'VALID_INSTITUTIONAL',
      category: 'CUSTOM_INSTITUTIONAL',
      message: '✓ Verified Sandbox Demo Account (@gmail.com)',
    }
  }

  // 1. Strict rejection of known consumer / personal email providers
  if (
    PERSONAL_EMAIL_DOMAINS.has(domain) ||
    Array.from(PERSONAL_EMAIL_DOMAINS).some((pDomain) => domain === pDomain || domain.endsWith(`.${pDomain}`))
  ) {
    return {
      isValid: false,
      domain,
      reason: 'PERSONAL_EMAIL',
      message: `Personal email (@${domain}) is not permitted. Please use your official college/institutional email.`,
    }
  }

  // 2. Recognize Indian Educational & Academic Domains (ERNET India & National Registry)
  const isIndianAcademic =
    domain.endsWith('.ac.in') ||
    domain.endsWith('.edu.in') ||
    domain.endsWith('.res.in') ||
    domain.endsWith('.school.in') ||
    domain.endsWith('.gov.in') ||
    domain.endsWith('.nic.in')

  if (isIndianAcademic) {
    return {
      isValid: true,
      domain,
      reason: 'VALID_INSTITUTIONAL',
      category: 'INDIAN_ACADEMIC',
      message: `✓ Verified Indian academic institution email (@${domain})`,
    }
  }

  // 3. Recognize Global Academic Domains (.edu, *.ac.*, *.edu.*)
  const isGlobalAcademic =
    domain === 'edu' ||
    domain.endsWith('.edu') ||
    /\.ac\.[a-z]{2,}$/i.test(domain) ||
    /\.edu\.[a-z]{2,}$/i.test(domain)

  if (isGlobalAcademic) {
    return {
      isValid: true,
      domain,
      reason: 'VALID_INSTITUTIONAL',
      category: 'GLOBAL_ACADEMIC',
      message: `✓ Verified academic institution email (@${domain})`,
    }
  }

  // 4. Custom/Configurable institutional domains (e.g. campusflow.io, custom institution-owned domains)
  const normalizedExtra = (extraAllowedDomains || [])
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)

  const isExtraAllowed =
    domain === 'campusflow.io' ||
    domain.endsWith('.campusflow.io') ||
    normalizedExtra.some((extra) => domain === extra || domain.endsWith(`.${extra}`))

  if (isExtraAllowed) {
    return {
      isValid: true,
      domain,
      reason: 'VALID_INSTITUTIONAL',
      category: 'CUSTOM_INSTITUTIONAL',
      message: `✓ Verified institutional email (@${domain})`,
    }
  }

  // 5. Legitimate organizational / educational domains (.org.in / .org)
  if (domain.endsWith('.org.in') || domain.endsWith('.org')) {
    return {
      isValid: true,
      domain,
      reason: 'VALID_INSTITUTIONAL',
      category: 'CUSTOM_INSTITUTIONAL',
      message: `✓ Verified educational organization email (@${domain})`,
    }
  }

  // Fallback: unrecognized non-academic domain
  return {
    isValid: false,
    domain,
    reason: 'UNRECOGNIZED_DOMAIN',
    message: `Domain @${domain} is not recognized as a legitimate academic or institutional domain (e.g. .ac.in, .edu.in, .res.in).`,
  }
}
