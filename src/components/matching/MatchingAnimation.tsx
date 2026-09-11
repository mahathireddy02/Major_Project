import { useEffect, useState } from 'react'
import { Search, MapPin, Route, Clock, Users, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

const steps = [
  { icon: Search,    text: 'Finding nearby rides...',       color: 'text-primary-600' },
  { icon: Route,     text: 'Checking route compatibility...', color: 'text-violet-600' },
  { icon: Users,     text: 'Checking available seats...',   color: 'text-green-600' },
  { icon: MapPin,    text: 'Optimizing pickup sequence...', color: 'text-amber-600' },
  { icon: Sparkles,  text: 'Calculating match scores...',   color: 'text-primary-600' },
]

interface MatchingAnimationProps {
  onComplete: () => void
  duration?: number
}

export default function MatchingAnimation({ onComplete, duration = 2800 }: MatchingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState<number[]>([])

  useEffect(() => {
    const interval = duration / steps.length
    const timers: ReturnType<typeof setTimeout>[] = []

    steps.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setCurrentStep(i)
          if (i > 0) setDone((d) => [...d, i - 1])
        }, i * interval)
      )
    })

    timers.push(
      setTimeout(() => {
        setDone([0, 1, 2, 3, 4])
        onComplete()
      }, duration)
    )

    return () => timers.forEach(clearTimeout)
  }, [onComplete, duration])

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {/* Spinning outer ring */}
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
        <div className="absolute inset-2 rounded-full bg-primary-50 flex items-center justify-center">
          <Sparkles size={24} className="text-primary-600 animate-pulse" />
        </div>
      </div>

      <h3 className="font-heading font-semibold text-slate-900 mb-1 text-center">
        Matching Ride
      </h3>
      <p className="text-sm text-slate-500 mb-8 text-center">
        Our engine is analysing {' '}
        <span className="font-semibold text-primary-600">86 active rides</span>
      </p>

      <div className="w-full max-w-xs space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isDone = done.includes(i)
          const isActive = currentStep === i && !isDone

          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300',
                isDone  ? 'bg-green-50 border border-green-200' :
                isActive ? 'bg-primary-50 border border-primary-200' :
                           'bg-slate-50 border border-slate-100 opacity-40'
              )}
            >
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                isDone   ? 'bg-green-100' :
                isActive ? 'bg-primary-100' : 'bg-slate-100'
              )}>
                {isDone ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <Icon size={15} className={isActive ? step.color : 'text-slate-400'} />
                )}
              </div>
              <span className={cn(
                'text-sm font-medium',
                isDone   ? 'text-green-700' :
                isActive ? 'text-slate-800' : 'text-slate-400'
              )}>
                {step.text}
              </span>
              {isActive && (
                <div className="ml-auto flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <div
                      key={d}
                      className="w-1 h-1 rounded-full bg-primary-400 animate-bounce"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
