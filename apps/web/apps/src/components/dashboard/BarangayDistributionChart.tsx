'use client'

import React, { useMemo, useState } from 'react'

interface BarangayData {
  barangay: string
  distributions: number
  registeredHouseholds: number
  claimedHouseholds: number
}

interface BarangayDistributionChartProps {
  data: BarangayData[]
  loading?: boolean
}

const PALETTE = [
  '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

/** Dual-view donut and ranked progress bar breakdown of distribution claims across barangays. */
export default function BarangayDistributionChart({ data, loading }: BarangayDistributionChartProps) {
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'claims' | 'rate'>('claims')

  const processedData = useMemo(() => {
    if (!data.length) return []
    return data.map((d) => {
      const rate = d.registeredHouseholds > 0 ? Math.round((d.claimedHouseholds / d.registeredHouseholds) * 100) : 0
      return { ...d, rate }
    })
  }, [data])

  const sortedList = useMemo(() => {
    if (!processedData.length) return []
    return [...processedData].sort((a, b) => {
      if (sortBy === 'rate') return b.rate - a.rate
      return b.claimedHouseholds - a.claimedHouseholds
    })
  }, [processedData, sortBy])

  const { segments, totalClaims, topBarangay, legendItems } = useMemo(() => {
    if (!processedData.length) return { segments: [] as React.ReactNode[], totalClaims: 0, topBarangay: null, legendItems: [] }

    const totalClaims = processedData.reduce((s, d) => s + d.claimedHouseholds, 0)
    if (totalClaims === 0) return { segments: [] as React.ReactNode[], totalClaims: 0, topBarangay: null, legendItems: [] }

    const R = 54
    const circumference = 2 * Math.PI * R
    let cumPercent = 0
    const segments: React.ReactNode[] = []
    const legendItems: Array<{ color: string; label: string; value: number; rate: number; pct: number }> = []

    // Top 8 for donut
    const topForDonut = [...processedData].sort((a, b) => b.claimedHouseholds - a.claimedHouseholds).slice(0, 7)
    const topBarangay = topForDonut[0] || null

    topForDonut.forEach((item, i) => {
      const pct = item.claimedHouseholds / totalClaims
      const dashLen = circumference * pct
      const offset = circumference * cumPercent
      const color = PALETTE[i % PALETTE.length]
      const isHovered = hoveredBarangay === item.barangay

      segments.push(
        <circle
          key={item.barangay}
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={isHovered ? 20 : 16}
          strokeDasharray={`${dashLen} ${circumference}`}
          strokeDashoffset={-offset}
          className="transition-all duration-300 cursor-pointer"
          onMouseEnter={() => setHoveredBarangay(item.barangay)}
          opacity={hoveredBarangay && !isHovered ? 0.35 : 1}
        />
      )

      legendItems.push({
        color,
        label: item.barangay,
        value: item.claimedHouseholds,
        rate: item.rate,
        pct: Math.round(pct * 100),
      })
      cumPercent += pct
    })

    return { segments, totalClaims, topBarangay, legendItems }
  }, [processedData, hoveredBarangay])

  if (loading) {
    return (
      <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-44 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800" />
          <div className="h-4 w-20 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 flex justify-center">
            <div className="w-36 h-36 bg-slate-100 rounded-full animate-pulse dark:bg-slate-800" />
          </div>
          <div className="md:col-span-7 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const activeLegend = hoveredBarangay ? legendItems.find((l) => l.label === hoveredBarangay) : null

  return (
    <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Claims by Barangay</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Coverage and distribution volume across assigned sectors</p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800 text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSortBy('claims')}
            className={`px-2 py-1 rounded-lg transition-all ${
              sortBy === 'claims'
                ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            By Claims
          </button>
          <button
            type="button"
            onClick={() => setSortBy('rate')}
            className={`px-2 py-1 rounded-lg transition-all ${
              sortBy === 'rate'
                ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            By Rate %
          </button>
        </div>
      </div>

      {totalClaims === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-slate-400 dark:text-slate-500">
          <span className="text-2xl mb-1">📍</span>
          <p>No barangay claim data recorded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-auto">
          {/* Donut column */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 shrink-0 select-none" onMouseLeave={() => setHoveredBarangay(null)}>
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                {/* Background track */}
                <circle cx="70" cy="70" r="54" fill="none" stroke="currentColor" strokeWidth="14" className="text-slate-100 dark:text-slate-800" />
                {segments}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {activeLegend ? activeLegend.value : totalClaims.toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 truncate max-w-[90px]">
                  {activeLegend ? activeLegend.label : 'Total Claims'}
                </span>
                {activeLegend && (
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {activeLegend.pct}% of total
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ranked List & Progress Bars Column */}
          <div className="md:col-span-7 space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {sortedList.slice(0, 5).map((item, idx) => {
              const color = PALETTE[idx % PALETTE.length]
              const isHovered = hoveredBarangay === item.barangay
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`

              return (
                <div
                  key={item.barangay}
                  onMouseEnter={() => setHoveredBarangay(item.barangay)}
                  onMouseLeave={() => setHoveredBarangay(null)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-slate-50 border-slate-300 dark:bg-slate-800 dark:border-slate-700 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold w-4 text-center">{medal}</span>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.barangay}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {item.claimedHouseholds} <span className="text-[10px] font-normal text-slate-400">claims</span>
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                        {item.rate}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(item.rate, 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer Top Performer Chip */}
      {topBarangay && totalClaims > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="text-sm">🌟</span> Top sector: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{topBarangay.barangay}</strong>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {topBarangay.claimedHouseholds} served ({topBarangay.rate}% coverage)
          </span>
        </div>
      )}
    </div>
  )
}

