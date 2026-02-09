'use client'

import React, { useMemo, useState } from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import {
  BlockchainLedgerStats,
  BlockchainLedgerTable,
  ClaimDetailsModal,
  RecordClaimModal,
  type LedgerClaim,
} from '@/components/blockchain-ledger'

const MOCK_CLAIMS: LedgerClaim[] = [
  {
    id: '1',
    dateTime: 'Jun 15, 2024 10:12',
    barangay: 'Barangay Santo Niño',
    packType: 'Medical Kit',
    householdHash: '0x0f7291b9a3e27a32f3a6',
    txHash: '0x6e5c5060a1b2c3d4e5f6',
    blockNumber: '1,847,305',
    status: 'Confirmed',
  },
  {
    id: '2',
    dateTime: 'Jun 15, 2024 09:45',
    barangay: 'Barangay San Jose',
    packType: 'Food Pack',
    householdHash: '0x6359d1aa2bfd9138c1aa',
    txHash: '0xa98e80e99fe725aa12bb',
    blockNumber: '1,847,301',
    status: 'Pending',
  },
  {
    id: '3',
    dateTime: 'Jun 15, 2024 09:05',
    barangay: 'Barangay Santo Niño',
    packType: 'Hygiene Kit',
    householdHash: '0xf8bdb5a5fa0c2d1181cc',
    txHash: '0xd0035ca1583f9bb1c2dd',
    blockNumber: '1,847,295',
    status: 'Confirmed',
  },
  {
    id: '4',
    dateTime: 'Jun 14, 2024 15:10',
    barangay: 'Barangay Santo Niño',
    packType: 'Hygiene Kit',
    householdHash: '0x3c26bf392722aa81ff00',
    txHash: '0xdc72554eabddbb2a9c11',
    blockNumber: '1,847,218',
    status: 'Confirmed',
  },
]

export default function BlockchainLedgerPage() {
  const [query, setQuery] = useState('')
  const [recordOpen, setRecordOpen] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<LedgerClaim | null>(null)

  const filteredClaims = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return MOCK_CLAIMS

    return MOCK_CLAIMS.filter((c) => {
      return (
        c.barangay.toLowerCase().includes(q) ||
        c.packType.toLowerCase().includes(q) ||
        c.householdHash.toLowerCase().includes(q) ||
        c.txHash.toLowerCase().includes(q) ||
        c.blockNumber.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
      )
    })
  }, [query])

  return (
    <DashboardLayout>
      <Header
        title="Blockchain Claim Ledger"
        subtitle="Immutable record of claimed relief packs."
      />

      <BlockchainLedgerStats />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => setRecordOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#004A1C] hover:bg-[#003A16] text-white text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)] w-full sm:w-auto"
        >
          <QrIcon className="w-4 h-4" />
          Record Claim
        </button>

        <div className="relative w-full sm:flex-1 sm:ml-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by hash or barangay..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
          />
        </div>
      </div>

      <BlockchainLedgerTable claims={filteredClaims} onViewClaim={(c) => setSelectedClaim(c)} />

      <RecordClaimModal open={recordOpen} onClose={() => setRecordOpen(false)} />
      <ClaimDetailsModal
        open={!!selectedClaim}
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
      />
    </DashboardLayout>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  )
}

function QrIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2m2 0h2m-6-3h6"
      />
    </svg>
  )
}
