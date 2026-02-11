'use client'

import React, { useState } from 'react'
import {
  type LedgerRow,
  shortenHash,
  formatDateTimeFull,
  StatusBadge,
  CopyBtn,
  CopyIcon,
  useCopyToast,
} from './BlockchainLedgerTable'

interface ClaimDetailsModalProps {
  open: boolean
  claim: LedgerRow | null
  onClose: () => void
}

export default function ClaimDetailsModal({ open, claim, onClose }: ClaimDetailsModalProps) {
  const { copiedId, copy } = useCopyToast()
  const [, setToastMsg] = useState('')

  if (!open || !claim) return null

  const hasOffChain = !!claim.offChainMatch

  const handleCopyTxHash = () => {
    copy(claim.txHash, 'footer-tx')
    setToastMsg('Copied!')
  }

  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-5 shrink-0 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center">
                <ShieldIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Claim Details</h2>
                <p className="text-xs text-gray-500">
                  Block #{claim.blockNumber.toLocaleString()}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="px-5 pb-5 overflow-y-auto flex-1 space-y-5">
            {/* ─── ON-CHAIN SECTION ────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ChainIcon className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-800">Blockchain Details</span>
                <span className="text-[10px] font-bold tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  ON-CHAIN
                </span>
              </div>

              <div className="space-y-2">
                <HashField
                  label="Tx Hash"
                  value={claim.txHash}
                  id="tx"
                  copiedId={copiedId}
                  onCopy={copy}
                />
                <HashField
                  label="Household Hash"
                  value={claim.householdHash}
                  id="hh"
                  copiedId={copiedId}
                  onCopy={copy}
                />
                <HashField
                  label="Event Hash"
                  value={claim.eventHash}
                  id="ev"
                  copiedId={copiedId}
                  onCopy={copy}
                />
                <HashField
                  label="Staff Signer"
                  value={claim.staffSigner}
                  id="sg"
                  copiedId={copiedId}
                  onCopy={copy}
                />
              </div>

              {/* Block / Timestamp / Status row */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <div className="text-[10px] text-gray-500">Block Number</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    {claim.blockNumber.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <div className="text-[10px] text-gray-500">Timestamp</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">
                    {new Date(claim.dateTimeISO).toLocaleTimeString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <div className="text-[10px] text-gray-500">Status</div>
                  <div className="mt-1">
                    <StatusBadge status={claim.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── OFF-CHAIN SECTION ───────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DatabaseIcon className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-800">Off-Chain Match</span>
                <span className="text-[10px] font-bold tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  MONGODB
                </span>
              </div>

              {hasOffChain ? (
                <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                    <CheckCircleIcon className="w-4 h-4" />
                    Database record linked
                  </div>

                  {/* Household code — prominent */}
                  <div className="bg-gray-800 rounded-xl px-4 py-3">
                    <div className="text-[10px] text-gray-400">Household Code</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {claim.offChainMatch!.householdCode}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div>
                      <span className="text-gray-500">Claim ID</span>
                      <div className="font-medium text-gray-900">{claim.offChainMatch!.claimId}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Barangay</span>
                      <div className="font-medium text-gray-900">{claim.offChainMatch!.barangay}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Distribution Site</span>
                      <div className="font-medium text-gray-900">{claim.offChainMatch!.distributionSite}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">LGU Staff</span>
                      <div className="font-medium text-gray-900">{claim.offChainMatch!.lguStaff}</div>
                    </div>
                  </div>

                  {/* Verification badge */}
                  <div>
                    <span className="text-[10px] text-gray-500">Verification</span>
                    <div className="mt-0.5">
                      <VerificationBadge status={claim.offChainMatch!.verification} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                  <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                    <XCircleIcon className="w-4 h-4" />
                    No database record found
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This claim exists on-chain but has no matching record in MongoDB.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 shrink-0 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-[#004A1C] hover:bg-[#003A16] text-white text-sm font-medium inline-flex items-center gap-2 shadow-sm"
            >
              <DownloadIcon className="w-4 h-4" />
              Export Audit Receipt
            </button>
            <button
              type="button"
              onClick={handleCopyTxHash}
              className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium inline-flex items-center gap-2"
            >
              <CopyIcon className="w-4 h-4" />
              Copy Tx Hash
            </button>
            <button
              type="button"
              className="ml-auto px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold inline-flex items-center gap-2"
            >
              <FlagIcon className="w-4 h-4" />
              Flag Issue
            </button>
          </div>
        </div>
      </div>

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
/*  Hash field row                                                     */
/* ------------------------------------------------------------------ */

function HashField({
  label,
  value,
  id,
  copiedId,
  onCopy,
}: {
  label: string
  value: string
  id: string
  copiedId: string | null
  onCopy: (text: string, id: string) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="min-w-0">
        <div className="text-[10px] text-gray-500">{label}</div>
        <div className="text-[13px] font-mono text-gray-900 mt-0.5 truncate">
          {shortenHash(value)}
        </div>
      </div>
      <CopyBtn value={value} id={id} copiedId={copiedId} onCopy={onCopy} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Verification badge                                                 */
/* ------------------------------------------------------------------ */

function VerificationBadge({ status }: { status: 'Verified' | 'Manual Override' | 'Failed' }) {
  const cls =
    status === 'Verified'
      ? 'bg-green-600 text-white'
      : status === 'Manual Override'
        ? 'bg-yellow-500 text-white'
        : 'bg-red-500 text-white'

  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
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

function ChainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
    </svg>
  )
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v16M5 5h11l-1 4 3 2-3 2 1 4H5" />
    </svg>
  )
}
