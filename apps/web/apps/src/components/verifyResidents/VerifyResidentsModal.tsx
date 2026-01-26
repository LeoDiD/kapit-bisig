'use client'

import React, { useEffect, useMemo, useState } from 'react'

type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected'

type Application = {
  id: number
  name: string
  email: string
  barangay: string
  idType: string
  idNumber: string
  aiVerification: string
  status: ApplicationStatus
  applied: string
  confidence: number
  contactNumber: string
  address: string
  rejectionReason?: string
  verifiedBy?: string
}

export default function VerificationDetailsModal({
  open,
  application,
  onClose,
  onApprove,
  onReject,
}: {
  open: boolean
  application: Application | null
  onClose: () => void
  onApprove: (id: number) => void
  onReject: (id: number, reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  useEffect(() => {
    if (!open) return
    setReason(application?.rejectionReason ?? '')
    setReasonError('')
  }, [open, application])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const status = application?.status ?? 'Pending'
  const barTone = useMemo(() => {
    if (status === 'Approved') return 'bg-green-500'
    if (status === 'Rejected') return 'bg-red-500'
    return 'bg-[#EAB308]'
  }, [status])

  const statusPill = useMemo(() => {
    if (status === 'Approved') return 'bg-green-500 text-white'
    if (status === 'Rejected') return 'bg-red-500 text-white'
    return 'bg-[#EAB308] text-white'
  }, [status])

  if (!open || !application) return null

  const canAct = application.status === 'Pending'

  const handleReject = () => {
    if (!reason.trim()) {
      setReasonError('Please enter a rejection reason.')
      return
    }
    onReject(application.id, reason.trim())
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 py-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-100 overflow-hidden flex flex-col max-h-[calc(100vh-4rem)]">
        <div className="p-6 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{application.name}</h2>
                <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium ${statusPill}`}>
                  {application.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">Resident verification application details</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info grid */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Info label="Email" value={application.email} />
            <Info label="Contact Number" value={application.contactNumber} />
            <Info label="Address" value={application.address} />
            <Info label="Barangay" value={application.barangay} />
          </div>

          {/* ID Verification */}
          <div className="mt-5 bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <IdCardIcon />
              ID Verification
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Info label="ID Type" value={application.idType} />
              <Info label="ID Number" value={application.idNumber} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <ImageSlot label="ID Front" />
              <ImageSlot label="ID Back" />
              <ImageSlot label="Face Scan" />
            </div>
          </div>

          {/* AI Verification */}
          <div className="mt-5 bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
              <AIIcon />
              AI Verification Result
            </div>

            <div className="mt-3 flex items-end gap-3">
              <div className="text-3xl font-semibold text-green-800">
                {application.confidence}%
              </div>
              <div className="text-xs text-gray-500 mb-1">
                Verification Confidence
              </div>
            </div>

            <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-2 ${barTone}`}
                style={{ width: `${Math.max(0, Math.min(100, application.confidence))}%` }}
              />
            </div>

            <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Face matched with ID photo
            </div>
          </div>

          {/* Pending actions OR Rejection reason display */}
          {canAct ? (
            <div className="mt-5 flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-2">Rejection Reason (if rejecting)</div>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value)
                    setReasonError('')
                  }}
                  placeholder="Enter reasoning for rejection..."
                  className={[
                    'w-full min-h-[92px] rounded-xl border bg-white px-3 py-3 text-sm text-gray-800 placeholder-gray-400',
                    'shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1',
                    reasonError ? 'border-red-400 focus:ring-red-400' : 'border-green-400 focus:ring-green-500',
                  ].join(' ')}
                />
                {reasonError ? (
                  <div className="mt-2 text-xs text-red-500">{reasonError}</div>
                ) : null}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleReject}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>

                <button
                  type="button"
                  onClick={() => onApprove(application.id)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F533A] hover:bg-[#0a3f2c] text-white transition-colors text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </button>
              </div>
            </div>
          ) : application.status === 'Rejected' ? (
            <div className="mt-5">
              <div className="bg-red-100 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                <div className="text-xs font-semibold mb-1">Rejection Reason:</div>
                <div>{application.rejectionReason || '—'}</div>
              </div>
              <div className="mt-3 text-xs text-gray-500">Verified by:</div>
            </div>
          ) : (
            <div className="mt-5 text-xs text-gray-500">Verified by:</div>
          )}
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  )
}

function ImageSlot({ label }: { label: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-2">{label}</div>
      <div className="w-full aspect-[4/3] rounded-xl bg-gray-200" />
    </div>
  )
}

function IdCardIcon() {
  return (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h5M8 14h8" />
    </svg>
  )
}

function AIIcon() {
  return (
    <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3h6M10 21h4M12 7v10" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8a4 4 0 010 8H8a4 4 0 010-8z" />
    </svg>
  )
}
