import axios from 'axios'
import { startServer } from '../index.js'

const API_BASE = 'http://localhost:5000/api'

async function runTests() {
  console.log('=================================================================')
  console.log('  CAMPUSFLOW — Phase 1 End-to-End Test Suite')
  console.log('=================================================================')

  // Check if server is running, if not start it
  try {
    await axios.get('http://localhost:5000/health', { timeout: 1000 })
  } catch {
    console.log('[Test Setup] Starting backend server with embedded MongoDB memory instance...')
    await startServer()
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  let passed = 0
  let failed = 0

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn()
      console.log(`[PASS] ${name}`)
      passed++
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.response?.data || err.message)
      failed++
    }
  }

  // 1. Health check
  await test('Backend Health Check', async () => {
    const res = await axios.get('http://localhost:5000/health')
    if (res.data.status !== 'healthy') throw new Error('Not healthy')
  })

  // 2. Email domain validation
  await test('Email Domain Validation (Allowed Domain)', async () => {
    const res = await axios.post(`${API_BASE}/auth/verify-email-domain`, {
      email: 'john.doe@campus.edu',
    })
    if (!res.data.data.allowed) throw new Error('Expected campus.edu to be authorized')
  })

  await test('Email Domain Validation (Rejected Domain)', async () => {
    const res = await axios.post(`${API_BASE}/auth/verify-email-domain`, {
      email: 'intruder@randommail.com',
    })
    if (res.data.data.allowed) throw new Error('Expected randommail.com to be rejected')
  })

  // 3. OCR Name Matching Service
  await test('OCR Fuzzy Name Matching', async () => {
    const res = await axios.post(`${API_BASE}/auth/verify-ocr`, {
      enteredName: 'Aarav Sharma',
      detectedName: 'AARAV K. SHARMA',
    })
    if (!res.data.data.isMatch) throw new Error('Expected Aarav Sharma to match AARAV K. SHARMA')
  })

  // 4. Student Registration
  let studentToken = ''
  await test('Student Registration (/api/auth/register/student)', async () => {
    const testEmail = `student_${Date.now()}@campus.edu`
    const res = await axios.post(`${API_BASE}/auth/register/student`, {
      name: 'Rohan Verma',
      email: testEmail,
      phone: '9876543210',
      password: 'SecurePassword123!',
      collegeName: 'National Engineering Campus',
      rollNumber: 'NEC-2026-CS-042',
      department: 'Computer Science',
      year: 3,
      idCardPhoto: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      detectedName: 'ROHAN VERMA',
      nameMatchStatus: 'MATCHED',
    })

    if (!res.data.success || !res.data.data.token) {
      throw new Error('Student registration failed')
    }
    if (res.data.data.user.verificationStatus !== 'PENDING') {
      throw new Error('New student verification status should be PENDING')
    }
    studentToken = res.data.data.token
  })

  // 5. Faculty Registration
  await test('Faculty Registration (/api/auth/register/faculty)', async () => {
    const testEmail = `faculty_${Date.now()}@campus.edu`
    const res = await axios.post(`${API_BASE}/auth/register/faculty`, {
      name: 'Dr. Anita Desai',
      email: testEmail,
      phone: '9876543211',
      password: 'FacultyPassword123!',
      collegeName: 'University Institute of Tech',
      collegeId: 'FAC-ENG-891',
      department: 'Information Science',
      idCardPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
      detectedName: 'DR ANITA DESAI',
      nameMatchStatus: 'MATCHED',
    })

    if (!res.data.success || res.data.data.user.role.toLowerCase() !== 'faculty') {
      throw new Error('Faculty registration failed')
    }
  })

  // 6. Driver Registration
  let driverToken = ''
  await test('Driver Registration (/api/auth/register/driver)', async () => {
    const testEmail = `driver_${Date.now()}@transitservices.in`
    const res = await axios.post(`${API_BASE}/auth/register/driver`, {
      name: 'Vikram Singh',
      email: testEmail,
      phone: `98765${Date.now().toString().slice(-5)}`,
      password: 'DriverPassword123!',
      licenseNumber: 'DL-04-2022-998877',
      vehicleRegistration: 'KA-01-EQ-4422',
      vehicleType: 'EV Van (6 Seater)',
      licensePhoto: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
      rcPhoto: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format&fit=crop&q=80',
      detectedName: 'VIKRAM SINGH',
      nameMatchStatus: 'MATCHED',
    })

    if (!res.data.success || res.data.data.user.role.toLowerCase() !== 'driver') {
      throw new Error('Driver registration failed')
    }
    driverToken = res.data.data.token
  })

  // 7. Dispatcher Login (Secure Environment Credentials)
  let dispatcherToken = ''
  await test('Dispatcher Login (Valid Admin Credentials)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin',
      password: 'CampusAdmin#2026',
    })

    const roleLower = (res.data.data?.user?.role || '').toLowerCase()
    if (!res.data.success || !res.data.data.token || (roleLower !== 'admin' && roleLower !== 'dispatcher')) {
      throw new Error('Dispatcher login failed')
    }
    dispatcherToken = res.data.data.token
  })

  await test('Dispatcher Login (Invalid Credentials Rejection)', async () => {
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin',
        password: 'WrongPassword!',
      })
      throw new Error('Should have rejected invalid password')
    } catch (err: any) {
      if (err.response?.status !== 401) {
        throw new Error(`Expected 401 status but got ${err.response?.status}`)
      }
    }
  })

  // 8. RBAC Endpoint Enforcement
  await test('RBAC: Student Token Denied on Dispatcher Dashboard (403 Forbidden)', async () => {
    try {
      await axios.get(`${API_BASE}/dispatcher/dashboard`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      })
      throw new Error('Student should NOT have access to dispatcher dashboard')
    } catch (err: any) {
      if (err.response?.status !== 403) {
        throw new Error(`Expected 403 Forbidden but got ${err.response?.status}`)
      }
    }
  })

  await test('RBAC: Dispatcher Token Allowed on Dispatcher Dashboard (200 OK)', async () => {
    const res = await axios.get(`${API_BASE}/dispatcher/dashboard`, {
      headers: { Authorization: `Bearer ${dispatcherToken}` },
    })
    if (!res.data.success || !res.data.data.kpis) {
      throw new Error('Dispatcher dashboard failed with valid token')
    }
  })

  // 9. Auth GET /api/auth/me with Bearer Token
  await test('Auth GET /api/auth/me (JWT Authorization Header)', async () => {
    const res = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    })
    if (res.data.data.name !== 'Rohan Verma') {
      throw new Error('Incorrect user returned from /api/auth/me')
    }
  })

  // 10. Rides listing from MongoDB
  await test('Rides GET /api/rides', async () => {
    const res = await axios.get(`${API_BASE}/rides`)
    if (!Array.isArray(res.data.data) || res.data.data.length < 5) throw new Error('Rides missing')
  })

  // 11. Ride request matching engine
  await test('Matching Engine POST /api/ride-requests', async () => {
    const res = await axios.post(`${API_BASE}/ride-requests`, {
      pickup: 'Hostel A',
      destination: 'Main Campus',
      time: '8:15 AM',
      seats: 1,
    })
    const matches = res.data.data.matches
    if (!matches || matches.length === 0) throw new Error('No matches returned')
    const topMatch = matches[0]
    console.log(`       Top match: ${topMatch.ride.routeName} with score: ${topMatch.score.total}%`)
    if (topMatch.score.total < 70) throw new Error('Expected high match score')
  })

  // 12. Reset demo to clean state
  await test('Demo Reset POST /api/demo/reset', async () => {
    const res = await axios.post(`${API_BASE}/demo/reset`, {})
    if (!res.data.success) throw new Error('Reset failed')
  })

  // 13. Join ride (5/6 -> 6/6 full transition)
  await test('Atomic Capacity Lock POST /api/rides/ride-102/join', async () => {
    const res = await axios.post(`${API_BASE}/rides/ride-102/join`, {
      studentId: 's1',
      pickup: 'Hostel A',
      destination: 'Main Campus',
      seats: 1,
    })
    if (res.data.data.ride.bookedSeats !== 6) throw new Error('Booked seats not 6')
    if (res.data.data.ride.status !== 'full') throw new Error('Ride status not full')
  })

  // 14. Overbooking rejection (6/6 + 1 -> 409 Conflict)
  await test('Overbooking Rejection (409 RIDE_FULL)', async () => {
    try {
      await axios.post(`${API_BASE}/rides/ride-102/join`, {
        studentId: 's7',
        pickup: 'Hostel A',
        destination: 'Main Campus',
        seats: 1,
      })
      throw new Error('Should have rejected overbooking')
    } catch (err: any) {
      if (err.response?.status !== 409) {
        throw new Error(`Expected 409 status but got ${err.response?.status}`)
      }
    }
  })

  // 15. Driver accept & start
  await test('Driver Lifecycle (Accept & Start)', async () => {
    // Get token for seeded driver d1
    const loginRes = await axios.post(`${API_BASE}/auth/login`, { userId: 'd1' })
    const activeDriverToken = loginRes.data.data.token

    const acceptRes = await axios.post(
      `${API_BASE}/driver/rides/ride-101/accept`,
      {},
      { headers: { Authorization: `Bearer ${activeDriverToken}` } }
    )
    if (acceptRes.data.data.status !== 'boarding') throw new Error('Did not accept')

    const startRes = await axios.post(`${API_BASE}/rides/ride-101/start`, {})
    if (startRes.data.data.status !== 'active') throw new Error('Did not start')
  })

  // 16. Telematics & Route deviation
  await test('Telematics & Route Deviation Detection', async () => {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, { userId: 'd1' })
    const activeDriverToken = loginRes.data.data.token

    const res = await axios.post(
      `${API_BASE}/driver/location`,
      {
        rideId: 'ride-105',
        lat: 17.3825,
        lng: 78.4715,
      },
      { headers: { Authorization: `Bearer ${activeDriverToken}` } }
    )
    if (!res.data.data.deviation.hasDeviation) throw new Error('Expected route deviation flag')
  })

  // 17. Emergency SOS
  await test('Emergency SOS Workflow', async () => {
    const res = await axios.post(`${API_BASE}/safety/sos`, {
      rideId: 'ride-102',
      userId: 's1',
    })
    if (res.data.data.eventType !== 'SOS' || res.data.data.severity !== 'CRITICAL') {
      throw new Error('SOS not created properly')
    }
  })

  // 18. Final Clean Demo Reset
  await test('Final Clean Demo Reset', async () => {
    await axios.post(`${API_BASE}/demo/reset`, {})
  })

  console.log(`\n=================================================================`)
  console.log(`  Test Results: ${passed} Passed, ${failed} Failed`)
  console.log(`=================================================================`)
  if (failed > 0) process.exit(1)
}

runTests().catch((e) => {
  console.error(e)
  process.exit(1)
})

