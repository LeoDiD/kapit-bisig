'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api, { getScopedBarangays, type ReportSummaryData, type ReportDistributionRow } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { DetailModal } from './DetailModal';
import { 
  formatDate, Dropdown, StatCard, StatusPill, ClaimRateBar, 
  Donut, MiniBarChart, SummaryCell, MenuItem, LoadingSpinner, EmptyState,
  FilterIcon, BoltIcon, DownloadIcon, ClearIcon, DocIcon, CubeIcon, UsersIcon, TrendIcon, UnclaimedIcon, DotsIcon, EyeIcon, QRIcon, FaceIcon, QuestionIcon, ChevronDownIcon, CheckIcon, downloadCSV, DropdownItem, AlertIcon
} from './ReportsHelpers';

type ReportType = 'distribution' | 'barangay';

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'distribution', label: 'Distribution Summary' },
  { value: 'barangay', label: 'Barangay Summary' },
];

const DONUT_COLORS = [
  '#0F533A', '#EAB308', '#22C55E', '#9ACB3C', '#3B82F6',
  '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#6366F1',
];





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
      console.error('Failed to generate report:', err)
      setError('Failed to generate report. Please try again.')
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
      <div className="print:hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]">
        <div className="mb-4 flex items-center gap-2 font-semibold text-gray-800 dark:text-slate-100">
          <FilterIcon className="h-5 w-5 text-gray-700 dark:text-slate-300" />
          <span>Report Filters</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <div className="mb-2 text-xs text-gray-500 dark:text-slate-400">Report Type</div>
            <Dropdown
              value={reportType}
              buttonLabel="Distribution Summary"
              items={REPORT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              onChange={(v) => setReportType(v as ReportType)}
              widthClass="w-full"
            />
          </div>

          <div>
            <div className="mb-2 text-xs text-gray-500 dark:text-slate-400">Start Date</div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)]"
            />
          </div>

          <div>
            <div className="mb-2 text-xs text-gray-500 dark:text-slate-400">End Date</div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)]"
            />
          </div>

          <div>
            <div className="mb-2 text-xs text-gray-500 dark:text-slate-400">Barangay</div>
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F533A] hover:bg-[#0a3f2c] disabled:opacity-60 text-white text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
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
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-all duration-300 hover:bg-slate-50 hover:text-[#004A1C] hover:scale-[1.02] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)] dark:hover:bg-slate-800/80 dark:hover:text-[#ECC323] print:hidden"
          >
            <DocIcon className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            Print Report
          </button>
          
          <button type="button" onClick={handleExportCSV}
            disabled={!distributions.length}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-all duration-300 hover:bg-slate-50 hover:text-[#004A1C] hover:scale-[1.02] disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)] dark:hover:bg-slate-800/80 dark:hover:text-[#ECC323]"
          >
            <DownloadIcon className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            Export CSV
          </button>

          {(startDate || endDate || barangay !== 'All') && (
            <button
              type="button"
              onClick={() => { setStartDate(''); setEndDate(''); setBarangay('All'); setReportType('distribution') }}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-all duration-300 hover:bg-slate-50 hover:text-[#004A1C] hover:scale-[1.02] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)] dark:hover:bg-slate-800/80 dark:hover:text-[#ECC323]"
            >
              <ClearIcon className="h-4 w-4 text-gray-500 dark:text-slate-400" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
          <AlertIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-red-800 dark:text-red-300">Error generating report</div>
            <div className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</div>
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────── */}
      {generated && overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<CubeIcon className="w-5 h-5" />}
            title="Total Distributions"
            value={`${overview.totalDistributions}`}
          />
          <StatCard
            icon={<UsersIcon className="w-5 h-5" />}
            title="Households Served"
            value={`${overview.totalClaimedHouseholds}`}
          />
          <StatCard
            icon={<TrendIcon className="w-5 h-5" />}
            title="Claim Rate"
            value={`${overview.claimRate}%`}
          />
          <StatCard
            icon={<UnclaimedIcon className="w-5 h-5" />}
            title="Unclaimed Households"
            value={`${overview.totalUnclaimedHouseholds}`}
          />
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────── */}
      {loading && <LoadingSpinner />}

      {/* ── Distribution Summary Table ────────────────────── */}
      {generated && !loading && reportType === 'distribution' && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]">
          <div className="border-b border-gray-100 p-5 dark:border-slate-800">
            <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-slate-100">
              <DocIcon className="h-5 w-5 text-gray-700 dark:text-slate-300" />
              <span>Distribution Report — {dateRangeLabel}</span>
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Summary of relief distributions by barangay for the selected period
            </div>
          </div>

          {distributions.length === 0 ? (
            <EmptyState message="No distributions found for the selected filters." />
          ) : (
            <>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse table-fixed min-w-[900px] lg:min-w-0">
                  <thead className="bg-gray-50 text-sm text-gray-500 dark:bg-slate-800/80 dark:text-slate-400">
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
                  <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
                    {distributions.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/70">
                        <td className="px-4 py-4 text-gray-600 dark:text-slate-300">{formatDate(r.scheduled || r.createdAt)}</td>
                        <td className="px-4 py-4 font-medium text-gray-700 dark:text-slate-100">{r.barangay}</td>
                        <td className="px-4 py-4 text-gray-700 dark:text-slate-200">{r.registeredHouseholds}</td>
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
                              className="rounded-full p-1 text-gray-400 transition-all duration-300 hover:bg-slate-50 hover:text-[#004A1C] dark:text-slate-500 dark:hover:bg-slate-800/50 dark:hover:text-[#ECC323]"
                            >
                              <DotsIcon />
                            </button>
                            {activeMenu === r.id && (
                              <div
                                className={[
                                  'absolute right-0 z-50 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_20px_45px_rgba(0,0,0,0.35)]',
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
              <div className="border-t border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                  <div className="mb-2 font-semibold text-gray-800 dark:text-slate-100">Report Summary</div>
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
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]">
          <div className="border-b border-gray-100 p-5 dark:border-slate-800">
            <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-slate-100">
              <DocIcon className="h-5 w-5 text-gray-700 dark:text-slate-300" />
              <span>Barangay Summary — {dateRangeLabel}</span>
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Aggregated relief distribution statistics grouped by barangay
            </div>
          </div>

          {barangaySummaryRows.length === 0 ? (
            <EmptyState message="No data found for the selected filters." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse table-fixed min-w-[700px] lg:min-w-0">
                <thead className="bg-gray-50 text-sm text-gray-500 dark:bg-slate-800/80 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-4 font-medium w-[20%]">Barangay</th>
                    <th className="px-4 py-4 font-medium w-[15%]">Distributions</th>
                    <th className="px-4 py-4 font-medium w-[15%]">Registered</th>
                    <th className="px-4 py-4 font-medium w-[15%]">Claimed</th>
                    <th className="px-4 py-4 font-medium w-[15%]">Unclaimed</th>
                    <th className="px-4 py-4 font-medium w-[20%]">Claim Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
                  {barangaySummaryRows.map((r) => {
                    const rate = r.registered > 0 ? Math.round((r.claimed / r.registered) * 100) : 0
                    return (
                      <tr key={r.barangay} className="hover:bg-gray-50 dark:hover:bg-slate-800/70">
                        <td className="px-4 py-4 font-medium text-gray-700 dark:text-slate-100">{r.barangay}</td>
                        <td className="px-4 py-4 text-gray-700 dark:text-slate-200">{r.distributions}</td>
                        <td className="px-4 py-4 text-gray-700 dark:text-slate-200">{r.registered}</td>
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
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]">
            <div className="font-semibold text-gray-900 dark:text-slate-100">Distribution Trends</div>
            <div className="mb-4 text-sm text-gray-500 dark:text-slate-400">Monthly distributions vs. claims (last 6 months)</div>
            {monthlyTrends.length > 0 ? (
              <MiniBarChart
                labels={monthlyTrends.map((t) => t.month.split(' ')[0])}
                seriesA={monthlyTrends.map((t) => t.distributions)}
                seriesB={monthlyTrends.map((t) => t.claimed)}
                legendA="Distributions"
                legendB="Claims"
              />
            ) : (
              <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">No trend data available</div>
            )}
          </div>

          {/* Barangay Donut */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]">
            <div className="font-semibold text-gray-900 dark:text-slate-100">Distribution by Barangay</div>
            <div className="mb-4 text-sm text-gray-500 dark:text-slate-400">Number of distributions per barangay</div>
            {barangayBreakdown.length > 0 ? (
              <Donut
                segments={barangayBreakdown.map((b, i) => ({
                  label: `${b.barangay}: ${b.distributions}`,
                  value: b.distributions,
                  stroke: DONUT_COLORS[i % DONUT_COLORS.length],
                }))}
              />
            ) : (
              <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">No barangay data available</div>
            )}
          </div>
        </div>
      )}

      {/* ── Verification Methods Card ─────────────────────── */}
      {generated && !loading && verification && (verification.qr > 0 || verification.face > 0) && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]">
          <div className="mb-1 font-semibold text-gray-900 dark:text-slate-100">Verification Methods</div>
          <div className="mb-4 text-sm text-gray-500 dark:text-slate-400">How households verified their claims</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <QRIcon className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{verification.qr}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">QR Code Scans</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <FaceIcon className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{verification.face}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">Face Recognition</div>
              </div>
            </div>
            {verification.unknown > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 dark:bg-slate-800/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-700">
                  <QuestionIcon className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{verification.unknown}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">Other / Manual</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Not generated state ───────────────────────────── */}
      {!generated && !loading && (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]">
          <EmptyState message="Click Generate Report to view distribution data." />
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────── */}
      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </div>
  )
}

