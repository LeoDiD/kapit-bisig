'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { api, DistributionHouseholdsData } from '../../lib/api'
import type { DistributionRow } from './DistributionsTable'

const HOUSEHOLDS_PER_PAGE = 8

export default function ViewHouseholdsModal({
  open,
  onClose,
  distribution,
}: {
  open: boolean
  onClose: () => void
  distribution: DistributionRow | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DistributionHouseholdsData | null>(null)
  const [activeTab, setActiveTab] = useState<'claimed' | 'notYetClaimed'>('notYetClaimed')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newClaimCount, setNewClaimCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const knownClaimIdsRef = useRef<Set<string>>(new Set())
  const hasLoadedRef = useRef(false)

  const fetchData = useCallback(async (distributionId: string, silent = false) => {
    if (silent) setIsRefreshing(true)
    else setLoading(true)
    if (!silent) setError(null)
    try {
      const res = await api.getDistributionHouseholds(distributionId)
      if (res.success && res.data) {
        const nextIds = new Set(res.data.claimed.map((claim) => claim.claimId || claim.householdId))
        if (hasLoadedRef.current) {
          const newlyDetected = [...nextIds].filter((id) => !knownClaimIdsRef.current.has(id)).length
          if (newlyDetected > 0) setNewClaimCount((count) => count + newlyDetected)
        }
        knownClaimIdsRef.current = nextIds
        hasLoadedRef.current = true
        setData(res.data)
        setLastUpdated(new Date())
      } else if (!silent) setError(res.message || 'Failed to load households')
    } catch (err: unknown) {
      console.error('Failed to load households:', err)
      if (!silent) setError('Failed to load households. Please try again.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (open && distribution) {
      setSearch('')
      setActiveTab('notYetClaimed')
      setPage(1)
      setData(null)
      setNewClaimCount(0)
      setLastUpdated(null)
      knownClaimIdsRef.current = new Set()
      hasLoadedRef.current = false
      fetchData(distribution.id)
    }
  }, [open, distribution, fetchData])

  useEffect(() => {
    setPage(1)
  }, [activeTab, search])

  useEffect(() => {
    if (!open || !distribution) return
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') fetchData(distribution.id, true)
    }
    const intervalId = window.setInterval(refreshIfVisible, 3000)
    document.addEventListener('visibilitychange', refreshIfVisible)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [open, distribution, fetchData])

  if (!open || !distribution) return null

  const noRegistered = data && data.totals.registered === 0
  const populationLabel = data?.requiresBeneficiaryApproval ? 'Eligible' : 'Registered'
  const emptyPopulationLabel = data?.requiresBeneficiaryApproval ? 'approved beneficiary' : 'registered household'

  const filteredClaimed = data?.claimed.filter((h) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      h.householdName.toLowerCase().includes(q) ||
      (h.householdCode || '').toLowerCase().includes(q) ||
      h.barangay.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q)
    )
  }) ?? []

  const filteredNotYetClaimed = data?.notYetClaimed.filter((h) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      h.householdName.toLowerCase().includes(q) ||
      (h.householdCode || '').toLowerCase().includes(q) ||
      h.barangay.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q)
    )
  }) ?? []

  const activeItemsCount = activeTab === 'claimed' ? filteredClaimed.length : filteredNotYetClaimed.length
  const totalPages = Math.max(1, Math.ceil(activeItemsCount / HOUSEHOLDS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const rangeStart = (currentPage - 1) * HOUSEHOLDS_PER_PAGE
  const rangeEnd = currentPage * HOUSEHOLDS_PER_PAGE
  const paginatedClaimed = filteredClaimed.slice(
    rangeStart,
    rangeEnd,
  )
  const paginatedNotYetClaimed = filteredNotYetClaimed.slice(
    (currentPage - 1) * HOUSEHOLDS_PER_PAGE,
    currentPage * HOUSEHOLDS_PER_PAGE,
  )

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="min-h-full px-4 py-8 flex items-start justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col max-h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="p-5 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#0F533A] flex items-center justify-center">
                  <UsersIcon />
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">Covered Households</div>
                  <div className="text-xs text-gray-500">Host: {distribution.barangay}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fetchData(distribution.id, true)} disabled={isRefreshing} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  {isRefreshing ? 'Refreshing…' : 'Refresh'}
                </button>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors" aria-label="Close"><XIcon /></button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 pb-5 overflow-y-auto flex-1">
            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading households…
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-center">
                {error}
              </div>
            )}

            {/* No registered households */}
            {!loading && !error && noRegistered && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <UsersEmptyIcon />
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  No {emptyPopulationLabel}.
                </p>
              </div>
            )}

            {/* Has registered households */}
            {!loading && !error && data && !noRegistered && (
              <div className="space-y-4">
                {newClaimCount > 0 && (
                  <button type="button" onClick={() => { setActiveTab('claimed'); setNewClaimCount(0) }} className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-800 hover:bg-emerald-100">
                    New claim recorded ({newClaimCount}). View the Claimed tab →
                  </button>
                )}
                {lastUpdated && <div className="text-right text-[11px] text-gray-400">Live · updated {lastUpdated.toLocaleTimeString('en-PH')}</div>}

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <SummaryCard label={populationLabel} value={data.totals.registered} color="text-gray-900" />
                  <SummaryCard label="Claimed" value={data.totals.claimed} color="text-green-600" />
                  <SummaryCard label="Not Yet Claimed" value={data.totals.notYetClaimed} color="text-[#EAB308]" />
                </div>

                {/* Search */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <SearchIcon />
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search households..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm text-gray-800 placeholder-gray-400"
                  />
                </div>

                {/* Tabs */}
                <div className="flex rounded-xl bg-gray-100 p-1">
                  <TabButton
                    active={activeTab === 'notYetClaimed'}
                    label={`Not Yet Claimed (${data.totals.notYetClaimed})`}
                    onClick={() => setActiveTab('notYetClaimed')}
                  />
                  <TabButton
                    active={activeTab === 'claimed'}
                    label={`Claimed (${data.totals.claimed})`}
                    onClick={() => setActiveTab('claimed')}
                  />
                </div>

                {/* Lists */}
                {activeTab === 'notYetClaimed' && (
                  <div className="space-y-2">
                    {filteredNotYetClaimed.length === 0 ? (
                      <EmptyList message={search ? 'No households match your search.' : 'All households have claimed.'} />
                    ) : (
                      paginatedNotYetClaimed.map((h) => (
                        <HouseholdCard key={h.householdId} name={h.householdName} code={h.householdCode} barangay={h.barangay} address={h.address} />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'claimed' && (
                  <div className="space-y-2">
                    {filteredClaimed.length === 0 ? (
                      <EmptyList message={search ? 'No households match your search.' : 'No households have claimed yet.'} />
                    ) : (
                      paginatedClaimed.map((h) => (
                        <div
                          key={h.householdId}
                          className="p-3 bg-gray-50 rounded-xl border border-gray-100"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{h.householdName}</div>
                              <div className="text-[11px] font-semibold text-gray-500">{h.householdCode || 'No household code'} · {h.barangay}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{h.address}</div>
                              {h.claimId && <div className="text-[11px] text-gray-400">Claim ID: {h.claimId}</div>}
                            </div>
                            {h.proofMethod && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 shrink-0">
                                {h.proofMethod}
                              </span>
                            )}
                          </div>
                          {h.claimedAt && (
                            <div className="text-[11px] text-gray-400 mt-1.5">
                              Claimed: {new Date(h.claimedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                          {(h.scanner?.name || h.claimedBy?.name) && (
                            <div className="text-[11px] text-gray-400">
                              Scanned by: {h.scanner?.name || h.claimedBy?.name}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeItemsCount > 0 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={HOUSEHOLDS_PER_PAGE}
                    totalItems={activeItemsCount}
                    onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
                    onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ----- Sub-components ----- */

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  )
}

function HouseholdCard({ name, code, barangay, address }: { name: string; code: string | null; barangay: string; address: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="text-sm font-medium text-gray-900">{name}</div>
      <div className="text-[11px] font-semibold text-gray-500">{code || 'No household code'} · {barangay}</div>
      <div className="text-xs text-gray-500 mt-0.5">{address}</div>
    </div>
  )
}

function EmptyList({ message }: { message: string }) {
  return (
    <div className="text-center py-6 text-sm text-gray-400">
      {message}
    </div>
  )
}

function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPrev,
  onNext,
}: {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPrev: () => void
  onNext: () => void
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-xs text-gray-500">
        Showing {start}-{end} of {totalItems}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage <= 1}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-xs font-medium text-gray-600">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

/* ----- Icons ----- */

function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function UsersEmptyIcon() {
  return (
    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
