'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import {
  BlockchainLedgerStats,
  BlockchainLedgerTable,
  ClaimDetailsModal,
  RecordClaimModal,
  groupByBarangay,
  type LedgerRow,
} from '@/components/blockchain-ledger'
import type { LedgerStatsData } from '@/components/blockchain-ledger/BlockchainLedgerStats'
import api, { getScopedBarangays } from '@/lib/api'
import { showToast } from '@/lib/toast'
import { useAuth } from '@/lib/AuthContext'

/* ------------------------------------------------------------------ */
/*  Barangay & Status options                                          */
/* ------------------------------------------------------------------ */

// Barangay options are now computed dynamically per-user

type BarangayFilter = string

const STATUS_OPTIONS = ['All Status', 'Confirmed', 'Pending/Confirming', 'Chain Failed'] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]

/* ------------------------------------------------------------------ */
/*  Stats helpers – compute from the full (unfiltered) fetched rows    */
/* ------------------------------------------------------------------ */

function computeStats(rows: LedgerRow[]): LedgerStatsData {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()) // Sunday

  let claimsToday = 0
  let claimsThisWeek = 0
  const householdSet = new Set<string>()
  let pendingWrites = 0
  let failedWrites = 0

  for (const r of rows) {
    const d = new Date(r.dateTimeISO)
    if (d >= startOfToday) claimsToday++
    if (d >= startOfWeek) claimsThisWeek++
    householdSet.add(r.householdHash)
    if (r.status === 'Pending/Confirming') pendingWrites++
    if (r.status === 'Chain Failed') failedWrites++
  }

  return {
    claimsToday,
    claimsThisWeek,
    uniqueHouseholds: householdSet.size,
    duplicateBlocks: 0, // on-chain contract prevents duplicates; no way to count from ledger rows
    pendingWrites,
    failedWrites,
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BlockchainLedgerPage() {
  const { user } = useAuth()
  const BARANGAY_OPTIONS = useMemo(
    () => ['All Barangays', ...getScopedBarangays(user?.role, user?.assignedBarangays)],
    [user?.role, user?.assignedBarangays],
  )

  const [query, setQuery] = useState('')
  const [barangay, setBarangay] = useState<BarangayFilter>('All Barangays')
  const [status, setStatus] = useState<StatusFilter>('All Status')
  const [recordOpen, setRecordOpen] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<LedgerRow | null>(null)

  // Live data from API
  const [allRows, setAllRows] = useState<LedgerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dropdown state
  const [barangayOpen, setBarangayOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const barangayBtnRef = useRef<HTMLButtonElement>(null)
  const barangayMenuRef = useRef<HTMLDivElement>(null)
  const statusBtnRef = useRef<HTMLButtonElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  // ── Fetch claims from backend ──
  const fetchLedger = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getLedger()
      if (res.success && Array.isArray(res.data)) {
        setAllRows(res.data as LedgerRow[])
      } else {
        setAllRows([])
      }
    } catch {
      setError('Unable to connect to the server.')
      showToast.error('Failed to load blockchain ledger.')
      setAllRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLedger()
  }, [fetchLedger])

  // Auto-refresh while pending confirmations are visible.
  useEffect(() => {
    if (!allRows.some((r) => r.status === 'Pending/Confirming')) return
    const id = window.setInterval(() => {
      fetchLedger()
    }, 12000)
    return () => window.clearInterval(id)
  }, [allRows, fetchLedger])

  // Close dropdowns on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const t = e.target as HTMLElement
    if (!barangayBtnRef.current?.contains(t) && !barangayMenuRef.current?.contains(t)) {
      setBarangayOpen(false)
    }
    if (!statusBtnRef.current?.contains(t) && !statusMenuRef.current?.contains(t)) {
      setStatusOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  // Stats computed from ALL fetched rows (unfiltered)
  const stats = useMemo(() => computeStats(allRows), [allRows])

  // Client-side filtering
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allRows.filter((c) => {
      const matchesQuery =
        !q ||
        c.barangay.toLowerCase().includes(q) ||
        c.householdCode.toLowerCase().includes(q) ||
        c.householdHash.toLowerCase().includes(q) ||
        c.txHash.toLowerCase().includes(q)

      const matchesBarangay =
        barangay === 'All Barangays' || c.barangay === barangay

      const matchesStatus =
        status === 'All Status' || c.status === status

      return matchesQuery && matchesBarangay && matchesStatus
    })
  }, [query, barangay, status, allRows])

  const groups = useMemo(() => groupByBarangay(filtered), [filtered])

  return (
    <DashboardLayout>
      <Header
        title="Blockchain Claim Ledger"
        subtitle="Immutable record of claimed relief packs"
      />

      <BlockchainLedgerStats data={stats} />

      {/* Record Claim + Filters row */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-stretch lg:items-center">
        {/* Record Claim button */}
        <button
          type="button"
          onClick={() => setRecordOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#004A1C] hover:bg-[#003A16] text-white text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)] shrink-0"
        >
          <QrIcon className="w-4 h-4" />
          Record Claim
        </button>

        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon className="w-5 h-5" />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by hash, barangay, or household code…"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* Barangay Dropdown */}
        <div className="relative min-w-[200px]">
          <button
            ref={barangayBtnRef}
            type="button"
            onClick={() => {
              setBarangayOpen((v) => !v)
              setStatusOpen(false)
            }}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
          >
            <span className="text-xs">{barangay}</span>
            <ChevronDownIcon />
          </button>
          {barangayOpen && (
            <DropdownMenu
              menuRef={barangayMenuRef}
              items={BARANGAY_OPTIONS.map((v) => ({ value: v, label: v }))}
              selected={barangay}
              onSelect={(v) => {
                setBarangay(v as BarangayFilter)
                setBarangayOpen(false)
              }}
            />
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative min-w-[170px]">
          <button
            ref={statusBtnRef}
            type="button"
            onClick={() => {
              setStatusOpen((v) => !v)
              setBarangayOpen(false)
            }}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
          >
            <span className="text-xs">{status}</span>
            <ChevronDownIcon />
          </button>
          {statusOpen && (
            <DropdownMenu
              menuRef={statusMenuRef}
              items={STATUS_OPTIONS.map((v) => ({ value: v, label: v }))}
              selected={status}
              onSelect={(v) => {
                setStatus(v as StatusFilter)
                setStatusOpen(false)
              }}
            />
          )}
        </div>
      </div>

      {/* Loading / Error / Empty / Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-5 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="flex gap-3">
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <ExclamationIcon className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-sm text-gray-700 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchLedger}
            className="mt-3 text-sm text-green-700 hover:underline font-medium"
          >
            Retry
          </button>
        </div>
      ) : allRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <LedgerIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-700 font-medium">No claims recorded yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Claims will appear here once relief packs are distributed and recorded on-chain.
          </p>
        </div>
      ) : (
        <BlockchainLedgerTable
          groups={groups}
          onViewClaim={(row) => setSelectedClaim(row)}
        />
      )}

      {/* Modals */}
      <RecordClaimModal
        open={recordOpen}
        onClose={() => {
          setRecordOpen(false)
          fetchLedger() // refresh after recording
        }}
      />
      <ClaimDetailsModal
        open={!!selectedClaim}
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
      />
    </DashboardLayout>
  )
}

/* ------------------------------------------------------------------ */
/*  Dropdown menu (reused pattern from Distribution page)              */
/* ------------------------------------------------------------------ */

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
      className="absolute left-0 top-full mt-2 w-full rounded-2xl border border-[#DCDCDC] bg-[#ECECEC] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)] z-50 max-h-64 overflow-y-auto"
    >
      {items.map((opt) => {
        const isSelected = opt.value === selected
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={[
              'w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-left transition-colors',
              isSelected
                ? 'bg-[#EAB308] text-gray-900'
                : 'text-slate-700 hover:bg-white/70',
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
  )
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function QrIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2m2 0h2m-6-3h6" />
    </svg>
  )
}

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

function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  )
}

function LedgerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
