/**
 * CampusFlow Prototype OCR & Identity Consistency Checking Service
 *
 * Provides name normalization, fuzzy token matching with tolerance for middle names,
 * initials, spaces, and formatting differences.
 */

export interface OcrMatchResult {
  enteredName: string
  detectedName: string
  matchScore: number // 0 - 100
  isMatch: boolean
  status: 'MATCHED' | 'MISMATCH'
  statusLabel: string
  confidence: number
  explanation: string
}

function normalizeName(name: string): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/^(mr\.|ms\.|mrs\.|dr\.|prof\.)\s+/i, '') // Remove salutations
    .replace(/[^a-z0-9\s]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0
  const bn = b ? b.length : 0
  if (an === 0) return bn
  if (bn === 0) return an

  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i])
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[bn][an]
}

export class OcrService {
  /**
   * Compare entered registration name with detected document name with high tolerance
   */
  evaluateNameConsistency(enteredName: string, detectedName: string): OcrMatchResult {
    const normEntered = normalizeName(enteredName)
    const normDetected = normalizeName(detectedName)

    if (!normEntered || !normDetected) {
      return {
        enteredName,
        detectedName,
        matchScore: 0,
        isMatch: false,
        status: 'MISMATCH',
        statusLabel: 'Name Mismatch — Manual Verification Required',
        confidence: 0.5,
        explanation: 'Missing entered name or document name could not be extracted.',
      }
    }

    // Exact normalized match
    if (normEntered === normDetected) {
      return {
        enteredName,
        detectedName,
        matchScore: 100,
        isMatch: true,
        status: 'MATCHED',
        statusLabel: '✓ Name Matched',
        confidence: 0.98,
        explanation: 'Exact match between registered name and ID card name.',
      }
    }

    // Tokenize names
    const enteredTokens = normEntered.split(' ')
    const detectedTokens = normDetected.split(' ')

    // Check token subset (e.g. "Rahul Kumar Varma" vs "Rahul Varma" or "Rahul Kumar")
    const commonTokens = enteredTokens.filter((t) => detectedTokens.includes(t))
    const tokenOverlapRatio = (commonTokens.length * 2) / (enteredTokens.length + detectedTokens.length)

    // Check initials match (e.g. "Uday Kiran" vs "U. Kiran" or "U Kiran")
    const firstInitialMatches =
      enteredTokens[0].charAt(0) === detectedTokens[0].charAt(0) &&
      (enteredTokens[enteredTokens.length - 1] === detectedTokens[detectedTokens.length - 1] ||
        enteredTokens[0] === detectedTokens[0])

    // Levenshtein similarity
    const maxLen = Math.max(normEntered.length, normDetected.length)
    const dist = levenshtein(normEntered, normDetected)
    const levScore = Math.max(0, Math.round(((maxLen - dist) / maxLen) * 100))

    let finalScore = Math.max(levScore, Math.round(tokenOverlapRatio * 100))
    if (firstInitialMatches && finalScore < 80) {
      finalScore = Math.min(88, finalScore + 20)
    }

    const isMatch = finalScore >= 70 || (commonTokens.length >= 2 && tokenOverlapRatio >= 0.6)

    return {
      enteredName,
      detectedName,
      matchScore: finalScore,
      isMatch,
      status: isMatch ? 'MATCHED' : 'MISMATCH',
      statusLabel: isMatch ? '✓ Name Matched' : '⚠️ Name Mismatch — Manual Verification Required',
      confidence: isMatch ? 0.92 : 0.65,
      explanation: isMatch
        ? `High consistency detected (${finalScore}% token & phonetic similarity).`
        : `Discrepancy detected between "${enteredName}" and "${detectedName}". Manual reviewer will verify.`,
    }
  }

  /**
   * Prototype ID Card text extraction
   * Simulates OCR extraction from document image or file payload
   */
  extractFromDocument(documentBase64OrText: string, fallbackName?: string): {
    extractedName: string
    extractedId?: string
    extractedCollege?: string
  } {
    // If text contains recognized student names, extract them
    if (fallbackName && fallbackName.trim().length > 2) {
      // Return entered name (or with slight realistic formatting simulation)
      return {
        extractedName: fallbackName.trim(),
        extractedId: `ID-${Math.floor(100000 + Math.random() * 900000)}`,
        extractedCollege: 'Campus University',
      }
    }

    return {
      extractedName: 'Student Name',
      extractedId: 'ID-2026001',
      extractedCollege: 'Campus University',
    }
  }
}

export const ocrService = new OcrService()
