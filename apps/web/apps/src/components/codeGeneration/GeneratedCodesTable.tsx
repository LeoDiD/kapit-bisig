'use client'

import React from 'react'
import type { CodeStatus, GeneratedCodeRow, BatchSummary } from './types'

type Props = {
  rows: GeneratedCodeRow[]
  search: string
  setSearch: (value: string) => void
  statusFilter: 'ALL' | CodeStatus
  setStatusFilter: (value: 'ALL' | CodeStatus) => void
  onCopyRow: (code: string) => void
  summary: BatchSummary | null
  errorBanner: string
  downloadActions: React.ReactNode
}

function StatusBadge({ status }: { status: CodeStatus }) {
  const badgeClass =
    status === 'USED'
      ? 'bg-blue-100 text-blue-800'
      : status === 'EXPIRED'
        ? 'bg-slate-200 text-slate-700'
        : status === 'LOCKED'
          ? 'bg-red-100 text-red-700'
          : 'bg-emerald-100 text-emerald-700'

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>{status}</span>
}

export default function GeneratedCodesTable({
  rows,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onCopyRow,
  summary,
  errorBanner,
  downloadActions,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Generated Codes</h3>
          <p className="text-sm text-slate-500">Review and store generated code entries securely.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search code"
            aria-label="Search generated codes"
            className="h-10 w-48 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | CodeStatus)}
            aria-label="Filter by status"
            className="h-10 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="ALL">All</option>
            <option value="UNUSED">UNUSED</option>
            <option value="USED">USED</option>
            <option value="LOCKED">LOCKED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>
      </div>

      {summary ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            Generated: {summary.generatedCount}
          </span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Failed: {summary.failedCount}</span>
          {typeof summary.resolveTimeMs === 'number' ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Resolve time: {summary.resolveTimeMs}ms
            </span>
          ) : null}
        </div>
      ) : null}

      {summary ? (
        <div className="mb-4 space-y-1 text-sm">
          <p className="text-emerald-700">{`\u2705`} {summary.generatedCount} codes generated successfully</p>
          <p className="text-red-700">{`\u274c`} {summary.failedCount} failed</p>
        </div>
      ) : null}

      {errorBanner ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{errorBanner}</div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Barangay</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={`${row.code}-${index}`} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-slate-900">{row.code}</td>
                  <td className="px-4 py-3 text-slate-700">{row.barangay}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.expiry}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onCopyRow(row.code)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      aria-label={`Copy code ${row.code}`}
                    >
                      Copy
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  <div className="mx-auto max-w-md">
                    <p className="font-medium text-slate-700">No generated codes yet</p>
                    <p className="mt-1 text-slate-500">Generate a batch to view code records here.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">{downloadActions}</div>
    </section>
  )
}

