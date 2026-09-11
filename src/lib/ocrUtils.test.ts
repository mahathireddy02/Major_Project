import { describe, it, expect } from 'vitest'
import {
  levenshtein,
  stringSimilarity,
  normalizeName,
  fuzzyMatchName,
  searchNameInFullText,
  normalizeId,
  fuzzyMatchId,
  normalizeOcrText,
  verifyCollegeInOcrText,
  extractStudentFromText,
  NAME_SIMILARITY_THRESHOLD,
} from './ocrUtils'

// ─── levenshtein ─────────────────────────────────────────────────────────────
describe('levenshtein', () => {
  it('identical strings = 0', () => expect(levenshtein('abc', 'abc')).toBe(0))
  it('single substitution = 1', () => expect(levenshtein('abc', 'axc')).toBe(1))
  it('empty vs non-empty', () => expect(levenshtein('', 'abc')).toBe(3))
})

// ─── stringSimilarity ─────────────────────────────────────────────────────────
describe('stringSimilarity', () => {
  it('identical = 1', () => expect(stringSimilarity('arjun', 'arjun')).toBe(1))
  it('empty both = 1', () => expect(stringSimilarity('', '')).toBe(1))
  it('one empty = 0', () => expect(stringSimilarity('arjun', '')).toBe(0))
  it('partial similarity < 1', () => expect(stringSimilarity('arjun', 'arjum')).toBeGreaterThan(0.7))
})

// ─── normalizeName ────────────────────────────────────────────────────────────
describe('normalizeName', () => {
  it('lowercases and strips title prefix', () => expect(normalizeName('Dr. Arjun Sharma')).toBe('arjun sharma'))
  it('collapses spaces', () => expect(normalizeName('Arjun  Sharma')).toBe('arjun sharma'))
  it('empty string', () => expect(normalizeName('')).toBe(''))
})

// ─── fuzzyMatchName ───────────────────────────────────────────────────────────
describe('fuzzyMatchName', () => {
  it('exact match', () => expect(fuzzyMatchName('Arjun Sharma', 'Arjun Sharma')).toBe(true))
  it('case insensitive', () => expect(fuzzyMatchName('Arjun Sharma', 'ARJUN SHARMA')).toBe(true))
  it('reordered tokens', () => expect(fuzzyMatchName('Sharma Arjun', 'Arjun Sharma')).toBe(true))
  it('minor OCR typo (1 char)', () => expect(fuzzyMatchName('Arjun Sharma', 'Arjun Sharna')).toBe(true))
  it('different names = false', () => expect(fuzzyMatchName('Arjun Sharma', 'Rahul Verma')).toBe(false))
  it('empty entered = false', () => expect(fuzzyMatchName('', 'Arjun Sharma')).toBe(false))
  it('empty detected = false', () => expect(fuzzyMatchName('Arjun Sharma', '')).toBe(false))
})

// ─── searchNameInFullText ─────────────────────────────────────────────────────
describe('searchNameInFullText', () => {
  it('exact match in full text', () => {
    const ocr = 'SRI INDU COLLEGE\nStudent ID Card\nARJUN SHARMA\nRoll No: 23D123456'
    const r = searchNameInFullText('Arjun Sharma', ocr)
    expect(r.found).toBe(true)
  })

  it('name with line breaks (split across lines)', () => {
    const ocr = 'SRI INDU COLLEGE\nARJUN\nSHARMA\nRoll: 23D123456'
    const r = searchNameInFullText('Arjun Sharma', ocr)
    expect(r.found).toBe(true)
  })

  it('name with minor OCR error', () => {
    const ocr = 'SRI INDU COLLEGE\nARJUN SHARNA\nRoll: 23D123456'
    const r = searchNameInFullText('Arjun Sharma', ocr)
    expect(r.found).toBe(true)
  })

  it('different name order', () => {
    const ocr = 'SRI INDU COLLEGE\nSHARMA ARJUN\nRoll: 23D123456'
    const r = searchNameInFullText('Arjun Sharma', ocr)
    expect(r.found).toBe(true)
  })

  it('name after label "Name:"', () => {
    const ocr = 'SRI INDU COLLEGE\nName: ARJUN SHARMA\nRoll: 23D123456'
    const r = searchNameInFullText('Arjun Sharma', ocr)
    expect(r.found).toBe(true)
  })

  it('name not present = not found', () => {
    const ocr = 'SRI INDU COLLEGE\nRahul Verma\nRoll: 23D123456'
    const r = searchNameInFullText('Arjun Sharma', ocr)
    expect(r.found).toBe(false)
  })

  it('empty OCR text = not found', () => {
    const r = searchNameInFullText('Arjun Sharma', '')
    expect(r.found).toBe(false)
  })

  it('multiple possible names — returns found for entered name', () => {
    const ocr = 'SRI INDU COLLEGE\nARJUN SHARMA\nRAHUL VERMA\nRoll: 23D123456'
    const r = searchNameInFullText('Arjun Sharma', ocr)
    expect(r.found).toBe(true)
  })

  it('low-confidence OCR with extra punctuation between every letter cannot be matched', () => {
    // A.R.J.U.N S.H.A.R.M.A normalizes to individual letters, not name tokens
    // This is a genuine OCR failure case — expected result is not found
    const ocr = 'SRI INDU COLLEGE\nA.R.J.U.N  S.H.A.R.M.A\nRoll: 23D123456'
    const r = searchNameInFullText('Arjun Sharma', ocr)
    expect(r.found).toBe(false)
  })

  it('NAME_SIMILARITY_THRESHOLD is 0.85', () => {
    expect(NAME_SIMILARITY_THRESHOLD).toBe(0.85)
  })
})

// ─── fuzzyMatchId ─────────────────────────────────────────────────────────────
describe('fuzzyMatchId', () => {
  it('exact match', () => expect(fuzzyMatchId('23D123456', '23D123456')).toBe(true))
  it('mismatch CSE345667 vs 23D123456 = false', () => expect(fuzzyMatchId('CSE345667', '23D123456')).toBe(false))
  it('normalizes separators', () => expect(fuzzyMatchId('23D-123456', '23D123456')).toBe(true))
  it('single OCR char substitution', () => expect(fuzzyMatchId('23D12345G', '23D123456')).toBe(true))
  it('completely different = false', () => expect(fuzzyMatchId('ABC999', 'XYZ111')).toBe(false))
  it('empty entered = false', () => expect(fuzzyMatchId('', '23D123456')).toBe(false))
  it('empty detected = false', () => expect(fuzzyMatchId('23D123456', '')).toBe(false))
})

// ─── verifyCollegeInOcrText ───────────────────────────────────────────────────
describe('verifyCollegeInOcrText', () => {
  it('exact college name in OCR', () => {
    const r = verifyCollegeInOcrText('Sri Indu College', 'SRI INDU COLLEGE\nARJUN SHARMA')
    expect(r.isMatch).toBe(true)
  })

  it('college name inside longer institution name', () => {
    const r = verifyCollegeInOcrText('Sri Indu College', 'SRI INDU COLLEGE OF ENGINEERING AND TECHNOLOGY\nARJUN SHARMA')
    expect(r.isMatch).toBe(true)
  })

  it('college name with OCR spelling error (COLLGE)', () => {
    const r = verifyCollegeInOcrText('Sri Indu College', 'SRI INDU COLLGE\nARJUN SHARMA')
    // Distinctive words "sri" and "indu" are present
    expect(r.isMatch).toBe(true)
  })

  it('college mismatch = false', () => {
    const r = verifyCollegeInOcrText('Sri Indu College', 'JNTU HYDERABAD\nARJUN SHARMA')
    expect(r.isMatch).toBe(false)
  })

  it('empty OCR = notDetected', () => {
    const r = verifyCollegeInOcrText('Sri Indu College', '')
    expect(r.notDetected).toBe(true)
    expect(r.isMatch).toBe(false)
  })

  it('only generic word "college" in OCR = false (ambiguous)', () => {
    const r = verifyCollegeInOcrText('Sri Indu College', 'COLLEGE\nSTUDENT ID')
    // "sri" and "indu" are not present, so should not match
    expect(r.isMatch).toBe(false)
  })

  it('only "TECH" in OCR = false', () => {
    const r = verifyCollegeInOcrText('Sri Indu College', 'TECH SOLUTIONS\nID CARD')
    expect(r.isMatch).toBe(false)
  })

  it('missing college = false', () => {
    const r = verifyCollegeInOcrText('', 'SRI INDU COLLEGE\nARJUN SHARMA')
    expect(r.isMatch).toBe(false)
  })
})

// ─── extractStudentFromText ───────────────────────────────────────────────────
describe('extractStudentFromText', () => {
  it('extracts ALL-CAPS name', () => {
    const text = 'SRI INDU COLLEGE\nStudent ID Card\nARJUN SHARMA\nRoll No: 23D123456'
    const r = extractStudentFromText(text)
    expect(r.name).toBe('ARJUN SHARMA')
  })

  it('extracts Title Case name', () => {
    const text = 'Sri Indu College\nStudent ID Card\nArjun Sharma\nRoll No: 23D123456'
    const r = extractStudentFromText(text)
    expect(r.name).toBe('Arjun Sharma')
  })

  it('extracts name after label', () => {
    const text = 'SRI INDU COLLEGE\nName: Arjun Sharma\nRoll No: 23D123456'
    const r = extractStudentFromText(text)
    expect(r.name).toBe('Arjun Sharma')
  })

  it('extracts roll number with label', () => {
    const text = 'SRI INDU COLLEGE\nARJUN SHARMA\nRoll No: 23D123456'
    const r = extractStudentFromText(text)
    expect(r.roll).toBe('23D123456')
  })

  it('extracts college from header', () => {
    const text = 'SRI INDU COLLEGE\nARJUN SHARMA\nRoll No: 23D123456'
    const r = extractStudentFromText(text)
    expect(r.college.toUpperCase()).toContain('INDU')
  })

  it('missing name = empty string', () => {
    const text = 'SRI INDU COLLEGE\nRoll No: 23D123456'
    const r = extractStudentFromText(text)
    expect(r.name).toBe('')
  })

  it('missing roll = empty string', () => {
    const text = 'SRI INDU COLLEGE\nARJUN SHARMA'
    const r = extractStudentFromText(text)
    expect(r.roll).toBe('')
  })

  it('missing college = empty string', () => {
    const text = 'ARJUN SHARMA\nRoll No: 23D123456'
    const r = extractStudentFromText(text)
    expect(r.college).toBe('')
  })
})

// ─── Integration: example screenshot scenario ─────────────────────────────────
describe('Integration: example screenshot', () => {
  const ocrText = `SRI INDU COLLEGE OF ENGINEERING AND TECHNOLOGY
Student Identity Card
ARJUN SHARMA
Roll No: 23D123456
Branch: CSE
Year: 2024`

  it('name ARJUN SHARMA is found via searchNameInFullText', () => {
    const r = searchNameInFullText('Arjun Sharma', ocrText)
    expect(r.found).toBe(true)
  })

  it('roll 23D123456 matches detected 23D123456', () => {
    expect(fuzzyMatchId('23D123456', '23D123456')).toBe(true)
  })

  it('entered roll CSE345667 does NOT match detected 23D123456', () => {
    expect(fuzzyMatchId('CSE345667', '23D123456')).toBe(false)
  })

  it('college Sri Indu College matches OCR', () => {
    const r = verifyCollegeInOcrText('Sri Indu College', ocrText)
    expect(r.isMatch).toBe(true)
  })

  it('overall: name=match, roll=mismatch, college=match', () => {
    const nameOk = searchNameInFullText('Arjun Sharma', ocrText).found
    const rollOk = fuzzyMatchId('CSE345667', '23D123456')
    const collegeOk = verifyCollegeInOcrText('Sri Indu College', ocrText).isMatch
    expect(nameOk).toBe(true)
    expect(rollOk).toBe(false)   // mismatch — must NOT be promoted to match
    expect(collegeOk).toBe(true)
  })
})
