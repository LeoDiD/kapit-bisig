'use client'

import React, { useState } from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LedgerOffChainMatch {
  householdCode: string
  claimId: string
  barangay: string
  distributionSite: string
  lguStaff: string
  verification: 'Verified' | 'Manual Override' | 'Failed'
}

export interface LedgerRow {
  id: string
  barangay: string
  dateTimeISO: string
  householdCode: string
  householdHash: string
  txHash: string
  eventHash: string
  staffSigner: string
  blockNumber: number
  status: 'Confirmed' | 'Pending' | 'Failed'
  offChainMatch?: LedgerOffChainMatch | null
}

export interface BarangayGroup {
  barangay: string
  rows: LedgerRow[]
  claimed: number
  pending: number
  failed: number
  lastActivity: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function shortenHash(hash: string): string {
  if (hash.length <= 14) return hash
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`
}

export function groupByBarangay(rows: LedgerRow[]): BarangayGroup[] {
  const map = new Map<string, LedgerRow[]>()
  for (const r of rows) {
    const arr = map.get(r.barangay) || []
    arr.push(r)
    map.set(r.barangay, arr)
  }

  const groups: BarangayGroup[] = []
  for (const [barangay, groupRows] of map) {
    const sorted = [...groupRows].sort(
      (a, b) => new Date(b.dateTimeISO).getTime() - new Date(a.dateTimeISO).getTime()
    )
    groups.push({
      barangay,
      rows: sorted,
      claimed: sorted.filter((r) => r.status === 'Confirmed').length,
      pending: sorted.filter((r) => r.status === 'Pending').length,
      failed: sorted.filter((r) => r.status === 'Failed').length,
      lastActivity: sorted[0] ? formatShort(sorted[0].dateTimeISO) : '',
    })
  }

  groups.sort((a, b) => a.barangay.localeCompare(b.barangay))
  return groups
}

function formatShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDateTimeFull(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/* ------------------------------------------------------------------ */
/*  Copy hook                                                          */
/* ------------------------------------------------------------------ */

export function useCopyToast() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // ignore
    }
  }

  return { copiedId, copy }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  groups: BarangayGroup[]
  onViewClaim: (row: LedgerRow) => void
}

export default function BlockchainLedgerTable({ groups, onViewClaim }: Props) {
  const [expandedSet, setExpandedSet] = useState<Set<string>>(() => new Set())
  const { copiedId, copy } = useCopyToast()

  const toggle = (barangay: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev)
      if (next.has(barangay)) next.delete(barangay)
      else next.add(barangay)
      return next
    })
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <SearchIcon className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 font-medium">No claims match your filters.</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const isOpen = expandedSet.has(g.barangay)
        return (
          <div
            key={g.barangay}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => toggle(g.barangay)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors text-left"
            >
              <span className="text-sm font-semibold text-gray-900">{g.barangay}</span>

              <div className="flex items-center gap-3 flex-wrap justify-end">
                {g.claimed > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-700">
                    <ConfirmedDot />
                    {g.claimed} Claimed
                  </span>
                )}
                {g.pending > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-yellow-700">
                    <PendingDot />
                    {g.pending} Pending
                  </span>
                )}
                {g.failed > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
                    <FailedDot />
                    {g.failed} Failed
                  </span>
                )}
                {g.lastActivity && (
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    Last: {g.lastActivity}
                  </span>
                )}
                <ChevronIcon open={isOpen} />
              </div>
            </button>

            {/* Expanded Table */}
            {isOpen && (
              <div className="border-t border-gray-100">
                {g.rows.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">
                    No claimed households yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
                          <th className="px-5 py-2.5">Date/Time</th>
                          <th className="px-4 py-2.5">Household</th>
                          <th className="px-4 py-2.5">Household Hash</th>
                          <th className="px-4 py-2.5">Tx Hash</th>
                          <th className="px-4 py-2.5">Block #</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {g.rows.map((row) => (
                          <tr
                            key={row.id}
                            className="text-[13px] text-gray-700 hover:bg-gray-50/60"
                          >
                            <td className="px-5 py-3 whitespace-nowrap">
                              {formatDateTimeFull(row.dateTimeISO)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-medium">
                              {row.householdCode}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-gray-600">
                                {shortenHash(row.householdHash)}
                                <CopyBtn
                                  value={row.householdHash}
                                  id={`hh-${row.id}`}
                                  copiedId={copiedId}
                                  onCopy={copy}
                                />
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-gray-600">
                                {shortenHash(row.txHash)}
                                <CopyBtn
                                  value={row.txHash}
                                  id={`tx-${row.id}`}
                                  copiedId={copiedId}
                                  onCopy={copy}
                                />
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {row.blockNumber.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <StatusBadge status={row.status} />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => onViewClaim(row)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500"
                                aria-label={`View claim ${row.id}`}
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Copy Toast */}
      {copiedId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium shadow-lg">
          Copied!
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

export function StatusBadge({ status }: { status: 'Confirmed' | 'Pending' | 'Failed' }) {
  const cls =
    status === 'Confirmed'
      ? 'bg-green-600 text-white'
      : status === 'Pending'
        ? 'bg-yellow-500 text-white'
        : 'bg-red-500 text-white'

  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}

export function CopyBtn({
  value,
  id,
  copiedId,
  onCopy,
}: {
  value: string
  id: string
  copiedId: string | null
  onCopy: (text: string, id: string) => void
}) {
  const isCopied = copiedId === id
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onCopy(value, id)
      }}
      className="text-gray-400 hover:text-gray-600 p-0.5"
      aria-label="Copy"
      title={isCopied ? 'Copied!' : 'Copy'}
    >
      {isCopied ? (
        <CheckIcon className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <CopyIcon className="w-3.5 h-3.5" />
      )}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Small visual elements                                              */
/* ------------------------------------------------------------------ */

function ConfirmedDot() {
  return (
    <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 8l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PendingDot() {
  return (
    <svg className="w-3.5 h-3.5 text-yellow-500" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FailedDot() {
  return (
    <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 16 16" fill="none">
      <path d="M8 1l6.93 12H1.07L8 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

export function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
