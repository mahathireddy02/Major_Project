import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { ENV } from '../config/env.js'
import { UserModel, IUser, UserRole } from '../models/User.js'

export interface AuthJwtPayload {
  userId: string
  role: UserRole
  email: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: IUser
  }
}

export function generateToken(user: { id: string; role: UserRole; email: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): AuthJwtPayload | null {
  try {
    return jwt.verify(token, ENV.JWT_SECRET) as AuthJwtPayload
  } catch {
    return null
  }
}

/**
 * Authentication middleware: Reads Bearer token or demo headers and populates request.user
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  let userId: string | undefined

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (decoded) {
      userId = decoded.userId
    }
  }

  // Fallback to demo headers for developer/demo workflows
  if (!userId) {
    userId = (request.headers['x-user-id'] as string) || (request.headers['x-driver-id'] as string)
  }

  if (userId) {
    const user = await UserModel.findOne({ id: userId })
    if (user) {
      request.user = user
      return
    }
  }
}

/**
 * RBAC authorization guard: Ensures user is authenticated and possesses one of the allowed roles
 */
export function requireRoles(allowedRoles: (UserRole | string)[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Run authentication first if not already run
    if (!request.user) {
      await authenticate(request, reply)
    }

    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required to access this resource.' },
      })
    }

    const userRole = (request.user.role || '').toUpperCase()
    const normalizedAllowed = allowedRoles.map((r) => {
      const u = r.toUpperCase()
      return u === 'ADMIN' ? 'DISPATCHER' : u
    })
    // Allow DISPATCHER and ADMIN interchangeably
    if (userRole === 'ADMIN') normalizedAllowed.push('ADMIN', 'DISPATCHER')
    if (userRole === 'DISPATCHER') normalizedAllowed.push('ADMIN', 'DISPATCHER')

    const isMatch =
      normalizedAllowed.includes(userRole) ||
      (userRole === 'STUDENT' && normalizedAllowed.includes('FACULTY')) ||
      (userRole === 'FACULTY' && normalizedAllowed.includes('STUDENT'))

    if (!isMatch) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role ${request.user.role} is not authorized for this action. Required: ${allowedRoles.join(', ')}`,
        },
      })
    }
  }
}
