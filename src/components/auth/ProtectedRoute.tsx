import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import type { UserRole } from '../../types'

interface ProtectedRouteProps {
  allowedRoles: UserRole[]
  children?: React.ReactNode
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const role = useAppStore((s) => s.role)
  const token = useAppStore((s) => s.token)
  const location = useLocation()

  // Map admin / dispatcher
  const currentRole = role === 'admin' ? 'admin' : role

  const isAuthorized = allowedRoles.includes(currentRole as UserRole) || (allowedRoles.includes('admin') && role === 'admin')

  if (!isAuthorized) {
    console.warn(`[ProtectedRoute] Unauthorized access attempt to ${location.pathname} by role ${role}. Redirecting.`)
    
    // Role-specific redirect
    if (role === 'student' || role === 'faculty') {
      return <Navigate to="/student/home" replace />
    } else if (role === 'driver') {
      return <Navigate to="/driver/dashboard" replace />
    } else if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    return <Navigate to="/auth/portal" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
