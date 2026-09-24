import React from 'react'

export type MetricColor = 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'red' | 'default'

const iconBgStyles: Record<MetricColor, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300 border-blue-100 dark:border-blue-900/50',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-300 border-amber-100 dark:border-amber-900/50',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-300 border-purple-100 dark:border-purple-900/50',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-300 border-rose-100 dark:border-rose-900/50',
  red: 'bg-red-50 text-red-600 dark:bg-red-950/70 dark:text-red-300 border-red-100 dark:border-red-900/50',
  default: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
}

interface SummaryMetricCardProps {
  label: string
  value: string | number
  helper?: string
  icon: React.ReactNode
  className?: string
  variant?: MetricColor
  color?: MetricColor
}

export default function SummaryMetricCard({
  label,
  value,
  helper,
  icon,
  className = '',
  variant,
  color,
}: SummaryMetricCardProps) {
  const selectedVariant = variant || color || 'default'
  const iconStyle = iconBgStyles[selectedVariant] || iconBgStyles.default

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
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${iconStyle}`}>
          {icon}
        </div>
      </div>
    </article>
  )
}
