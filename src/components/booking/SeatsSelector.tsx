import React from 'react'
import { Users, ChevronUp, ChevronDown } from 'lucide-react'

interface SeatsSelectorProps {
  value: number
  onChange: (seats: number) => void
  min?: number
  max?: number
  label?: string
  className?: string
}

export const SeatsSelector: React.FC<SeatsSelectorProps> = ({
  value,
  onChange,
  min = 1,
  max = 20,
  label = 'Seats Needed',
  className = '',
}) => {
  const [inputValue, setInputValue] = React.useState<string>(String(value || 1))

  React.useEffect(() => {
    setInputValue(String(value || 1))
  }, [value])

  const handleIncrement = () => {
    const nextVal = Math.min(max, (value || 1) + 1)
    onChange(nextVal)
    setInputValue(String(nextVal))
  }

  const handleDecrement = () => {
    const nextVal = Math.max(min, (value || 1) - 1)
    onChange(nextVal)
    setInputValue(String(nextVal))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '')
    setInputValue(cleaned)
    if (cleaned !== '') {
      const parsed = parseInt(cleaned, 10)
      if (!isNaN(parsed) && parsed >= min) {
        onChange(Math.min(max, parsed))
      }
    }
  }

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10)
    if (isNaN(parsed) || parsed < min) {
      onChange(min)
      setInputValue(String(min))
    } else if (parsed > max) {
      onChange(max)
      setInputValue(String(max))
    } else {
      onChange(parsed)
      setInputValue(String(parsed))
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-purple-500" />
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="1"
          className="input-field w-full pr-10 py-2.5 text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs transition-all"
        />

        {/* Up / Down Controls */}
        <div className="absolute right-1.5 flex flex-col items-center justify-center -space-y-0.5 border-l border-slate-100 pl-1">
          <button
            type="button"
            onClick={handleIncrement}
            className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors cursor-pointer"
            title="Increase seat count"
            aria-label="Increase seat count"
          >
            <ChevronUp size={14} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            disabled={value <= min}
            className={`p-1 rounded transition-colors cursor-pointer ${
              value <= min
                ? 'text-slate-200 cursor-not-allowed'
                : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
            }`}
            title="Decrease seat count"
            aria-label="Decrease seat count"
          >
            <ChevronDown size={14} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        {value === 1 ? '1 seat for yourself' : `${value} seats needed`}
      </p>
    </div>
  )
}

export default SeatsSelector
