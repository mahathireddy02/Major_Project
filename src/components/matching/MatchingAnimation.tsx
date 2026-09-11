import { useEffect, useState } from 'react'
import { Search, MapPin, Route, Users, Sparkles } from 'lucide-react'

const steps = [
  { icon: Search,   text: 'Finding nearby rides...',        color: '#4f46e5' },
  { icon: Route,    text: 'Checking route compatibility...', color: '#7c3aed' },
  { icon: Users,    text: 'Checking available seats...',    color: '#16a34a' },
  { icon: MapPin,   text: 'Optimizing pickup sequence...',  color: '#d97706' },
  { icon: Sparkles, text: 'Calculating match scores...',    color: '#4f46e5' },
]

// ms each phase lasts
const ENTER_MS    = 350   // slide in from right
const PROGRESS_MS = 700   // progress bar fills 0→100%
const EXIT_MS     = 350   // slide out to left

interface MatchingAnimationProps {
  onComplete: () => void
  duration?: number
}

type SlidePhase = 'enter' | 'progress' | 'exit' | 'idle'

export default function MatchingAnimation({ onComplete }: MatchingAnimationProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [phase, setPhase]         = useState<SlidePhase>('idle')
  const [progress, setProgress]   = useState(0)

  useEffect(() => {
    let cancelled = false

    const run = async (i: number) => {
      if (cancelled || i >= steps.length) return

      setStepIndex(i)
      setProgress(0)

      // 1. Slide in from right
      setPhase('enter')
      await delay(ENTER_MS)
      if (cancelled) return

      // 2. Progress bar fills to 100%
      setPhase('progress')
      // Animate progress 0 → 100 in small ticks
      const ticks = 20
      const tickMs = PROGRESS_MS / ticks
      for (let t = 1; t <= ticks; t++) {
        await delay(tickMs)
        if (cancelled) return
        setProgress(Math.round((t / ticks) * 100))
      }

      // 3. Slide out to left
      setPhase('exit')
      await delay(EXIT_MS)
      if (cancelled) return

      setPhase('idle')
      await delay(60)
      if (cancelled) return

      if (i + 1 < steps.length) {
        run(i + 1)
      } else {
        onComplete()
      }
    }

    // tiny mount delay so first enter transition is visible
    const t = setTimeout(() => run(0), 80)
    return () => { cancelled = true; clearTimeout(t) }
  }, [onComplete])

  const step = steps[stepIndex]
  const Icon = step.icon

  const slideStyle: React.CSSProperties =
    phase === 'enter' ? { animation: `stepEnter ${ENTER_MS}ms cubic-bezier(0.22,1,0.36,1) forwards` } :
    phase === 'exit'  ? { animation: `stepExit  ${EXIT_MS}ms  cubic-bezier(0.55,0,1,0.45)    forwards` } :
    phase === 'progress' ? { transform: 'translateX(0)', opacity: 1 } :
    { opacity: 0 }

  return (
    <>
      <style>{`
        @keyframes stepEnter {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes stepExit {
          from { transform: translateX(0);     opacity: 1; }
          to   { transform: translateX(-110%); opacity: 0; }
        }
      `}</style>

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
          Our engine is analysing{' '}
          <span className="font-semibold text-primary-600">86 active rides</span>
        </p>

        {/* Slide stage — overflow hidden clips the entering/exiting card */}
        <div className="w-full max-w-xs overflow-hidden">
          <div style={slideStyle}>
            {phase !== 'idle' && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
                {/* Icon + label row */}
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} style={{ color: step.color }} />
                  </div>
                  <span className="text-sm font-medium text-slate-800 flex-1">{step.text}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: step.color }}>
                    {progress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-primary-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: step.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
