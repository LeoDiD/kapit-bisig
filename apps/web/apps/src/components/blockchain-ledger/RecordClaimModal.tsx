'use client'

import React from 'react'

interface RecordClaimModalProps {
  open: boolean
  onClose: () => void
}

export default function RecordClaimModal({ open, onClose }: RecordClaimModalProps) {
  if (!open) return null

  const steps = [
    'Validate token',
    'Check duplicate on-chain',
    'Store claim in DB',
    'Write hashes to blockchain',
    'Confirm transaction',
  ]

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="flex items-start justify-between p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#004A1C]/10 text-[#004A1C] flex items-center justify-center">
                <ShieldIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Record Claim</h2>
                <p className="text-xs text-gray-500">
                  Scan QR token to record a relief claim on-chain.
                </p>
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

          <div className="px-5 pb-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700">QR token</label>
              <input
                className="mt-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#004A1C] focus:border-[#004A1C] outline-none text-sm"
                placeholder="Scan or enter QR token..."
              />
            </div>

            <div className="space-y-2">
              {steps.map((step) => (
                <div key={step} className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="w-4 h-4 rounded-full border border-gray-300" />
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-[#004A1C]/15 text-[#004A1C] text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2"
              disabled
            >
              <QrIcon className="w-4 h-4" />
              Record Claim
            </button>
          </div>
        </div>
      </div>
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
