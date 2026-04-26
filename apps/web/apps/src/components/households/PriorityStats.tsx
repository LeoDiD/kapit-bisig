import React from 'react'
import SummaryMetricCard from '@/components/ui/SummaryMetricCard'

type Counts = {
  total: number
  claimed: number
  notClaimed: number
  withClaimHistory: number
}

export default function HouseholdStats({
  counts,
}: {
  counts?: Partial<Counts>
}) {
  const total = counts?.total ?? 0
  const claimed = counts?.claimed ?? 0
  const notClaimed = counts?.notClaimed ?? 0
  const withClaimHistory = counts?.withClaimHistory ?? 0
  const claimRate = total > 0 ? Math.round((claimed / total) * 100) : 0

  return (
    <section className="mb-6 rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Relief Registry Overview</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">
              Resident relief summary
            </h2>
          </div>
          <p className="text-sm text-slate-500">Claim rate {claimRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        <SummaryMetricCard
          label="Registry Rows"
          value={total}
          helper="Resident-based records"
          icon={<UsersIcon className="h-5 w-5" />}
        />
        <SummaryMetricCard
          label="Claimed"
          value={claimed}
          helper="Released support"
          icon={<CheckCircleIcon className="h-5 w-5" />}
        />
        <SummaryMetricCard
          label="Pending"
          value={notClaimed}
          helper="Needs follow-up"
          icon={<HourglassIcon className="h-5 w-5" />}
        />
        <SummaryMetricCard
          label="With History"
          value={withClaimHistory}
          helper="Previously assisted"
          icon={<HistoryIcon className="h-5 w-5" />}
        />
      </div>
    </section>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function HourglassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 2h12M6 22h12M8 2v6a4 4 0 002 3.464L12 13l2-1.536A4 4 0 0016 8V2m0 20v-6a4 4 0 00-2-3.464L12 11l-2 1.536A4 4 0 008 16v6" />
    </svg>
  )
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8m9-4v8l4 2" />
    </svg>
  )
}
