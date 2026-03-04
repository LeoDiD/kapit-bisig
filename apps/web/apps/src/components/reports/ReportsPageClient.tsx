'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api, { getScopedBarangays, type ReportSummaryData, type ReportDistributionRow } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

type ReportType = 'distribution' | 'barangay'

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'distribution', label: 'Distribution Summary' },
  { value: 'barangay', label: 'Barangay Summary' },
]

// Barangay list is now dynamically scoped per-user via getScopedBarangays()

const DONUT_COLORS = [
  '#0F533A', '#EAB308', '#22C55E', '#9ACB3C', '#3B82F6',
  '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#6366F1',
]

// ─── Helpers ────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function downloadCSV(rows: ReportDistributionRow[], filename: string) {
  const headers = [
    'Date', 'Barangay', 'Assigned Barangays', 'Registered Households',
    'Claimed', 'Unclaimed', 'Claim Rate (%)', 'Status',
  ]
  const csvRows = rows.map((r) => [
    formatDate(r.scheduled || r.createdAt),
    r.barangay,
    (r.assignedBarangays || []).join('; '),
    r.registeredHouseholds,
    r.claimedHouseholds,
    r.unclaimedHouseholds,
    r.claimRate,
    r.status,
  ])

  const csv = [
    headers.join(','),
    ...csvRows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Components ─────────────────────────────────────────────

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
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false)
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
      {open && (
        <div
          ref={menuRef}
          className="absolute left-0 top-full mt-2 w-full rounded-2xl border border-[#DCDCDC] bg-[#ECECEC] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)] z-50"
        >
          {items.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={[
                  'w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-left transition-colors',
                  isSelected ? 'bg-[#EAB308] text-gray-900' : 'text-slate-700 hover:bg-white/70',
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
      )}
    </div>
  )
}

function StatCard({
  icon, title, value, accentBg,
}: {
  icon: React.ReactNode; title: string; value: string; accentBg: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-4 flex items-center gap-3">
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

function StatusPill({ status }: { status: string }) {
  const cls =
    status === 'Claimed'
      ? 'bg-green-600 text-white'
      : status === 'Partially Claimed'
        ? 'bg-[#EAB308] text-white'
        : 'bg-gray-400 text-white'
  return (
    <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>
      {status}
    </span>
  )
}

function ClaimRateBar({ rate }: { rate: number }) {
  const color =
    rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-[#EAB308]' : rate > 0 ? 'bg-orange-400' : 'bg-gray-300'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-9 text-right">{rate}%</span>
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
    <div className="flex items-center justify-between gap-4">
      <svg width="128" height="128" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="12" />
        {segments.map((seg, idx) => {
          const dash = (seg.value / total) * circumference
          const gap = circumference - dash
          const dashArray = `${dash} ${gap}`
          const dashOffset = -offset
          offset += dash
          return (
            <circle
              key={idx} cx="60" cy="60" r={radius} fill="none"
              stroke={seg.stroke} strokeWidth="12" strokeLinecap="butt"
              strokeDasharray={dashArray} strokeDashoffset={dashOffset}
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
  labels, seriesA, seriesB, legendA, legendB,
}: {
  labels: string[]; seriesA: number[]; seriesB: number[]
  legendA: string; legendB: string
}) {
  const max = Math.max(...seriesA, ...seriesB, 1)
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#0F533A]" /> {legendA}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#9ACB3C]" /> {legendB}
        </span>
      </div>
      <div className="flex items-end gap-3 h-44">
        {labels.map((m, i) => {
          const a = (seriesA[i] / max) * 100
          const b = (seriesB[i] / max) * 100
          return (
            <div key={m} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end justify-center gap-1 w-full h-36">
                <div
                  className="w-3 rounded-t-md bg-[#0F533A] transition-all duration-300"
                  style={{ height: `${a}%`, minHeight: seriesA[i] > 0 ? '4px' : '0px' }}
                  title={`${legendA}: ${seriesA[i]}`}
                />
                <div
                  className="w-3 rounded-t-md bg-[#9ACB3C] transition-all duration-300"
                  style={{ height: `${b}%`, minHeight: seriesB[i] > 0 ? '4px' : '0px' }}
                  title={`${legendB}: ${seriesB[i]}`}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[11px] text-gray-500 mt-2">
        {labels.map((m) => (
          <span key={m} className="w-full text-center">{m}</span>
        ))}
      </div>
    </div>
  )
}

function SummaryCell({
  label, value, valueClass = 'text-gray-900',
}: {
  label: string; value: string; valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between lg:block">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-sm font-semibold ${valueClass}`}>{value}</div>
    </div>
  )
}

function MenuItem({
  icon, label, onClick,
}: {
  icon: React.ReactNode; label: string; onClick: () => void
}) {
  return (
    <button
      type="button" onClick={onClick}
      className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span className="text-gray-500">{icon}</span>{label}
    </button>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-gray-200 border-t-[#0F533A] rounded-full animate-spin" />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <DocIcon className="w-12 h-12 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ─── Detail Modal ───────────────────────────────────────────

function DetailModal({
  row,
  onClose,
}: {
  row: ReportDistributionRow
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Distribution Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Date</div>
              <div className="text-sm font-medium text-gray-900">{formatDate(row.scheduled || row.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Host Barangay</div>
              <div className="text-sm font-medium text-gray-900">{row.barangay}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Assigned Barangays</div>
              <div className="text-sm font-medium text-gray-900">
                {row.assignedBarangays?.length ? row.assignedBarangays.join(', ') : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="mt-0.5"><StatusPill status={row.status} /></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-3">Household Statistics</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-lg font-bold text-gray-900">{row.registeredHouseholds}</div>
                <div className="text-xs text-gray-500">Registered</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-700">{row.claimedHouseholds}</div>
                <div className="text-xs text-gray-500">Claimed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-600">{row.unclaimedHouseholds}</div>
                <div className="text-xs text-gray-500">Unclaimed</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">Claim Rate</div>
              <ClaimRateBar rate={row.claimRate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

export default function ReportsPageClient() {
  const { user } = useAuth()
  const scopedBarangays = useMemo(
    () => getScopedBarangays(user?.role, user?.assignedBarangays),
    [user?.role, user?.assignedBarangays],
  )

  const [reportType, setReportType] = useState<ReportType>('distribution')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [barangay, setBarangay] = useState('All')

  const [data, setData] = useState<ReportSummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(false)

  // detail modal
  const [detailRow, setDetailRow] = useState<ReportDistributionRow | null>(null)

  // row menu
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [menuOpensUp, setMenuOpensUp] = useState(false)
  const rowMenuWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rowMenuWrapRef.current && !rowMenuWrapRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getReportSummary({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        barangay: barangay !== 'All' ? barangay : undefined,
        reportType,
      })
      if (res.success && res.data) {
        setData(res.data)
        setGenerated(true)
      } else {
        setError(res.message || 'Failed to generate report')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, barangay, reportType])

  // Auto-fetch on first load
  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const overview = data?.overview
  const distributions = data?.distributions ?? []
  const monthlyTrends = data?.monthlyTrends ?? []
  const barangayBreakdown = data?.barangayBreakdown ?? []
  const verification = data?.verificationMethods

  // Barangay summary aggregation (for barangay report type)
  const barangaySummaryRows = useMemo(() => {
    if (reportType !== 'barangay' || !distributions.length) return []
    const map = new Map<string, {
      barangay: string
      distributions: number
      registered: number
      claimed: number
      unclaimed: number
    }>()
    for (const d of distributions) {
      const existing = map.get(d.barangay) || {
        barangay: d.barangay,
        distributions: 0,
        registered: 0,
        claimed: 0,
        unclaimed: 0,
      }
      existing.distributions++
      existing.registered += d.registeredHouseholds
      existing.claimed += d.claimedHouseholds
      existing.unclaimed += d.unclaimedHouseholds
      map.set(d.barangay, existing)
    }
    return Array.from(map.values()).sort((a, b) => b.distributions - a.distributions)
  }, [reportType, distributions])

  const barangayItems: DropdownItem[] = useMemo(() => [
    { value: 'All', label: 'All Barangays' },
    ...scopedBarangays.map((b) => ({ value: b, label: b })),
  ], [scopedBarangays])

  const onToggleMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (activeMenu === id) { setActiveMenu(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuOpensUp(window.innerHeight - rect.bottom < 160)
    setActiveMenu(id)
  }

  const handleExportCSV = () => {
    if (!distributions.length) return
    const dateRange = startDate && endDate ? `${startDate}_to_${endDate}` : 'all'
    downloadCSV(distributions, `distribution_report_${dateRange}.csv`)
  }

  const handleExportRowCSV = (row: ReportDistributionRow) => {
    downloadCSV([row], `distribution_${row.barangay}_${row.id}.csv`)
    setActiveMenu(null)
  }

  // Date range label for the table header
  const dateRangeLabel = useMemo(() => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} — ${formatDate(endDate)}`
    }
    if (startDate) return `From ${formatDate(startDate)}`
    if (endDate) return `Until ${formatDate(endDate)}`
    return 'All Time'
  }, [startDate, endDate])

  return (
    <div className="space-y-6">
      {/* ── Filters Card ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-5">
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
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2">End Date</div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
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
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F533A] hover:bg-[#0a3f2c] disabled:opacity-60 text-white text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)] transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <BoltIcon className="w-4 h-4" />
            )}
            {loading ? 'Generating...' : 'Generate Report'}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!distributions.length}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-colors"
          >
            <DownloadIcon className="w-4 h-4 text-gray-500" />
            Export CSV
          </button>

          {(startDate || endDate || barangay !== 'All') && (
            <button
              type="button"
              onClick={() => { setStartDate(''); setEndDate(''); setBarangay('All'); setReportType('distribution') }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-colors"
            >
              <ClearIcon className="w-4 h-4 text-gray-500" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-red-800">Error generating report</div>
            <div className="text-sm text-red-600 mt-1">{error}</div>
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────── */}
      {generated && overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<CubeIcon className="w-5 h-5 text-green-700" />}
            accentBg="bg-green-100"
            title="Total Distributions"
            value={`${overview.totalDistributions}`}
          />
          <StatCard
            icon={<UsersIcon className="w-5 h-5 text-green-700" />}
            accentBg="bg-green-100"
            title="Households Served"
            value={`${overview.totalClaimedHouseholds}`}
          />
          <StatCard
            icon={<TrendIcon className="w-5 h-5 text-green-700" />}
            accentBg="bg-green-100"
            title="Claim Rate"
            value={`${overview.claimRate}%`}
          />
          <StatCard
            icon={<UnclaimedIcon className="w-5 h-5 text-amber-600" />}
            accentBg="bg-amber-100"
            title="Unclaimed Households"
            value={`${overview.totalUnclaimedHouseholds}`}
          />
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────── */}
      {loading && <LoadingSpinner />}

      {/* ── Distribution Summary Table ────────────────────── */}
      {generated && !loading && reportType === 'distribution' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <DocIcon className="w-5 h-5 text-gray-700" />
              <span>Distribution Report — {dateRangeLabel}</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Summary of relief distributions by barangay for the selected period
            </div>
          </div>

          {distributions.length === 0 ? (
            <EmptyState message="No distributions found for the selected filters." />
          ) : (
            <>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse table-fixed min-w-[900px] lg:min-w-0">
                  <thead className="bg-gray-50 text-gray-500 text-sm">
                    <tr>
                      <th className="px-4 py-4 font-medium w-[12%]">Date</th>
                      <th className="px-4 py-4 font-medium w-[14%]">Barangay</th>
                      <th className="px-4 py-4 font-medium w-[12%]">Registered</th>
                      <th className="px-4 py-4 font-medium w-[10%]">Claimed</th>
                      <th className="px-4 py-4 font-medium w-[10%]">Unclaimed</th>
                      <th className="px-4 py-4 font-medium w-[18%]">Claim Rate</th>
                      <th className="px-4 py-4 font-medium w-[14%]">Status</th>
                      <th className="px-4 py-4 font-medium w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {distributions.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-gray-600">{formatDate(r.scheduled || r.createdAt)}</td>
                        <td className="px-4 py-4 text-gray-700 font-medium">{r.barangay}</td>
                        <td className="px-4 py-4 text-gray-700">{r.registeredHouseholds}</td>
                        <td className="px-4 py-4 text-green-700 font-medium">{r.claimedHouseholds}</td>
                        <td className="px-4 py-4 text-amber-600 font-medium">{r.unclaimedHouseholds}</td>
                        <td className="px-4 py-4">
                          <ClaimRateBar rate={r.claimRate} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusPill status={r.status} />
                        </td>
                        <td className="px-4 py-4 text-right relative">
                          <div className="relative inline-block" ref={activeMenu === r.id ? rowMenuWrapRef : undefined}>
                            <button
                              onClick={(e) => onToggleMenu(r.id, e)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                              <DotsIcon />
                            </button>
                            {activeMenu === r.id && (
                              <div
                                className={[
                                  'absolute right-0 w-52 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-200 z-50 overflow-hidden',
                                  menuOpensUp ? 'bottom-full mb-2' : 'top-full mt-2',
                                ].join(' ')}
                              >
                                <div className="py-2">
                                  <MenuItem
                                    icon={<EyeIcon />}
                                    label="View Details"
                                    onClick={() => { setDetailRow(r); setActiveMenu(null) }}
                                  />
                                  <MenuItem
                                    icon={<DownloadIcon className="w-5 h-5" />}
                                    label="Export Row CSV"
                                    onClick={() => handleExportRowCSV(r)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary strip */}
              <div className="p-5 bg-white border-t border-gray-100">
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                  <div className="font-semibold text-gray-800 mb-2">Report Summary</div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    <SummaryCell label="Total Distributions" value={`${overview?.totalDistributions ?? 0}`} />
                    <SummaryCell label="Registered Households" value={`${overview?.totalRegisteredHouseholds ?? 0}`} />
                    <SummaryCell label="Households Claimed" value={`${overview?.totalClaimedHouseholds ?? 0}`} valueClass="text-green-700" />
                    <SummaryCell label="Households Unclaimed" value={`${overview?.totalUnclaimedHouseholds ?? 0}`} valueClass="text-[#D97706]" />
                    <SummaryCell label="Claim Rate" value={`${overview?.claimRate ?? 0}%`} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Barangay Summary Table ────────────────────────── */}
      {generated && !loading && reportType === 'barangay' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <DocIcon className="w-5 h-5 text-gray-700" />
              <span>Barangay Summary — {dateRangeLabel}</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Aggregated relief distribution statistics grouped by barangay
            </div>
          </div>

          {barangaySummaryRows.length === 0 ? (
            <EmptyState message="No data found for the selected filters." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse table-fixed min-w-[700px] lg:min-w-0">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                  <tr>
                    <th className="px-4 py-4 font-medium w-[20%]">Barangay</th>
                    <th className="px-4 py-4 font-medium w-[15%]">Distributions</th>
                    <th className="px-4 py-4 font-medium w-[15%]">Registered</th>
                    <th className="px-4 py-4 font-medium w-[15%]">Claimed</th>
                    <th className="px-4 py-4 font-medium w-[15%]">Unclaimed</th>
                    <th className="px-4 py-4 font-medium w-[20%]">Claim Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {barangaySummaryRows.map((r) => {
                    const rate = r.registered > 0 ? Math.round((r.claimed / r.registered) * 100) : 0
                    return (
                      <tr key={r.barangay} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-gray-700 font-medium">{r.barangay}</td>
                        <td className="px-4 py-4 text-gray-700">{r.distributions}</td>
                        <td className="px-4 py-4 text-gray-700">{r.registered}</td>
                        <td className="px-4 py-4 text-green-700 font-medium">{r.claimed}</td>
                        <td className="px-4 py-4 text-amber-600 font-medium">{r.unclaimed}</td>
                        <td className="px-4 py-4"><ClaimRateBar rate={rate} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Charts ────────────────────────────────────────── */}
      {generated && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Trend */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-4">
            <div className="font-semibold text-gray-900">Distribution Trends</div>
            <div className="text-sm text-gray-500 mb-4">Monthly distributions vs. claims (last 6 months)</div>
            {monthlyTrends.length > 0 ? (
              <MiniBarChart
                labels={monthlyTrends.map((t) => t.month.split(' ')[0])}
                seriesA={monthlyTrends.map((t) => t.distributions)}
                seriesB={monthlyTrends.map((t) => t.claimed)}
                legendA="Distributions"
                legendB="Claims"
              />
            ) : (
              <div className="text-sm text-gray-400 py-8 text-center">No trend data available</div>
            )}
          </div>

          {/* Barangay Donut */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-4">
            <div className="font-semibold text-gray-900">Distribution by Barangay</div>
            <div className="text-sm text-gray-500 mb-4">Number of distributions per barangay</div>
            {barangayBreakdown.length > 0 ? (
              <Donut
                segments={barangayBreakdown.map((b, i) => ({
                  label: `${b.barangay}: ${b.distributions}`,
                  value: b.distributions,
                  stroke: DONUT_COLORS[i % DONUT_COLORS.length],
                }))}
              />
            ) : (
              <div className="text-sm text-gray-400 py-8 text-center">No barangay data available</div>
            )}
          </div>
        </div>
      )}

      {/* ── Verification Methods Card ─────────────────────── */}
      {generated && !loading && verification && (verification.qr > 0 || verification.face > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-5">
          <div className="font-semibold text-gray-900 mb-1">Verification Methods</div>
          <div className="text-sm text-gray-500 mb-4">How households verified their claims</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <QRIcon className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{verification.qr}</div>
                <div className="text-xs text-gray-500">QR Code Scans</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <FaceIcon className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{verification.face}</div>
                <div className="text-xs text-gray-500">Face Recognition</div>
              </div>
            </div>
            {verification.unknown > 0 && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <QuestionIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{verification.unknown}</div>
                  <div className="text-xs text-gray-500">Other / Manual</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Not generated state ───────────────────────────── */}
      {!generated && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-12">
          <EmptyState message="Click Generate Report to view distribution data." />
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────── */}
      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Icons
   ═══════════════════════════════════════════════════════════ */

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
function ClearIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
function UnclaimedIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
function QRIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14h3v3h-3zM14 20h7M20 14v3" />
    </svg>
  )
}
function FaceIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth={3} strokeLinecap="round" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
