import Tesseract from 'tesseract.js'

// ─── Levenshtein + Fuzzy ────────────────────────────────────────────────────

export const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
  return dp[m][n]
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const similarity = (a: string, b: string): number => {
  const na = norm(a), nb = norm(b)
  const maxLen = Math.max(na.length, nb.length)
  return maxLen === 0 ? 1 : 1 - levenshtein(na, nb) / maxLen
}

export const COLLEGE_ACRONYMS: Record<string, string> = {
  SICET: 'SRI INDU COLLEGE OF ENGINEERING AND TECHNOLOGY',
  SIIM: 'SRI INDU INSTITUTE OF MANAGEMENT',
  SIPG: 'SRI INDU PG COLLEGE',
}

export const normalizeCollege = (s: string) => {
  const up = s.toUpperCase().trim()
  return COLLEGE_ACRONYMS[up] ?? up
}

export const fuzzyMatch = (entered: string, detected: string): boolean => {
  const a = normalizeCollege(entered).toLowerCase()
  const b = normalizeCollege(detected).toLowerCase()
  if (a === b || b.includes(a) || a.includes(b)) return true
  const wa = a.split(/\s+/).filter(w => w.length > 3)
  if (wa.length && wa.every(w => b.includes(w))) return true
  return similarity(a, b) >= 0.6
}

export const fuzzyMatchName = (entered: string, detected: string): boolean => {
  const a = entered.toLowerCase().trim().replace(/[^a-z\s]/g, '')
  const b = detected.toLowerCase().trim().replace(/[^a-z\s]/g, '')
  if (a === b || b.includes(a) || a.includes(b)) return true
  const wa = a.split(/\s+/).filter(w => w.length > 1)
  const wb = b.split(/\s+/).filter(w => w.length > 1)
  if (wa.filter(w => wb.includes(w)).length >= Math.min(2, wa.length)) return true
  return similarity(a, b) >= 0.6
}

// ─── Image Preprocessing ────────────────────────────────────────────────────

export const preprocessImage = (dataUri: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(4, 2400 / Math.max(img.width, img.height, 1))
      const w = img.width * scale, h = img.height * scale
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      const id = ctx.getImageData(0, 0, w, h)
      const d = id.data
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const c = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128))
        d[i] = d[i + 1] = d[i + 2] = c
      }
      ctx.putImageData(id, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUri)
    img.src = dataUri
  })

// ─── ROI Cropping ───────────────────────────────────────────────────────────
// rx,ry,rw,rh are fractions of image dimensions (0–1)

export const cropROI = (dataUri: string, rx: number, ry: number, rw: number, rh: number): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const cw = Math.round(img.width * rw), ch = Math.round(img.height * rh)
      canvas.width = cw; canvas.height = ch
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, Math.round(img.width * rx), Math.round(img.height * ry), cw, ch, 0, 0, cw, ch)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUri)
    img.src = dataUri
  })

// ─── OCR a single region ────────────────────────────────────────────────────

const ocrRegion = async (dataUri: string): Promise<string> => {
  const result = await Tesseract.recognize(dataUri, 'eng', {
    logger: () => {},
    // @ts-ignore
    tessedit_pageseg_mode: '7', // single line mode for cropped strips
  })
  return result.data.text.trim()
}

// ─── Full-image OCR (PSM 6 = block of text) ─────────────────────────────────

const ocrFull = async (dataUri: string): Promise<string> => {
  const result = await Tesseract.recognize(dataUri, 'eng', {
    logger: () => {},
    // @ts-ignore
    tessedit_pageseg_mode: '6',
  })
  return result.data.text
}

// ─── Student ID Extraction ──────────────────────────────────────────────────

const SKIP = /student\s*id|identification|id\s*card|admit\s*card|hall\s*ticket|university|college|institute|department|year|branch|valid|photo|signature|issued|date|address|phone|mob|www\.|http/i

export interface StudentFields {
  name: string
  roll: string
  college: string
}

const extractStudentFromText = (text: string): StudentFields => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Name
  let name = ''
  for (const line of lines) {
    const m = line.match(/(?:name|student\s*name)\s*[:\-]\s*([A-Za-z][A-Za-z\s]{2,39})/i)
    if (m) { name = m[1].trim(); break }
  }
  if (!name) {
    for (let i = 0; i < lines.length - 1; i++) {
      if (/identification|id\s*card|admit\s*card/i.test(lines[i])) {
        const next = lines[i + 1]
        if (/^[A-Z][A-Za-z\s]{2,39}$/.test(next) && !SKIP.test(next)) { name = next; break }
      }
    }
  }
  if (!name) name = lines.find(l => /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)+$/.test(l) && !SKIP.test(l)) ?? ''
  if (!name) name = lines.find(l => /^[A-Z]{2,}(?:\s[A-Z]{2,})+$/.test(l) && !SKIP.test(l)) ?? ''

  // Roll
  let roll = ''
  for (const line of lines) {
    const m = line.match(/(?:roll|ht|hall\s*ticket|reg(?:istration)?\s*(?:no|number)?|student\s*id|enrollment|h\.t\.\s*no)[.:\s#]*([A-Z0-9]{5,20})/i)
    if (m) { roll = m[1].trim().toUpperCase(); break }
  }
  if (!roll) {
    const rl = lines.find(l => /^[0-9]{2}[A-Z]{1,4}[0-9]{5,7}$|^[A-Z]{2,4}[0-9]{2}[A-Z]{0,2}[0-9]{4,7}$|^[0-9]{10,12}$/.test(l.replace(/\s/g, '')))
    if (rl) roll = rl.replace(/\s/g, '').toUpperCase()
  }

  // College
  let college = ''
  for (const line of lines) {
    if (/college|university|institute|indu|engineering|technology|management|polytechnic/i.test(line) && line.length > 6) {
      college = line.replace(/[^A-Za-z0-9\s&]/g, ' ').replace(/\s+/g, ' ').trim()
      break
    }
  }

  return { name, roll, college }
}

// ROI strategy for student IDs:
// Name region: top 25–50% of card, full width
// Roll region: middle 40–65% of card, full width
export const extractStudentFields = async (processedUri: string): Promise<StudentFields> => {
  try {
    const [nameRegionUri, rollRegionUri] = await Promise.all([
      cropROI(processedUri, 0, 0.2, 1, 0.35),
      cropROI(processedUri, 0, 0.45, 1, 0.35),
    ])
    const [nameText, rollText, fullText] = await Promise.all([
      ocrRegion(nameRegionUri),
      ocrRegion(rollRegionUri),
      ocrFull(processedUri),
    ])

    // Parse full text for structure, then override name/roll with ROI results if better
    const fromFull = extractStudentFromText(fullText)

    // ROI name: pick longest clean line from nameText
    const nameLines = nameText.split('\n').map(l => l.trim()).filter(l => l.length > 2 && !SKIP.test(l))
    const roiName = nameLines.find(l => /^[A-Za-z][A-Za-z\s]{2,39}$/.test(l)) ?? ''

    // ROI roll: find token matching roll pattern
    const rollTokens = rollText.replace(/\n/g, ' ').split(/\s+/)
    const roiRoll = rollTokens.find(t =>
      /^[0-9]{2}[A-Z]{1,4}[0-9]{5,7}$|^[A-Z]{2,4}[0-9]{2}[A-Z]{0,2}[0-9]{4,7}$|^[0-9]{10,12}$/.test(t)
    )?.toUpperCase() ?? ''

    // Also try label match in rollText
    const rollLabelMatch = rollText.match(/(?:ROLL|HT|NO|REG|ENROLLMENT)[:\s#]*([A-Z0-9]{5,20})/i)
    const roiRollFinal = roiRoll || rollLabelMatch?.[1]?.toUpperCase() || ''

    return {
      name: roiName || fromFull.name,
      roll: roiRollFinal || fromFull.roll,
      college: fromFull.college,
    }
  } catch {
    return { name: '', roll: '', college: '' }
  }
}

// ─── Faculty ID Extraction ──────────────────────────────────────────────────

export interface FacultyFields {
  name: string
  facultyId: string
  college: string
}

const extractFacultyFromText = (text: string): FacultyFields => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Name
  let name = ''
  for (const line of lines) {
    const m = line.match(/(?:name|faculty\s*name|staff\s*name|dr\.|prof\.)\s*[:\-]\s*([A-Za-z][A-Za-z\s]{2,39})/i)
    if (m) { name = m[1].trim(); break }
  }
  if (!name) name = lines.find(l => /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)+$/.test(l) && !SKIP.test(l)) ?? ''
  if (!name) name = lines.find(l => /^[A-Z]{2,}(?:\s[A-Z]{2,})+$/.test(l) && !SKIP.test(l)) ?? ''

  // Faculty ID
  let facultyId = ''
  for (const line of lines) {
    const m = line.match(/(?:faculty\s*id|staff\s*id|employee\s*(?:id|no)|emp(?:\s*no|\.?\s*id)?|fac(?:ulty)?[\s\-#]*(?:id|no))[.:\s#]*([A-Z0-9\-]{3,20})/i)
    if (m) { facultyId = m[1].trim().toUpperCase(); break }
  }
  if (!facultyId) {
    const fl = lines.find(l => /^FAC[-\s]?[0-9]{3,6}$|^EMP[-\s]?[0-9]{3,6}$|^[A-Z]{2,4}[-\s]?[0-9]{3,6}$/.test(l.replace(/\s/g, '').toUpperCase()))
    if (fl) facultyId = fl.replace(/\s/g, '').toUpperCase()
  }

  // College
  let college = ''
  for (const line of lines) {
    if (/college|university|institute|indu|engineering|technology|management|polytechnic/i.test(line) && line.length > 6) {
      college = line.replace(/[^A-Za-z0-9\s&]/g, ' ').replace(/\s+/g, ' ').trim()
      break
    }
  }

  return { name, facultyId, college }
}

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

    const nameLines = nameText.split('\n').map(l => l.trim()).filter(l => l.length > 2 && !SKIP.test(l))
    const roiName = nameLines.find(l => /^[A-Za-z][A-Za-z\s]{2,39}$/.test(l)) ?? ''

    const idTokens = idText.replace(/\n/g, ' ').split(/\s+/)
    const roiId = idTokens.find(t => /^FAC[-]?[0-9]{3,6}$|^EMP[-]?[0-9]{3,6}$|^[A-Z]{2,4}[-]?[0-9]{3,6}$/.test(t))?.toUpperCase() ?? ''
    const idLabelMatch = idText.match(/(?:FAC|EMP|STAFF|FACULTY)[:\s#-]*([A-Z0-9\-]{3,15})/i)
    const roiIdFinal = roiId || idLabelMatch?.[1]?.toUpperCase() || ''

    return {
      name: roiName || fromFull.name,
      facultyId: roiIdFinal || fromFull.facultyId,
      college: fromFull.college,
    }
  } catch {
    return { name: '', facultyId: '', college: '' }
  }
}

// ─── Driving License Extraction ─────────────────────────────────────────────

export interface LicenseFields {
  name: string
  dlNumber: string
}

const DL_REGEX = /([A-Z]{2}[- ]?\d{2}[- ]?(?:19|20)\d{2}[- ]?\d{7}|[A-Z]{2}\d{2}\/\d{4}\/\d{5})/i

const extractLicenseFromText = (text: string): LicenseFields => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // DL Number
  let dlNumber = ''
  for (const line of lines) {
    // Explicit label
    const labeled = line.match(/(?:dl|licence|license|lic(?:ence)?\.?\s*no)[.:\s]*([A-Z0-9\-\/\s]{8,20})/i)
    if (labeled) { dlNumber = labeled[1].replace(/\s/g, '').toUpperCase(); break }
    // Pattern match
    const pat = line.match(DL_REGEX)
    if (pat) { dlNumber = pat[1].replace(/[\s-]/g, '').toUpperCase(); break }
  }
  // Fallback: generic ID token
  if (!dlNumber) {
    const m = text.match(/(?:ROLL|HT|NO|DL|LICENCE)[:\s]*([A-Z0-9]{8,16})/i)
    if (m) dlNumber = m[1].toUpperCase()
  }

  // Name
  let name = ''
  for (const line of lines) {
    const m = line.match(/(?:name|holder'?s?\s*name|driver\s*name|s\/o|d\/o|w\/o)[:\s]+([A-Za-z\s]{3,40})/i)
    if (m) { name = m[1].trim(); break }
  }
  if (!name) name = lines.find(l => /^[A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3}$/.test(l)) ?? ''
  if (!name) {
    const upper = lines.filter(l => /^[A-Z\s]{4,40}$/.test(l) && l.split(' ').length >= 2)
    if (upper.length) name = upper[0]
  }

  return { name, dlNumber }
}

// ROI strategy for DL:
// Name region: top 20–45% (name usually in upper half)
// DL number region: middle 40–70%
export const extractLicenseFields = async (processedUri: string): Promise<LicenseFields> => {
  try {
    const [nameRegionUri, dlRegionUri] = await Promise.all([
      cropROI(processedUri, 0, 0.15, 1, 0.35),
      cropROI(processedUri, 0, 0.35, 1, 0.4),
    ])
    const [nameText, dlText, fullText] = await Promise.all([
      ocrRegion(nameRegionUri),
      ocrRegion(dlRegionUri),
      ocrFull(processedUri),
    ])

    const fromFull = extractLicenseFromText(fullText)

    // ROI name
    const nameLines = nameText.split('\n').map(l => l.trim()).filter(Boolean)
    const roiName = nameLines.find(l =>
      /^[A-Za-z][A-Za-z\s]{2,39}$/.test(l) &&
      !/licence|license|driving|transport|authority|govt|government/i.test(l)
    ) ?? ''

    // ROI DL number
    const dlTokens = dlText.replace(/\n/g, ' ')
    const roiDl = dlTokens.match(DL_REGEX)?.[1]?.replace(/[\s-]/g, '').toUpperCase()
      ?? dlTokens.match(/(?:ROLL|HT|NO|DL|LICENCE)[:\s]*([A-Z0-9]{8,16})/i)?.[1]?.toUpperCase()
      ?? ''

    return {
      name: roiName || fromFull.name,
      dlNumber: roiDl || fromFull.dlNumber,
    }
  } catch {
    return { name: '', dlNumber: '' }
  }
}
