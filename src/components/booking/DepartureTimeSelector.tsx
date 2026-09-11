import React, { useState, useEffect } from 'react'
import { Clock, Zap, Edit3, Check } from 'lucide-react'

interface DepartureTimeSelectorProps {
  value: string
  onChange: (timeStr: string) => void
  error?: string
  className?: string
}

/**
 * Format current local time as "h:mm A/PM" e.g., "9:16 AM"
 */
export function getCurrentRealTime(): string {
  const d = new Date()
  let hours = d.getHours()
  const minutes = d.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`
  return `${hours}:${minStr} ${period}`
}

/**
 * Convert 24h "HH:MM" input string to 12h "h:mm AM/PM"
 */
export function convert24To12(time24: string): string {
  if (!time24) return ''
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr, 10)
  if (isNaN(h)) return time24
  const period = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  h = h ? h : 12
  return `${h}:${mStr} ${period}`
}

/**
 * Generate standard 15-min interval time slots for quick selection
 */
function generatePresetSlots(): string[] {
  const slots: string[] = []
  for (let hour = 6; hour <= 22; hour++) {
    for (const min of [0, 15, 30, 45]) {
      const period = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const displayMin = min === 0 ? '00' : String(min)
      slots.push(`${displayHour}:${displayMin} ${period}`)
    }
  }
  return slots
}

const PRESET_SLOTS = generatePresetSlots()

export const DepartureTimeSelector: React.FC<DepartureTimeSelectorProps> = ({
  value,
  onChange,
  error,
  className = '',
}) => {
  const [isRealTime, setIsRealTime] = useState(true)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customTimeInput, setCustomTimeInput] = useState('')

  const currentRealTime = getCurrentRealTime()

  // Keep value in sync when real-time mode is active
  useEffect(() => {
    if (isRealTime) {
      onChange(getCurrentRealTime())
      const interval = setInterval(() => onChange(getCurrentRealTime()), 60000)
      return () => clearInterval(interval)
    }
  }, [isRealTime])

  const handleSelectPreset = (slot: string) => {
    if (slot === 'CUSTOM') {
      setIsCustomMode(true)
      return
    }
    setIsCustomMode(false)
    onChange(slot)
  }

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val24 = e.target.value
    setCustomTimeInput(val24)
    if (val24) onChange(convert24To12(val24))
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-blue-600" />
          Departure Time
        </label>
        {/* Real Time / Manual toggle */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => { setIsRealTime(true); setIsCustomMode(false) }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isRealTime
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Zap size={11} />
            Real Time (Now)
          </button>
          <button
            type="button"
            onClick={() => setIsRealTime(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              !isRealTime
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Edit3 size={11} />
            Manual
          </button>
        </div>
      </div>

      {isRealTime ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50/60 text-sm font-semibold text-blue-700">
          <Zap size={14} className="text-blue-500" />
          Departing Now · {currentRealTime}
        </div>
      ) : !isCustomMode ? (
        <select
          value={value}
          onChange={(e) => handleSelectPreset(e.target.value)}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${
            error ? 'border-red-400' : 'border-slate-200'
          }`}
        >
          <option value="">Select departure time...</option>
          {PRESET_SLOTS.map((slot) => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
          <option value="CUSTOM">✏️ Enter Custom Time...</option>
        </select>
      ) : (
        <div className="flex items-center gap-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-200">
          <div className="flex-1">
            <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Custom Time:</label>
            <input
              type="time"
              value={customTimeInput}
              onChange={handleCustomTimeChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Selected:</span>
            <span className="text-sm font-bold text-blue-700">{value || 'None'}</span>
            <button type="button" onClick={() => setIsCustomMode(false)} className="text-[11px] text-slate-500 underline block mt-1 hover:text-slate-800 cursor-pointer">Back to List</button>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default DepartureTimeSelector
