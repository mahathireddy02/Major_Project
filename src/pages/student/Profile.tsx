import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import {
  Star, Shield, CheckCircle, MapPin, Car, TrendingUp, Phone, User,
  HeartHandshake, Edit2, Trash2, Plus, X, AlertCircle
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { api } from '../../services/api'
import type { EmergencyContact, UserStats } from '../../types'
import toast from 'react-hot-toast'

export default function StudentProfile() {
  const currentStudentStore = useAppStore((s) => s.currentStudent())
  const currentUser = useAppStore((s) => s.currentUser)
  const currentStudentId = useAppStore((s) => s.currentStudentId)
  const student = currentUser || currentStudentStore

  // Dynamic states
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loadingContact, setLoadingContact] = useState(true)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [contactName, setContactName] = useState('')
  const [relationship, setRelationship] = useState('Parent')
  const [contactPhone, setContactPhone] = useState('')
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Fetch real backend data
  useEffect(() => {
    if (!currentStudentId) return
    let isMounted = true

    const loadData = async () => {
      try {
        const [contact, userStats] = await Promise.all([
          api.getEmergencyContact(currentStudentId).catch(() => null),
          api.getUserStats(currentStudentId).catch(() => null),
        ])
        if (isMounted) {
          if (contact) setEmergencyContact(contact)
          if (userStats) setStats(userStats)
          setLoadingContact(false)
        }
      } catch (err) {
        console.warn('Could not load profile backend data:', err)
        if (isMounted) setLoadingContact(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [currentStudentId])

  const openAddEditModal = () => {
    if (emergencyContact) {
      setContactName(emergencyContact.name)
      setRelationship(emergencyContact.relationship)
      setContactPhone(emergencyContact.phone)
    } else {
      setContactName('')
      setRelationship('Parent')
      setContactPhone('')
    }
    setModalErrors({})
    setIsModalOpen(true)
  }

  const validateModal = () => {
    const errors: Record<string, string> = {}
    if (!contactName.trim() || contactName.trim().length < 2) {
      errors.name = 'Please enter a valid full name (at least 2 characters)'
    }
    if (!relationship.trim()) {
      errors.relationship = 'Please select a relationship'
    }
    const cleanPhone = contactPhone.replace(/^\+91/, '')
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit phone number'
    }
    setModalErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateModal()) return

    setSaving(true)
    try {
      const saved = await api.saveEmergencyContact(currentStudentId, {
        name: contactName.trim(),
        relationship: relationship.trim(),
        phone: contactPhone.trim(),
      })
      setEmergencyContact(saved)
      setIsModalOpen(false)
      toast.success('Emergency contact saved successfully!', { icon: '🛡️' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to save emergency contact')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteContact = async () => {
    if (!window.confirm('Are you sure you want to remove this emergency contact?')) return
    try {
      await api.deleteEmergencyContact(currentStudentId)
      setEmergencyContact(null)
      toast.success('Emergency contact removed')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete emergency contact')
    }
  }

  if (!student) return null

  const displayTotalRides = stats?.totalRides ?? student.totalRides ?? 0
  const displayRating = stats?.rating ?? student.rating ?? 4.9
  const displayTotalSaved = stats?.totalSaved ?? (displayTotalRides * 18)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-12">
      <h1 className="font-heading font-bold text-2xl text-slate-900 mb-5">Profile</h1>

      {/* Profile hero */}
      <Card padding="lg" className="mb-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-5">
          <Avatar name={student.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-bold text-xl text-slate-900 truncate">{student.name}</h2>
              <Badge variant="green">
                <CheckCircle size={11} /> Verified
              </Badge>
            </div>
            <p className="text-sm text-slate-500 font-mono">{student.rollNumber || (student as any).studentId || 'ID Verified'}</p>
            <p className="text-sm text-slate-500">
              {student.collegeName || 'SRI INDU College'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: displayTotalRides, label: 'Total Rides' },
            { value: stats?.completedRides ?? (student as any).completedRides ?? displayTotalRides, label: 'Completed' },
            { value: stats?.cancelledRides ?? (student as any).cancelledRides ?? 0, label: 'Cancelled' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center shadow-2xs">
              <p className="font-heading font-bold text-slate-900 text-base">{value}</p>
              <p className="text-[10px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Emergency Contact Section */}
      <Card padding="md" className="mb-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-rose-500" />
            <h3 className="font-heading font-semibold text-slate-900 text-sm">Emergency SOS Contact</h3>
          </div>
          {emergencyContact ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={openAddEditModal}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Edit Contact"
              >
                <Edit2 size={13} />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteContact}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Remove Contact"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={openAddEditModal} className="text-xs gap-1 border-rose-200 text-rose-600 hover:bg-rose-50">
              <Plus size={13} /> Add Contact
            </Button>
          )}
        </div>

        {emergencyContact ? (
          <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 text-sm">{emergencyContact.name}</p>
                <Badge variant="blue" size="sm">
                  {emergencyContact.relationship}
                </Badge>
              </div>
              <p className="text-xs font-mono text-slate-600 flex items-center gap-1.5">
                <Phone size={11} className="text-rose-500" />
                {emergencyContact.phone}
              </p>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Active SOS
            </span>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-1.5">
            <p className="text-xs font-semibold text-slate-700">No emergency contact configured</p>
            <p className="text-[11px] text-slate-500">
              In case of an SOS alert during a trip, Campus Mobility will notify campus security and dispatch live tracking alerts to your contact.
            </p>
          </div>
        )}
      </Card>

      {/* Verification Status List */}
      <Card padding="md" className="mb-4 border border-slate-200 shadow-sm">
        <h3 className="font-heading font-semibold text-slate-800 text-sm mb-3">Safety & Verification</h3>
        <div className="space-y-2">
          {[
            { label: 'Student ID verified', verified: true },
            { label: 'Phone verified', verified: true },
            { label: 'University email verified', verified: true },
            {
              label: 'Emergency contact added',
              verified: !!emergencyContact,
              actionLabel: emergencyContact ? 'Configured' : 'Add',
              onClick: openAddEditModal,
            },
          ].map(({ label, verified, actionLabel, onClick }) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    verified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {verified ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                </div>
                <p className="text-sm text-slate-700 font-medium">{label}</p>
              </div>

              {actionLabel && (
                <button
                  type="button"
                  onClick={onClick}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    verified
                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  {actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Details */}
      <Card padding="md" className="border border-slate-200 shadow-sm">
        <h3 className="font-heading font-semibold text-slate-800 text-sm mb-3">Academic & Contact Details</h3>
        <div className="space-y-3">
          {[
            { label: 'College', value: student.collegeName || 'SRI INDU College of Engineering' },
            { label: 'Gender', value: student.gender || '—' },
            { label: 'Phone', value: student.phone || '—' },
            { label: 'College Email', value: student.email || '—' },
            { label: 'Roll / Hall Ticket No', value: student.rollNumber || (student as any).studentId || '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 text-sm"
            >
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit Emergency Contact Modal                                 */}
      {/* ------------------------------------------------------------------ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-500" />
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  {emergencyContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3.5">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Contact Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sharma"
                  value={contactName}
                  onChange={(e) => {
                    setContactName(e.target.value)
                    setModalErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  className={`input-field text-sm ${modalErrors.name ? 'border-rose-500 bg-rose-50/30' : ''}`}
                />
                {modalErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{modalErrors.name}</p>
                )}
              </div>

              {/* Relationship */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="input-field text-sm cursor-pointer"
                >
                  <option value="Parent">Parent</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Friend">Friend</option>
                  <option value="Hostel Warden">Hostel Warden</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-sm font-semibold text-slate-600 select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={contactPhone.replace(/^\+91/, '')}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setContactPhone('+91' + digits)
                      setModalErrors((prev) => ({ ...prev, phone: '' }))
                    }}
                    className={`input-field rounded-l-none text-sm flex-1 ${modalErrors.phone ? 'border-rose-500 bg-rose-50/30' : ''}`}
                  />
                </div>
                {contactPhone.replace(/^\+91/, '').length > 0 && contactPhone.replace(/^\+91/, '').length < 10 && (
                  <p className="text-[10px] text-red-500 mt-0.5">Must be exactly 10 digits</p>
                )}
                {modalErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{modalErrors.phone}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Emergency Contact'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

