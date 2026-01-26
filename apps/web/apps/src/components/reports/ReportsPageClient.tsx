'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

type ReportType = 'Distribution Summary' | 'Barangay Summary'
type Status = 'Claimed' | 'Unclaimed'

type PriorityBreakdown = { high: number; medium: number; low: number }

type ReportRow = {
  id: number
  date: string // YYYY-MM-DD
  barangay: string
  totalHouseholds: number
  claimed: number
  unclaimed: number
  priority: PriorityBreakdown
  items: { name: string; qty: number }[]
  status: Status
}

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'Distribution Summary', label: 'Distribution Summary' },
  { value: 'Barangay Summary', label: 'Barangay Summary' },
]

const BARANGAYS = ['Brgy. San Jose', 'Brgy. Santo Nino', 'Brgy. San Miguel']

const mockRows: ReportRow[] = [
  {
    id: 1,
    date: '2025-12-25',
    barangay: 'Brgy. San Jose',
    totalHouseholds: 45,
    claimed: 43,
    unclaimed: 2,
    priority: { high: 4, medium: 12, low: 29 },
    items: [
      { name: 'Rice (5kg)', qty: 100 },
      { name: 'Canned Goods', qty: 300 },
      { name: 'Medicine Kit', qty: 20 },
    ],
    status: 'Unclaimed',
  },
  {
    id: 2,
    date: '2025-12-15',
    barangay: 'Brgy. Santo Nino',
    totalHouseholds: 40,
    claimed: 40,
    unclaimed: 0,
    priority: { high: 2, medium: 14, low: 24 },
    items: [
      { name: 'Rice (5kg)', qty: 80 },
      { name: 'Bottled Water', qty: 240 },
      { name: 'Medicine Kit', qty: 40 },
    ],
    status: 'Claimed',
  },
  {
    id: 3,
    date: '2025-12-05',
    barangay: 'Brgy. San Miguel',
    totalHouseholds: 25,
    claimed: 24,
    unclaimed: 1,
    priority: { high: 2, medium: 8, low: 15 },
    items: [
      { name: 'Rice (5kg)', qty: 80 },
      { name: 'Canned Goods', qty: 150 },
      { name: 'Bottled Water', qty: 240 },
      { name: 'Medicine Kit', qty: 30 },
    ],
    status: 'Claimed',
  },
]

type DropdownItem = { value: string; label: string }

function Dropdown({
  value,
  items,
  onChange,
  buttonLabel,
  widthClass = 'min-w-[200px]',
}: {
  value: string
  items: DropdownItem[]
  onChange: (v: string) => void
  buttonLabel: string
  widthClass?: string
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      const inBtn = btnRef.current?.contains(t)
      const inMenu = menuRef.current?.contains(t)
      if (!inBtn && !inMenu) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const selectedLabel = items.find((i) => i.value === value)?.label ?? buttonLabel

  return (
    <div className={`relative ${widthClass}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
      >
        <span className="text-sm">{selectedLabel}</span>
        <ChevronDownIcon />
      </button>

      {open ? (
        <div
          ref={menuRef}
          className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1 z-50"
        >
          {items.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={[
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                  isSelected ? 'bg-[#EAB308] text-gray-900' : 'text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                <span className="w-5 flex items-center justify-center">
                  {isSelected ? <CheckIcon /> : null}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  accentBg,
}: {
  icon: React.ReactNode
  title: string
  value: string
  accentBg: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentBg}`}>
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-lg font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{title}</div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: Status }) {
  const cls =
    status === 'Claimed' ? 'bg-green-600 text-white' : 'bg-[#EAB308] text-white'
  return (
    <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

function PriorityDots({ p }: { p: PriorityBreakdown }) {
  return (
    <div className="flex items-center gap-2">
      <Dot color="bg-red-500" label={`High: ${p.high}`} />
      <Dot color="bg-[#EAB308]" label={`Med: ${p.medium}`} />
      <Dot color="bg-green-600" label={`Low: ${p.low}`} />
    </div>
  )
}
function Dot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

function Donut({
  segments,
}: {
  segments: { label: string; value: number; stroke: string }[]
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const radius = 44
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center justify-between gap-6">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="12"
        />
        {segments.map((seg, idx) => {
          const dash = (seg.value / total) * circumference
          const gap = circumference - dash
          const dashArray = `${dash} ${gap}`
          const dashOffset = -offset
          offset += dash

          return (
            <circle
              key={idx}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={seg.stroke}
              strokeWidth="12"
              strokeLinecap="butt"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
            />
          )
        })}
        <circle cx="60" cy="60" r="28" fill="white" />
      </svg>

      <div className="flex flex-col gap-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ background: s.stroke }} />
            <span className="text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniBarChart({
  labels,
  seriesA,
  seriesB,
}: {
  labels: string[]
  seriesA: number[]
  seriesB: number[]
}) {
  const max = Math.max(...seriesA, ...seriesB, 1)
  return (
    <div className="w-full">
      <div className="flex items-end gap-3 h-44">
        {labels.map((m, i) => {
          const a = (seriesA[i] / max) * 100
          const b = (seriesB[i] / max) * 100
          return (
            <div key={m} className="flex-1 flex items-end justify-center gap-1">
              <div className="w-3 rounded-t-md bg-[#0F533A]" style={{ height: `${a}%` }} />
              <div className="w-3 rounded-t-md bg-[#9ACB3C]" style={{ height: `${b}%` }} />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[11px] text-gray-500 mt-2">
        {labels.map((m) => (
          <span key={m} className="w-full text-center">
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ReportsPageClient() {
  const [reportType, setReportType] = useState<ReportType>('Distribution Summary')
  const [startDate, setStartDate] = useState('dd/mm/yyyy')
  const [endDate, setEndDate] = useState('dd/mm/yyyy')
  const [barangay, setBarangay] = useState('All')

  const [generated, setGenerated] = useState(true)

  // row menu (3 dots)
  const [activeMenu, setActiveMenu] = useState<number | null>(null)
  const [menuOpensUp, setMenuOpensUp] = useState(false)
  const rowMenuWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (rowMenuWrapRef.current && !rowMenuWrapRef.current.contains(t)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const filteredRows = useMemo(() => {
    if (barangay === 'All') return mockRows
    return mockRows.filter((r) => r.barangay === barangay)
  }, [barangay])

  const totals = useMemo(() => {
    const totalDistributions = filteredRows.length
    const totalHouseholds = filteredRows.reduce((a, r) => a + r.totalHouseholds, 0)
    const totalClaimed = filteredRows.reduce((a, r) => a + r.claimed, 0)
    const totalUnclaimed = filteredRows.reduce((a, r) => a + r.unclaimed, 0)

    const claimRate = totalHouseholds ? Math.round((totalClaimed / totalHouseholds) * 100) : 0
    const highPriority = filteredRows.reduce((a, r) => a + r.priority.high, 0)

    return { totalDistributions, totalHouseholds, totalClaimed, totalUnclaimed, claimRate, highPriority }
  }, [filteredRows])

  const barangayItems: DropdownItem[] = [
    { value: 'All', label: 'All Barangays' },
    ...BARANGAYS.map((b) => ({ value: b, label: b })),
  ]

  const onToggleMenu = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (activeMenu === id) {
      setActiveMenu(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    setMenuOpensUp(spaceBelow < 160)
    setActiveMenu(id)
  }

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-gray-800 font-semibold mb-4">
          <FilterIcon className="w-5 h-5 text-gray-700" />
          <span>Report Filters</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-2">Report Type</div>
            <Dropdown
              value={reportType}
              buttonLabel="Distribution Summary"
              items={REPORT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              onChange={(v) => setReportType(v as ReportType)}
              widthClass="w-full"
            />
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2">Start Date</div>
            <div className="relative">
              <input
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <CalendarIcon />
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2">End Date</div>
            <div className="relative">
              <input
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <CalendarIcon />
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2">Barangay</div>
            <Dropdown
              value={barangay}
              buttonLabel="All Barangays"
              items={barangayItems}
              onChange={setBarangay}
              widthClass="w-full"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setGenerated(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F533A] hover:bg-[#0a3f2c] text-white text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)]"
          >
            <BoltIcon className="w-4 h-4" />
            Generate Report
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
          >
            <DownloadIcon className="w-4 h-4 text-gray-500" />
            Export PDF
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
          >
            <DownloadIcon className="w-4 h-4 text-gray-500" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<CubeIcon className="w-5 h-5 text-green-700" />}
          accentBg="bg-green-100"
          title="Total Distributions"
          value={`${totals.totalDistributions}`}
        />
        <StatCard
          icon={<UsersIcon className="w-5 h-5 text-green-700" />}
          accentBg="bg-green-100"
          title="Households Served"
          value={`${totals.totalHouseholds}`}
        />
        <StatCard
          icon={<TrendIcon className="w-5 h-5 text-green-700" />}
          accentBg="bg-green-100"
          title="Claim Rate"
          value={`${totals.claimRate}%`}
        />
        <StatCard
          icon={<AlertIcon className="w-5 h-5 text-red-600" />}
          accentBg="bg-red-100"
          title="High Priority"
          value={`${totals.highPriority}`}
        />
      </div>

      {/* Report Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <DocIcon className="w-5 h-5 text-gray-700" />
            <span>Distribution Report - December 2025</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Summary of relief distributions by barangay for the selected period
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-fixed min-w-[1100px] lg:min-w-0">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="px-4 py-4 font-medium w-[10%]">Date</th>
                <th className="px-4 py-4 font-medium w-[14%]">Barangay</th>
                <th className="px-4 py-4 font-medium w-[12%]">Total Households</th>
                <th className="px-4 py-4 font-medium w-[10%]">Claimed</th>
                <th className="px-4 py-4 font-medium w-[10%]">Unclaimed</th>
                <th className="px-4 py-4 font-medium w-[18%]">Priority Breakdown</th>
                <th className="px-4 py-4 font-medium w-[22%]">Items Distributed</th>
                <th className="px-4 py-4 font-medium w-[4%]"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {generated ? (
                filteredRows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-gray-600">{r.date}</td>
                    <td className="px-4 py-4 text-gray-700">{r.barangay}</td>
                    <td className="px-4 py-4 text-gray-700">{r.totalHouseholds}</td>
                    <td className="px-4 py-4 text-gray-700">{r.claimed}/{r.totalHouseholds}</td>
                    <td className="px-4 py-4 text-gray-700">{r.unclaimed}/{r.totalHouseholds}</td>
                    <td className="px-4 py-4">
                      <PriorityDots p={r.priority} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {r.items.map((it, idx) => (
                          <span
                            key={idx}
                            className="inline-flex px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-700"
                          >
                            {it.name} x{it.qty}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right relative">
                      <div className="relative inline-block" ref={rowMenuWrapRef}>
                        <button
                          onClick={(e) => onToggleMenu(r.id, e)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <DotsIcon />
                        </button>

                        {activeMenu === r.id ? (
                          <div
                            className={[
                              'absolute right-0 w-52 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-200 z-50 overflow-hidden',
                              menuOpensUp ? 'bottom-full mb-2' : 'top-full mt-2',
                            ].join(' ')}
                          >
                            <div className="py-2">
                              <MenuItem icon={<EyeIcon />} label="View Details" onClick={() => setActiveMenu(null)} />
                              <MenuItem icon={<DownloadIcon className="w-5 h-5" />} label="Export Row" onClick={() => setActiveMenu(null)} />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                    Click <span className="font-semibold">Generate Report</span> to view results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Report Summary strip */}
        <div className="p-5 bg-white border-t border-gray-100">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
            <div className="font-semibold text-gray-800 mb-2">Report Summary</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <SummaryCell label="Total Distributions" value={`${totals.totalDistributions}`} />
              <SummaryCell label="Households Claimed" value={`${totals.totalClaimed}`} valueClass="text-green-700" />
              <SummaryCell label="Households Unclaimed" value={`${totals.totalUnclaimed}`} valueClass="text-[#D97706]" />
              <SummaryCell label="Claim Rate" value={`${totals.claimRate}%`} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="font-semibold text-gray-900">Distribution Summary</div>
          <div className="text-sm text-gray-500 mb-4">Monthly distribution and household coverage</div>
          <MiniBarChart
            labels={['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
            seriesA={[120, 150, 200, 170, 220, 190]}
            seriesB={[90, 110, 140, 130, 160, 150]}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="font-semibold text-gray-900">Distribution by Barangay</div>
          <div className="text-sm text-gray-500 mb-4">Percentage of distributions per barangay</div>
          <Donut
            segments={[
              { label: 'San Jose: 45', value: 45, stroke: '#0F533A' },
              { label: 'Santo Nino: 40', value: 40, stroke: '#EAB308' },
              { label: 'San Miguel: 30', value: 30, stroke: '#22C55E' },
              { label: 'San Miguel: 30', value: 30, stroke: '#9ACB3C' },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function SummaryCell({
  label,
  value,
  valueClass = 'text-gray-900',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between lg:block">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-sm font-semibold ${valueClass}`}>{value}</div>
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span className="text-gray-500">{icon}</span>
      {label}
    </button>
  )
}

/* ----- Icons ----- */

function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
    </svg>
  )
}
function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17v-3.586L3.293 6.707A1 1 0 013 6V4z" />
    </svg>
  )
}
function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15V3" />
    </svg>
  )
}
function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
    </svg>
  )
}
function CubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8v8l9 5 9-5V8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13v8" />
    </svg>
  )
}
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function TrendIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 7h7v7" />
    </svg>
  )
}
function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}
function DotsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
