import { useEffect, useState } from 'react'
import { Check, Mic, Send, ShieldCheck } from 'lucide-react'
import './meeting-animation.css'

/** How long each stage (Capture -> Review -> Deliver) stays on screen. */
export const STAGE_MS = 5200

/**
 * Drives the 3-stage loop. Returns [stage, setStage].
 * The timer restarts whenever the stage changes, so clicking a step
 * gives that stage a full slot before the loop moves on.
 */
export function useStageClock(ms = STAGE_MS) {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const id = setTimeout(() => setStage((s) => (s + 1) % 3), ms)
    return () => clearTimeout(id)
  }, [stage, ms])
  return [stage, setStage]
}

/* ------------------------------------------------------------------ */
/* Background: sound ripples spreading out from the right edge         */
/* ------------------------------------------------------------------ */
export function Ripples() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-[450px] top-1/2 h-[900px] w-[900px] -translate-y-1/2">
        <div className="lm-breathe absolute inset-[300px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16),transparent_65%)]" />
        {[0, -3, -6].map((d) => (
          <div
            key={d}
            className="lm-ripple absolute inset-0 rounded-full border border-sky-300/15"
            style={{ '--delay': `${d}s` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step rail: Capture / Review / Deliver, highlighted by current stage */
/* ------------------------------------------------------------------ */
export function PipelineSteps({ steps, stage, onSelect }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-4">
      {steps.map(([Icon, title, sub], i) => {
        const active = i === stage
        const done = i < stage
        return (
          <div key={title} className="flex items-center gap-3">
            {i > 0 && (
              <span className="relative hidden h-px w-6 overflow-hidden bg-white/15 xl:block">
                <span
                  className={`absolute inset-0 origin-left bg-sky-400/70 transition-transform duration-700 ${
                    stage >= i ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </span>
            )}
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? 'step' : undefined}
              className="flex items-center gap-3 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
            >
              <span
                className={`relative grid h-11 w-11 place-items-center rounded-xl border transition-all duration-500 ${
                  active
                    ? 'border-sky-400/50 bg-sky-400/15 text-sky-300 shadow-[0_0_0_6px_rgba(56,189,248,0.08)]'
                    : done
                      ? 'border-white/15 bg-white/10 text-slate-200'
                      : 'border-white/10 bg-white/5 text-slate-400'
                }`}
              >
                <Icon size={18} />
                {active && <span className="lm-ping absolute inset-0 rounded-xl border border-sky-400/50" />}
              </span>
              <span>
                <span
                  className={`block text-sm font-semibold transition-colors duration-500 ${
                    active ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {title}
                </span>
                <span className="block text-xs text-slate-400">{sub}</span>
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* The animated "meeting" card                                         */
/* ------------------------------------------------------------------ */
const TRANSCRIPT = [
  ['Priya', "Let's lock the launch date for the 24th."],
  ['Omar', "I'll send the revised budget by Friday."],
  ['Ayesha', 'Design review moves to Monday.'],
]

const ACTIONS = [
  { text: 'Lock launch date', who: 'PS', due: '24 Oct' },
  { text: 'Send revised budget', who: 'OK', due: 'Fri' },
  { text: 'Move design review', who: 'AK', due: 'Mon' },
]

const BARS = Array.from({ length: 48 }, (_, i) => {
  const env = 0.5 + 0.5 * Math.sin((i / 47) * Math.PI) // taller in the middle
  return {
    dur: 0.6 + ((i * 7) % 9) * 0.09,
    delay: -(((i * 5) % 11) * 0.13),
    hi: Math.min(1, (0.45 + ((i * 13) % 6) * 0.11) * (0.6 + env * 0.6)),
    lo: 0.12 + ((i * 3) % 4) * 0.04,
  }
})

function Capture() {
  const [sec, setSec] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const t = 754 + sec
  const clock = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`

  return (
    <>
      <div className="flex items-center gap-2.5 text-xs">
        <span className="lm-rec h-2 w-2 rounded-full bg-red-400" />
        <span className="font-mono font-medium uppercase tracking-[0.18em] text-red-300">Rec</span>
        <span className="text-slate-300">Weekly planning</span>
        <Mic size={13} className="ml-1 text-slate-500" />
        <span className="ml-auto font-mono tabular-nums text-slate-400">{clock}</span>
      </div>

      <div className="mt-2.5 flex h-6 items-center justify-between">
        {BARS.map((b, i) => (
          <span
            key={i}
            className="lm-bar h-full w-[3px] rounded-full bg-sky-400/80"
            style={{ '--dur': `${b.dur}s`, '--delay': `${b.delay}s`, '--hi': b.hi, '--lo': b.lo }}
          />
        ))}
      </div>

      <ul className="mt-2.5 space-y-1 text-xs leading-[17px]">
        {TRANSCRIPT.map(([who, line], i) => (
          <li key={who} className="lm-line truncate" style={{ '--delay': `${0.5 + i * 1.1}s` }}>
            <span className="font-semibold text-sky-300">{who}</span>
            <span className="text-slate-300"> {line}</span>
            {i === TRANSCRIPT.length - 1 && (
              <span className="lm-caret ml-1 inline-block h-3 w-px bg-sky-300 align-middle" />
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

function Review() {
  return (
    <>
      <div className="flex items-center gap-2 text-xs">
        <ShieldCheck size={14} className="text-sky-300" />
        <span className="font-medium text-slate-200">Manager review</span>
        <span className="relative ml-auto h-5 w-[104px]">
          <span
            className="lm-out absolute right-0 top-0 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-200"
            style={{ '--delay': '2.8s' }}
          >
            Pending review
          </span>
          <span
            className="lm-inn absolute right-0 top-0 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200"
            style={{ '--delay': '2.8s' }}
          >
            Approved
          </span>
        </span>
      </div>

      <ul className="mt-3 space-y-2.5">
        {ACTIONS.map((a, i) => (
          <li
            key={a.text}
            className="lm-line flex items-center gap-3 text-xs"
            style={{ '--delay': `${0.1 + i * 0.15}s` }}
          >
            <span
              className="lm-box grid h-4 w-4 shrink-0 place-items-center rounded border border-white/30"
              style={{ '--delay': `${0.9 + i * 0.6}s` }}
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3 text-navy-900">
                <path
                  d="M3.5 8.5l3 3 6-6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength="24"
                  className="lm-tick"
                  style={{ '--delay': `${0.95 + i * 0.6}s` }}
                />
              </svg>
            </span>
            <span className="flex-1 truncate text-slate-200">{a.text}</span>
            <span className="text-slate-500">Due {a.due}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

function Deliver() {
  return (
    <>
      <div className="flex items-center gap-2 text-xs">
        <Send size={13} className="text-sky-300" />
        <span className="font-medium text-slate-200">Tasks delivered</span>
        <span className="lm-inn ml-auto text-slate-400" style={{ '--delay': '1.7s' }}>
          3 assigned
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {ACTIONS.map((a, i) => (
          <li
            key={a.text}
            className="lm-slide flex items-center gap-2.5 text-xs"
            style={{ '--delay': `${0.1 + i * 0.2}s` }}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-400/15 text-[10px] font-semibold text-sky-200">
              {a.who}
            </span>
            <span className="flex-1 truncate text-slate-200">{a.text}</span>
            <span className="text-slate-400">{a.due}</span>
            <span
              className="lm-pop grid h-5 w-5 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"
              style={{ '--delay': `${0.8 + i * 0.3}s` }}
            >
              <Check size={12} strokeWidth={3} />
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

export function MeetingStage({ stage, ms = STAGE_MS, className = '' }) {
  const View = [Capture, Review, Deliver][stage]
  return (
    <div
      aria-hidden="true"
      className={`relative h-[148px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm ${className}`}
    >
      <div key={stage} className="lm-stage absolute inset-0 px-4 py-3.5">
        <View />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/5">
        <div key={stage} className="lm-progress h-full origin-left bg-sky-400/70" style={{ '--ms': `${ms}ms` }} />
      </div>
    </div>
  )
}
