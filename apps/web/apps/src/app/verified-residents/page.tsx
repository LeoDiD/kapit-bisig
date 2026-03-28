'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout, Header } from '@/components/layout'
import api, { getScopedBarangays, ResidentRecord } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import FilterDropdown from '@/components/ui/FilterDropdown'
import { AiMatchBadge, ResidentStatusBadge } from '@/components/residents/ResidentTableBadges'

function maskResidentName(record: ResidentRecord): string {
  const raw =
    record.fullName?.trim() ||
    `${record.firstName || ''} ${record.lastName || ''}`.trim()
  if (!raw) return 'Uxxxx Uxxxx'

  const parts = raw.split(/\s+/).filter(Boolean)
  const firstInitial = (parts[0]?.[0] || 'U').toUpperCase()
  const lastInitial = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[0] || 'U').toUpperCase()
  return `${firstInitial}xxxx ${lastInitial}xxxx`
}

function maskMobileNumber(_mobile: string | undefined): string {
  return '09XXXXXXXXX'
}

export default function VerifiedResidentsPage() {
  const PAGE_SIZE = 5
  const { user, loading, isSuperadmin } = useAuth()
  const router = useRouter()

  const [rows, setRows] = useState<ResidentRecord[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [barangay, setBarangay] = useState('All Barangays')
  const [currentPage, setCurrentPage] = useState(1)

  const barangayOptions = useMemo(
    () => ['All Barangays', ...getScopedBarangays(user?.role, user?.assignedBarangays)],
    [user?.role, user?.assignedBarangays],
  )

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
    } else if (!isSuperadmin) {
      router.replace('/dashboard')
    }
  }, [loading, user, isSuperadmin, router])

  const fetchResidents = useCallback(async () => {
    setFetching(true)
    setError(null)
    try {
      const response = await api.getResidents({
        status: 'Approved',
        barangay,
        page: 1,
        limit: 100,
      })
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.message || 'Failed to load verified residents.')
      }
      setRows(response.data)
      setCurrentPage(1)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load verified residents.'
      setError(message)
      setRows([])
    } finally {
      setFetching(false)
    }
  }, [barangay])

  useEffect(() => {
    if (!user) return
    fetchResidents()
  }, [user, fetchResidents])

  const uniqueBarangayCount = useMemo(
    () => new Set(rows.map((r) => (r.barangay || '').trim()).filter(Boolean)).size,
    [rows],
  )
  const withHighMatch = useMemo(
    () => rows.filter((r) => r.verification?.aiVerificationStatus === 'High Match').length,
    [rows],
  )
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
    [rows.length, PAGE_SIZE],
  )
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, currentPage, PAGE_SIZE])
  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  )

  if (loading || !user || !isSuperadmin) return null

  return (
    <DashboardLayout>
      <Header
        title="Verified Residents"
        subtitle="All approved resident registrations"
      />

      {/* Top Metrics Ribbon */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl mb-6 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden">
        <StatSection 
          label="Total Verified" 
          value={rows.length} 
          icon={<CheckCircleIcon className="w-5 h-5 text-emerald-600" />} 
        />
        <StatSection 
          label="Barangays Rep." 
          value={uniqueBarangayCount} 
          icon={<MapIcon className="w-5 h-5 text-sky-600" />} 
        />
        <StatSection 
          label="High AI Match" 
          value={withHighMatch} 
          icon={<SparklesIcon className="w-5 h-5 text-violet-600" />} 
        />
      </div>

      {/* Unified Table Container */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col overflow-hidden mb-12">
        {/* Integrated Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/40 flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
             <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Resident inputs masked for data privacy
             </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Filters */}
            <div className="w-full lg:w-[220px]">
              <FilterDropdown
                value={barangay}
                onChange={(v) => setBarangay(v)}
                options={barangayOptions.map((item) => ({ value: item, label: item }))}
              />
            </div>
            
            {/* Refresh */}
            <button
              onClick={fetchResidents}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold shadow-sm transition-colors whitespace-nowrap lg:mt-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full">
          {error ? (
             <div className="p-8 text-center text-red-600 font-semibold text-sm">
               {error}
             </div>
          ) : (
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px] lg:min-w-0">
              <thead className="bg-white border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-[20%]">Name</th>
                  <th className="px-6 py-4 w-[15%]">Mobile</th>
                  <th className="px-6 py-4 w-[15%]">Barangay</th>
                  <th className="px-6 py-4 w-[20%]">AI Match</th>
                  <th className="px-6 py-4 w-[15%]">Submitted</th>
                  <th className="px-6 py-4 w-[15%] text-right pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-sm">
                {fetching ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-16 text-center text-gray-500 font-medium" colSpan={6}>
                      No verified residents found filtering by {barangay}.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((r) => {
                    const id = r._id || r.id || ''
                    return (
                      <tr key={id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4 font-bold text-gray-900 whitespace-normal break-words">{maskResidentName(r)}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium whitespace-normal break-words">{maskMobileNumber(r.mobileNumber)}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{r.barangay}</td>
                        <td className="px-6 py-4">
                          <AiMatchBadge record={r} />
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs font-bold tracking-wide whitespace-normal">
                          {r.createdAt ? new Date(r.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <ResidentStatusBadge status={r.status} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Integrated Pagination Footer */}
        {rows.length > 0 && !fetching && !error && (
          <div className="bg-gray-50/50 border-t border-gray-100 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-gray-500 tracking-wide uppercase">
              Page {currentPage} of {totalPages} <span className="text-gray-400 mx-1">|</span> {rows.length} Total
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors ${
                    page === currentPage
                      ? 'bg-gray-900 text-white border border-gray-900'
                      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// --- HELPER COMPONENTS ---

function StatSection({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="flex-1 flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors">
      <div>
        <p className="text-[11px] font-bold tracking-wider text-gray-500 uppercase mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-900 leading-tight">{value > 0 ? value : '--'}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
        {icon}
      </div>
    </div>
  )
}

function CheckCircleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function MapIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  )
}

function SparklesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}
