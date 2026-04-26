'use client'

import React from 'react'
import type { ResidentRecord } from '@/lib/api'

const HIGH_MATCH_THRESHOLD = 80
const MEDIUM_MATCH_THRESHOLD = 50

function clampConfidence(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : null
}

function hasScreeningMetadata(record: ResidentRecord): boolean {
  const verification = record.verification
  if (!verification) return false

  return Boolean(
    verification.idCheckDecision ||
      verification.idCheckRequiresManualReview ||
      verification.detectedIdType ||
      verification.typeMatch !== undefined ||
      verification.idNumberMatch !== undefined ||
      verification.extractedIdNumberMasked ||
      verification.rawTextPreview ||
      (verification.idCheckReasons && verification.idCheckReasons.length > 0) ||
      (verification.idCheckWarnings && verification.idCheckWarnings.length > 0) ||
      (verification.reviewFlags && verification.reviewFlags.length > 0) ||
      (typeof verification.ocrConfidence === 'number' && verification.ocrConfidence > 0) ||
      (typeof verification.qualityScore === 'number' && verification.qualityScore > 0),
  )
}

export function getResidentConfidence(record: ResidentRecord): number | null {
  const screeningConfidence = clampConfidence(record.verification?.screeningConfidence)
  if (screeningConfidence !== null && (screeningConfidence > 0 || hasScreeningMetadata(record))) {
    return screeningConfidence
  }

  return clampConfidence(record.verification?.overallConfidence)
}

export function getResidentAiLabel(record: ResidentRecord): string {
  const confidence = getResidentConfidence(record)
  if (confidence === null) return record.verification?.aiVerificationStatus || 'Unverified'
  if (confidence >= HIGH_MATCH_THRESHOLD) return 'High Match'
  if (confidence >= MEDIUM_MATCH_THRESHOLD) return 'Medium Match'
  return 'Low Match'
}

export function isHighMatchResident(record: ResidentRecord): boolean {
  return getResidentAiLabel(record) === 'High Match'
}

function getAiTheme(record: ResidentRecord): string {
  const confidence = getResidentConfidence(record)
  if (confidence === null) return 'bg-slate-50 text-slate-600 border-slate-300'
  if (confidence >= HIGH_MATCH_THRESHOLD) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (confidence >= MEDIUM_MATCH_THRESHOLD) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-rose-50 text-rose-700 border-rose-200'
}

function getAiDotTheme(record: ResidentRecord): string {
  const confidence = getResidentConfidence(record)
  if (confidence === null) return 'bg-slate-400'
  if (confidence >= HIGH_MATCH_THRESHOLD) return 'bg-emerald-500'
  if (confidence >= MEDIUM_MATCH_THRESHOLD) return 'bg-amber-500'
  return 'bg-rose-500'
}

export function AiMatchBadge({ record }: { record: ResidentRecord }) {
  const confidence = getResidentConfidence(record)
  const label = getResidentAiLabel(record)
  const theme = getAiTheme(record)
  const dotTheme = getAiDotTheme(record)

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${theme}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotTheme}`} />
      <span className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">{label}</span>
      {confidence !== null ? <span className="text-[11px] font-black whitespace-nowrap opacity-80 pl-1">{confidence}%</span> : null}
    </div>
  )
}

export function ResidentStatusBadge({
  status,
  approvedLabel = 'Approved',
}: {
  status: ResidentRecord['status']
  approvedLabel?: string
}) {
  const isApproved = status === 'Approved'
  const needsRevision = status === 'Needs Revision'
  const isRejected = status === 'Rejected'
  const label = isApproved ? approvedLabel : status

  const theme = isApproved
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : needsRevision
      ? 'bg-amber-50 text-amber-700 border-amber-200'
    : isRejected
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-700 border-amber-200'
      
  const dotTheme = isApproved
    ? 'bg-emerald-500'
    : needsRevision
      ? 'bg-amber-500'
    : isRejected
      ? 'bg-rose-500'
      : 'bg-amber-500'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${theme}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotTheme}`} />
      {label}
    </span>
  )
}

export function VerificationDecisionBadge({
  decision,
}: {
  decision?: ResidentRecord['verification'] extends infer Verification
    ? Verification extends { idCheckDecision?: infer T }
      ? T
      : never
    : never
}) {
  const value = decision || 'REVIEW'

  const theme =
    value === 'PASS'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : value === 'BLOCK'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-amber-50 text-amber-700 border-amber-200'

  const dotTheme =
    value === 'PASS'
      ? 'bg-emerald-500'
      : value === 'BLOCK'
        ? 'bg-rose-500'
        : 'bg-amber-500'

  const label =
    value === 'PASS'
      ? 'ID Screen Pass'
      : value === 'BLOCK'
        ? 'Needs Attention'
        : 'Manual Review'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${theme}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotTheme}`} />
      {label}
    </span>
  )
}
