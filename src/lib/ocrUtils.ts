import Tesseract from 'tesseract.js'

// ─── Constants ───────────────────────────────────────────────────────────────

export const NAME_SIMILARITY_THRESHOLD = 0.85

const LABEL_WORDS = new Set([
  'NAME', 'STUDENT', 'CANDIDATE', 'FACULTY', 'EMPLOYEE', 'IDENTIFICATION',
  'IDENTITY', 'CARD', 'PASS', 'SIGNATURE', 'PRINCIPAL', 'DIRECTOR',
  'AUTHORITY', 'HOLDER', 'BRANCH', 'COURSE', 'YEAR', 'DATE', 'GENDER',
  'MALE', 'FEMALE', 'GRADE', 'CLASS', 'STUDENT NAME', 'STUDENT ID',
  'IDENTIFICATION CARD', 'IDENTITY CARD', 'ID CARD',
])

const ROLL_LABEL_PATTERN =
  /\b(?:roll\s*(?:no|number)?|student\s*id|id\s*(?:no|number|#)?|emp(?:loyee)?\s*id|faculty\s*id|hall\s*ticket\s*(?:no|number)?|h\.?t\.?\s*(?:no|number)?|reg(?:istration|n)?\s*(?:no|number)?|enrollment\s*(?:no|number)?|admission\s*(?:no|number)?|adm\s*no|card\s*no|badge\s*no|urn|prn|usn)\b/i

const SKIP_LINE =
  /student\s*id|identification|identity\s*card|id\s*card|admit\s*card|hall\s*ticket|campus\s*pass|valid|photo|signature|issued|date|address|phone|mob|www\.|http|department|dept|course|branch|semester|year|class|grade|blood\s*group|dob|gender|male|female|principal|director|authori|emergency|contact/i

const GENERIC_COLLEGE_WORDS = new Set([
  'of', 'and', 'the', 'for', 'in', 'at', 'college', 'university', 'school',
  'institute', 'institution', 'academy', 'technology', 'engineering',
  'management', 'science', 'sciences', 'polytechnic', 'campus', 'dept', 'department',
])

// ─── Levenshtein ─────────────────────────────────────────────────────────────

export const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
  return dp[m][n]
}

/** Returns 0..1 similarity (1 = identical) */
export const stringSimilarity = (a: string, b: string): number => {
  if (!a && !b) return 1
  if (!a || !b) return 0
  if (a === b) return 1
  const maxLen = Math.max(a.length, b.length)
  return 1 - levenshtein(a, b) / maxLen
}

// ─── Name Normalization & Matching ───────────────────────────────────────────

export const normalizeName = (name: string): string => {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/^(mr\.|ms\.|mrs\.|dr\.|prof\.|sri\.|smt\.)\s+/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Searches the entire OCR text for the entered name as a phrase.
 * Returns { found, detectedValue, score } where score is 0..1.
 * This is the primary fix: instead of only checking the single extracted
 * name field, we scan the full OCR text for the entered name.
 */
export const searchNameInFullText = (
  enteredName: string,
  fullOcrText: string
): { found: boolean; detectedValue: string; score: number } => {
  if (!enteredName || !fullOcrText) return { found: false, detectedValue: '', score: 0 }

  const normEntered = normalizeName(enteredName)
  const normFull = normalizeName(fullOcrText)

  // 1. Direct substring match (handles ARJUN SHARMA in full text)
  if (normFull.includes(normEntered)) {
    return { found: true, detectedValue: enteredName.toUpperCase(), score: 1 }
  }

  // 2. Check each line and sliding window of 2 lines
  const lines = fullOcrText
    .split('\n')
    .map((l) => l.replace(/^[|•*~_—–\-]+\s*/, '').trim())
    .filter(Boolean)

  let bestScore = 0
  let bestLine = ''

  for (let i = 0; i < lines.length; i++) {
    // Skip obvious label-only lines
    const upper = lines[i].toUpperCase().trim()
    if (LABEL_WORDS.has(upper)) continue
    if (SKIP_LINE.test(lines[i])) continue

    // Single line
    const normLine = normalizeName(lines[i])
    if (normLine.length < 2) continue

    const score1 = stringSimilarity(normEntered, normLine)
    if (score1 > bestScore) { bestScore = score1; bestLine = lines[i] }

    // Check if entered name is a substring of this line (e.g. line = "Name: ARJUN SHARMA")
    if (normLine.includes(normEntered)) {
      return { found: true, detectedValue: lines[i].trim(), score: 1 }
    }

    // 2-line window
    if (i + 1 < lines.length) {
      const combined = lines[i] + ' ' + lines[i + 1]
      const normCombined = normalizeName(combined)
      if (normCombined.includes(normEntered)) {
        return { found: true, detectedValue: combined.trim(), score: 1 }
      }
      const score2 = stringSimilarity(normEntered, normCombined)
      if (score2 > bestScore) { bestScore = score2; bestLine = combined }
    }
  }

  // 3. Token-based matching: all name tokens present in the full text
  const nameTokens = normEntered.split(' ').filter((t) => t.length >= 2)
  if (nameTokens.length >= 2) {
    const allPresent = nameTokens.every((t) => normFull.includes(t))
    if (allPresent) {
      // Find the line that contains the most tokens
      let bestTokenLine = ''
      let bestTokenCount = 0
      for (const line of lines) {
        const normLine = normalizeName(line)
        const count = nameTokens.filter((t) => normLine.includes(t)).length
        if (count > bestTokenCount) { bestTokenCount = count; bestTokenLine = line }
      }
      if (bestTokenCount === nameTokens.length) {
        return { found: true, detectedValue: bestTokenLine || enteredName.toUpperCase(), score: 0.95 }
      }
      // Tokens spread across lines — still a match
      return { found: true, detectedValue: enteredName.toUpperCase(), score: 0.9 }
    }
  }

  // 4. Fuzzy threshold
  if (bestScore >= NAME_SIMILARITY_THRESHOLD) {
    return { found: true, detectedValue: bestLine.trim(), score: bestScore }
  }

  return { found: false, detectedValue: bestLine.trim(), score: bestScore }
}

export const fuzzyMatchName = (entered: string, detected: string): boolean => {
  const a = normalizeName(entered)
  const b = normalizeName(detected)
  if (!a || !b) return false
  if (a === b) return true

  const tokensA = a.split(' ').filter((t) => t.length > 0)
  const tokensB = b.split(' ').filter((t) => t.length > 0)
  if (!tokensA.length || !tokensB.length) return false

  // Reordered tokens
  if (tokensA.length === tokensB.length && tokensA.length > 1) {
    if ([...tokensA].sort().join(' ') === [...tokensB].sort().join(' ')) return true
  }

  const checkContainment = (src: string[], tgt: string[]) =>
    src.every((s) =>
      tgt.includes(s) ||
      (s.length === 1 && tgt.some((t) => t.startsWith(s))) ||
      (tgt.some((t) => t.length === 1 && s.startsWith(t))) ||
      (s.length >= 5 && tgt.some((t) => t.length >= 5 && levenshtein(s, t) <= 1))
    )

  if (checkContainment(tokensA, tokensB) || checkContainment(tokensB, tokensA)) return true

  const maxLen = Math.max(a.length, b.length)
  return maxLen >= 8 && levenshtein(a, b) <= 2
}

// ─── ID / Roll Number Normalization & Matching ───────────────────────────────

export const normalizeId = (id: string): string => {
  if (!id) return ''
  return id.replace(/[\s\-_.:/#]/g, '').toUpperCase()
}

export const fuzzyMatchId = (entered: string, detected: string): boolean => {
  const a = normalizeId(entered)
  const b = normalizeId(detected)
  if (!a || !b) return false
  if (a === b) return true

  const stripPfx = (s: string) => s.replace(/^(ID|STU|FAC|ROLL|NO|REG|HT)/i, '')
  if (stripPfx(a) && stripPfx(a) === stripPfx(b)) return true

  // OCR char confusion — only apply when lengths match to avoid false positives
  const ocrNorm = (s: string) =>
    s.replace(/O/g, '0').replace(/[IL]/g, '1').replace(/S/g, '5').replace(/Z/g, '2')

  if (a.length === b.length && ocrNorm(a) === ocrNorm(b)) return true

  return a.length >= 6 && b.length >= 6 && Math.abs(a.length - b.length) <= 1 && levenshtein(a, b) <= 1
}

// ─── OCR Text Normalization ───────────────────────────────────────────────────

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

// ─── College Verification ─────────────────────────────────────────────────────

export interface CollegeVerificationResult {
  isMatch: boolean
  notDetected: boolean
  matchedText: string
}

export const findMatchingSnippetInOcr = (fullOcrText: string, normEntered: string): string => {
  if (!fullOcrText || !normEntered) return ''
  const rawLines = fullOcrText.split('\n').map((l) => l.trim()).filter(Boolean)

  for (const line of rawLines) {
    const normLine = normalizeOcrText(line)
    if (normLine && (normLine.includes(normEntered) || (normEntered.includes(normLine) && normLine.length >= 6)))
      return line.replace(/^[|•*~_—–\-]+\s*/, '').trim()
  }

  for (let i = 0; i < rawLines.length - 1; i++) {
    const combined = rawLines[i] + ' ' + rawLines[i + 1]
    const normCombined = normalizeOcrText(combined)
    if (normCombined && (normCombined.includes(normEntered) || (normEntered.includes(normCombined) && normCombined.length >= 6)))
      return combined.replace(/^[|•*~_—–\-]+\s*/, '').trim()
  }

  const enteredWords = normEntered.split(' ').filter(Boolean)
  const distinctive = enteredWords.filter((w) => !GENERIC_COLLEGE_WORDS.has(w) && w.length >= 2)
  if (distinctive.length > 0) {
    for (const line of rawLines) {
      const normLine = normalizeOcrText(line)
      if (distinctive.every((w) => normLine.includes(w)))
        return line.replace(/^[|•*~_—–\-]+\s*/, '').trim()
    }
  }
  return ''
}

export const verifyCollegeInOcrText = (
  enteredCollege: string,
  fullOcrText: string
): CollegeVerificationResult => {
  const normEntered = normalizeOcrText(enteredCollege)
  const normOcr = normalizeOcrText(fullOcrText)

  if (!normOcr || normOcr.length < 3)
    return { isMatch: false, notDetected: true, matchedText: '' }

  if (!normEntered)
    return { isMatch: false, notDetected: false, matchedText: '' }

  // Guard: reject if entered college is only a generic word
  const enteredWords = normEntered.split(' ').filter(Boolean)
  const distinctiveWords = enteredWords.filter((w) => !GENERIC_COLLEGE_WORDS.has(w) && w.length >= 3)
  if (distinctiveWords.length === 0)
    return { isMatch: false, notDetected: false, matchedText: '' }

  // Direct substring
  if (normOcr.includes(normEntered)) {
    return {
      isMatch: true,
      notDetected: false,
      matchedText: findMatchingSnippetInOcr(fullOcrText, normEntered) || enteredCollege.trim(),
    }
  }

  const rawLines = fullOcrText.split('\n').map((l) => l.trim()).filter(Boolean)

  // Line containment
  for (const line of rawLines) {
    const normLine = normalizeOcrText(line)
    if (!normLine || normLine.length < 3) continue
    if (normEntered.includes(normLine)) {
      const lineWords = normLine.split(' ').filter(Boolean)
      const hasDistinctive = lineWords.some((w) => distinctiveWords.includes(w))
      if (hasDistinctive || normLine.length >= 8)
        return { isMatch: true, notDetected: false, matchedText: line.replace(/^[|•*~_—–\-]+\s*/, '').trim() }
    }
  }

  // 2-line combinations
  for (let i = 0; i < rawLines.length - 1; i++) {
    const combined = rawLines[i] + ' ' + rawLines[i + 1]
    const normCombined = normalizeOcrText(combined)
    if (normCombined.includes(normEntered) || (normEntered.includes(normCombined) && normCombined.length >= 8))
      return { isMatch: true, notDetected: false, matchedText: combined.replace(/^[|•*~_—–\-]+\s*/, '').trim() }
  }

  // All distinctive words present in OCR
  if (distinctiveWords.length > 0 && distinctiveWords.every((t) => normOcr.includes(t))) {
    const snippet = findMatchingSnippetInOcr(fullOcrText, normEntered)
    return { isMatch: true, notDetected: false, matchedText: snippet || enteredCollege.trim() }
  }

  const fallbackLine = rawLines.find(
    (line) =>
      /(?:college|university|school|institute|academy|polytechnic)/i.test(line) &&
      !/student\s*id|identity\s*card|valid/i.test(line)
  )
  return {
    isMatch: false,
    notDetected: false,
    matchedText: fallbackLine
      ? fallbackLine.replace(/[^A-Za-z0-9\s&,'.\-]/g, ' ').replace(/\s+/g, ' ').trim()
      : '',
  }
}

export const fuzzyMatchCollege = (entered: string, detectedOrFullOcr: string): boolean =>
  verifyCollegeInOcrText(entered, detectedOrFullOcr).isMatch

export const fuzzyMatch = fuzzyMatchCollege

// ─── Image Preprocessing ─────────────────────────────────────────────────────

/** Grayscale + contrast stretch + adaptive-threshold approximation */
const applyAdaptiveThreshold = (data: Uint8ClampedArray, w: number, h: number, blockSize = 15) => {
  // Box-blur mean for local threshold
  const gray = new Float32Array(w * h)
  for (let i = 0; i < data.length; i += 4)
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]

  const half = Math.floor(blockSize / 2)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, count = 0
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const ny = y + dy, nx = x + dx
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) { sum += gray[ny * w + nx]; count++ }
        }
      }
      const mean = sum / count
      const idx = (y * w + x) * 4
      const val = gray[y * w + x] > mean - 10 ? 255 : 0
      data[idx] = data[idx + 1] = data[idx + 2] = val
    }
  }
}

const renderToCanvas = (img: HTMLImageElement, scale: number): HTMLCanvasElement => {
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return canvas
}

export const preprocessImage = (dataUri: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxDim = Math.max(img.width, img.height, 1)
      const scale = Math.max(1, Math.min(3, 2000 / maxDim))
      const canvas = renderToCanvas(img, scale)
      const ctx = canvas.getContext('2d')!
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = id.data

      // Grayscale + contrast stretch
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const c = Math.min(255, Math.max(0, (gray - 128) * 1.6 + 128))
        d[i] = d[i + 1] = d[i + 2] = c
      }

      // Adaptive threshold
      applyAdaptiveThreshold(d, canvas.width, canvas.height)
      ctx.putImageData(id, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUri)
    img.src = dataUri
  })

/** Lighter preprocessing: grayscale + contrast only, no binarization */
export const preprocessImageLight = (dataUri: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxDim = Math.max(img.width, img.height, 1)
      const scale = Math.max(1, Math.min(3, 2000 / maxDim))
      const canvas = renderToCanvas(img, scale)
      const ctx = canvas.getContext('2d')!
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = id.data
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const c = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 128))
        d[i] = d[i + 1] = d[i + 2] = c
      }
      ctx.putImageData(id, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUri)
    img.src = dataUri
  })

// ─── Tesseract OCR Runner ─────────────────────────────────────────────────────

const performOcr = async (imageUri: string): Promise<string> => {
  try {
    const result = await Tesseract.recognize(imageUri, 'eng', { logger: () => {} })
    return result.data.text || ''
  } catch (err) {
    console.error('[OCR] Tesseract error:', err)
    return ''
  }
}

// ─── Student Field Extraction ─────────────────────────────────────────────────

export interface StudentFields {
  name: string
  roll: string
  college: string
  fullText?: string
}

export interface StudentFieldsDebug extends StudentFields {
  fullText: string
  nameCandidates: string[]
  rollCandidates: string[]
  collegeCandidates: string[]
  nameScore: number
  rollSource: string
  debugLog: string[]
}

const ROLL_INVALID = /^(CARD|IDENTIFICATION|PASS|VALID|STUDENT|FACULTY|EMPLOYEE|NUMBER|DATE|PHOTO|AUTHORITY|SIGNATURE)$/i

export const extractStudentFromText = (text: string): StudentFields => {
  const debug = extractStudentFromTextDebug(text)
  return { name: debug.name, roll: debug.roll, college: debug.college, fullText: text }
}

export const extractStudentFromTextDebug = (text: string): StudentFieldsDebug => {
  const log: string[] = []
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const lines = rawLines.map((l) => l.replace(/^[|•*~_—–\-]+\s*/, '').trim()).filter(Boolean)

  log.push(`[EXTRACT] Total lines: ${lines.length}`)
  log.push(`[EXTRACT] Raw OCR:\n${text}`)

  // ── 1. College ──────────────────────────────────────────────────────────────
  const collegeCandidates: string[] = []
  let college = ''

  for (const line of lines) {
    const m = line.match(
      /\b(?:college|university|school|institute|institution|academy)\s*(?:name)?\b\s*[:\-.]*\s*([A-Za-z0-9\s&,'.\-]{4,70})/i
    )
    if (m && m[1].trim().length > 3) {
      collegeCandidates.push(m[1].trim())
    }
  }
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i]
    if (
      /(?:school|high\s*school|public\s*school|academy|college|university|institute|institution|vidyalaya|gurukul|polytechnic|engineering\s*college)/i.test(line) &&
      line.length >= 4 &&
      !/^(?:student\s*(?:id\s*)?card|identity\s*card|id\s*card)$/i.test(line.trim())
    ) {
      collegeCandidates.push(line.replace(/[^A-Za-z0-9\s&,'.\-]/g, ' ').replace(/\s+/g, ' ').trim())
    }
  }
  if (collegeCandidates.length === 0) {
    for (const line of lines) {
      if (
        /(?:school|college|university|institute|academy|polytechnic)/i.test(line) &&
        line.length >= 6 &&
        !/student\s*id|identity\s*card|valid|principal/i.test(line)
      ) {
        collegeCandidates.push(line.replace(/[^A-Za-z0-9\s&,'.\-]/g, ' ').replace(/\s+/g, ' ').trim())
      }
    }
  }
  college = collegeCandidates[0] || ''
  log.push(`[COLLEGE] Candidates: ${JSON.stringify(collegeCandidates)}`)
  log.push(`[COLLEGE] Selected: "${college}"`)

  // ── 2. Name ─────────────────────────────────────────────────────────────────
  const nameCandidates: string[] = []
  let name = ''
  let nameScore = 0

  // Label-based
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(
      /\b(?:student\s*name|candidate\s*name|faculty\s*name|employee\s*name|cardholder\s*name|holder'?s?\s*name|full\s*name|member\s*name|name\s*of\s*student|name)\b\s*[:\-.]*\s*([A-Za-z\s.'"\-]{2,50})/i
    )
    if (m) {
      const candidate = m[1].trim().replace(/\s+/g, ' ')
      if (candidate.length >= 2 && !SKIP_LINE.test(candidate) && !LABEL_WORDS.has(candidate.toUpperCase())) {
        nameCandidates.push(candidate)
        log.push(`[NAME] Label match on line ${i}: "${candidate}"`)
      }
    }
    // Label on its own line, value on next
    if (/^(?:name|student\s*name|faculty\s*name|employee\s*name)\s*[:\-]?$/i.test(line.trim()) && i + 1 < lines.length) {
      const next = lines[i + 1]
      if (/^[A-Za-z\s.'"\-]{2,50}$/.test(next) && !SKIP_LINE.test(next) && !LABEL_WORDS.has(next.toUpperCase())) {
        nameCandidates.push(next.trim())
        log.push(`[NAME] Next-line match after label at ${i}: "${next.trim()}"`)
      }
    }
  }

  // Positional: Title Case (e.g. "Arjun Sharma")
  if (nameCandidates.length === 0) {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (college && (line.toLowerCase().includes(college.toLowerCase()) || college.toLowerCase().includes(line.toLowerCase()))) continue
      if (SKIP_LINE.test(line)) continue
      if (/school|college|university|institute|academy|identity\s*card|id\s*card/i.test(line)) continue
      if (/\d/.test(line)) continue
      if (/^[A-Z][a-zA-Z.'"\-]+(?:\s[A-Z][a-zA-Z.'"\-]+){1,3}$/.test(line)) {
        nameCandidates.push(line.trim())
        log.push(`[NAME] Title-case positional at line ${i}: "${line.trim()}"`)
      }
    }
  }

  // Positional: ALL CAPS (e.g. "ARJUN SHARMA") — this was the missing case
  if (nameCandidates.length === 0) {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (college && (line.toLowerCase().includes(college.toLowerCase()) || college.toLowerCase().includes(line.toLowerCase()))) continue
      if (SKIP_LINE.test(line)) continue
      if (/school|college|university|institute|academy|identity\s*card|id\s*card/i.test(line)) continue
      if (/\d/.test(line)) continue
      if (/^[A-Z]{2,}(?:\s[A-Z]{2,}){1,3}$/.test(line) && line.length <= 40) {
        nameCandidates.push(line.trim())
        log.push(`[NAME] ALL-CAPS positional at line ${i}: "${line.trim()}"`)
      }
    }
  }

  name = nameCandidates[0] || ''
  nameScore = name ? 1 : 0
  log.push(`[NAME] Final candidates: ${JSON.stringify(nameCandidates)}`)
  log.push(`[NAME] Selected: "${name}"`)

  // ── 3. Roll Number ───────────────────────────────────────────────────────────
  const rollCandidates: string[] = []
  let roll = ''
  let rollSource = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^(?:student\s*(?:id\s*)?card|identity\s*card|identification\s*card|faculty\s*id\s*card)$/i.test(line.trim())) continue

    const m = line.match(
      /\b(?:roll\s*(?:no|number)?|student\s*id|id\s*(?:no|number|#)?|emp(?:loyee)?\s*id|faculty\s*id|hall\s*ticket\s*(?:no|number)?|h\.?t\.?\s*(?:no|number)?|reg(?:istration|n)?\s*(?:no|number)?|enrollment\s*(?:no|number)?|admission\s*(?:no|number)?|adm\s*no|card\s*no|badge\s*no|urn|prn|usn)\b[.:\s#\-]*([A-Za-z0-9\-_/]{3,25})/i
    )
    if (m && m[1].trim().length >= 3) {
      const candidate = m[1].trim().toUpperCase()
      if (!ROLL_INVALID.test(candidate)) {
        rollCandidates.push(candidate)
        rollSource = `label on line ${i}`
        log.push(`[ROLL] Label match: "${candidate}" on line ${i}`)
      }
    }

    if (ROLL_LABEL_PATTERN.test(line) && /^[A-Za-z0-9\s\-_/:]{0,10}$/.test(line.replace(ROLL_LABEL_PATTERN, '').trim()) && i + 1 < lines.length) {
      const next = lines[i + 1]
      const idMatch = next.match(/([A-Za-z0-9\-_/]{3,25})/)
      if (idMatch && !ROLL_INVALID.test(idMatch[1].toUpperCase())) {
        rollCandidates.push(idMatch[1].trim().toUpperCase())
        rollSource = `next-line after label at ${i}`
        log.push(`[ROLL] Next-line match: "${idMatch[1].trim().toUpperCase()}"`)
      }
    }
  }

  // Pattern fallback
  if (rollCandidates.length === 0) {
    for (const line of lines) {
      if (/school|college|university|card|phone|mobile|date|dob/i.test(line)) continue
      const hyphenated = line.match(/\b\d{2,4}[-\s]\d{3,4}[-\s]\d{3,4}\b/)
      if (hyphenated) {
        rollCandidates.push(hyphenated[0].replace(/\s+/g, '-').trim())
        rollSource = 'hyphenated pattern'
        break
      }
      const alphaRoll = line.match(
        /\b([0-9]{2}[A-Z]{1,4}[0-9]{4,8}|[A-Z]{2,4}[0-9]{2}[A-Z]{0,2}[0-9]{4,7}|[A-Z]{2,4}-[0-9]{3,8}|STU-[0-9]{4,8}|FAC-[0-9]{3,8})\b/i
      )
      if (alphaRoll) {
        rollCandidates.push(alphaRoll[1].toUpperCase())
        rollSource = 'alphanumeric pattern'
        break
      }
    }
  }

  roll = rollCandidates[0] || ''
  log.push(`[ROLL] Candidates: ${JSON.stringify(rollCandidates)}, source: ${rollSource}`)
  log.push(`[ROLL] Selected: "${roll}"`)

  return { name, roll, college, fullText: text, nameCandidates, rollCandidates, collegeCandidates, nameScore, rollSource, debugLog: log }
}

export const extractStudentFields = async (
  processedUri: string,
  rawUri?: string
): Promise<StudentFields & { fullText: string }> => {
  try {
    const processedText = await performOcr(processedUri)
    let lightText = ''
    // Multi-pass: also run on light-preprocessed version if in browser
    if (typeof document !== 'undefined' && rawUri) {
      try {
        const lightUri = await preprocessImageLight(rawUri)
        lightText = await performOcr(lightUri)
      } catch { /* ignore */ }
    }

    let rawText = ''
    if (rawUri && rawUri !== processedUri) {
      rawText = await performOcr(rawUri)
    }

    // Combine all passes — deduplicate lines
    const allText = [processedText, lightText, rawText]
      .filter(Boolean)
      .join('\n')

    const fullText = allText.trim() || processedText.trim()

    let fields = extractStudentFromText(processedText)

    // Fallback: fill missing fields from other passes
    const passes = [lightText, rawText].filter(Boolean)
    for (const passText of passes) {
      if (fields.name && fields.roll && fields.college) break
      const pf = extractStudentFromText(passText)
      fields = {
        name: fields.name || pf.name,
        roll: fields.roll || pf.roll,
        college: fields.college || pf.college,
        fullText,
      }
    }

    console.debug('[OCR] Full combined text:', fullText)
    return { name: fields.name, roll: fields.roll, college: fields.college, fullText }
  } catch (err) {
    console.error('[OCR] extractStudentFields failed:', err)
    return { name: '', roll: '', college: '', fullText: '' }
  }
}

// ─── Faculty ID Extraction ────────────────────────────────────────────────────

export interface FacultyFields {
  name: string
  facultyId: string
  college: string
}

const SKIP = SKIP_LINE

const extractFacultyFromText = (text: string): FacultyFields => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  let name = ''
  for (const line of lines) {
    const m = line.match(/(?:name|faculty\s*name|staff\s*name|dr\.|prof\.)\s*[:\-]\s*([A-Za-z][A-Za-z\s]{2,39})/i)
    if (m) { name = m[1].trim(); break }
  }
  if (!name) name = lines.find((l) => /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)+$/.test(l) && !SKIP.test(l)) ?? ''
  if (!name) name = lines.find((l) => /^[A-Z]{2,}(?:\s[A-Z]{2,})+$/.test(l) && !SKIP.test(l)) ?? ''

  let facultyId = ''
  for (const line of lines) {
    const m = line.match(/(?:faculty\s*id|staff\s*id|employee\s*(?:id|no)|emp(?:\s*no|\.?\s*id)?|fac(?:ulty)?[\s\-#]*(?:id|no))[.:\s#]*([A-Z0-9\-]{3,20})/i)
    if (m) { facultyId = m[1].trim().toUpperCase(); break }
  }
  if (!facultyId) {
    const fl = lines.find((l) => /^FAC[-\s]?[0-9]{3,6}$|^EMP[-\s]?[0-9]{3,6}$|^[A-Z]{2,4}[-\s]?[0-9]{3,6}$/.test(l.replace(/\s/g, '').toUpperCase()))
    if (fl) facultyId = fl.replace(/\s/g, '').toUpperCase()
  }

  let college = ''
  for (const line of lines) {
    if (/college|university|institute|indu|engineering|technology|management|polytechnic/i.test(line) && line.length > 6) {
      college = line.replace(/[^A-Za-z0-9\s&]/g, ' ').replace(/\s+/g, ' ').trim()
      break
    }
  }
  return { name, facultyId, college }
}

const cropROI = (dataUri: string, x: number, y: number, w: number, h: number): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * w)
      canvas.height = Math.round(img.height * h)
      canvas.getContext('2d')!.drawImage(img, Math.round(img.width * x), Math.round(img.height * y), canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUri)
    img.src = dataUri
  })

const ocrRegion = performOcr
const ocrFull = performOcr

export const extractFacultyFields = async (processedUri: string): Promise<FacultyFields> => {
  try {
    const [nameRegionUri, idRegionUri] = await Promise.all([
      cropROI(processedUri, 0, 0.2, 1, 0.35),
      cropROI(processedUri, 0, 0.45, 1, 0.35),
    ])
    const [nameText, idText, fullText] = await Promise.all([
      ocrRegion(nameRegionUri),
      ocrRegion(idRegionUri),
      ocrFull(processedUri),
    ])
    const fromFull = extractFacultyFromText(fullText)
    const nameLines = nameText.split('\n').map((l) => l.trim()).filter((l) => l.length > 2 && !SKIP.test(l))
    const roiName = nameLines.find((l) => /^[A-Za-z][A-Za-z\s]{2,39}$/.test(l)) ?? ''
    const idTokens = idText.replace(/\n/g, ' ').split(/\s+/)
    const roiId = idTokens.find((t) => /^FAC[-]?[0-9]{3,6}$|^EMP[-]?[0-9]{3,6}$|^[A-Z]{2,4}[-]?[0-9]{3,6}$/.test(t))?.toUpperCase() ?? ''
    const idLabelMatch = idText.match(/(?:FAC|EMP|STAFF|FACULTY)[:\s#-]*([A-Z0-9\-]{3,15})/i)
    return {
      name: roiName || fromFull.name,
      facultyId: roiId || idLabelMatch?.[1]?.toUpperCase() || fromFull.facultyId,
      college: fromFull.college,
    }
  } catch {
    return { name: '', facultyId: '', college: '' }
  }
}

// ─── Driving License Extraction ───────────────────────────────────────────────

export interface LicenseFields {
  name: string
  dlNumber: string
}

const DL_REGEX = /([A-Z]{2}[- ]?\d{2}[- ]?(?:19|20)\d{2}[- ]?\d{7}|[A-Z]{2}\d{2}\/\d{4}\/\d{5}|[A-Z]{2}[- ]?\d{2}[- ]?\d{11}|DL[- ]?[A-Z0-9]{6,16})/i

export const extractLicenseFromText = (text: string): LicenseFields => {
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const lines = rawLines.map((l) => l.replace(/^[|•*~_—–\-]+\s*/, '').trim()).filter(Boolean)

  let dlNumber = ''
  for (const line of lines) {
    const labeled = line.match(/(?:dl|licence|license|lic(?:ence)?\.?\s*no)[.:\s#\-]*([A-Z0-9\-\/\s]{6,22})/i)
    if (labeled) {
      const token = labeled[1].trim().replace(/\s+/g, '')
      if (token.length >= 6) { dlNumber = token.toUpperCase(); break }
    }
    const pat = line.match(DL_REGEX)
    if (pat) { dlNumber = pat[1].replace(/[\s]/g, '').toUpperCase(); break }
  }
  if (!dlNumber) {
    const m = text.match(DL_REGEX)
    if (m) dlNumber = m[1].replace(/[\s]/g, '').toUpperCase()
  }

  let name = ''
  for (const line of lines) {
    const m = line.match(/(?:holder'?s?\s*name|driver\s*name|name|s\/o|d\/o|w\/o)[:\s]+([A-Za-z\s.'"\-]{3,40})/i)
    if (m && !/licence|license|driving|transport|authority|govt|union/i.test(m[1])) {
      name = m[1].trim().replace(/\s+/g, ' '); break
    }
  }
  if (!name) {
    for (const line of lines) {
      if (/licence|license|driving|transport|authority|government|india|union|state/i.test(line)) continue
      if (/^[A-Z][a-zA-Z.'"\-]+(?:\s[A-Z][a-zA-Z.'"\-]+){1,3}$/.test(line)) { name = line.trim(); break }
      if (/^[A-Z]{2,}(?:\s[A-Z]{2,}){1,3}$/.test(line) && line.length <= 40) { name = line.trim(); break }
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
      fields = { name: fields.name || rawFields.name, dlNumber: fields.dlNumber || rawFields.dlNumber }
    }
    return fields
  } catch (err) {
    console.error('[OCR] extractLicenseFields failed:', err)
    return { name: '', dlNumber: '' }
  }
}
