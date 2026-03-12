'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/lib/api'
import { showToast } from '@/lib/toast'
import SelectDropdown from '@/components/ui/SelectDropdown'

interface RecordClaimModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

type StepStatus = 'idle' | 'active' | 'done' | 'error'

interface StepState {
  label: string
  status: StepStatus
}

interface BatchResultItem {
  token?: string
  status?: 'SUBMITTED' | 'FAILED'
  message?: string
  claimId?: string
}

interface DistOption {
  id: string
  label: string
  barangay: string
}

const STEP_LABELS = [
  'Validate token(s)',
  'Check duplicate on-chain',
  'Store claim in DB',
  'Write hashes to blockchain',
  'Submit transaction (tx hash)',
]

function initialSteps(): StepState[] {
  return STEP_LABELS.map((label) => ({ label, status: 'idle' }))
}

export default function RecordClaimModal({ open, onClose, onSuccess }: RecordClaimModalProps) {
  const [tokenInput, setTokenInput] = useState('')
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [distributionId, setDistributionId] = useState('')
  const [distOptions, setDistOptions] = useState<DistOption[]>([])
  const [distLoading, setDistLoading] = useState(false)
  const [steps, setSteps] = useState<StepState[]>(initialSteps)
  const [processing, setProcessing] = useState(false)
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setDistLoading(true)
    api
      .getDistributions()
      .then((res) => {
        if (cancelled) return
        if (res.success && Array.isArray(res.data)) {
          const opts: DistOption[] = res.data
            .filter((d) => d.status !== 'Claimed')
            .map((d) => ({
              id: d.id || d._id,
              label: `${d.barangay} - ${d.scheduled}`,
              barangay: d.barangay,
            }))
          setDistOptions(opts)
          if (opts.length > 0 && !distributionId) setDistributionId(opts[0].id)
        }
      })
      .catch(() => {
        // User will see empty dropdown state.
      })
      .finally(() => {
        if (!cancelled) setDistLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) {
      setTokenInput('')
      setTokenError(null)
      setDistributionId('')
      setSteps(initialSteps())
      setProcessing(false)
      setResultMsg(null)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const setStepStatus = useCallback((index: number, status: StepStatus) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, status } : s)))
  }, [])

  const handleRecord = useCallback(async () => {
    const parsedTokens = parseTokens(tokenInput)
    if (parsedTokens.length === 0) {
      setTokenError('At least one token is required')
      inputRef.current?.focus()
      return
    }
    if (parsedTokens.length > 100) {
      setTokenError('Maximum 100 tokens per batch')
      inputRef.current?.focus()
      return
    }
    setTokenError(null)

    if (!distributionId) {
      setResultMsg({ type: 'error', text: 'Please select a distribution first.' })
      return
    }

    const selectedDist = distOptions.find((d) => d.id === distributionId)
    const distributionSite = selectedDist
      ? `${selectedDist.barangay} Barangay Hall`
      : 'Unknown Site'
    const isBatch = parsedTokens.length > 1

    setProcessing(true)
    setResultMsg(null)
    setSteps(initialSteps())

    try {
      setStepStatus(0, 'active')
      await sleep(300)

      setStepStatus(0, 'done')
      setStepStatus(1, 'active')
      await sleep(200)

      const res = isBatch
        ? await api.recordClaimBatch({
            claimTokens: parsedTokens,
            distributionId,
            distributionSite,
          })
        : await api.recordClaim({
            claimToken: parsedTokens[0],
            distributionId,
            distributionSite,
          })

      if (res.success) {
        if (isBatch) {
          const summary = (res as any).summary || {}
          const submittedCount = Number(summary.submitted || 0)
          const failedCount = Number(summary.failed || 0)
          const txHash = String((res as any).txHash || '').trim()
          const resultItems: BatchResultItem[] = Array.isArray((res as any).results)
            ? ((res as any).results as BatchResultItem[])
            : []
          const failedItems = resultItems.filter((item) => item.status === 'FAILED')
          const failedDetails = failedItems
            .slice(0, 3)
            .map((item) => `${item.token || 'Token'}: ${item.message || 'Failed'}`)
          const extraFailedCount = Math.max(0, failedItems.length - failedDetails.length)
          const failedSuffix = failedDetails.length
            ? `\n${failedDetails.join('\n')}${extraFailedCount > 0 ? `\n+${extraFailedCount} more failed token(s)` : ''}`
            : ''

          if (submittedCount > 0) {
            setStepStatus(1, 'done')
            setStepStatus(2, 'done')
            setStepStatus(3, 'done')
            setStepStatus(4, 'done')
            setResultMsg({
              type: 'success',
              text: txHash
                ? `${submittedCount} claim(s) submitted. Failed: ${failedCount}. Tx: ${shortHash(txHash)}${failedSuffix}`
                : `${submittedCount} claim(s) submitted. Failed: ${failedCount}.${failedSuffix}`,
            })
            showToast.success(`${submittedCount} claim(s) submitted. Awaiting confirmations.`)
          } else {
            setStepStatus(1, 'error')
            setStepStatus(2, 'error')
            setStepStatus(3, 'error')
            setStepStatus(4, 'error')
            setResultMsg({
              type: 'error',
              text: `No claims were submitted. Failed: ${failedCount}.${failedSuffix}`,
            })
            showToast.error('Batch claim submission failed.')
          }
        } else {
          const claim = (res as any).claim || res.data
          const claimStatus: string = claim?.status || ''

          if (claimStatus === 'CHAIN_SUBMITTED' || claimStatus === 'PENDING_CHAIN') {
            const txHash = (res as any).txHash || claim?.blockchain?.txHash || ''
            setStepStatus(1, 'done')
            setStepStatus(2, 'done')
            setStepStatus(3, 'done')
            setStepStatus(4, 'done')
            setResultMsg({
              type: 'success',
              text: txHash
                ? `Submitted. Awaiting confirmations. Tx: ${shortHash(txHash)}`
                : 'Submitted. Awaiting confirmations.',
            })
            showToast.success('Claim submitted. Awaiting confirmations.')
          } else if (claimStatus === 'CONFIRMED') {
            setStepStatus(1, 'done')
            setStepStatus(2, 'done')
            setStepStatus(3, 'done')
            setStepStatus(4, 'done')
            setResultMsg({ type: 'success', text: 'Claim confirmed on-chain.' })
            showToast.success('Claim confirmed on-chain.')
          } else if (claimStatus === 'CHAIN_FAILED') {
            setStepStatus(1, 'done')
            setStepStatus(2, 'done')
            setStepStatus(3, 'error')
            setStepStatus(4, 'idle')
            setResultMsg({
              type: 'error',
              text: 'Blockchain write failed. Claim saved in DB as CHAIN_FAILED. You can retry later.',
            })
            showToast.error('Blockchain write failed. Retry later.')
          } else {
            throw new Error(res.message || 'Unexpected claim status returned by server')
          }
        }

        onSuccess?.()
      } else {
        throw new Error(res.message || 'Claim recording failed')
      }
    } catch (err: unknown) {
      const e = err as {
        message?: string
        response?: { message?: string; results?: BatchResultItem[] }
      }
      const msg = e?.response?.message || e?.message || 'An error occurred'
      const resultItems: BatchResultItem[] = Array.isArray(e?.response?.results)
        ? (e?.response?.results as BatchResultItem[])
        : []
      const failedItems = resultItems.filter((item) => item.status === 'FAILED')
      const failedDetails = failedItems
        .slice(0, 3)
        .map((item) => `${item.token || 'Token'}: ${item.message || 'Failed'}`)
      const extraFailedCount = Math.max(0, failedItems.length - failedDetails.length)
      const detailSuffix = failedDetails.length
        ? `\n${failedDetails.join('\n')}${extraFailedCount > 0 ? `\n+${extraFailedCount} more failed token(s)` : ''}`
        : ''
      const detailedMsg = `${msg}${detailSuffix}`

      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        setStepStatus(0, 'error')
        setTokenError(detailedMsg)
        showToast.error(msg)
      } else if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already')) {
        setStepStatus(0, 'done')
        setStepStatus(1, 'error')
        setResultMsg({ type: 'error', text: detailedMsg })
        showToast.error(msg)
      } else {
        setSteps((prev) => {
          const activeIdx = prev.findIndex((s) => s.status === 'active')
          if (activeIdx >= 0) {
            return prev.map((s, i) =>
              i === activeIdx ? { ...s, status: 'error' as StepStatus } : s,
            )
          }
          return prev.map((s, i) => (i === 0 ? { ...s, status: 'error' as StepStatus } : s))
        })
        setResultMsg({ type: 'error', text: detailedMsg })
        showToast.error(msg)
      }
    } finally {
      setProcessing(false)
    }
  }, [tokenInput, distributionId, distOptions, setStepStatus, onSuccess])

  if (!open) return null

  const parsedTokenCount = parseTokens(tokenInput).length
  const canRecord =
    parsedTokenCount > 0 &&
    parsedTokenCount <= 100 &&
    !!distributionId &&
    !processing

  return (
    <div className="fixed inset-0 z-[60] pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/40 pointer-events-auto"
        onClick={!processing ? onClose : undefined}
      />
      <div className="absolute inset-0 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none">
        <div
          className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 pointer-events-auto my-4 sm:my-0 max-h-[calc(100vh-1rem)] sm:max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between p-5 border-b border-gray-100 shrink-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#004A1C]/10 text-[#004A1C] flex items-center justify-center shrink-0">
                <ShieldIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Record Claim</h2>
                <p className="text-xs text-gray-500">
                  Enter one or more household claim tokens from QR to record relief claims on-chain.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="w-8 h-8 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 inline-flex items-center justify-center disabled:opacity-50"
              aria-label="Close"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4 overflow-y-auto min-h-0">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Distribution <span className="text-red-500">*</span>
              </label>
              {distLoading ? (
                <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400">
                  Loading distributions...
                </div>
              ) : distOptions.length === 0 ? (
                <div className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
                  No unclaimed distributions found. Create one first.
                </div>
              ) : (
                <SelectDropdown
                  value={distributionId}
                  onChange={setDistributionId}
                  options={distOptions.map((d) => ({ value: d.id, label: d.label }))}
                  ariaLabel="Select distribution"
                  disabled={processing}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                QR Token(s) <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={inputRef}
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value)
                  if (tokenError) setTokenError(null)
                }}
                disabled={processing}
                // [RISK-5 MITIGATION] Show supported token formats for reliable staff input.
                placeholder="One per line, comma, or space separated. Example: CLM-BL-0005-7005"
                rows={4}
                className={[
                  'w-full px-4 py-2.5 rounded-xl border outline-none text-sm text-gray-900 placeholder-gray-400 resize-y',
                  'focus:ring-2 focus:ring-[#004A1C] focus:border-[#004A1C]',
                  'disabled:bg-gray-50 disabled:text-gray-400',
                  tokenError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white',
                ].join(' ')}
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Accepted formats: <code>CLM-XX-0000-0000</code> or <code>XXXX-XXXX-XXXX</code>
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                Tokens detected: <strong>{parsedTokenCount}</strong> (max 100)
              </p>
              {tokenError && <p className="mt-1 text-xs text-red-600">{tokenError}</p>}
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-gray-700 mb-1">Progress</p>
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 py-1 select-none">
                  <StepIndicator status={step.status} />
                  <span
                    className={[
                      'text-xs',
                      step.status === 'done'
                        ? 'text-green-700 font-medium'
                        : step.status === 'error'
                          ? 'text-red-600 font-medium'
                          : step.status === 'active'
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-500',
                    ].join(' ')}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {resultMsg && (
              <div
                className={[
                  'px-4 py-3 rounded-xl text-sm whitespace-pre-line',
                  resultMsg.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200',
                ].join(' ')}
              >
                {resultMsg.text}
              </div>
            )}
          </div>

          <div className="px-5 pb-5 flex gap-3 shrink-0">
            {resultMsg?.type === 'success' ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#004A1C] hover:bg-[#003A16] text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Done - View Ledger
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRecord}
                  disabled={!canRecord}
                  className={[
                    'flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2',
                    canRecord
                      ? 'bg-[#004A1C] hover:bg-[#003A16] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                  ].join(' ')}
                >
                  {processing ? (
                    <>
                      <Spinner className="w-4 h-4" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <QrIcon className="w-4 h-4" />
                      Record Claim(s)
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    )
  }
  if (status === 'active') {
    return <Spinner className="w-5 h-5 text-[#004A1C] shrink-0" />
  }
  return <span className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
}

function parseTokens(value: string): string[] {
  const rawTokens = value
    .split(/[\s,\n\r\t;]+/)
    .map((token) => token.trim().toUpperCase())
    .filter((token) => token.length > 0)

  return Array.from(new Set(rawTokens))
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shortHash(value: string): string {
  if (!value) return ''
  if (value.length <= 14) return value
  return `${value.slice(0, 8)}...${value.slice(-6)}`
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className || ''}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

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

function QrIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2m2 0h2m-6-3h6" />
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
