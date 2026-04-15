import React from 'react'

interface SummaryMetricCardProps {
  label: string
  value: string | number
  helper?: string
  icon: React.ReactNode
  className?: string
}

export default function SummaryMetricCard({
  label,
  value,
  helper,
  icon,
  className = '',
}: SummaryMetricCardProps) {
  return (
    <article className={`rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold leading-tight tracking-[-0.04em] text-slate-950 dark:text-slate-100">
            {value || value === 0 ? value : '--'}
          </p>
          {helper ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helper}</p> : null}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </div>
      </div>
    </article>
  )
}
