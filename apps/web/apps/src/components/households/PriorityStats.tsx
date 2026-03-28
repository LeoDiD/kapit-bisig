import React from 'react'

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
    <section className="mb-6 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-sky-50/40 p-4 sm:p-6 shadow-[0_2px_14px_rgba(0,0,0,0.05)]">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-gray-500">Household Overview</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-black text-gray-900 leading-tight">Population Assistance Snapshot</h2>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">
          <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-700">Claim Rate</p>
          <p className="text-2xl font-black text-emerald-800 leading-tight">{claimRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Total Households"
          value={total}
          helper="Registered records"
          icon={<UsersIcon className="w-5 h-5" />}
          accent="text-blue-700 bg-blue-100"
        />
        <StatCard
          label="Claimed Subsidies"
          value={claimed}
          helper="Ready for next cycle"
          icon={<CheckCircleIcon className="w-5 h-5" />}
          accent="text-emerald-700 bg-emerald-100"
          progress={claimRate}
          progressColor="bg-emerald-500"
        />
        <StatCard
          label="Pending / Unclaimed"
          value={notClaimed}
          helper="Needs follow-up"
          icon={<HourglassIcon className="w-5 h-5" />}
          accent="text-amber-700 bg-amber-100"
          progress={100 - claimRate}
          progressColor="bg-amber-500"
        />
        <StatCard
          label="With Claim History"
          value={withClaimHistory}
          helper="Previously assisted"
          icon={<HistoryIcon className="w-5 h-5" />}
          accent="text-slate-700 bg-slate-200"
        />
      </div>
    </section>
  )
}

function StatCard({ 
  label, 
  value, 
  helper,
  icon, 
  accent,
  progress,
  progressColor,
}: { 
  label: string
  value: number
  helper: string
  icon: React.ReactNode
  accent: string
  progress?: number
  progressColor?: string
}) {
  const clampedProgress = typeof progress === 'number'
    ? Math.min(100, Math.max(0, progress))
    : undefined

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">{label}</p>
          <h3 className="mt-1 text-3xl font-black text-gray-900 leading-tight">{value > 0 ? value : '--'}</h3>
          <p className="mt-1 text-xs text-gray-500">{helper}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
          {icon}
        </div>
      </div>
      {typeof clampedProgress === 'number' && (
        <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${progressColor ?? 'bg-gray-700'}`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      )}
    </article>
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
