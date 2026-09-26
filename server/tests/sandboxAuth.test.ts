import { describe, it, expect, beforeAll } from 'vitest'
import axios from 'axios'

const API_BASE = 'http://localhost:5000/api'

describe('Sandbox Demo Credentials Verification', () => {
  beforeAll(async () => {
    const health = await axios.get('http://localhost:5000/health', { timeout: 3000 })
    expect(health.data?.status).toBe('healthy')
  })

  it('1. Student Sandbox Credentials: logs in as real existing Student record (Demo Student)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demostudent@gmail.com',
      password: 'campus2026',
      role: 'student',
    })

    expect(res.data.success).toBe(true)
    expect(res.data.data.token).toBeTruthy()
    expect(res.data.data.user.role).toBe('STUDENT')
    expect(res.data.data.user.name).toBe('Demo Student')
    expect(res.data.data.user.email).toBe('demostudent@gmail.com')
  })

  it('2. Faculty Sandbox Credentials: logs in as real existing Faculty record (Demo Faculty)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demofaculty@gmail.com',
      password: 'campus2026',
      role: 'faculty',
    })

    expect(res.data.success).toBe(true)
    expect(res.data.data.token).toBeTruthy()
    expect(res.data.data.user.role).toBe('FACULTY')
    expect(res.data.data.user.name).toBe('Demo Faculty')
    expect(res.data.data.user.email).toBe('demofaculty@gmail.com')
  })

  it('3. Driver Sandbox Credentials: logs in as real existing Driver record (Demo Driver)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demodriver@gmail.com',
      password: 'campus2026',
      role: 'driver',
    })

    expect(res.data.success).toBe(true)
    expect(res.data.data.token).toBeTruthy()
    expect(res.data.data.user.role).toBe('DRIVER')
    expect(res.data.data.user.name).toBe('Demo Driver')
    expect(res.data.data.user.email).toBe('demodriver@gmail.com')
  })

  it('4. Student as Driver Sandbox Credentials: logs in as real existing Student Driver record (Demo Student Driver)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demostudentdriver@gmail.com',
      password: 'campus2026',
      role: 'driver',
    })

    expect(res.data.success).toBe(true)
    expect(res.data.data.token).toBeTruthy()
    expect(res.data.data.user.role).toBe('DRIVER')
    expect(res.data.data.user.name).toBe('Demo Student Driver')
    expect(res.data.data.user.email).toBe('demostudentdriver@gmail.com')
  })
})
