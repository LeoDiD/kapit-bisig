import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: 'default' | 'yellow' | 'green' | 'red' | 'blue' | 'orange'
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}

const iconVariantStyles = {
  default: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300',
  yellow: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
  red: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-300',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
}

const borderAccent = {
  default: 'border-gray-100 dark:border-slate-700',
  yellow: 'border-amber-100 dark:border-amber-900/40',
  green: 'border-emerald-100 dark:border-emerald-900/40',
  red: 'border-red-100 dark:border-red-900/40',
  blue: 'border-blue-100 dark:border-blue-900/40',
  orange: 'border-orange-100 dark:border-orange-900/40',
}

export default function StatsCard({
  title,
  value,
  icon,
  variant = 'default',
  subtitle,
  trend,
}: StatsCardProps) {
  const trendClasses =
    trend === 'up'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : trend === 'down'
        ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
        : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'

  const trendSymbol = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] transition-all hover:scale-[1.02] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] dark:bg-slate-900 ${borderAccent[variant]}`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconVariantStyles[variant]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${trendClasses}`}>
            {trendSymbol}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold leading-tight text-gray-800 dark:text-slate-100">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{title}</p>
      {subtitle ? <p className="mt-1 text-[10px] text-gray-400 dark:text-slate-500">{subtitle}</p> : null}
    </div>
  )
}
