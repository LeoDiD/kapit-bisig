'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  api,
  BeneficiaryProofQueueSummary,
  BeneficiaryReviewNotificationDelivery,
  BeneficiaryProofSubmissionRecord,
  getScopedBarangays,
} from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { showToast } from '@/lib/toast'
import ConfirmModal from '@/components/ui/ConfirmModal'
import SummaryMetricCard from '@/components/ui/SummaryMetricCard'
import FilterDropdown from '@/components/ui/FilterDropdown'

const ALL_STATUSES = '__ALL_STATUSES__'
const ALL_BARANGAYS = 'All Barangays'
const PAGE_SIZE = 12
const PENDING_STATUS = 'Pending Verification'

type ReviewDecision = 'Approved' | 'Rejected'

const INITIAL_PROOF_SUMMARY: BeneficiaryProofQueueSummary = {
  total: 0,
  pendingVerification: 0,
  approved: 0,
  rejected: 0,
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL?.trim() || '/api').replace(/\/api\/?$/, '')

function getProofId(submission: BeneficiaryProofSubmissionRecord): string {
  return String(submission.id || submission._id || '')
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Pending Verification':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Approved':
    case 'Eligible':
    case 'Active':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Rejected':
    case 'Not Eligible':
    case 'Closed':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'Draft':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function getProofStatusLabel(status: BeneficiaryProofSubmissionRecord['status']): string {
  return status === 'Rejected' ? 'Needs Revision' : status
}

function getReviewDeliveryMessage(delivery?: BeneficiaryReviewNotificationDelivery): string {
  const pushDelivered = delivery?.push.status === 'sent_successfully'
    || delivery?.push.status === 'partially_delivered'
  const smsDelivered = delivery?.sms.status === 'sent_successfully'

  if (pushDelivered && smsDelivered) {
    return ' The resident was notified by Firebase push, in the app, and by SMS.'
  }
  if (pushDelivered) {
    return ' The resident was notified by Firebase push and in the app.'
  }
  if (smsDelivered) {
    return ' The resident was notified in the app and by SMS; no Firebase push was delivered.'
  }
  if (delivery?.push.status === 'no_eligible_recipients') {
    return ' The in-app notification was saved, but this resident has no active push device.'
  }
  if (delivery?.push.status === 'provider_not_configured') {
    return ' The in-app notification was saved. Firebase push delivery is not enabled.'
  }
  if (delivery?.push.status === 'provider_request_failed') {
    return ' The in-app notification was saved, but Firebase push delivery failed.'
  }
  return ' The resident was notified in the app.'
}

function resolveProofAssetUrl(value: string): string {
  const raw = String(value || '').trim()
  if (!raw) return '#'
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('/')) {
    return API_BASE ? `${API_BASE}${raw}` : raw
  }
  return raw
}

function getProofUrls(submission: BeneficiaryProofSubmissionRecord): string[] {
  const sources = Array.isArray(submission.photoProofUrls) && submission.photoProofUrls.length > 0
    ? submission.photoProofUrls
    : [submission.photoProofUrl]

  return sources
    .map((value) => resolveProofAssetUrl(value))
    .filter((value, index, array) => value !== '#' && array.indexOf(value) === index)
    .slice(0, 5)
}

function truncateText(value: string | null | undefined, maxLength: number): string {
  const text = String(value || '').trim()
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}...`
}

function RevisionRequestModal({
  open,
  loading,
  residentName,
  eventName,
  reason,
  onReasonChange,
  onClose,
  onSubmit,
}: {
  open: boolean
  loading: boolean
  residentName: string
  eventName: string
  reason: string
  onReasonChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Return Submission</p>
        <h3 className="mt-2 text-xl font-black text-gray-900 dark:text-slate-100">Request more proof or missing requirements</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          This note will be sent back to <span className="font-semibold text-gray-900 dark:text-slate-100">{residentName}</span> for{' '}
          <span className="font-semibold text-gray-900 dark:text-slate-100">{eventName}</span>.
        </p>

        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          rows={5}
          placeholder="Explain what the resident still needs to upload or clarify, such as a barangay indigency certificate or clearer damage photos."
          className="mt-5 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none transition-colors focus:border-gray-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-slate-500"
        />

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? <SpinnerIcon className="h-4 w-4" /> : null}
            Return for revision
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function TargetBeneficiariesPageClient() {
  const { user, loading } = useAuth()

  const scopedBarangays = useMemo(
    () => getScopedBarangays(user?.role, user?.assignedBarangays),
    [user?.role, user?.assignedBarangays],
  )

  const [proofRows, setProofRows] = useState<BeneficiaryProofSubmissionRecord[]>([])
  const [proofSummary, setProofSummary] = useState<BeneficiaryProofQueueSummary>(INITIAL_PROOF_SUMMARY)
  const [proofLoading, setProofLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState<string>(PENDING_STATUS)
  const [selectedBarangay, setSelectedBarangay] = useState<string>(ALL_BARANGAYS)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [reviewTarget, setReviewTarget] = useState<BeneficiaryProofSubmissionRecord | null>(null)
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>('Approved')
  const [reviewReason, setReviewReason] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false)

  const fetchProofQueue = useCallback(async () => {
    if (!user) return

    try {
      setProofLoading(true)
      setError(null)
      const response = await api.getBeneficiaryProofSubmissions({
        status: selectedStatus !== ALL_STATUSES
          ? (selectedStatus as 'Pending Verification' | 'Approved' | 'Rejected')
          : undefined,
        barangay: selectedBarangay !== ALL_BARANGAYS ? selectedBarangay : undefined,
        search: appliedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      })

      const rows = Array.isArray(response.data) ? response.data : []
      const nextTotalPages = response.pagination?.totalPages || 1
      const nextSummary = response.summary || {
        total: rows.length,
        pendingVerification: rows.filter((row) => row.status === 'Pending Verification').length,
        approved: rows.filter((row) => row.status === 'Approved').length,
        rejected: rows.filter((row) => row.status === 'Rejected').length,
      }
      setProofRows(rows)
      setProofSummary(nextSummary)
      setTotalPages(nextTotalPages)
    } catch (err) {
      console.error('Failed to load proof submissions:', err)
      setError('Failed to load proof submissions. Please try again.')
      setProofRows([])
      setProofSummary(INITIAL_PROOF_SUMMARY)
    } finally {
      setProofLoading(false)
    }
  }, [appliedSearch, page, selectedBarangay, selectedStatus, user])

  useEffect(() => {
    if (loading || !user) return
    void fetchProofQueue()
  }, [fetchProofQueue, loading, user])

  const handleApplySearch = useCallback(() => {
    setPage(1)
    setAppliedSearch(searchInput.trim())
  }, [searchInput])

  const handleClearFilters = useCallback(() => {
    setSelectedStatus(PENDING_STATUS)
    setSelectedBarangay(ALL_BARANGAYS)
    setSearchInput('')
    setAppliedSearch('')
    setPage(1)
  }, [])

  const openApproveModal = useCallback((submission: BeneficiaryProofSubmissionRecord) => {
    setReviewTarget(submission)
    setReviewDecision('Approved')
    setReviewReason('')
    setConfirmApproveOpen(true)
  }, [])

  const openRejectModal = useCallback((submission: BeneficiaryProofSubmissionRecord) => {
    setReviewTarget(submission)
    setReviewDecision('Rejected')
    setReviewReason(submission.rejectionReason || '')
  }, [])

  const closeReviewModals = useCallback(() => {
    setConfirmApproveOpen(false)
    setReviewTarget(null)
    setReviewReason('')
    setReviewLoading(false)
  }, [])

  const submitReview = useCallback(async () => {
    if (!reviewTarget) return
    if (reviewDecision === 'Rejected' && !reviewReason.trim()) {
      showToast.error('A revision note is required.')
      return
    }

    setReviewLoading(true)
    try {
      const reviewedId = getProofId(reviewTarget)
      const response = await api.reviewBeneficiaryProofSubmission(getProofId(reviewTarget), {
        decision: reviewDecision,
        rejectionReason: reviewDecision === 'Rejected' ? reviewReason.trim() : undefined,
      })
      const baseMessage = response.message
        || `Submission ${reviewDecision === 'Approved' ? 'approved' : 'returned for revision'}.`
      showToast.success(
        `${baseMessage}${getReviewDeliveryMessage(response.data?.notificationDelivery)}`,
      )
      closeReviewModals()

      // Keep the review queue focused on items that still need action.
      setProofRows((prev) => prev.filter((row) => getProofId(row) !== reviewedId))
      setProofSummary((prev) => ({
        total: Math.max(0, prev.total - 1),
        pendingVerification: Math.max(0, prev.pendingVerification - 1),
        approved: reviewDecision === 'Approved' ? prev.approved + 1 : prev.approved,
        rejected: reviewDecision === 'Rejected' ? prev.rejected + 1 : prev.rejected,
      }))

      if (page > 1 && proofRows.length === 1) {
        setPage((prev) => Math.max(1, prev - 1))
        return
      }

      if (selectedStatus !== PENDING_STATUS) {
        setSelectedStatus(PENDING_STATUS)
        setPage(1)
        return
      }
    } catch (err) {
      console.error('Failed to update proof submission:', err)
      const message = err instanceof Error && err.message
        ? err.message
        : 'Failed to update proof submission. Please try again.'
      showToast.error(message)
      setReviewLoading(false)
    }
  }, [closeReviewModals, page, proofRows.length, reviewDecision, reviewReason, reviewTarget, selectedStatus])

  if (loading) return null

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">Target Beneficiary Control</p>
          <h2 className="mt-2 text-2xl font-black text-gray-900 dark:text-slate-100">Event-scoped eligibility review</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-slate-400">
            Review affected-resident proof submissions, approve complete requests, and return incomplete requests so residents can upload clearer proof or missing barangay documents for each distribution.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetricCard label="Matched Submissions" value={String(proofSummary.total)} helper="Across the current proof queue filter" icon={<ClipboardIcon className="h-5 w-5" />} />
          <SummaryMetricCard label="Pending Reviews" value={String(proofSummary.pendingVerification)} helper="Across the current queue filter" icon={<ClockIcon className="h-5 w-5" />} />
          <SummaryMetricCard label="Approved Proofs" value={String(proofSummary.approved)} helper="Across the current queue filter" icon={<ShieldCheckIcon className="h-5 w-5" />} />
          <SummaryMetricCard label="Returned Proofs" value={String(proofSummary.rejected)} helper="Sent back for additional proof" icon={<AlertIcon className="h-5 w-5" />} />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
        <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">Verification Queue</p>
              <h3 className="mt-1 text-lg font-black text-gray-900 dark:text-slate-100">Proof submission review queue</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                Approve complete submissions or return incomplete ones with guidance for resubmission.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_260px]">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleApplySearch()
                      }
                    }}
                    placeholder="Search resident or code"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 shadow-sm outline-none transition-colors focus:border-gray-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-slate-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplySearch}
                  className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-gray-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Search
                </button>
              </div>

              <FilterDropdown
                value={selectedStatus}
                options={[
                  { value: 'Pending Verification', label: 'Pending Verification' },
                  { value: ALL_STATUSES, label: 'All Statuses' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Rejected', label: 'Needs Revision' },
                ]}
                onChange={(val) => {
                  setSelectedStatus(val)
                  setPage(1)
                }}
              />

              <FilterDropdown
                value={selectedBarangay}
                options={[
                  { value: ALL_BARANGAYS, label: ALL_BARANGAYS },
                  ...scopedBarangays.map((barangay) => ({ value: barangay, label: barangay })),
                ]}
                onChange={(val) => {
                  setSelectedBarangay(val)
                  setPage(1)
                }}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchProofQueue()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              Refresh queue
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Reset filters
            </button>
            {appliedSearch ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
                Search: {appliedSearch}
              </span>
            ) : null}
            <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              {proofSummary.total} matched submission{proofSummary.total === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-red-600">{error}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 p-3 sm:p-4">
              {proofLoading ? (
                <div className="px-6 py-16 text-center">
                  <div className="inline-flex flex-col items-center gap-2 text-gray-500 dark:text-slate-400">
                    <SpinnerIcon className="h-8 w-8" />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">Loading proof queue</span>
                  </div>
                </div>
              ) : proofRows.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto max-w-xl">
                    <p className="text-base font-bold text-gray-800 dark:text-slate-100">No proof submissions matched this filter</p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                      Try clearing filters, changing the search, or waiting for residents to sync new disaster proof requests.
                    </p>
                  </div>
                </div>
              ) : (
                proofRows.map((row) => {
                  const rowId = getProofId(row)
                  const proofUrls = getProofUrls(row)
                  const proofUrl = proofUrls[0] || '#'
                  const reviewNote = row.status === 'Rejected'
                    ? row.rejectionReason || 'Returned for revision without a note.'
                    : row.status === 'Approved'
                      ? `Approved by ${row.reviewedBy || 'reviewer'}`
                      : 'Awaiting admin verification'

                  return (
                    <article
                      key={rowId}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm transition-colors hover:bg-gray-50/70 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900/80"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate text-sm font-black text-gray-900 dark:text-slate-100 sm:text-base">{row.resident.fullName}</p>
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(row.status)}`}>
                                  {getProofStatusLabel(row.status)}
                                </span>
                                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                  {row.damageType}
                                </span>
                                {row.syncSource === 'OFFLINE_SYNC' ? (
                                  <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
                                    Offline sync
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500 dark:text-slate-400">
                                <span className="font-semibold uppercase tracking-[0.12em]">{row.resident.residentCode}</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-slate-800 dark:text-slate-200">
                                  <MapPinIcon className="h-3.5 w-3.5" />
                                  {row.resident.barangay}
                                </span>
                                <span className="truncate">{row.event.name}</span>
                                <span>{row.event.disasterType}</span>
                                <span>{row.syncSource === 'OFFLINE_SYNC' ? 'Captured' : 'Submitted'} {formatDateTime(row.dateSubmitted)}</span>
                                {row.syncSource === 'OFFLINE_SYNC' ? <span>Synced {formatDateTime(row.createdAt)}</span> : null}
                                <span>Version {row.submissionVersion}</span>
                              </div>
                            </div>

                            <div className="shrink-0">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {proofUrls.map((url, index) => (
                                  <a
                                    key={`${rowId}-proof-${index + 1}`}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group relative block h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                                    title={`Proof photo ${index + 1}`}
                                  >
                                    <img
                                      src={url}
                                      alt={`Proof photo ${index + 1} for ${row.resident.fullName}`}
                                      className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-105"
                                    />
                                  </a>
                                ))}
                                <a
                                  href={proofUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  {proofUrls.length > 1 ? `${proofUrls.length} photos` : 'View proof'}
                                </a>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                            <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-slate-800/80">
                              <p className="text-sm text-gray-700 dark:text-slate-200">{truncateText(row.description, 120)}</p>
                              {row.supportingInfo ? (
                                <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">{truncateText(row.supportingInfo, 90)}</p>
                              ) : null}
                            </div>

                            <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-slate-800/80">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">Review</p>
                              <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{truncateText(reviewNote, 90)}</p>
                              {row.reviewedAt ? (
                                <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">Reviewed {formatDateTime(row.reviewedAt)}</p>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="lg:w-36 lg:pl-2">
                          {row.status === 'Pending Verification' ? (
                            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                              <button
                                type="button"
                                onClick={() => openApproveModal(row)}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => openRejectModal(row)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                              >
                                Return
                              </button>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:border-slate-700 dark:text-slate-500">
                              No action needed
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1 || proofLoading}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages || proofLoading}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <ConfirmModal
        isOpen={confirmApproveOpen && !!reviewTarget}
        title="Approve Proof Submission"
        body={
          reviewTarget
            ? `Approve the proof submission from ${reviewTarget.resident.fullName} for ${reviewTarget.event.name}? This will make the resident eligible for that distribution once the registration record is approved.`
            : ''
        }
        confirmLabel={reviewLoading ? 'Approving...' : 'Approve Submission'}
        loading={reviewLoading}
        onCancel={closeReviewModals}
        onConfirm={submitReview}
      />

      <RevisionRequestModal
        open={!!reviewTarget && reviewDecision === 'Rejected'}
        loading={reviewLoading}
        residentName={reviewTarget?.resident.fullName || ''}
        eventName={reviewTarget?.event.name || ''}
        reason={reviewReason}
        onReasonChange={setReviewReason}
        onClose={closeReviewModals}
        onSubmit={submitReview}
      />
    </div>
  )
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`${className || ''} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 4h6m-7 3h8a2 2 0 012 2v9a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10 4.5A1.5 1.5 0 0111.5 3h1A1.5 1.5 0 0114 4.5V7h-4V4.5z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.66 18h16.68a1 1 0 00.87-1.5l-7.5-13a1 1 0 00-1.74 0z" />
    </svg>
  )
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h5M20 20v-5h-5M5.8 9A7 7 0 0118 6.3M18.2 15A7 7 0 016 17.7" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
    </svg>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 14l2.5-2.5L15 16l2-2 3 3M9 9h.01" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 21s6-4.5 6-10a6 6 0 10-12 0c0 5.5 6 10 6 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  )
}
