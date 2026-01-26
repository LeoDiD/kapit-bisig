'use client'

import React, { useMemo, useState } from 'react'
import DistributionStats from './DistributionStats'
import DistributionsTable, { DistributionRow } from './DistributionsTable'
import NewDistributionModal, { CreateDistributionPayload } from './NewDistributionModal'

const initialData: DistributionRow[] = [
  {
    id: 1,
    barangay: 'Brgy. San Jose',
    items: [
      { name: 'Rice (5kg)', qty: 100 },
      { name: 'Canned Goods', qty: 300 },
    ],
    served: 0,
    households: 45,
    scheduled: 'January 15, 2026',
    status: 'Unclaimed',
    claimedAt: null,
  },
  {
    id: 2,
    barangay: 'Brgy. San Jose',
    items: [
      { name: 'Rice (5kg)', qty: 80 },
      { name: 'Bottled Water', qty: 240 },
      { name: 'Medicine Kit', qty: 40 },
    ],
    served: 40,
    households: 40,
    scheduled: 'January 13, 2026',
    status: 'Claimed',
    claimedAt: 'January 13, 2026',
  },
  {
    id: 3,
    barangay: 'Brgy. Santo Nino',
    items: [
      { name: 'Rice (5kg)', qty: 80 },
      { name: 'Canned Goods', qty: 150 },
      { name: 'Bottled Water', qty: 240 },
    ],
    served: 40,
    households: 40,
    scheduled: 'January 10, 2026',
    status: 'Claimed',
    claimedAt: 'January 10, 2026',
  },
]

export default function DistributionPageClient() {
  const [rows, setRows] = useState<DistributionRow[]>(initialData)
  const [createOpen, setCreateOpen] = useState(false)

  const unclaimedCount = useMemo(
    () => rows.filter((r) => r.status === 'Unclaimed').length,
    [rows]
  )
  const claimedCount = useMemo(
    () => rows.filter((r) => r.status === 'Claimed').length,
    [rows]
  )
  const barangaysCount = useMemo(() => {
    const set = new Set(rows.map((r) => r.barangay))
    return set.size
  }, [rows])

  // Matches your screenshot vibe (kept simple):
  const householdsServedCount = 1

  const bannerText = useMemo(() => {
    if (unclaimedCount <= 0) return ''
    return `${unclaimedCount} barangay distribution(s) are waiting to be claimed by residents.`
  }, [unclaimedCount])

  const handleCreate = (payload: CreateDistributionPayload) => {
    const next: DistributionRow = {
      id: Math.max(0, ...rows.map((r) => r.id)) + 1,
      barangay: payload.barangay,
      items: payload.items,
      served: 0,
      households: payload.households,
      scheduled: payload.scheduled,
      status: 'Unclaimed',
      claimedAt: null,
    }
    setRows((prev) => [next, ...prev])
    setCreateOpen(false)
  }

  const markClaimed = (id: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Claimed',
              claimedAt: r.claimedAt ?? r.scheduled,
              served: r.households, // auto-complete for UI
            }
          : r
      )
    )
  }

  return (
    <div>
      <DistributionStats
        unclaimed={unclaimedCount}
        claimed={claimedCount}
        householdsServed={householdsServedCount}
        barangays={barangaysCount}
      />

      {unclaimedCount > 0 ? (
        <div className="mb-6 bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDE68A] flex items-center justify-center">
            <BoxIcon className="w-5 h-5 text-[#9A6A00]" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">Unclaimed Distributions</div>
            <div className="text-sm text-gray-600">{bannerText}</div>
          </div>
        </div>
      ) : null}

      <DistributionsTable
        rows={rows}
        onOpenCreate={() => setCreateOpen(true)}
        onMarkClaimed={markClaimed}
      />

      <NewDistributionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        barangayOptions={['Brgy. San Jose', 'Brgy. Santo Nino']}
      />
    </div>
  )
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8v8l9 5 9-5V8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13v8" />
    </svg>
  )
}
