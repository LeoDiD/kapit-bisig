'use client'

import React, { useMemo } from 'react'

interface DayData {
  day: string
  count: number
}

interface WeeklyClaimChartProps {
  data: DayData[]
  loading?: boolean
}

const BAR_COLORS = ['#f59e0b', '#f59e0b', '#f59e0b', '#f59e0b', '#f59e0b', '#f59e0b', '#f59e0b']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Animated bar chart for weekly claim activity. */
export default function WeeklyClaimChart({ data, loading }: WeeklyClaimChartProps) {
  const { bars, maxY, yTicks } = useMemo(() => {
    const mapped = DAY_LABELS.map((label) => {
      const found = data.find((d) => d.day === label)
      return { day: label, count: found?.count ?? 0 }
    })
    const raw = Math.max(...mapped.map((d) => d.count), 1)
    const maxY = Math.ceil(raw / 5) * 5 || 10
    const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxY / 4) * i))
    return { bars: mapped, maxY, yTicks }
  }, [data])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-[220px] bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Weekly Claim Activity</h3>
        <span className="text-xs text-gray-400">This week</span>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Y axis */}
        <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-gray-400 pointer-events-none">
          {[...yTicks].reverse().map((t) => (
            <span key={t}>₱{t > 0 ? t : '0'}</span>
          ))}
        </div>

        <div className="ml-9">
          <svg viewBox="0 0 350 200" className="w-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {yTicks.map((t) => {
              const y = 200 - (t / maxY) * 200
              return (
                <line key={t} x1="0" y1={y} x2="350" y2={y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 4" />
              )
            })}

            {/* Bars */}
            {bars.map((bar, i) => {
              const barW = 30
              const gap = (350 - barW * 7) / 8
              const x = gap + i * (barW + gap)
              const h = (bar.count / maxY) * 180
              const y = 200 - h

              return (
                <g key={bar.day}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx={4}
                    fill={BAR_COLORS[i]}
                    className="transition-all duration-500"
                    opacity={bar.count > 0 ? 1 : 0.25}
                  />
                  {bar.count > 0 && (
                    <text
                      x={x + barW / 2}
                      y={y - 6}
                      textAnchor="middle"
                      className="text-[10px] fill-gray-500 font-medium"
                    >
                      {bar.count}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* X labels */}
          <div className="flex justify-around mt-1 text-[10px] text-gray-400">
            {DAY_LABELS.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
