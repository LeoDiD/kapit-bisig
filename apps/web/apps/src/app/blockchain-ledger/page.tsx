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

/* ------------------------------------------------------------------ */
/*  Barangay & Status options                                          */
/* ------------------------------------------------------------------ */

const BARANGAY_OPTIONS = [
  'All Barangays',
  'Bolo',
  'Bongalon',
  'Dulig',
  'Laois',
  'Magsaysay',
  'Poblacion',
  'San Gonzalo',
  'San Jose',
  'Tobuan',
  'Uyong',
] as const

type BarangayFilter = (typeof BARANGAY_OPTIONS)[number]

const STATUS_OPTIONS = ['All Status', 'Confirmed', 'Pending', 'Failed'] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]

/* ------------------------------------------------------------------ */
/*  Mock data (realistic, matching the 10 barangays)                   */
/* ------------------------------------------------------------------ */

const MOCK_CLAIMS: LedgerRow[] = [
  // ── Bolo ──
  {
    id: 'bl-1',
    barangay: 'Bolo',
    dateTimeISO: '2024-06-15T09:45:00Z',
    householdCode: 'HH-BL-0008',
    householdHash: '0x50acea3b9f22d71e88a3c4596491',
    txHash: '0xf311dd8a12bc5e4f9a73bf0831',
    eventHash: '0xe9ad7c2b33f1a85d0187a2',
    staffSigner: '0xb9bc3f7a22e1d894c0734c',
    blockNumber: 1847301,
    status: 'Pending',
    offChainMatch: null,
  },
  {
    id: 'bl-2',
    barangay: 'Bolo',
    dateTimeISO: '2024-06-15T07:15:00Z',
    householdCode: 'HH-BL-0022',
    householdHash: '0x3441d7ee91c4a5b1f399942f',
    txHash: '0xbeaa6e0d3f17c8a29abf09d8',
    eventHash: '0x919d4a8f02c7eb3dec0d',
    staffSigner: '0xd671a3c82e4b9f1f67',
    blockNumber: 1847280,
    status: 'Confirmed',
    offChainMatch: {
      householdCode: 'HH-BL-0022',
      claimId: 'CLM-2024-0189',
      barangay: 'Bolo',
      distributionSite: 'Bolo Barangay Hall',
      lguStaff: 'Luis Tan',
      verification: 'Verified',
    },
  },
  // ── Bongalon ──
  {
    id: 'bg-1',
    barangay: 'Bongalon',
    dateTimeISO: '2024-06-13T09:44:00Z',
    householdCode: 'HH-BG-0015',
    householdHash: '0x8c4f2a1b6e93d507cc81',
    txHash: '0xa23b7f091cc4d58e2f88',
    eventHash: '0x7b2c93a05d1e8f44bb11',
    staffSigner: '0xc5a912e73f8b64dd0022',
    blockNumber: 1847155,
    status: 'Confirmed',
    offChainMatch: {
      householdCode: 'HH-BG-0015',
      claimId: 'CLM-2024-0175',
      barangay: 'Bongalon',
      distributionSite: 'Bongalon Covered Court',
      lguStaff: 'Maria Santos',
      verification: 'Verified',
    },
  },
  // ── Dulig ──
  {
    id: 'dl-1',
    barangay: 'Dulig',
    dateTimeISO: '2024-06-14T14:33:00Z',
    householdCode: 'HH-DL-0011',
    householdHash: '0x009be1c3a79f45dabe32ba',
    txHash: '0x6c8f36a12b8e5d9c28f613',
    eventHash: '0xd82f4a15ce0b73946611',
    staffSigner: '0x2a91bc7f3e4560fd8833',
    blockNumber: 1847210,
    status: 'Failed',
    offChainMatch: null,
  },
  // ── Laois ──
  {
    id: 'la-1',
    barangay: 'Laois',
    dateTimeISO: '2024-06-15T11:30:00Z',
    householdCode: 'HH-LA-0003',
    householdHash: '0x5e7a1c0bf923d48e6644',
    txHash: '0x91a4c3b8d2f7e50a1177',
    eventHash: '0xfe2a7931b4d85c069f22',
    staffSigner: '0xa87b3e12cf945d06dd44',
    blockNumber: 1847310,
    status: 'Pending',
    offChainMatch: null,
  },
  // ── Magsaysay ──
  {
    id: 'mg-1',
    barangay: 'Magsaysay',
    dateTimeISO: '2024-06-15T10:12:00Z',
    householdCode: 'HH-MG-0041',
    householdHash: '0x0f7291b9a3e27a32f3a6',
    txHash: '0x6e5c5060a1b2c3d4e5f6',
    eventHash: '0xcc9812efa4b730c15d33',
    staffSigner: '0xf19a7c340b8e25d6aa55',
    blockNumber: 1847305,
    status: 'Confirmed',
    offChainMatch: {
      householdCode: 'HH-MG-0041',
      claimId: 'CLM-2024-0191',
      barangay: 'Magsaysay',
      distributionSite: 'Magsaysay Barangay Hall',
      lguStaff: 'Ana Reyes',
      verification: 'Verified',
    },
  },
  // ── Poblacion ──
  {
    id: 'pb-1',
    barangay: 'Poblacion',
    dateTimeISO: '2024-06-14T16:20:00Z',
    householdCode: 'HH-PB-0009',
    householdHash: '0xaa22b4c1d3e5f607a899',
    txHash: '0xbb33c5d2e4f60718b900',
    eventHash: '0xdd44e6f3a5071829cb11',
    staffSigner: '0xee55f704b618293adc22',
    blockNumber: 1847225,
    status: 'Confirmed',
    offChainMatch: {
      householdCode: 'HH-PB-0009',
      claimId: 'CLM-2024-0180',
      barangay: 'Poblacion',
      distributionSite: 'Poblacion Multi-Purpose Hall',
      lguStaff: 'Carlo Mendoza',
      verification: 'Verified',
    },
  },
  {
    id: 'pb-2',
    barangay: 'Poblacion',
    dateTimeISO: '2024-06-14T15:55:00Z',
    householdCode: 'HH-PB-0017',
    householdHash: '0xff66a815c729304bed33',
    txHash: '0x1177b926d83a415cfe44',
    eventHash: '0x2288ca37e94b526d0f55',
    staffSigner: '0x3399db48fa5c637e1066',
    blockNumber: 1847220,
    status: 'Confirmed',
    offChainMatch: {
      householdCode: 'HH-PB-0017',
      claimId: 'CLM-2024-0179',
      barangay: 'Poblacion',
      distributionSite: 'Poblacion Multi-Purpose Hall',
      lguStaff: 'Carlo Mendoza',
      verification: 'Manual Override',
    },
  },
  // ── San Gonzalo ──
  {
    id: 'sg-1',
    barangay: 'San Gonzalo',
    dateTimeISO: '2024-06-14T13:10:00Z',
    householdCode: 'HH-SG-0006',
    householdHash: '0x44aabb59c06d748e2f77',
    txHash: '0x55bbcc6ad17e859f3088',
    eventHash: '0x66ccdd7be28f960a4199',
    staffSigner: '0x77ddee8cf3a0a71b52aa',
    blockNumber: 1847200,
    status: 'Confirmed',
    offChainMatch: {
      householdCode: 'HH-SG-0006',
      claimId: 'CLM-2024-0174',
      barangay: 'San Gonzalo',
      distributionSite: 'San Gonzalo Elementary School',
      lguStaff: 'Elena Cruz',
      verification: 'Verified',
    },
  },
  // ── San Jose ──
  {
    id: 'sj-1',
    barangay: 'San Jose',
    dateTimeISO: '2024-06-15T09:05:00Z',
    householdCode: 'HH-SJ-0033',
    householdHash: '0xf8bdb5a5fa0c2d1181cc',
    txHash: '0xd0035ca1583f9bb1c2dd',
    eventHash: '0xb112e7c3942a0d5e3aff',
    staffSigner: '0x9a01d6b2831f9c4d2bee',
    blockNumber: 1847295,
    status: 'Confirmed',
    offChainMatch: {
      householdCode: 'HH-SJ-0033',
      claimId: 'CLM-2024-0186',
      barangay: 'San Jose',
      distributionSite: 'San Jose Barangay Hall',
      lguStaff: 'Roberto Lim',
      verification: 'Verified',
    },
  },
  {
    id: 'sj-2',
    barangay: 'San Jose',
    dateTimeISO: '2024-06-14T15:10:00Z',
    householdCode: 'HH-SJ-0021',
    householdHash: '0x3c26bf392722aa81ff00',
    txHash: '0xdc72554eabddbb2a9c11',
    eventHash: '0xac539e43bc0ecc3b8d22',
    staffSigner: '0x8c42bf52ad1fdd4c7e33',
    blockNumber: 1847218,
    status: 'Confirmed',
    offChainMatch: {
      householdCode: 'HH-SJ-0021',
      claimId: 'CLM-2024-0178',
      barangay: 'San Jose',
      distributionSite: 'San Jose Barangay Hall',
      lguStaff: 'Roberto Lim',
      verification: 'Verified',
    },
  },
  // ── Tobuan ──
  {
    id: 'tb-1',
    barangay: 'Tobuan',
    dateTimeISO: '2024-06-14T10:45:00Z',
    householdCode: 'HH-TB-0012',
    householdHash: '0x88eeff9de04b1c8a63bb',
    txHash: '0x99ff00aef15c2d9b74cc',
    eventHash: '0xaa0011bfc26d3eac85dd',
    staffSigner: '0xbb1122c0d37e4fbd96ee',
    blockNumber: 1847180,
    status: 'Pending',
    offChainMatch: null,
  },
  // ── Uyong ──
  {
    id: 'uy-1',
    barangay: 'Uyong',
    dateTimeISO: '2024-06-13T15:30:00Z',
    householdCode: 'HH-UY-0005',
    householdHash: '0xcc2233d1e48f50ce07ff',
    txHash: '0xdd3344e2f590a1df1800',
    eventHash: '0xee4455f306a1b2e02911',
    staffSigner: '0xff5566041782c3f13a22',
    blockNumber: 1847140,
    status: 'Confirmed',
    offChainMatch: {
      householdCode: 'HH-UY-0005',
      claimId: 'CLM-2024-0170',
      barangay: 'Uyong',
      distributionSite: 'Uyong Covered Court',
      lguStaff: 'Grace Villanueva',
      verification: 'Verified',
    },
  },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BlockchainLedgerPage() {
  const [query, setQuery] = useState('')
  const [barangay, setBarangay] = useState<BarangayFilter>('All Barangays')
  const [status, setStatus] = useState<StatusFilter>('All Status')
  const [recordOpen, setRecordOpen] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<LedgerRow | null>(null)

  // Dropdown state
  const [barangayOpen, setBarangayOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const barangayBtnRef = useRef<HTMLButtonElement>(null)
  const barangayMenuRef = useRef<HTMLDivElement>(null)
  const statusBtnRef = useRef<HTMLButtonElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

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

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MOCK_CLAIMS.filter((c) => {
      // text search
      const matchesQuery =
        !q ||
        c.barangay.toLowerCase().includes(q) ||
        c.householdCode.toLowerCase().includes(q) ||
        c.householdHash.toLowerCase().includes(q) ||
        c.txHash.toLowerCase().includes(q)

      // barangay filter
      const matchesBarangay =
        barangay === 'All Barangays' || c.barangay === barangay

      // status filter
      const matchesStatus =
        status === 'All Status' || c.status === status

      return matchesQuery && matchesBarangay && matchesStatus
    })
  }, [query, barangay, status])

  const groups = useMemo(() => groupByBarangay(filtered), [filtered])

  return (
    <DashboardLayout>
      <Header
        title="Blockchain Claim Ledger"
        subtitle="Immutable record of claimed relief packs (hash-based, no personal data stored on-chain)."
      />

      <BlockchainLedgerStats />

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

      {/* Accordion table grouped by barangay */}
      <BlockchainLedgerTable
        groups={groups}
        onViewClaim={(row) => setSelectedClaim(row)}
      />

      {/* Modals */}
      <RecordClaimModal open={recordOpen} onClose={() => setRecordOpen(false)} />
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
      className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1 z-50 max-h-64 overflow-y-auto"
    >
      {items.map((opt) => {
        const isSelected = opt.value === selected
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={[
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
              isSelected
                ? 'bg-[#EAB308] text-gray-900'
                : 'text-gray-700 hover:bg-gray-50',
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
