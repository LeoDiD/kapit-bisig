'use client'

import React, { useMemo } from 'react'

interface TrendPoint {
  month: string
  distributions: number
  claimed: number
}

interface DistributionTrendsChartProps {
  data: TrendPoint[]
  loading?: boolean
}

/** Smooth SVG area + line chart for monthly distribution trends. */
export default function DistributionTrendsChart({ data, loading }: DistributionTrendsChartProps) {
  const { distributionsPath, claimedPath, distributionsArea, claimedArea, labels, maxY, yTicks } =
    useMemo(() => {
      if (!data.length) return { distributionsPath: '', claimedPath: '', distributionsArea: '', claimedArea: '', labels: [] as string[], maxY: 10, yTicks: [0, 5, 10] }

      const vals = data.flatMap((d) => [d.distributions, d.claimed])
      const raw = Math.max(...vals, 1)
      const maxY = Math.ceil(raw / 5) * 5 || 10
      const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxY / 4) * i))

      const W = 500
      const H = 200
      const padL = 0
      const padR = 0
      const n = data.length

      const xStep = n > 1 ? (W - padL - padR) / (n - 1) : 0

      const toY = (v: number) => H - (v / maxY) * H

      const pts = (key: 'distributions' | 'claimed') =>
        data.map((d, i) => ({ x: padL + i * xStep, y: toY(d[key]) }))

      const line = (points: { x: number; y: number }[]) => {
        if (points.length < 2) return `M${points[0].x},${points[0].y}`
        let d = `M${points[0].x},${points[0].y}`
        for (let i = 1; i < points.length; i++) {
          const cp1x = (points[i - 1].x + points[i].x) / 2
          const cp1y = points[i - 1].y
          const cp2x = cp1x
          const cp2y = points[i].y
          d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`
        }
        return d
      }

      const area = (points: { x: number; y: number }[]) => {
        const l = line(points)
        return `${l} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`
      }

      const dp = pts('distributions')
      const cp = pts('claimed')
      const labels = data.map((d) => d.month)

      return {
        distributionsPath: line(dp),
        claimedPath: line(cp),
        distributionsArea: area(dp),
        claimedArea: area(cp),
        labels,
        maxY,
        yTicks,
      }
    }, [data])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-[220px] bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
        <h3 className="text-base font-bold text-gray-800 mb-2">Monthly Distribution Trends</h3>
        <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
          No trend data available yet
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Monthly Distribution Trends</h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="inline-block w-3 h-[3px] rounded-full bg-blue-500" />
            Distributions
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="inline-block w-3 h-[3px] rounded-full bg-emerald-500" />
            Claimed
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Y axis labels */}
        <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-gray-400 pointer-events-none">
          {[...yTicks].reverse().map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        <div className="ml-9">
          <svg viewBox="0 0 500 220" className="w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-dist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="grad-claim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {yTicks.map((t) => {
              const y = 200 - (t / maxY) * 200
              return (
                <line key={t} x1="0" y1={y} x2="500" y2={y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 4" />
              )
            })}

            {/* Areas */}
            <path d={distributionsArea} fill="url(#grad-dist)" />
            <path d={claimedArea} fill="url(#grad-claim)" />

            {/* Lines */}
            <path d={distributionsPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            <path d={claimedPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          {/* X labels */}
          <div className="flex justify-between mt-1 text-[10px] text-gray-400 px-0.5">
            {labels.map((l) => (
              <span key={l} className="truncate max-w-[60px] text-center">{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
