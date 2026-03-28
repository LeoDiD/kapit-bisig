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
    <div className="flex flex-col sm:flex-row gap-3 items-center">
      <div className="rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-[12px] font-bold text-amber-900 dark:text-amber-400">
        Codes are only shown once. Download and secure.
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDownloadCsv}
          disabled={disabled}
          className="rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          CSV
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={disabled}
          className="rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          PDF
        </button>
        <button
          type="button"
          onClick={onCopyAll}
          disabled={disabled}
          className="rounded-xl bg-[#004A1C] dark:bg-[#ECC323] px-5 py-2 text-sm font-bold text-white dark:text-[#004A1C] hover:bg-[#003815] dark:hover:bg-yellow-400 transition-colors shadow-md shadow-[#004A1C]/20 dark:shadow-[#ECC323]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Copy all
        </button>
      </div>
    </div>
  )
}

