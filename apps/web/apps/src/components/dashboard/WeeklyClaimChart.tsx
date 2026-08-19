'use client'

import React, { useMemo, useState } from 'react'

interface DayData {
  day: string
  count: number
}

interface WeeklyClaimChartProps {
  data: DayData[]
  loading?: boolean
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Interactive bar chart for weekly claim activity with gradient bars & hover metrics. */
export default function WeeklyClaimChart({ data, loading }: WeeklyClaimChartProps) {
  const [hoverDay, setHoverDay] = useState<string | null>(null)

  const { bars, maxY, yTicks, totalWeekly, peakDay, avgDaily } = useMemo(() => {
    const mapped = DAY_LABELS.map((label) => {
      const found = data.find((d) => d.day === label)
      return { day: label, count: found?.count ?? 0 }
    })
    const totalWeekly = mapped.reduce((acc, d) => acc + d.count, 0)
    const raw = Math.max(...mapped.map((d) => d.count), 1)
    const maxY = Math.ceil(raw / 5) * 5 || 10
    const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxY / 4) * i))

    // Find peak day
    const sorted = [...mapped].sort((a, b) => b.count - a.count)
    const peak = sorted[0]?.count > 0 ? sorted[0] : null
    const avgDaily = Math.round(totalWeekly / 7)

    return { bars: mapped, maxY, yTicks, totalWeekly, peakDay: peak, avgDaily }
  }, [data])

  if (loading) {
    return (
      <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-36 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800" />
          <div className="h-4 w-16 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800" />
        </div>
        <div className="h-[180px] bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800/50" />
      </div>
    )
  }

  const activeBar = hoverDay ? bars.find((b) => b.day === hoverDay) : null

  return (
    <div className="h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Weekly Claim Activity</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Claims processed past 7 days</p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40">
          {totalWeekly} total
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="relative my-auto select-none pt-2">
        {/* Hover info badge */}
        {activeBar && (
          <div className="absolute top-0 right-2 z-10 text-[11px] bg-slate-900 text-white dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium shadow-md">
            {activeBar.day}: <span className="font-bold text-amber-300">{activeBar.count} claims</span>
          </div>
        )}

        {/* Y axis */}
        <div className="absolute left-0 top-3 bottom-6 w-7 flex flex-col justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
          {[...yTicks].reverse().map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        <div className="ml-8">
          <svg
            viewBox="0 0 350 170"
            className="w-full h-[155px] overflow-visible"
            preserveAspectRatio="none"
            onMouseLeave={() => setHoverDay(null)}
          >
            <defs>
              <linearGradient id="bar-grad-default" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="bar-grad-peak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="bar-grad-hover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {yTicks.map((t) => {
              const y = 145 - (t / maxY) * 125
              return (
                <line
                  key={t}
                  x1="0"
                  y1={y}
                  x2="350"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  className="text-slate-200 dark:text-slate-800"
                />
              )
            })}

            {/* Bars */}
            {bars.map((bar, i) => {
              const barW = 28
              const gap = (350 - barW * 7) / 8
              const x = gap + i * (barW + gap)
              const h = Math.max((bar.count / maxY) * 125, bar.count > 0 ? 6 : 2)
              const y = 145 - h
              const isPeak = peakDay && bar.day === peakDay.day && bar.count > 0
              const isHovered = hoverDay === bar.day

              let fillGrad = 'url(#bar-grad-default)'
              if (isPeak) fillGrad = 'url(#bar-grad-peak)'
              if (isHovered) fillGrad = 'url(#bar-grad-hover)'

              return (
                <g key={bar.day} className="cursor-pointer" onMouseEnter={() => setHoverDay(bar.day)}>
                  {/* Background hover bar highlight */}
                  {isHovered && (
                    <rect
                      x={x - 4}
                      y={10}
                      width={barW + 8}
                      height={138}
                      rx={8}
                      fill="currentColor"
                      className="text-slate-100 dark:text-slate-800/60 transition-all"
                    />
                  )}

                  {/* The bar itself */}
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx={6}
                    fill={fillGrad}
                    opacity={bar.count > 0 ? (isHovered ? 1 : 0.9) : 0.25}
                    className="transition-all duration-300"
                  />

                  {/* Value label above bar */}
                  {bar.count > 0 && (
                    <text
                      x={x + barW / 2}
                      y={y - 5}
                      textAnchor="middle"
                      className={`text-[10px] font-bold ${
                        isPeak
                          ? 'fill-emerald-600 dark:fill-emerald-400'
                          : isHovered
                          ? 'fill-amber-600 dark:fill-amber-400'
                          : 'fill-slate-600 dark:fill-slate-400'
                      }`}
                    >
                      {bar.count}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* X labels */}
          <div className="flex justify-around mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {DAY_LABELS.map((l) => {
              const isPeak = peakDay && l === peakDay.day && peakDay.count > 0
              const isHovered = hoverDay === l
              return (
                <span
                  key={l}
                  className={`cursor-pointer transition-colors ${
                    isPeak
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : isHovered
                      ? 'text-amber-600 dark:text-amber-400 font-bold'
                      : ''
                  }`}
                  onMouseEnter={() => setHoverDay(l)}
                >
                  {l}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Summary Footer Ribbon - eliminates white space */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl py-1.5 px-2">
          <span className="text-[10px] text-slate-400 block font-medium">Daily Average</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{avgDaily} / day</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl py-1.5 px-2">
          <span className="text-[10px] text-slate-400 block font-medium">Peak Day</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {peakDay ? `${peakDay.day} (${peakDay.count})` : 'None'}
          </span>
        </div>
      </div>
    </div>
  )
}

