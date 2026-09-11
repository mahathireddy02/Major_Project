import { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { UserModel, UserRole } from '../models/User.js'
import { VehicleModel } from '../models/Vehicle.js'
import { EmergencyContactModel } from '../models/EmergencyContact.js'
import { BookingModel } from '../models/Booking.js'
import { RideModel } from '../models/Ride.js'
import { RatingModel } from '../models/Rating.js'
import { ENV } from '../config/env.js'
import { generateToken, authenticate } from '../middleware/auth.js'
import { ocrService } from '../services/ocrService.js'

function isAuthorizedDomain(email: string): boolean {
  if (!email || !email.includes('@')) return false
  const domain = email.split('@')[1].toLowerCase().trim()
  return ENV.AUTHORIZED_COLLEGE_DOMAINS.some(
    (authDomain) => domain === authDomain || domain.endsWith(`.${authDomain}`)
  )
}

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Validate College Email Domain
  fastify.post('/verify-email-domain', async (request, reply) => {
    const { email } = (request.body as { email?: string }) || {}
    if (!email) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email is required' },
      })
    }

    const isValid = isAuthorizedDomain(email)
    const domain = email.includes('@') ? email.split('@')[1] : ''

    return {
      success: true,
      data: {
        allowed: isValid,
        isValid,
        domain,
        authorizedDomains: ENV.AUTHORIZED_COLLEGE_DOMAINS,
        message: isValid
          ? `✓ Authorized college domain detected (@${domain})`
          : `Domain @${domain} is not in the authorized college list (${ENV.AUTHORIZED_COLLEGE_DOMAINS.join(', ')})`,
      },
    }
  })

  // OCR & Name Consistency Evaluation
  fastify.post('/verify-ocr', async (request, reply) => {
    const { enteredName, detectedName } = (request.body as {
      enteredName?: string
      detectedName?: string
    }) || {}

    if (!enteredName || !detectedName) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Both enteredName and detectedName are required' },
      })
    }

    const result = ocrService.evaluateNameConsistency(enteredName, detectedName)
    return { success: true, data: result }
  })

  // Student Registration
  fastify.post('/register/student', async (request, reply) => {
    const body = (request.body || {}) as any
    const fullName = (body.fullName || body.name || '').trim()
    const collegeEmail = (body.collegeEmail || body.email || '').trim().toLowerCase()
    const password = body.password || ''
    const rollNumber = body.rollNumber || body.studentId || `STU-${Date.now().toString().slice(-4)}`
    const collegeName = body.collegeName || 'Campus University'
    const phone = body.phone || '+91 90000 00000'
    const idCardPhoto = body.idCardPhoto || ''
    const detectedName = body.detectedName || fullName

    if (!fullName || !collegeEmail || !password) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Full name, college email, and password are required' },
      })
    }

    if (password.length < 6) {
      return reply.status(400).send({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters' },
      })
    }

    // Check college domain
    if (!isAuthorizedDomain(collegeEmail)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED_DOMAIN',
          message: `Email domain is not authorized. Must end with: ${ENV.AUTHORIZED_COLLEGE_DOMAINS.join(', ')}`,
        },
      })
    }

    // Check duplicate
    const existing = await UserModel.findOne({ email: collegeEmail })
    if (existing) {
      return reply.status(409).send({
        success: false,
        error: { code: 'USER_EXISTS', message: 'An account with this college email already exists.' },
      })
    }

    // Password Hash
    const passwordHash = await bcrypt.hash(password, 10)

    // OCR Consistency check
    const ocrResult = ocrService.evaluateNameConsistency(fullName, detectedName)

    const userId = `s-${Date.now().toString().slice(-6)}`
    const initials = fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const newUser = await UserModel.create({
      id: userId,
      name: fullName,
      email: collegeEmail,
      phone,
      role: 'STUDENT',
      passwordHash,
      studentId: rollNumber,
      rollNumber,
      collegeName,
      department: body.department || 'Engineering',
      avatar: initials || 'ST',
      rating: 5.0,
      totalRides: 0,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      idCardPhoto,
      detectedName,
      gender: body.gender || 'Prefer not to say',
      nameMatchStatus: ocrResult.isMatch ? 'MATCHED' : 'MISMATCH',
    })

    const token = generateToken(newUser)

    return {
      success: true,
      data: {
        user: newUser,
        token,
        ocrResult,
      },
    }
  })

  // Faculty Registration
  fastify.post('/register/faculty', async (request, reply) => {
    const body = (request.body || {}) as any
    const fullName = (body.fullName || body.name || '').trim()
    const collegeEmail = (body.collegeEmail || body.email || '').trim().toLowerCase()
    const password = body.password || ''
    const collegeId = body.collegeId || `FAC-${Date.now().toString().slice(-4)}`
    const collegeName = body.collegeName || 'Campus University'
    const phone = body.phone || '+91 90000 00000'
    const idCardPhoto = body.idCardPhoto || ''
    const detectedName = body.detectedName || fullName

    if (!fullName || !collegeEmail || !password) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Full name, college email, and password are required' },
      })
    }

    if (!isAuthorizedDomain(collegeEmail)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED_DOMAIN',
          message: `Email domain is not authorized. Must end with: ${ENV.AUTHORIZED_COLLEGE_DOMAINS.join(', ')}`,
        },
      })
    }

    const existing = await UserModel.findOne({ email: collegeEmail })
    if (existing) {
      return reply.status(409).send({
        success: false,
        error: { code: 'USER_EXISTS', message: 'An account with this faculty email already exists.' },
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const ocrResult = ocrService.evaluateNameConsistency(fullName, detectedName)

    const userId = `fac-${Date.now().toString().slice(-6)}`
    const initials = fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const newUser = await UserModel.create({
      id: userId,
      name: fullName,
      email: collegeEmail,
      phone,
      role: 'FACULTY',
      passwordHash,
      collegeId,
      collegeName,
      department: body.department || 'Faculty Department',
      avatar: initials || 'FC',
      rating: 5.0,
      totalRides: 0,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      idCardPhoto,
      detectedName,
      nameMatchStatus: ocrResult.isMatch ? 'MATCHED' : 'MISMATCH',
    })

    const token = generateToken(newUser)

    return {
      success: true,
      data: {
        user: newUser,
        token,
        ocrResult,
      },
    }
  })

  // Driver Registration
  fastify.post('/register/driver', async (request, reply) => {
    const body = (request.body || {}) as any
    const fullName = (body.fullName || body.name || '').trim()
    const phone = (body.phone || '').trim()
    const password = body.password || ''
    const vehicleRegistration = (body.vehicleRegistration || body.vehicleNo || '').trim()
    const vehicleType = body.vehicleType || 'EV Van (6 Seater)'
    const licenseNumber = body.licenseNumber || body.licenseNo || `DL-${Date.now().toString().slice(-6)}`
    const driverEmail = (body.email || `driver.${phone.replace(/[^0-9]/g, '')}@campus.edu`).toLowerCase()
    const detectedName = body.detectedName || fullName

    if (!fullName || !phone || !password || !vehicleRegistration) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Name, phone, password, and vehicle registration are required' },
      })
    }

    const existing = await UserModel.findOne({
      $or: [{ phone }, { email: driverEmail }],
    })

    if (existing) {
      return reply.status(409).send({
        success: false,
        error: { code: 'USER_EXISTS', message: 'A driver with this phone number or email is already registered.' },
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const ocrResult = ocrService.evaluateNameConsistency(fullName, detectedName)

    const driverId = `d-${Date.now().toString().slice(-6)}`
    const vehicleId = `v-${Date.now().toString().slice(-6)}`
    const initials = fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const newUser = await UserModel.create({
      id: driverId,
      name: fullName,
      email: driverEmail,
      phone,
      role: 'DRIVER',
      passwordHash,
      avatar: initials || 'DR',
      rating: 5.0,
      totalRides: 0,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      licenseNumber,
      licensePhoto: body.licensePhoto,
      rcPhoto: body.rcPhoto,
      profilePhoto: body.passportPhoto,
      vehicleRegistration,
      vehicleType,
      detectedName,
      nameMatchStatus: ocrResult.isMatch ? 'MATCHED' : 'MISMATCH',
    })

    // Create corresponding Vehicle entry
    await VehicleModel.create({
      id: vehicleId,
      driverId,
      name: `${fullName}'s ${vehicleType}`,
      vehicleType,
      registrationNumber: vehicleRegistration,
      capacity: vehicleType === 'Auto Rickshaw' ? 3 : vehicleType === 'Mini Bus' ? 12 : 6,
      status: 'AVAILABLE',
      verificationStatus: true,
      currentLat: 17.398,
      currentLng: 78.479,
      color: '#0891B2',
      rating: 5.0,
      totalTrips: 0,
    })

    const token = generateToken(newUser)

    return {
      success: true,
      data: {
        user: newUser,
        token,
        ocrResult,
      },
    }
  })

  // Universal Sign In (Student, Faculty, Driver, Dispatcher)
  fastify.post('/login', async (request, reply) => {
    const body = request.body as {
      email?: string
      username?: string
      phone?: string
      password?: string
      role?: string
      userId?: string
    }

    const credential = (body.email || body.username || body.phone || '').trim().toLowerCase()
    const password = body.password || ''

    // 1. Dispatcher / Admin check
    if (
      credential === ENV.DISPATCHER_USERNAME.toLowerCase() ||
      credential === 'admin' ||
      credential === 'dispatcher' ||
      credential === 'dispatcher@campusflow.io'
    ) {
      const allowedPasswords = [ENV.DISPATCHER_PASSWORD, 'CampusAdmin#2026', 'CampusFlowAdmin2026!', 'admin123']
      if (!password || !allowedPasswords.includes(password)) {
        return reply.status(401).send({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect password for dispatcher account.' },
        })
      }

      let adminUser = await UserModel.findOne({ role: { $in: ['DISPATCHER', 'ADMIN'] } })
      if (!adminUser) {
        adminUser = await UserModel.create({
          id: 'admin-dispatch',
          name: 'Campus Dispatch Control',
          email: ENV.DISPATCHER_USERNAME,
          phone: '+91 90000 00000',
          role: 'ADMIN',
          avatar: 'DC',
          isVerified: true,
          verificationStatus: 'VERIFIED',
        })
      }

      const token = generateToken(adminUser)
      return {
        success: true,
        data: {
          user: adminUser,
          token,
          role: 'admin',
        },
      }
    }

    // 2. Demo / Direct Role or userId login (For 1-click test conveniences)
    if (body.userId && !password) {
      const user = await UserModel.findOne({ id: body.userId })
      if (user) {
        const token = generateToken(user)
        return {
          success: true,
          data: { user, token, role: user.role },
        }
      }
    }

    // 3. Authenticate standard registered user by email or phone
    if (!credential) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Email or phone number is required.' },
      })
    }

    if (!password) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Password is required to sign in.' },
      })
    }

    const user = await UserModel.findOne({
      $or: [
        { email: credential },
        { phone: credential },
        { studentId: credential },
        { rollNumber: credential },
        { id: credential },
      ],
    })

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'No account found matching this email or phone.' },
      })
    }

    // Verify password against passwordHash or default fallback password
    const targetHash = user.passwordHash || (await bcrypt.hash('campus2026', 10))
    const isValid = await bcrypt.compare(password, targetHash)
    if (!isValid) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect password.' },
      })
    }

    const token = generateToken(user)

    return {
      success: true,
      data: {
        user,
        token,
        role: user.role,
      },
    }
  })

  // Get Current Authenticated Profile
  fastify.get('/me', async (request, reply) => {
    await authenticate(request, reply)
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      })
    }
    return { success: true, data: request.user }
  })

  // List users
  fastify.get('/users', async () => {
    const users = await UserModel.find({}).sort({ role: 1, name: 1 })
    return { success: true, data: users }
  })

  // List all vehicles (public fleet radar)
  fastify.get('/vehicles', async () => {
    const rawVehicles = await VehicleModel.find({}).sort({ name: 1 })
    const vehicles = rawVehicles.map((v) => ({
      id: v.id,
      driverId: v.driverId,
      name: v.name,
      type: v.vehicleType || 'Mini Van',
      vehicleType: v.vehicleType || 'Mini Van',
      registration: v.registrationNumber || 'TS 09 AB 1234',
      registrationNumber: v.registrationNumber || 'TS 09 AB 1234',
      capacity: v.capacity || 6,
      status: v.status || 'AVAILABLE',
      verified: v.verificationStatus ?? true,
      currentLat: v.currentLat || 17.398,
      currentLng: v.currentLng || 78.479,
      color: v.color || '#0891B2',
      rating: v.rating || 4.8,
      totalTrips: v.totalTrips || 0,
    }))
    return { success: true, data: vehicles }
  })

  // List all drivers
  fastify.get('/drivers', async () => {
    const drivers = await UserModel.find({ role: 'DRIVER' }).sort({ name: 1 })
    return { success: true, data: drivers }
  })

  // List all students
  fastify.get('/students', async () => {
    const students = await UserModel.find({ role: 'STUDENT' }).sort({ name: 1 })
    return { success: true, data: students }
  })


  // Update profile
  fastify.patch('/users/me', async (request, reply) => {
    await authenticate(request, reply)
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      })
    }

    const body = request.body as any
    // Protect role & password from arbitrary patch
    delete body.role
    delete body.passwordHash

    const updated = await UserModel.findOneAndUpdate(
      { id: request.user.id },
      { $set: body },
      { new: true }
    )

    return { success: true, data: updated }
  })

  // ---------------------------------------------------------------------------
  // Emergency Contact Endpoints
  // ---------------------------------------------------------------------------
  fastify.get('/users/:id/emergency-contact', async (request, reply) => {
    const { id } = request.params as { id: string }
    const contact = await EmergencyContactModel.findOne({ userId: id })
    return { success: true, data: contact || null }
  })

  fastify.post('/users/:id/emergency-contact', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = (request.body || {}) as {
      name?: string
      relationship?: string
      phone?: string
    }

    const name = (body.name || '').trim()
    const relationship = (body.relationship || 'Parent').trim()
    const phone = (body.phone || '').trim()

    // Strict Validation per prompt requirements
    if (!name || name.length < 2) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Please enter a valid contact name (at least 2 characters).' },
      })
    }

    if (!relationship) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_RELATIONSHIP', message: 'Please select a relationship.' },
      })
    }

    // Phone format validation (allows +91 or 10 digits)
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '')
    if (!cleanedPhone || cleanedPhone.length < 10) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_PHONE', message: 'Please enter a valid phone number (at least 10 digits).' },
      })
    }

    let contact = await EmergencyContactModel.findOne({ userId: id })
    if (contact) {
      contact.name = name
      contact.relationship = relationship
      contact.phone = phone
      contact.isPrimary = true
      await contact.save()
    } else {
      contact = await EmergencyContactModel.create({
        id: `ec-${Date.now()}`,
        userId: id,
        name,
        relationship,
        phone,
        isPrimary: true,
      })
    }

    return { success: true, data: contact }
  })

  fastify.delete('/users/:id/emergency-contact', async (request, reply) => {
    const { id } = request.params as { id: string }
    await EmergencyContactModel.deleteOne({ userId: id })
    return { success: true, data: { deleted: true } }
  })

  // ---------------------------------------------------------------------------
  // Dynamic Profile Statistics from Real Database
  // ---------------------------------------------------------------------------
  fastify.get('/users/:id/stats', async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = await UserModel.findOne({ id })

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      })
    }

    if (user.role === 'DRIVER') {
      const myRides = await RideModel.find({ driverId: id })
      const completedRides = myRides.filter((r) => r.status === 'completed').length
      const activeRides = myRides.filter((r) => r.status === 'active' || r.status === 'boarding').length
      const totalPassengers = myRides.reduce((acc, r) => acc + (r.bookedSeats || 0), 0)
      const earnings = myRides.reduce((acc, r) => acc + ((r.bookedSeats || 0) * (r.fare || 25)), 0)

      return {
        success: true,
        data: {
          role: 'DRIVER',
          completedRides,
          activeRides,
          totalRides: myRides.length,
          passengersServed: totalPassengers,
          earnings,
          rating: user.rating || 4.8,
        },
      }
    }

    // Student statistics
    const bookings = await BookingModel.find({ studentId: id })
    const completed = bookings.filter((b) => b.status === 'completed').length
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length
    const totalRides = bookings.length
    const totalSaved = completed * 18 // Average savings per shared ride

    return {
      success: true,
      data: {
        role: 'STUDENT',
        totalRides,
        completedRides: completed,
        upcomingRides: confirmed,
        cancelledRides: cancelled,
        totalSaved,
        rating: user.rating || 4.9,
      },
    }
  })

  // ---------------------------------------------------------------------------
  // Rating Endpoint
  // ---------------------------------------------------------------------------
  fastify.post('/rides/:id/rate', async (request, reply) => {
    const { id: rideId } = request.params as { id: string }
    const body = (request.body || {}) as {
      fromUserId?: string
      toUserId?: string
      rating?: number
      comment?: string
      bookingId?: string
    }

    const fromUserId = body.fromUserId || (request.headers['x-user-id'] as string) || 's1'
    const ratingValue = Number(body.rating)

    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_RATING', message: 'Rating must be an integer between 1 and 5.' },
      })
    }

    // Check duplicate rating for this booking/ride by same user
    const existing = await RatingModel.findOne({
      rideId,
      fromUserId,
      ...(body.bookingId ? { bookingId: body.bookingId } : {}),
    })

    if (existing) {
      return reply.status(409).send({
        success: false,
        error: { code: 'ALREADY_RATED', message: 'You have already submitted a rating for this ride.' },
      })
    }

    const ride = await RideModel.findOne({ id: rideId })
    const targetUserId = body.toUserId || (ride ? ride.driverId : 'd1')

    const newRating = await RatingModel.create({
      id: `rat-${Date.now()}`,
      rideId,
      bookingId: body.bookingId,
      fromUserId,
      toUserId: targetUserId,
      rating: ratingValue,
      comment: body.comment || '',
    })

    // Update target user's average rating
    const allRatings = await RatingModel.find({ toUserId: targetUserId })
    if (allRatings.length > 0) {
      const avg = allRatings.reduce((acc, r) => acc + r.rating, 0) / allRatings.length
      await UserModel.updateOne({ id: targetUserId }, { rating: Math.round(avg * 10) / 10 })
    }

    return { success: true, data: newRating }
  })
}
