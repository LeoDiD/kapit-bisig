'use client'

import React from 'react'
import type { DistributionRow } from './DistributionsTable'

export default function DistributionDetailsModal({
  open,
  onClose,
  distribution,
  onMarkClaimed,
}: {
  open: boolean
  onClose: () => void
  distribution: DistributionRow | null
  onMarkClaimed?: (id: string) => void
}) {
  if (!open || !distribution) return null

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="min-h-full px-4 py-8 flex items-start justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col max-h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="p-5 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#0F533A] flex items-center justify-center">
                  <LocationIcon />
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    {distribution.barangay}
                  </div>
                  <div className="text-xs text-gray-500">
                    Distribution Details
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
          <div className="px-5 pb-5 space-y-3 overflow-y-auto flex-1">
            {/* Scheduled Date & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <CalendarIcon />
                  <span>Scheduled Date</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {distribution.scheduled}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <ClockIcon />
                  <span>Status</span>
                </div>
                <div className="mt-1">
                  <StatusPill status={distribution.status} />
                </div>
              </div>
            </div>

            {/* Household Coverage */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
                <UsersIcon />
                <span>Household Coverage</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                <span className="text-[#0F533A]">{distribution.households}</span>
                <span className="text-gray-400 text-sm font-normal ml-1">households</span>
              </div>
            </div>

            {/* Notes (if any) */}
            {distribution.notes && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-gray-500 text-xs mb-1">Notes</div>
                <div className="text-sm text-gray-700">{distribution.notes}</div>
              </div>
            )}

            {/* Claimed At (if claimed) */}
            {distribution.claimedAt && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <CalendarIcon />
                  <span>Claimed At</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {new Date(distribution.claimedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 shrink-0 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
            >
              Close
            </button>
            {distribution.status === 'Unclaimed' && onMarkClaimed && (
              <button
                type="button"
                onClick={() => {
                  onMarkClaimed(distribution.id)
                  onClose()
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0F533A] hover:bg-[#0a3f2c] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircleIcon />
                Mark as Claimed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ----- Status Pill ----- */

function StatusPill({ status }: { status: 'Claimed' | 'Unclaimed' }) {
  const isUnclaimed = status === 'Unclaimed'
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
      isUnclaimed 
        ? 'bg-[#EAB308] text-white' 
        : 'bg-green-600 text-white'
    }`}>
      {isUnclaimed ? <ClockSmallIcon /> : <CheckSmallIcon />}
      {status}
    </span>
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

function LocationIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ClockSmallIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CheckSmallIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
