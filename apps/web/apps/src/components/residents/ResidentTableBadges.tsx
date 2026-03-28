'use client'

import React from 'react'
import type { ResidentRecord } from '@/lib/api'

function getConfidence(record: ResidentRecord): number | null {
  const confidence = record.verification?.overallConfidence
  return typeof confidence === 'number' ? Math.max(0, Math.min(100, confidence)) : null
}

function getAiLabel(record: ResidentRecord): string {
  return record.verification?.aiVerificationStatus || 'Unverified'
}

function getAiTheme(record: ResidentRecord): string {
  const confidence = getConfidence(record)
  if (confidence === null) return 'bg-slate-50 text-slate-600 border-slate-300'
  if (confidence >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (confidence >= 75) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-rose-50 text-rose-700 border-rose-200'
}

function getAiDotTheme(record: ResidentRecord): string {
  const confidence = getConfidence(record)
  if (confidence === null) return 'bg-slate-400'
  if (confidence >= 90) return 'bg-emerald-500'
  if (confidence >= 75) return 'bg-amber-500'
  return 'bg-rose-500'
}

export function AiMatchBadge({ record }: { record: ResidentRecord }) {
  const confidence = getConfidence(record)
  const label = getAiLabel(record)
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
}: {
  status: ResidentRecord['status']
}) {
  const isApproved = status === 'Approved'
  const isRejected = status === 'Rejected'

  const theme = isApproved
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isRejected
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-700 border-amber-200'
      
  const dotTheme = isApproved
    ? 'bg-emerald-500'
    : isRejected
      ? 'bg-rose-500'
      : 'bg-amber-500'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${theme}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotTheme}`} />
      {status}
    </span>
  )
}
