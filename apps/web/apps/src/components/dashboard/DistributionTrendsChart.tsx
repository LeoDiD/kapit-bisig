'use client'

import React, { useMemo, useState } from 'react'

interface TrendPoint {
  month: string
  distributions: number
  claimed: number
}

interface DistributionTrendsChartProps {
  data: TrendPoint[]
  loading?: boolean
}

type TimeframeOption = 'all' | '6m' | '3m'

/** Interactive glowing SVG area + line chart with hover scrubber for monthly trends. */
export default function DistributionTrendsChart({ data, loading }: DistributionTrendsChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('all')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const filteredData = useMemo(() => {
    if (!data.length) return []
    if (timeframe === '3m') return data.slice(-3)
    if (timeframe === '6m') return data.slice(-6)
    return data
  }, [data, timeframe])

  // Aggregate metrics for header pill
  const summaryMetrics = useMemo(() => {
    if (!filteredData.length) return { totalDist: 0, totalClaim: 0, avgClaimRate: 0 }
    const totalDist = filteredData.reduce((s, d) => s + d.distributions, 0)
    const totalClaim = filteredData.reduce((s, d) => s + d.claimed, 0)
    const avgClaimRate = totalDist > 0 ? Math.round((totalClaim / totalDist) * 100) : 0
    return { totalDist, totalClaim, avgClaimRate }
  }, [filteredData])

  const chartModel = useMemo(() => {
    if (!filteredData.length) {
      return {
        distributionsPath: '',
        claimedPath: '',
        distributionsArea: '',
        claimedArea: '',
        pointsDist: [] as { x: number; y: number; val: number }[],
        pointsClaim: [] as { x: number; y: number; val: number }[],
        labels: [] as string[],
        maxY: 10,
        yTicks: [0, 5, 10],
      }
    }

    const vals = filteredData.flatMap((d) => [d.distributions, d.claimed])
    const rawMax = Math.max(...vals, 1)
    const maxY = Math.ceil(rawMax / 5) * 5 || 10
    const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxY / 4) * i))

    const W = 600
    const H = 210
    const padX = 20
    const n = filteredData.length
    const xStep = n > 1 ? (W - padX * 2) / (n - 1) : 0

    const toY = (v: number) => H - (v / maxY) * (H - 24) - 12

    const pointsDist = filteredData.map((d, i) => ({
      x: padX + i * xStep,
      y: toY(d.distributions),
      val: d.distributions,
    }))

    const pointsClaim = filteredData.map((d, i) => ({
      x: padX + i * xStep,
      y: toY(d.claimed),
      val: d.claimed,
    }))

    const buildSmoothPath = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return ''
      if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
      let d = `M${pts[0].x},${pts[0].y}`
      for (let i = 1; i < pts.length; i++) {
        const cp1x = (pts[i - 1].x + pts[i].x) / 2
        const cp1y = pts[i - 1].y
        const cp2x = cp1x
        const cp2y = pts[i].y
        d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${pts[i].x},${pts[i].y}`
      }
      return d
    }

    const buildSmoothArea = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return ''
      const lineStr = buildSmoothPath(pts)
      return `${lineStr} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`
    }

    return {
      distributionsPath: buildSmoothPath(pointsDist),
      claimedPath: buildSmoothPath(pointsClaim),
      distributionsArea: buildSmoothArea(pointsDist),
      claimedArea: buildSmoothArea(pointsClaim),
      pointsDist,
      pointsClaim,
      labels: filteredData.map((d) => d.month),
      maxY,
      yTicks,
    }
  }, [filteredData])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-48 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800" />
          <div className="h-7 w-32 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800" />
        </div>
        <div className="h-[210px] bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800/50" />
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Monthly Distribution Trends</h3>
        <div className="flex flex-col items-center justify-center h-[200px] text-center text-sm text-slate-400">
          <span className="text-3xl mb-2">📊</span>
          <p>No distribution trend data available yet</p>
        </div>
      </div>
    )
  }

  const activePointDist = hoverIndex !== null ? chartModel.pointsDist[hoverIndex] : null
  const activePointClaim = hoverIndex !== null ? chartModel.pointsClaim[hoverIndex] : null
  const activeItem = hoverIndex !== null ? filteredData[hoverIndex] : null
  const activeClaimRate =
    activeItem && activeItem.distributions > 0
      ? Math.round((activeItem.claimed / activeItem.distributions) * 100)
      : 0

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Monthly Distribution Trends</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
              {summaryMetrics.avgClaimRate}% overall claim rate
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track distributions planned vs actual beneficiary claims over time
          </p>
        </div>

        {/* Controls & Legend */}
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
              Planned
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              Claimed
            </span>
          </div>

          {/* Timeframe pills */}
          {data.length > 3 && (
            <div className="flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800 text-xs font-medium">
              <button
                type="button"
                onClick={() => { setTimeframe('all'); setHoverIndex(null) }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeframe === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                All
              </button>
              {data.length >= 6 && (
                <button
                  type="button"
                  onClick={() => { setTimeframe('6m'); setHoverIndex(null) }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    timeframe === '6m'
                      ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  6M
                </button>
              )}
              <button
                type="button"
                onClick={() => { setTimeframe('3m'); setHoverIndex(null) }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeframe === '3m'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                3M
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative select-none">
        {/* Hover Tooltip Popup */}
        {activeItem && activePointDist && activePointClaim && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${(activePointDist.x / 600) * 100}%`,
              top: `${Math.min(activePointDist.y, activePointClaim.y) * 0.9}px`,
            }}
          >
            <div className="bg-slate-900/95 text-white dark:bg-slate-800/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs whitespace-nowrap min-w-[130px]">
              <div className="font-bold text-slate-200 border-b border-slate-700/80 pb-1 mb-1.5 flex items-center justify-between gap-2">
                <span>{activeItem.month}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                  {activeClaimRate}% Rate
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> Planned:
                </span>
                <span className="font-semibold text-white">{activeItem.distributions.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-slate-300 mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Claimed:
                </span>
                <span className="font-semibold text-emerald-300">{activeItem.claimed.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Y-axis Labels */}
        <div className="absolute left-0 top-1 bottom-6 w-9 flex flex-col justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
          {[...chartModel.yTicks].reverse().map((t) => (
            <span key={t}>{t.toLocaleString()}</span>
          ))}
        </div>

        {/* SVG Curve Canvas */}
        <div className="ml-10">
          <svg
            viewBox="0 0 600 210"
            className="w-full h-[190px] overflow-visible"
            preserveAspectRatio="none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="grad-dist-modern" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="grad-claim-modern" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.4" />
              </filter>
              <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.4" />
              </filter>
            </defs>

            {/* Gridlines */}
            {chartModel.yTicks.map((t) => {
              const y = 210 - (t / chartModel.maxY) * (210 - 24) - 12
              return (
                <line
                  key={t}
                  x1="0"
                  y1={y}
                  x2="600"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="text-slate-200 dark:text-slate-800"
                />
              )
            })}

            {/* Glowing Filled Areas */}
            <path d={chartModel.distributionsArea} fill="url(#grad-dist-modern)" />
            <path d={chartModel.claimedArea} fill="url(#grad-claim-modern)" />

            {/* Crisp Curves with filter glow */}
            <path
              d={chartModel.distributionsPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-blue)"
            />
            <path
              d={chartModel.claimedPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-emerald)"
            />

            {/* Vertical scrubber line when hovered */}
            {activePointDist && (
              <line
                x1={activePointDist.x}
                y1={0}
                x2={activePointDist.x}
                y2={210}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="opacity-70"
              />
            )}

            {/* Data Point Circles */}
            {chartModel.pointsDist.map((p, i) => (
              <g key={`dist-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoverIndex === i ? 6 : 4}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={hoverIndex === i ? 3 : 2}
                  className="transition-all duration-150 cursor-pointer"
                />
              </g>
            ))}

            {chartModel.pointsClaim.map((p, i) => (
              <g key={`claim-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoverIndex === i ? 6 : 4}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth={hoverIndex === i ? 3 : 2}
                  className="transition-all duration-150 cursor-pointer"
                />
              </g>
            ))}

            {/* Interactive invisible hover hit areas */}
            {chartModel.pointsDist.map((p, i) => {
              const prevX = i > 0 ? chartModel.pointsDist[i - 1].x : 0
              const nextX = i < chartModel.pointsDist.length - 1 ? chartModel.pointsDist[i + 1].x : 600
              const left = (prevX + p.x) / 2
              const width = (nextX + p.x) / 2 - left

              return (
                <rect
                  key={`hit-${i}`}
                  x={left}
                  y={0}
                  width={width}
                  height={210}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              )
            })}
          </svg>

          {/* X Axis Month Labels */}
          <div className="flex justify-between mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2">
            {chartModel.labels.map((lbl, i) => (
              <span
                key={lbl}
                className={`transition-colors cursor-pointer text-center ${
                  hoverIndex === i
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                    : 'hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                onMouseEnter={() => setHoverIndex(i)}
              >
                {lbl}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

