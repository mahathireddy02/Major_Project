import { describe, it, expect, beforeAll } from 'vitest'
import axios from 'axios'

const API_BASE = 'http://localhost:5000/api'

describe('Sandbox Demo Credentials Verification', () => {
  beforeAll(async () => {
    const health = await axios.get('http://localhost:5000/health', { timeout: 3000 })
    expect(health.data?.status).toBe('healthy')
  })

  it('1. Student Sandbox Credentials: logs in as real existing Student record (Uday Kiran)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'uday.kiran@sriindu.ac.in',
      password: 'campus2026',
      role: 'student',
    })

    expect(res.data.success).toBe(true)
    expect(res.data.data.token).toBeTruthy()
    expect(res.data.data.user.role).toBe('STUDENT')
    expect(res.data.data.user.name).toBe('Uday Kiran')
    expect(res.data.data.user.email).toBe('uday.kiran@sriindu.ac.in')
    expect(res.data.data.user.collegeName).toBe('Sri Indu College of Engineering & Technology')
  })

  it('2. Faculty Sandbox Credentials: logs in as real existing Faculty record (Dr. Ramesh Sharma)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'ramesh.sharma@sriindu.ac.in',
      password: 'campus2026',
      role: 'faculty',
    })

    expect(res.data.success).toBe(true)
    expect(res.data.data.token).toBeTruthy()
    expect(res.data.data.user.role).toBe('FACULTY')
    expect(res.data.data.user.name).toBe('Dr. Ramesh Sharma')
    expect(res.data.data.user.email).toBe('ramesh.sharma@sriindu.ac.in')
    expect(res.data.data.user.collegeName).toBe('Sri Indu College of Engineering & Technology')
  })

  it('3. Driver Sandbox Credentials: logs in as real existing Driver record (Rahul Kumar)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'rahul.kumar.driver@gmail.com',
      password: 'campus2026',
      role: 'driver',
    })

    expect(res.data.success).toBe(true)
    expect(res.data.data.token).toBeTruthy()
    expect(res.data.data.user.role).toBe('DRIVER')
    expect(res.data.data.user.id).toBe('d1')
    expect(res.data.data.user.name).toBe('Rahul Kumar')
    expect(res.data.data.user.email).toBe('rahul.kumar.driver@gmail.com')
    expect(res.data.data.user.vehicleRegistration).toBe('TS 09 AB 1234')
  })
})
