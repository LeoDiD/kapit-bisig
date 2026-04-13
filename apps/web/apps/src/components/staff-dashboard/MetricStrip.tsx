'use client'

import React from 'react'

interface Metric {
  id: string
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

interface MetricStripProps {
  metrics: Metric[]
  loading?: boolean
}

export function MetricStrip({ metrics, loading = false }: MetricStripProps) {
  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row w-full border-t border-b border-slate-300 dark:border-slate-700 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 dark:divide-slate-700">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 p-6 animate-pulse">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 mb-2 rounded" />
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row w-full border-t border-b border-slate-300 dark:border-slate-700 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 dark:divide-slate-700 bg-white dark:bg-slate-900">
      {metrics.map((metric) => (
        <div key={metric.id} className="flex-1 p-6 flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
          <span className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2 block">
            {metric.label}
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {metric.value}
            </span>
            {metric.trend && metric.trendValue && (
              <span className={`text-sm font-semibold ${
                metric.trend === 'up' ? 'text-emerald-600' : 
                metric.trend === 'down' ? 'text-red-500' : 'text-slate-500'
              }`}>
                {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '—'} {metric.trendValue}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
