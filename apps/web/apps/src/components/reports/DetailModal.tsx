import React, { useEffect } from 'react';
import { type ReportDistributionRow } from '@/lib/api';
// We need formatDate, StatusPill, ClaimRateBar. 
// We will export them from ReportsHelpers.tsx
import { formatDate, StatusPill, ClaimRateBar } from './ReportsHelpers';

// ─── Detail Modal ───────────────────────────────────────────

export function DetailModal({
  row,
  onClose,
}: {
  row: ReportDistributionRow
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-slate-800">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">Distribution Details</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-slate-400">Date</div>
              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{formatDate(row.scheduled || row.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-slate-400">Host Barangay</div>
              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{row.barangay}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-slate-400">Assigned Barangays</div>
              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                {row.assignedBarangays?.length ? row.assignedBarangays.join(', ') : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="mt-0.5"><StatusPill status={row.status} /></div>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800/80">
            <div className="mb-3 text-xs text-gray-500 dark:text-slate-400">Household Statistics</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{row.registeredHouseholds}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">Registered</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-700">{row.claimedHouseholds}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">Claimed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-600">{row.unclaimedHouseholds}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">Unclaimed</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 text-xs text-gray-500 dark:text-slate-400">Claim Rate</div>
              <ClaimRateBar rate={row.claimRate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


