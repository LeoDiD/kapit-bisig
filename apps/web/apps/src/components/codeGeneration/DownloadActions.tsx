'use client'

import React from 'react'

type Props = {
  disabled: boolean
  onDownloadCsv: () => void
  onDownloadPdf: () => void
  onCopyAll: () => void
}

export default function DownloadActions({ disabled, onDownloadCsv, onDownloadPdf, onCopyAll }: Props) {
  return (
    <div>
      <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
        Codes are only shown once. Download and store securely.
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDownloadCsv}
          disabled={disabled}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Download CSV
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={disabled}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Download PDF
        </button>
        <button
          type="button"
          onClick={onCopyAll}
          disabled={disabled}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Copy all
        </button>
      </div>
    </div>
  )
}

