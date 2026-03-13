'use client'

import React, { useMemo } from 'react'

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

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
]

/** Donut chart showing distribution breakdown by barangay. */
export default function BarangayDistributionChart({ data, loading }: BarangayDistributionChartProps) {
  const { segments, total, legendItems } = useMemo(() => {
    if (!data.length) return { segments: [] as React.ReactNode[], total: 0, legendItems: [] as { color: string; label: string; value: number }[] }

    const total = data.reduce((s, d) => s + d.claimedHouseholds, 0)
    if (total === 0) return { segments: [] as React.ReactNode[], total: 0, legendItems: [] as { color: string; label: string; value: number }[] }

    const R = 60
    const circumference = 2 * Math.PI * R
    let cumPercent = 0
    const segments: React.ReactNode[] = []
    const legendItems: { color: string; label: string; value: number }[] = []

    // Sort descending and take top items
    const sorted = [...data].sort((a, b) => b.claimedHouseholds - a.claimedHouseholds)
    const top = sorted.slice(0, 8)

    top.forEach((item, i) => {
      const pct = item.claimedHouseholds / total
      const dashLen = circumference * pct
      const offset = circumference * cumPercent

      segments.push(
        <circle
          key={item.barangay}
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke={COLORS[i % COLORS.length]}
          strokeWidth="22"
          strokeDasharray={`${dashLen} ${circumference}`}
          strokeDashoffset={-offset}
          className="transition-all duration-700"
        />
      )
      legendItems.push({
        color: COLORS[i % COLORS.length],
        label: item.barangay,
        value: item.claimedHouseholds,
      })
      cumPercent += pct
    })

    return { segments, total, legendItems }
  }, [data])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
        <div className="h-4 w-44 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="flex items-center gap-6">
          <div className="w-36 h-36 bg-gray-100 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${70 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
      <h3 className="text-base font-bold text-gray-800 mb-4">Claims by Barangay</h3>

      {total === 0 ? (
        <div className="flex items-center justify-center h-[160px] text-sm text-gray-400">
          No claim data available
        </div>
      ) : (
        <div className="flex items-center gap-5">
          {/* Donut */}
          <div className="relative w-36 h-36 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {segments}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">{total}</p>
                <p className="text-[10px] text-gray-400">Total</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600 truncate flex-1">{item.label}</span>
                <span className="text-xs font-semibold text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
