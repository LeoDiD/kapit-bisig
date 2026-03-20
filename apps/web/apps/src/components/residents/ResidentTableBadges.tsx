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
  if (confidence === null) return 'bg-slate-50 text-slate-700 border-slate-200'
  if (confidence >= 90) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (confidence >= 75) return 'bg-amber-50 text-amber-800 border-amber-200'
  return 'bg-rose-50 text-rose-700 border-rose-200'
}

export function AiMatchBadge({ record }: { record: ResidentRecord }) {
  const confidence = getConfidence(record)
  const label = getAiLabel(record)
  const theme = getAiTheme(record)

  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 ${theme}`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
      {confidence !== null ? <span className="text-xs font-bold whitespace-nowrap">{confidence}%</span> : null}
    </div>
  )
}

export function ResidentStatusBadge({
  status,
}: {
  status: ResidentRecord['status']
}) {
  const theme = status === 'Approved'
    ? 'bg-emerald-600 text-white border-emerald-600'
    : status === 'Rejected'
      ? 'bg-rose-600 text-white border-rose-600'
      : 'bg-amber-100 text-amber-800 border-amber-200'

  return (
    <span className={`inline-flex rounded-xl border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${theme}`}>
      {status}
    </span>
  )
}
