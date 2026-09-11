import Tesseract from 'tesseract.js'

// ─── Levenshtein & Similarity Metrics ───────────────────────────────────────

export const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[m][n]
}

// ─── Name Normalization & Matching ──────────────────────────────────────────

export const normalizeName = (name: string): string => {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/^(mr\.|ms\.|mrs\.|dr\.|prof\.|sri\.|smt\.)\s+/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const fuzzyMatchName = (entered: string, detected: string): boolean => {
  const a = normalizeName(entered)
  const b = normalizeName(detected)

  if (!a || !b) return false
  if (a === b) return true

  const tokensA = a.split(' ').filter((t) => t.length > 0)
  const tokensB = b.split(' ').filter((t) => t.length > 0)

  if (tokensA.length === 0 || tokensB.length === 0) return false

  // Check reordered tokens (e.g. "Wilson Olivia" vs "Olivia Wilson")
  if (tokensA.length === tokensB.length && tokensA.length > 1) {
    const sortedA = [...tokensA].sort().join(' ')
    const sortedB = [...tokensB].sort().join(' ')
    if (sortedA === sortedB) return true
  }

  // Token subset & initial matching (e.g. "Olivia Wilson" vs "Olivia M. Wilson" or "Aarav Sharma" vs "AARAV K. SHARMA")
  const checkTokenContainment = (source: string[], target: string[]) => {
    return source.every((sToken) => {
      // Direct token match
      if (target.includes(sToken)) return true
      // Single initial match (e.g. 'k' matches 'k' or 'kiran')
      if (sToken.length === 1 && target.some((t) => t.startsWith(sToken))) return true
      if (target.some((t) => t.length === 1 && sToken.startsWith(t))) return true
      // 1-char OCR typo tolerance for longer words
      if (sToken.length >= 5 && target.some((t) => t.length >= 5 && levenshtein(sToken, t) <= 1)) return true
      return false
    })
  }

  if (checkTokenContainment(tokensA, tokensB) || checkTokenContainment(tokensB, tokensA)) {
    return true
  }

  // Small Levenshtein edit distance on entire normalized string for minor OCR typos
  const maxLen = Math.max(a.length, b.length)
  const dist = levenshtein(a, b)
  if (maxLen >= 8 && dist <= 2) {
    return true
  }

  return false
}

// ─── ID / Roll Number Normalization & Matching ──────────────────────────────

export const normalizeId = (id: string): string => {
  if (!id) return ''
  return id.replace(/[\s\-_.:/#]/g, '').toUpperCase()
}

export const fuzzyMatchId = (entered: string, detected: string): boolean => {
  const a = normalizeId(entered)
  const b = normalizeId(detected)

  if (!a || !b) return false
  if (a === b) return true

  // Check prefix variations (e.g. "ID1234567890" vs "1234567890" or "STU-22A91A0501" vs "22A91A0501")
  const stripCommonPrefixes = (s: string) => s.replace(/^(ID|STU|FAC|ROLL|NO|REG|HT)/i, '')
  if (stripCommonPrefixes(a) && stripCommonPrefixes(a) === stripCommonPrefixes(b)) {
    return true
  }

  // Minor OCR character confusion normalization: O/0, I/1, L/1, S/5, Z/2
  const ocrCharNorm = (s: string) =>
    s
      .replace(/O/g, '0')
      .replace(/[IL]/g, '1')
      .replace(/S/g, '5')
      .replace(/Z/g, '2')

  if (ocrCharNorm(a) === ocrCharNorm(b)) {
    return true
  }

  // If both IDs are 6+ chars and distance is <= 1 (single OCR substitution)
  if (a.length >= 6 && b.length >= 6 && Math.abs(a.length - b.length) <= 1 && levenshtein(a, b) <= 1) {
    return true
  }

  return false
}

// ─── Complete OCR Text Normalization & Institution Matching ──────────────────

/**
 * Normalizes text for OCR presence checking:
 * - Converts to lowercase
 * - Normalizes & to 'and'
 * - Replaces punctuation/special characters with spaces
 * - Normalizes multiple whitespace characters (including newlines) into single spaces
 * - Trims leading/trailing whitespace
 */
export const normalizeOcrText = (text: string): string => {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const normalizeCollegeString = normalizeOcrText
export const normalizeCollege = normalizeOcrText

export interface CollegeVerificationResult {
  isMatch: boolean
  notDetected: boolean
  matchedText: string
}

/**
 * Finds the matching line or multi-line snippet from raw OCR text
 */
export const findMatchingSnippetInOcr = (fullOcrText: string, normEntered: string): string => {
  if (!fullOcrText || !normEntered) return ''
  const rawLines = fullOcrText.split('\n').map((l) => l.trim()).filter(Boolean)
  
  // 1. Check if any single raw line contains the entered text or is contained in it
  for (const line of rawLines) {
    const normLine = normalizeOcrText(line)
    if (normLine && (normLine.includes(normEntered) || (normEntered.includes(normLine) && normLine.length >= 6))) {
      return line.replace(/^[|•*~_—–-]+\s*/, '').trim()
    }
  }

  // 2. Check 2 consecutive lines combined
  for (let i = 0; i < rawLines.length - 1; i++) {
    const combined = rawLines[i] + ' ' + rawLines[i + 1]
    const normCombined = normalizeOcrText(combined)
    if (normCombined && (normCombined.includes(normEntered) || (normEntered.includes(normCombined) && normCombined.length >= 6))) {
      return combined.replace(/^[|•*~_—–-]+\s*/, '').trim()
    }
  }

  // 3. Check line containing distinctive words
  const GENERIC_WORDS = new Set([
    'of', 'and', 'the', 'for', 'in', 'at', 'college', 'university', 'school',
    'institute', 'institution', 'academy', 'technology', 'engineering',
    'management', 'science', 'sciences', 'polytechnic', 'campus', 'dept', 'department'
  ])
  const enteredWords = normEntered.split(' ').filter(Boolean)
  const distinctiveWords = enteredWords.filter((w) => !GENERIC_WORDS.has(w) && w.length >= 2)

  if (distinctiveWords.length > 0) {
    for (const line of rawLines) {
      const normLine = normalizeOcrText(line)
      if (distinctiveWords.every((w) => normLine.includes(w))) {
        return line.replace(/^[|•*~_—–-]+\s*/, '').trim()
      }
    }
  }

  return ''
}

/**
 * Verifies whether the user-entered college name is present anywhere within the complete OCR text.
 * Runs normalization on both strings and checks for presence/containment without requiring dedicated field extraction.
 */
export const verifyCollegeInOcrText = (
  enteredCollege: string,
  fullOcrText: string
): CollegeVerificationResult => {
  const normEntered = normalizeOcrText(enteredCollege)
  const normOcr = normalizeOcrText(fullOcrText)

  // If OCR failed completely to extract usable text
  if (!normOcr || normOcr.length < 3) {
    return {
      isMatch: false,
      notDetected: true,
      matchedText: '',
    }
  }

  // If user entered nothing for college
  if (!normEntered) {
    return {
      isMatch: false,
      notDetected: false,
      matchedText: '',
    }
  }

  // 1. Direct normalized substring check (e.g. "Sri Indu College" in "... SRI INDU COLLEGE OF ENGINEERING AND TECHNOLOGY ...")
  if (normOcr.includes(normEntered)) {
    const matchedSnippet = findMatchingSnippetInOcr(fullOcrText, normEntered)
    return {
      isMatch: true,
      notDetected: false,
      matchedText: matchedSnippet || enteredCollege.trim(),
    }
  }

  // 2. Token / word sequence matching for partial text / institution variations
  const GENERIC_WORDS = new Set([
    'of', 'and', 'the', 'for', 'in', 'at', 'college', 'university', 'school',
    'institute', 'institution', 'academy', 'technology', 'engineering',
    'management', 'science', 'sciences', 'polytechnic', 'campus', 'dept', 'department'
  ])

  const enteredWords = normEntered.split(' ').filter(Boolean)
  const distinctiveEnteredWords = enteredWords.filter((w) => !GENERIC_WORDS.has(w) && w.length >= 2)
  const tokensToCheck = distinctiveEnteredWords.length > 0 ? distinctiveEnteredWords : enteredWords

  const rawLines = fullOcrText.split('\n').map((l) => l.trim()).filter(Boolean)

  // Check if any OCR line is a substring of the entered college name with distinctive words
  for (const line of rawLines) {
    const normLine = normalizeOcrText(line)
    if (!normLine || normLine.length < 3) continue

    if (normEntered.includes(normLine)) {
      const lineWords = normLine.split(' ').filter(Boolean)
      const hasDistinctive = lineWords.some((w) => tokensToCheck.includes(w))
      if (hasDistinctive || normLine.length >= 8) {
        return {
          isMatch: true,
          notDetected: false,
          matchedText: line.replace(/^[|•*~_—–-]+\s*/, '').trim(),
        }
      }
    }
  }

  // Check 2-line combinations from OCR
  for (let i = 0; i < rawLines.length - 1; i++) {
    const combined = rawLines[i] + ' ' + rawLines[i + 1]
    const normCombined = normalizeOcrText(combined)
    if (normCombined.includes(normEntered) || (normEntered.includes(normCombined) && normCombined.length >= 8)) {
      return {
        isMatch: true,
        notDetected: false,
        matchedText: combined.replace(/^[|•*~_—–-]+\s*/, '').trim(),
      }
    }
  }

  // Check if all distinctive words appear in the OCR text
  if (tokensToCheck.length > 0) {
    const allDistinctivePresent = tokensToCheck.every((token) => normOcr.includes(token))
    if (allDistinctivePresent) {
      const matchedSnippet = findMatchingSnippetInOcr(fullOcrText, normEntered)
      return {
        isMatch: true,
        notDetected: false,
        matchedText: matchedSnippet || enteredCollege.trim(),
      }
    }
  }

  // If no match, check if an institution line exists in OCR to show what was found
  const fallbackLine = rawLines.find((line) =>
    /(?:college|university|school|institute|academy|polytechnic)/i.test(line) &&
    !/student\s*id|identity\s*card|valid/i.test(line)
  )

  return {
    isMatch: false,
    notDetected: false,
    matchedText: fallbackLine ? fallbackLine.replace(/[^A-Za-z0-9\s&,'.-]/g, ' ').replace(/\s+/g, ' ').trim() : '',
  }
}

export const fuzzyMatchCollege = (entered: string, detectedOrFullOcr: string): boolean => {
  const result = verifyCollegeInOcrText(entered, detectedOrFullOcr)
  return result.isMatch
}

export const fuzzyMatch = fuzzyMatchCollege

// ─── Image Preprocessing ────────────────────────────────────────────────────

export const preprocessImage = (dataUri: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxDim = Math.max(img.width, img.height, 1)
      const scale = Math.max(1, Math.min(3, 2000 / maxDim))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      const id = ctx.getImageData(0, 0, w, h)
      const d = id.data

      // Enhance contrast and convert to grayscale
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const c = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128))
        d[i] = d[i + 1] = d[i + 2] = c
      }
      ctx.putImageData(id, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUri)
    img.src = dataUri
  })

// ─── Tesseract OCR Recognizer ───────────────────────────────────────────────

const performOcr = async (imageUri: string): Promise<string> => {
  try {
    const result = await Tesseract.recognize(imageUri, 'eng', {
      logger: () => {},
    })
    return result.data.text || ''
  } catch (err) {
    console.error('Tesseract OCR error:', err)
    return ''
  }
}

// ─── Student / Faculty Card Extraction ──────────────────────────────────────

export interface StudentFields {
  name: string
  roll: string
  college: string
  fullText?: string
}

const SKIP_WORDS = /student\s*id|identification|identity\s*card|id\s*card|admit\s*card|hall\s*ticket|campus\s*pass|valid|photo|signature|issued|date|address|phone|mob|www\.|http|department|dept|course|branch|semester|year|class|grade|blood\s*group|dob|gender|male|female|principal|director|authori|emergency|contact/i
const ROLL_INVALID = /^(CARD|IDENTIFICATION|PASS|VALID|STUDENT|FACULTY|EMPLOYEE|NUMBER|DATE|PHOTO|AUTHORITY|SIGNATURE)$/i
const NAME_INVALID = /^(STUDENT|FACULTY|EMPLOYEE|COLLEGE|UNIVERSITY|SCHOOL|CAMPUS|IDENTIFICATION|IDENTITY|CARD|PASS|SIGNATURE|PRINCIPAL|DIRECTOR|AUTHORITY|HOLDER|NAME|BRANCH|COURSE|YEAR|DATE|GENDER|MALE|FEMALE|GRADE|CLASS)$/i

export const extractStudentFromText = (text: string): StudentFields => {
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const lines = rawLines.map((l) => l.replace(/^[|•*~_—–-]+\s*/, '').trim()).filter(Boolean)

  // 1. Extract College / Institution Name (if present on header)
  let college = ''
  // Labeled search
  for (const line of lines) {
    const m = line.match(
      /\b(?:college|university|school|institute|institution|academy)\s*(?:name)?\b\s*[:\-.]*\s*([A-Za-z0-9\s&,'.-]{4,70})/i
    )
    if (m && m[1].trim().length > 3) {
      college = m[1].trim().replace(/\s+/g, ' ')
      break
    }
  }
  // Search header lines or lines containing institution keywords
  if (!college) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i]
      if (
        /(?:school|high\s*school|public\s*school|academy|college|university|institute|institution|vidyalaya|gurukul|polytechnic|engineering\s*college)/i.test(
          line
        ) &&
        line.length >= 4 &&
        !/^(?:student\s*(?:id\s*)?card|identity\s*card|id\s*card)$/i.test(line.trim())
      ) {
        college = line.replace(/[^A-Za-z0-9\s&,'.-]/g, ' ').replace(/\s+/g, ' ').trim()
        break
      }
    }
  }
  // Fallback check in any line
  if (!college) {
    for (const line of lines) {
      if (
        /(?:school|college|university|institute|academy|polytechnic)/i.test(line) &&
        line.length >= 6 &&
        !/student\s*id|identity\s*card|valid|principal/i.test(line)
      ) {
        college = line.replace(/[^A-Za-z0-9\s&,'.-]/g, ' ').replace(/\s+/g, ' ').trim()
        break
      }
    }
  }

  // 2. Extract Full Name
  let name = ''
  // Labeled search
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(
      /\b(?:student\s*name|candidate\s*name|faculty\s*name|employee\s*name|cardholder\s*name|holder'?s?\s*name|full\s*name|member\s*name|name\s*of\s*student|name)\b\s*[:\-.]*\s*([A-Za-z\s.'-]{2,50})/i
    )
    if (m && m[1].trim().length >= 2 && !SKIP_WORDS.test(m[1].trim())) {
      const candidate = m[1].trim().replace(/\s+/g, ' ')
      if (!NAME_INVALID.test(candidate.toUpperCase())) {
        name = candidate
        break
      }
    }
    // Handle "Name:" on one line, and name value on next line
    if (/^(?:name|student\s*name|faculty\s*name|employee\s*name)\s*[:\-]?$/i.test(line.trim()) && i + 1 < lines.length) {
      const nextLine = lines[i + 1]
      if (/^[A-Za-z\s.'-]{2,50}$/.test(nextLine) && !SKIP_WORDS.test(nextLine) && !NAME_INVALID.test(nextLine.toUpperCase())) {
        name = nextLine.trim()
        break
      }
    }
  }
  // Positional / Candidate line search (only after header lines, index >= 1)
  if (!name && lines.length >= 2) {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (college && (line.toLowerCase().includes(college.toLowerCase()) || college.toLowerCase().includes(line.toLowerCase()))) continue
      if (SKIP_WORDS.test(line)) continue
      if (/school|college|university|institute|academy|identity\s*card|id\s*card/i.test(line)) continue
      if (/\d/.test(line)) continue

      if (/^[A-Z][a-zA-Z.'-]+(?:\s[A-Z][a-zA-Z.'-]+){1,3}$/.test(line)) {
        name = line.trim()
        break
      }
      if (/^[A-Z]{2,}(?:\s[A-Z]{2,}){1,3}$/.test(line) && line.length <= 40) {
        name = line.trim()
        break
      }
    }
  }

  // 3. Extract Roll / ID / Hall Ticket Number
  let roll = ''
  // Labeled search
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^(?:student\s*(?:id\s*)?card|identity\s*card|identification\s*card|faculty\s*id\s*card)$/i.test(line.trim())) {
      continue
    }

    const m = line.match(
      /\b(?:roll\s*(?:no|number)?|student\s*id|id\s*(?:no|number|#)?|emp(?:loyee)?\s*id|faculty\s*id|hall\s*ticket\s*(?:no|number)?|h\.?t\.?\s*(?:no|number)?|reg(?:istration|n)?\s*(?:no|number)?|enrollment\s*(?:no|number)?|admission\s*(?:no|number)?|adm\s*no|card\s*no|badge\s*no|urn|prn|usn)\b[.:\s#\-]*([A-Za-z0-9\-_/]{3,25})/i
    )
    if (m && m[1].trim().length >= 3) {
      const candidate = m[1].trim().toUpperCase()
      if (!ROLL_INVALID.test(candidate)) {
        roll = candidate
        break
      }
    }

    // Handle "ID:" or "Roll No:" on one line, and ID token on next line
    if (
      /^(?:roll\s*no|roll|student\s*id|id\s*no|id|emp\s*id|faculty\s*id|hall\s*ticket|ht\s*no)\s*[:#\-]?$/i.test(line.trim()) &&
      i + 1 < lines.length
    ) {
      const nextLine = lines[i + 1]
      const idMatch = nextLine.match(/([A-Za-z0-9\-_/]{3,25})/)
      if (idMatch && !ROLL_INVALID.test(idMatch[1].toUpperCase())) {
        roll = idMatch[1].trim().toUpperCase()
        break
      }
    }
  }

  // Pattern search across lines for hyphenated codes (e.g. 123-456-7890) or alphanumeric rolls (e.g. 22A91A0501)
  if (!roll) {
    for (const line of lines) {
      if (/school|college|university|card|phone|mobile|date|dob/i.test(line)) continue
      const hyphenated = line.match(/\b\d{2,4}[-\s]\d{3,4}[-\s]\d{3,4}\b/)
      if (hyphenated) {
        roll = hyphenated[0].replace(/\s+/g, '-').trim()
        break
      }
      const alphaRoll = line.match(
        /\b([0-9]{2}[A-Z]{1,4}[0-9]{4,8}|[A-Z]{2,4}[0-9]{2}[A-Z]{0,2}[0-9]{4,7}|[A-Z]{2,4}-[0-9]{3,8}|STU-[0-9]{4,8}|FAC-[0-9]{3,8})\b/i
      )
      if (alphaRoll) {
        roll = alphaRoll[1].toUpperCase()
        break
      }
    }
  }

  return { name, roll, college, fullText: text }
}

export const extractStudentFields = async (
  processedUri: string,
  rawUri?: string
): Promise<StudentFields & { fullText: string }> => {
  try {
    const processedText = await performOcr(processedUri)
    let rawText = ''
    if (rawUri && rawUri !== processedUri) {
      rawText = await performOcr(rawUri)
    }

    const fullText = (processedText + '\n' + rawText).trim() || processedText.trim()
    let fields = extractStudentFromText(processedText)

    // If some fields could not be found and raw image is available, attempt raw OCR fallback
    if ((!fields.name || !fields.roll || !fields.college) && rawText) {
      const rawFields = extractStudentFromText(rawText)
      fields = {
        name: fields.name || rawFields.name,
        roll: fields.roll || rawFields.roll,
        college: fields.college || rawFields.college,
        fullText,
      }
    }

    return {
      name: fields.name,
      roll: fields.roll,
      college: fields.college,
      fullText,
    }
  } catch (err) {
    console.error('Failed to extract student fields:', err)
    return { name: '', roll: '', college: '', fullText: '' }
  }
}

// ─── Driving License Extraction ─────────────────────────────────────────────

export interface LicenseFields {
  name: string
  dlNumber: string
}

const DL_REGEX = /([A-Z]{2}[- ]?\d{2}[- ]?(?:19|20)\d{2}[- ]?\d{7}|[A-Z]{2}\d{2}\/\d{4}\/\d{5}|[A-Z]{2}[- ]?\d{2}[- ]?\d{11}|DL[- ]?[A-Z0-9]{6,16})/i

export const extractLicenseFromText = (text: string): LicenseFields => {
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const lines = rawLines.map((l) => l.replace(/^[|•*~_—–-]+\s*/, '').trim()).filter(Boolean)

  // 1. DL Number
  let dlNumber = ''
  for (const line of lines) {
    const labeled = line.match(
      /(?:dl|licence|license|lic(?:ence)?\.?\s*no)[.:\s#\-]*([A-Z0-9\-\/\s]{6,22})/i
    )
    if (labeled) {
      const token = labeled[1].trim().replace(/\s+/g, '')
      if (token.length >= 6) {
        dlNumber = token.toUpperCase()
        break
      }
    }
    const pat = line.match(DL_REGEX)
    if (pat) {
      dlNumber = pat[1].replace(/[\s]/g, '').toUpperCase()
      break
    }
  }
  if (!dlNumber) {
    const m = text.match(DL_REGEX)
    if (m) dlNumber = m[1].replace(/[\s]/g, '').toUpperCase()
  }

  // 2. Name
  let name = ''
  for (const line of lines) {
    const m = line.match(
      /(?:holder'?s?\s*name|driver\s*name|name|s\/o|d\/o|w\/o)[:\s]+([A-Za-z\s.'-]{3,40})/i
    )
    if (m && !/licence|license|driving|transport|authority|govt|union/i.test(m[1])) {
      name = m[1].trim().replace(/\s+/g, ' ')
      break
    }
  }
  if (!name) {
    for (const line of lines) {
      if (/licence|license|driving|transport|authority|government|india|union|state/i.test(line)) continue
      if (/^[A-Z][a-zA-Z.'-]+(?:\s[A-Z][a-zA-Z.'-]+){1,3}$/.test(line)) {
        name = line.trim()
        break
      }
      if (/^[A-Z]{2,}(?:\s[A-Z]{2,}){1,3}$/.test(line) && line.length <= 40) {
        name = line.trim()
        break
      }
    }
  }

  return { name, dlNumber }
}

export const extractLicenseFields = async (
  processedUri: string,
  rawUri?: string
): Promise<LicenseFields> => {
  try {
    const processedText = await performOcr(processedUri)
    let fields = extractLicenseFromText(processedText)

    if ((!fields.name || !fields.dlNumber) && rawUri && rawUri !== processedUri) {
      const rawText = await performOcr(rawUri)
      const rawFields = extractLicenseFromText(rawText)
      fields = {
        name: fields.name || rawFields.name,
        dlNumber: fields.dlNumber || rawFields.dlNumber,
      }
    }

    return fields
  } catch (err) {
    console.error('Failed to extract license fields:', err)
    return { name: '', dlNumber: '' }
  }
}
