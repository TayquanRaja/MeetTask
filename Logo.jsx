

export function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mt-g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f46e5" />
          <stop offset="1" stopColor="#312e81" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#mt-g)" />
      <path d="M15 16h18M15 24h12M15 32h8" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="34" cy="32" r="3" fill="#38bdf8" />
    </svg>
  )
}

export function Logo({ dark = false, size = 40, tagline = true }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} />
      <div className="leading-none">
        <div className={`text-[21px] font-bold tracking-tight ${dark ? 'text-white' : 'text-navy-900'}`}>
          Meet<span className={dark ? 'text-sky-400' : 'text-brand'}>Task</span>
        </div>
        {tagline && (
          <div className={`mt-1 font-mono text-[9px] uppercase tracking-[0.25em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Intelligence
          </div>
        )}
      </div>
    </div>
  )
}