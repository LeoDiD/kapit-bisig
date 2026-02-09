'use client'

import React from 'react'
import type { LedgerClaim } from './BlockchainLedgerTable'

interface ClaimDetailsModalProps {
  open: boolean
  claim: LedgerClaim | null
  onClose: () => void
}

export default function ClaimDetailsModal({ open, claim, onClose }: ClaimDetailsModalProps) {
  if (!open || !claim) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[85vh] overflow-hidden">
          <div className="flex items-start justify-between p-5 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-700 flex items-center justify-center">
                <ShieldIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Claim Details</h2>
                <p className="text-xs text-gray-500">Block {claim.blockNumber}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 inline-flex items-center justify-center"
              aria-label="Close"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 overflow-auto max-h-[calc(85vh-80px)]">
            <h3 className="text-xs font-semibold text-gray-800 mb-2">Blockchain Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DetailCard label="Tx Hash" value={claim.txHash} />
              <DetailCard label="Household Hash" value={claim.householdHash} />
              <DetailCard label="Barangay" value={claim.barangay} />
              <DetailCard label="Pack Type" value={claim.packType} />
              <DetailCard label="Date/Time" value={claim.dateTime} />
              <DetailCard label="Status" value={claim.status} />
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium inline-flex items-center gap-2"
              >
                <CopyIcon className="w-4 h-4" />
                Copy Tx Hash
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium inline-flex items-center gap-2"
              >
                <DownloadIcon className="w-4 h-4" />
                Export Audit Receipt
              </button>
              <button
                type="button"
                className="ml-auto px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold inline-flex items-center gap-2"
              >
                <FlagIcon className="w-4 h-4" />
                Flag Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-[13px] font-medium text-gray-900 break-all">{value}</div>
    </div>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z"
      />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
      />
    </svg>
  )
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 5v16M5 5h11l-1 4 3 2-3 2 1 4H5"
      />
    </svg>
  )
}
