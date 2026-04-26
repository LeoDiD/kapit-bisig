'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import HouseholdProfileModal from './HouseholdProfileModal'
import type { HouseholdRow } from '@/app/households/page'

const ROWS_PER_PAGE = 5

interface HouseholdsTableProps {
  rows: HouseholdRow[]
  loading: boolean
  error: string | null
  hasAnyRows: boolean
  onRetry: () => void
  searchQuery: string
  onSearchChange: (v: string) => void
  barangay: string
  barangayOptions: string[]
  onBarangayChange: (v: string) => void
  status: string
  statusOptions: string[]
  onStatusChange: (v: string) => void
}

export default function HouseholdsTable({
  rows,
  loading,
  error,
  hasAnyRows,
  onRetry,
  searchQuery,
  onSearchChange,
  barangay,
  barangayOptions,
  onBarangayChange,
  status,
  statusOptions,
  onStatusChange,
}: HouseholdsTableProps) {
  // Modal
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Dropdowns
  const [barangayOpen, setBarangayOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const barangayBtnRef = useRef<HTMLButtonElement>(null)
  const barangayMenuRef = useRef<HTMLDivElement>(null)
  const statusBtnRef = useRef<HTMLButtonElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const t = event.target as Node
      if (!barangayBtnRef.current?.contains(t) && !barangayMenuRef.current?.contains(t)) setBarangayOpen(false)
      if (!statusBtnRef.current?.contains(t) && !statusMenuRef.current?.contains(t)) setStatusOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, barangay, status])

  const handleViewProfile = (household: HouseholdRow) => {
    setSelectedHousehold(household)
    setIsModalOpen(true)
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '--'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const hasActiveFilters = searchQuery.trim().length > 0 || barangay !== 'All Barangays' || status !== 'All Status'
  const activeFilterCount = [
    searchQuery.trim().length > 0,
    barangay !== 'All Barangays',
    status !== 'All Status',
  ].filter(Boolean).length

  const { visibleClaimed, visiblePending } = useMemo(() => {
    const claimedCount = rows.filter((item) => item.claimStatus === 'Claimed').length
    return {
      visibleClaimed: claimedCount,
      visiblePending: rows.length - claimedCount,
    }
  }, [rows])

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedRows = useMemo(
    () => rows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE),
    [rows, currentPage],
  )
  const rangeStart = rows.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1
  const rangeEnd = Math.min(currentPage * ROWS_PER_PAGE, rows.length)

  return (
    <>
      <div className="mb-12 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)] dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-100 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] uppercase text-gray-500 dark:text-slate-400">Relief Registry</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">
                {loading ? 'Loading registry data...' : `${rows.length} visible record(s)`}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Each row is a resident-based relief record used for claim tracking.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                Claimed: {visibleClaimed}
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                Pending: {visiblePending}
              </span>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 bg-gray-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/70 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search by resident, code, barangay, or address..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
              <div className="relative min-w-[180px] flex-1 sm:flex-none">
                <button
                  ref={barangayBtnRef}
                  onClick={() => {
                    setBarangayOpen(!barangayOpen)
                    setStatusOpen(false)
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
                >
                  <span className="truncate">{barangay}</span>
                  <ChevronDownIcon />
                </button>
                {barangayOpen && (
                  <DropdownMenu
                    menuRef={barangayMenuRef}
                    items={barangayOptions.map((v) => ({ value: v, label: v }))}
                    selected={barangay}
                    onSelect={(v) => {
                      onBarangayChange(v)
                      setBarangayOpen(false)
                    }}
                  />
                )}
              </div>

              <div className="relative min-w-[140px] flex-1 sm:flex-none">
                <button
                  ref={statusBtnRef}
                  onClick={() => {
                    setStatusOpen(!statusOpen)
                    setBarangayOpen(false)
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
                >
                  <span className="truncate">{status}</span>
                  <ChevronDownIcon />
                </button>
                {statusOpen && (
                  <DropdownMenu
                    menuRef={statusMenuRef}
                    items={statusOptions.map((v) => ({ value: v, label: v }))}
                    selected={status}
                    onSelect={(v) => {
                      onStatusChange(v)
                      setStatusOpen(false)
                    }}
                  />
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('')
                    onBarangayChange('All Barangays')
                    onStatusChange('All Status')
                  }}
                  className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
                >
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <SpinnerIcon className="h-8 w-8 text-gray-700" />
              <p className="mt-3 text-sm font-medium text-gray-600">Fetching relief registry...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <p className="text-lg font-semibold text-red-600">{error}</p>
              <button
                onClick={onRetry}
                className="mt-4 inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
              >
                Retry Fetch
              </button>
            </div>
          ) : !hasAnyRows || rows.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400">
              <UsersMenuIcon className="mb-4 h-12 w-12 opacity-50" />
              <p className="font-bold text-gray-900 dark:text-slate-100">No relief records found</p>
              <p className="mt-1 text-sm">Try adjusting your active filters or clear them.</p>
            </div>
          ) : (
            <table className="w-full min-w-[950px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-white text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  <th className="px-6 py-4 font-bold">Resident Record</th>
                  <th className="px-6 py-4 font-bold">Barangay</th>
                  <th className="px-6 py-4 font-bold">Claim Status</th>
                  <th className="px-6 py-4 font-bold">Last Claimed</th>
                  <th className="px-6 py-4 font-bold">Members</th>
                  <th className="px-6 py-4 pr-10 pt-4 text-right font-bold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-700 dark:bg-slate-900">
                {paginatedRows.map((item) => (
                  <tr key={item.id} className="group transition-colors hover:bg-gray-50/80 dark:hover:bg-slate-800/55">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {item.familyHeadName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{item.familyHeadName}</p>
                          <p className="mt-0.5 max-w-[260px] truncate line-clamp-1 text-xs text-gray-500 dark:text-slate-400">
                            {item.householdCode ? `Registry ${item.householdCode} | ` : ''}
                            {item.address}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-700 dark:bg-slate-800 dark:text-slate-200">{item.barangay}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${
                          item.claimStatus === 'Claimed'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.claimStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-slate-300">{formatDate(item.lastClaimedAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <UsersMenuIcon className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                        {item.familyMembersCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 pr-6 text-right">
                      <button
                        onClick={() => handleViewProfile(item)}
                        className="inline-flex flex-shrink-0 items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-gray-50 hover:text-blue-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/60 dark:hover:bg-slate-700/80 dark:hover:text-blue-300 md:opacity-0 md:group-hover:opacity-100"
                      >
                        View Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && rows.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Showing {rangeStart}-{rangeEnd} of {rows.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Previous
              </button>

              <span className="min-w-[88px] text-center text-xs font-semibold text-gray-600 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <HouseholdProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedHousehold}
      />
    </>
  )
}

function DropdownMenu({
  menuRef,
  items,
  selected,
  onSelect,
}: {
  menuRef: React.RefObject<HTMLDivElement>
  items: { value: string; label: string }[]
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900 md:w-[120%]"
    >
      {items.map((opt) => {
        const isSelected = opt.value === selected
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              isSelected ? 'bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-700 hover:bg-gray-50 font-medium dark:text-slate-200 dark:hover:bg-slate-800/80'
            }`}
          >
            <span className="truncate">{opt.label}</span>
            {isSelected && <CheckIcon className="w-4 h-4" />}
          </button>
        )
      })}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function UsersMenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" className="opacity-20" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

