import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600'
  if (score >= 65) return 'text-amber-600'
  return 'text-red-500'
}

export function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-green-50 border-green-200 text-green-700'
  if (score >= 65) return 'bg-amber-50 border-amber-200 text-amber-700'
  return 'bg-red-50 border-red-200 text-red-600'
}

export function getSeatColor(filled: number, total: number): string {
  const pct = filled / total
  if (pct >= 1.0) return 'bg-slate-400'
  if (pct >= 0.8) return 'bg-amber-500'
  return 'bg-primary-500'
}

export function getRideStatusBadge(status: string): string {
  switch (status) {
    case 'waiting':   return 'badge-blue'
    case 'boarding':  return 'badge-yellow'
    case 'active':    return 'badge-green'
    case 'full':      return 'badge-slate'
    case 'completed': return 'badge-slate'
    case 'cancelled': return 'badge-red'
    default:          return 'badge-slate'
  }
}

export function getRideStatusLabel(status: string): string {
  switch (status) {
    case 'waiting':   return 'Waiting'
    case 'boarding':  return 'Boarding'
    case 'active':    return 'On Route'
    case 'full':      return 'Full'
    case 'completed': return 'Completed'
    case 'cancelled': return 'Cancelled'
    default:          return status
  }
}

export function getAvatarColor(initials: string): string {
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-violet-100 text-violet-700',
    'bg-green-100 text-green-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-indigo-100 text-indigo-700',
    'bg-teal-100 text-teal-700',
    'bg-orange-100 text-orange-700',
  ]
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length
  return colors[idx]
}

export function compressImage(dataUrl: string, maxWidth = 1000, maxHeight = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      } else {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
