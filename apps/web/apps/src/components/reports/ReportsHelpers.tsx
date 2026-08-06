import React, { useState, useRef, useEffect } from 'react';
import { type ReportDistributionRow } from '@/lib/api';

// ─── Helpers ────────────────────────────────────────────────

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function downloadCSV(rows: ReportDistributionRow[], filename: string) {
  const headers = [
    'Date', 'Barangay', 'Assigned Barangays', 'Registered Households',
    'Claimed', 'Unclaimed', 'Claim Rate (%)', 'Status',
  ]
  const csvRows = rows.map((r) => [
    formatDate(r.scheduled || r.createdAt),
    r.barangay,
    (r.assignedBarangays || []).join('; '),
    r.registeredHouseholds,
    r.claimedHouseholds,
    r.unclaimedHouseholds,
    r.claimRate,
    r.status,
  ])

  const csv = [
    headers.join(','),
    ...csvRows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}



// ─── Components ─────────────────────────────────────────────

export type DropdownItem = { value: string; label: string }

export function Dropdown({
  value,
  items,
  onChange,
  buttonLabel,
  widthClass = 'min-w-[200px]',
}: {
  value: string
  items: DropdownItem[]
  onChange: (v: string) => void
  buttonLabel: string
  widthClass?: string
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const selectedLabel = items.find((i) => i.value === value)?.label ?? buttonLabel

  return (
    <div className={`relative ${widthClass}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)]"
      >
        <span className="text-sm">{selectedLabel}</span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div
          ref={menuRef}
          className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-[#DCDCDC] bg-[#ECECEC] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        >
          {items.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={[
                  'w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-left transition-colors',
                  isSelected ? 'bg-[#EAB308] text-gray-900' : 'text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                <span className="w-5 flex items-center justify-center">
                  {isSelected ? <CheckIcon /> : null}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function StatCard({
  icon, title, value,
}: {
  icon: React.ReactNode; title: string; value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{value}</div>
        <div className="text-xs text-gray-500 dark:text-slate-400">{title}</div>
      </div>
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const cls =
    status === 'Claimed'
      ? 'bg-green-600 text-white'
      : status === 'Partially Claimed'
        ? 'bg-[#EAB308] text-white'
        : 'bg-gray-400 text-white'
        
  const label =
    status === 'Claimed'
      ? 'Completed'
      : status === 'Partially Claimed'
        ? 'Active'
        : 'Scheduled'
        
  return (
    <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

export function ClaimRateBar({ rate }: { rate: number }) {
  const color =
    rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-[#EAB308]' : rate > 0 ? 'bg-orange-400' : 'bg-gray-300'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-medium text-gray-600 dark:text-slate-300">{rate}%</span>
    </div>
  )
}

export function Donut({
  segments,
}: {
  segments: { label: string; value: number; stroke: string }[]
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const radius = 44
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center justify-between gap-4">
      <svg width="128" height="128" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-200 dark:text-slate-700" />
        {segments.map((seg, idx) => {
          const dash = (seg.value / total) * circumference
          const gap = circumference - dash
          const dashArray = `${dash} ${gap}`
          const dashOffset = -offset
          offset += dash
          return (
            <circle
              key={idx} cx="60" cy="60" r={radius} fill="none"
              stroke={seg.stroke} strokeWidth="12" strokeLinecap="butt"
              strokeDasharray={dashArray} strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
            />
          )
        })}
        <circle cx="60" cy="60" r="28" fill="currentColor" className="text-white dark:text-slate-900" />
      </svg>
      <div className="flex flex-col gap-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ background: s.stroke }} />
            <span className="text-gray-600 dark:text-slate-300">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MiniBarChart({
  labels, seriesA, seriesB, legendA, legendB,
}: {
  labels: string[]; seriesA: number[]; seriesB: number[]
  legendA: string; legendB: string
}) {
  const max = Math.max(...seriesA, ...seriesB, 1)
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#0F533A]" /> {legendA}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#9ACB3C]" /> {legendB}
        </span>
      </div>
      <div className="flex items-end gap-3 h-44">
        {labels.map((m, i) => {
          const a = (seriesA[i] / max) * 100
          const b = (seriesB[i] / max) * 100
          return (
            <div key={m} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end justify-center gap-1 w-full h-36">
                <div
                  className="w-3 rounded-t-md bg-[#0F533A] transition-all duration-300"
                  style={{ height: `${a}%`, minHeight: seriesA[i] > 0 ? '4px' : '0px' }}
                  title={`${legendA}: ${seriesA[i]}`}
                />
                <div
                  className="w-3 rounded-t-md bg-[#9ACB3C] transition-all duration-300"
                  style={{ height: `${b}%`, minHeight: seriesB[i] > 0 ? '4px' : '0px' }}
                  title={`${legendB}: ${seriesB[i]}`}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-gray-500 dark:text-slate-400">
        {labels.map((m) => (
          <span key={m} className="w-full text-center">{m}</span>
        ))}
      </div>
    </div>
  )
}

export function SummaryCell({
  label, value, valueClass = 'text-gray-900',
}: {
  label: string; value: string; valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between lg:block">
      <div className="text-xs text-gray-500 dark:text-slate-400">{label}</div>
      <div className={`text-sm font-semibold ${valueClass}`}>{value}</div>
    </div>
  )
}

export function MenuItem({
  icon, label, onClick,
}: {
  icon: React.ReactNode; label: string; onClick: () => void
}) {
  return (
    <button
      type="button" onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <span className="text-slate-500 dark:text-slate-400">{icon}</span>{label}
    </button>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-[#0F533A] dark:border-slate-700 dark:border-t-[#ECC323]" />
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500">
      <DocIcon className="w-12 h-12 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  )
}



/* ═══════════════════════════════════════════════════════════
   Icons
   ═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   Icons
   ═══════════════════════════════════════════════════════════ */

export function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
export function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}
export function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17v-3.586L3.293 6.707A1 1 0 013 6V4z" />
    </svg>
  )
}
export function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
export function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15V3" />
    </svg>
  )
}
export function ClearIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
export function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
    </svg>
  )
}
export function CubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8v8l9 5 9-5V8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13v8" />
    </svg>
  )
}
export function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
export function TrendIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 7h7v7" />
    </svg>
  )
}
export function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}
export function UnclaimedIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}
export function DotsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
    </svg>
  )
}
export function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
export function QRIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14h3v3h-3zM14 20h7M20 14v3" />
    </svg>
  )
}
export function FaceIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth={3} strokeLinecap="round" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
export function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
