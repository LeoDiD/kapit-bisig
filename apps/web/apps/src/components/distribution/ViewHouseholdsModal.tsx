'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { api, DistributionHouseholdsData } from '../../lib/api'
import type { DistributionRow } from './DistributionsTable'

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

  const fetchData = useCallback(async (distributionId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getDistributionHouseholds(distributionId)
      if (res.success && res.data) {
        setData(res.data)
      } else {
        setError(res.message || 'Failed to load households')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load households'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && distribution) {
      setSearch('')
      setActiveTab('notYetClaimed')
      setData(null)
      fetchData(distribution.id)
    }
  }, [open, distribution, fetchData])

  if (!open || !distribution) return null

  const noRegistered = data && data.totals.registered === 0

  const filteredClaimed = data?.claimed.filter((h) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      h.householdName.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q)
    )
  }) ?? []

  const filteredNotYetClaimed = data?.notYetClaimed.filter((h) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      h.householdName.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q)
    )
  }) ?? []

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
                  <div className="text-base font-semibold text-gray-900">
                    Households — {distribution.barangay}
                  </div>
                  <div className="text-xs text-gray-500">
                    Distribution Household Tracking
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <XIcon />
              </button>
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
                  No registered household.
                </p>
              </div>
            )}

            {/* Has registered households */}
            {!loading && !error && data && !noRegistered && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <SummaryCard label="Registered" value={data.totals.registered} color="text-gray-900" />
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
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredNotYetClaimed.length === 0 ? (
                      <EmptyList message={search ? 'No households match your search.' : 'All households have claimed.'} />
                    ) : (
                      filteredNotYetClaimed.map((h) => (
                        <HouseholdCard key={h.householdId} name={h.householdName} address={h.address} />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'claimed' && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredClaimed.length === 0 ? (
                      <EmptyList message={search ? 'No households match your search.' : 'No households have claimed yet.'} />
                    ) : (
                      filteredClaimed.map((h) => (
                        <div
                          key={h.householdId}
                          className="p-3 bg-gray-50 rounded-xl border border-gray-100"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{h.householdName}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{h.address}</div>
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
                          {h.claimedBy?.name && (
                            <div className="text-[11px] text-gray-400">
                              By: {h.claimedBy.name}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
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

function HouseholdCard({ name, address }: { name: string; address: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="text-sm font-medium text-gray-900">{name}</div>
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
