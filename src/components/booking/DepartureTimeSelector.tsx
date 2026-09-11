import React, { useState, useEffect } from 'react'
import { Clock, Zap, Edit3 } from 'lucide-react'

interface DepartureTimeSelectorProps {
  value: string
  onChange: (timeStr: string) => void
  error?: string
  className?: string
}

/**
 * Format current local time as "hh:mm A/PM" (e.g. "08:05 PM")
 */
export function getCurrentRealTime(): string {
  const d = new Date()
  let hours = d.getHours()
  const minutes = d.getMinutes()
  const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const hourStr = hours < 10 ? `0${hours}` : `${hours}`
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`
  return `${hourStr}:${minStr} ${period}`
}

/**
 * Parse time string like "08:05 PM" or "8:5 PM" or "20:05" into structured components
 */
export function parseTimeParts(timeStr: string): { hours: string; minutes: string; period: 'AM' | 'PM' } {
  if (!timeStr) {
    const curr = getCurrentRealTime()
    return parseTimeParts(curr)
  }

  const match12 = timeStr.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)?$/i)
  if (match12) {
    let h = parseInt(match12[1], 10)
    let m = parseInt(match12[2], 10)
    let p: 'AM' | 'PM' = (match12[3]?.toUpperCase() as 'AM' | 'PM') || 'AM'

    if (!match12[3] && h >= 12) {
      p = 'PM'
      h = h % 12 || 12
    } else if (h === 0) {
      h = 12
    } else if (h > 12) {
      p = 'PM'
      h = h % 12 || 12
    }

    if (isNaN(m) || m < 0) m = 0
    if (m > 59) m = 59

    const hStr = h < 10 ? `0${h}` : `${h}`
    const mStr = m < 10 ? `0${m}` : `${m}`
    return { hours: hStr, minutes: mStr, period: p }
  }

  const curr = getCurrentRealTime()
  return parseTimeParts(curr)
}

export const DepartureTimeSelector: React.FC<DepartureTimeSelectorProps> = ({
  value,
  onChange,
  error,
  className = '',
}) => {
  const [isRealTime, setIsRealTime] = useState(true)

  // Parse current value into hours, minutes, period
  const initialParts = parseTimeParts(value || getCurrentRealTime())
  const [hoursInput, setHoursInput] = useState<string>(initialParts.hours)
  const [minutesInput, setMinutesInput] = useState<string>(initialParts.minutes)
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialParts.period)

  // Keep value synced with current local time when in Real-Time mode
  useEffect(() => {
    if (isRealTime) {
      const now = getCurrentRealTime()
      const parts = parseTimeParts(now)
      setHoursInput(parts.hours)
      setMinutesInput(parts.minutes)
      setPeriod(parts.period)
      onChange(now)

      const interval = setInterval(() => {
        const updatedNow = getCurrentRealTime()
        const updatedParts = parseTimeParts(updatedNow)
        setHoursInput(updatedParts.hours)
        setMinutesInput(updatedParts.minutes)
        setPeriod(updatedParts.period)
        onChange(updatedNow)
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [isRealTime])

  // Sync state if external value changes while in manual mode
  useEffect(() => {
    if (!isRealTime && value) {
      const parts = parseTimeParts(value)
      setHoursInput(parts.hours)
      setMinutesInput(parts.minutes)
      setPeriod(parts.period)
    }
  }, [value, isRealTime])

  const handleSelectRealTime = () => {
    setIsRealTime(true)
    const now = getCurrentRealTime()
    const parts = parseTimeParts(now)
    setHoursInput(parts.hours)
    setMinutesInput(parts.minutes)
    setPeriod(parts.period)
    onChange(now)
  }

  const handleSelectManual = () => {
    setIsRealTime(false)
    const current = value || getCurrentRealTime()
    const parts = parseTimeParts(current)
    setHoursInput(parts.hours)
    setMinutesInput(parts.minutes)
    setPeriod(parts.period)
    onChange(`${parts.hours}:${parts.minutes} ${parts.period}`)
  }

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
    setHoursInput(raw)

    if (raw !== '') {
      let num = parseInt(raw, 10)
      if (num > 12) num = 12
      if (num >= 1 && (raw.length === 2 || num > 1)) {
        const formattedH = num < 10 ? `0${num}` : `${num}`
        onChange(`${formattedH}:${minutesInput || '00'} ${period}`)
      }
    }
  }

  const handleHoursBlur = () => {
    let num = parseInt(hoursInput, 10)
    if (isNaN(num) || num < 1) num = 12
    if (num > 12) num = 12
    const formattedH = num < 10 ? `0${num}` : `${num}`
    setHoursInput(formattedH)
    onChange(`${formattedH}:${minutesInput || '00'} ${period}`)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
    setMinutesInput(raw)

    if (raw !== '') {
      let num = parseInt(raw, 10)
      if (num > 59) num = 59
      if (raw.length === 2) {
        const formattedM = num < 10 ? `0${num}` : `${num}`
        onChange(`${hoursInput || '12'}:${formattedM} ${period}`)
      }
    }
  }

  const handleMinutesBlur = () => {
    let num = parseInt(minutesInput, 10)
    if (isNaN(num) || num < 0) num = 0
    if (num > 59) num = 59
    const formattedM = num < 10 ? `0${num}` : `${num}`
    setMinutesInput(formattedM)
    onChange(`${hoursInput || '12'}:${formattedM} ${period}`)
  }

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    setPeriod(newPeriod)
    onChange(`${hoursInput || '12'}:${minutesInput || '00'} ${newPeriod}`)
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
            onClick={handleSelectRealTime}
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
            onClick={handleSelectManual}
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
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50/60 text-sm font-semibold text-blue-700 shadow-2xs">
          <Zap size={14} className="text-blue-500 shrink-0" />
          <span>Departing Now · {value || getCurrentRealTime()}</span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center gap-1.5">
            {/* Hours Input */}
            <div className="flex flex-col items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hr</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={hoursInput}
                onChange={handleHoursChange}
                onBlur={handleHoursBlur}
                placeholder="12"
                className="w-12 h-10 text-center text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Fixed Non-Editable Colon */}
            <div className="flex flex-col items-center justify-end pb-1.5">
              <span className="font-extrabold text-slate-600 select-none text-xl leading-none">:</span>
            </div>

            {/* Minutes Input */}
            <div className="flex flex-col items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Min</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={minutesInput}
                onChange={handleMinutesChange}
                onBlur={handleMinutesBlur}
                placeholder="00"
                className="w-12 h-10 text-center text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* AM / PM Toggle Selector */}
            <div className="flex flex-col items-center ml-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Period</label>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-10 items-center">
                <button
                  type="button"
                  onClick={() => handlePeriodChange('AM')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    period === 'AM'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handlePeriodChange('PM')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    period === 'PM'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Time Preview Badge */}
          <div className="text-right pr-1">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Scheduled</span>
            <span className="text-sm font-extrabold text-blue-700 font-mono tracking-tight">
              {hoursInput || '12'}:{minutesInput || '00'} {period}
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default DepartureTimeSelector
