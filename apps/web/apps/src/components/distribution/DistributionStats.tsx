import React from 'react'

export default function DistributionStats({
  unclaimed,
  claimed,
  householdsServed,
  barangays,
}: {
  unclaimed: number
  claimed: number
  householdsServed: number
  barangays: number
}) {
  const totalDistributions = claimed + unclaimed
  const claimedRate = totalDistributions > 0 ? Math.round((claimed / totalDistributions) * 100) : 0
  const unclaimedRate = totalDistributions > 0 ? 100 - claimedRate : 0

  return (
    <section className="mb-6 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50 p-4 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-4 sm:mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-gray-500">Distribution Overview</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-black text-gray-900 leading-tight">Live Barangay Distribution Snapshot</h2>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">Total Distributions</p>
          <p className="text-2xl font-black text-gray-900 leading-tight">{totalDistributions > 0 ? totalDistributions : '--'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Barangays"
          value={barangays}
          helper="Covered areas"
          icon={<PinIcon className="w-5 h-5 text-gray-700" />}
          iconBg="bg-gray-100"
        />
        <StatCard
          label="Households Served"
          value={householdsServed}
          helper="Claimed households"
          icon={<UsersIcon className="w-5 h-5 text-blue-700" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          label="Claimed Subsidies"
          value={claimed}
          helper={`${claimedRate}% completion`}
          icon={<CheckCircleIcon className="w-5 h-5 text-emerald-700" />}
          iconBg="bg-emerald-100"
          progress={claimedRate}
          progressClassName="bg-emerald-500"
        />
        <StatCard
          label="Unclaimed / Pending"
          value={unclaimed}
          helper={`${unclaimedRate}% remaining`}
          icon={<ClockIcon className="w-5 h-5 text-amber-700" />}
          iconBg="bg-amber-100"
          progress={unclaimedRate}
          progressClassName="bg-amber-500"
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
  iconBg,
  progress,
  progressClassName,
}: {
  label: string
  value: number
  helper: string
  icon: React.ReactNode
  iconBg: string
  progress?: number
  progressClassName?: string
}) {
  const clampedProgress = typeof progress === 'number'
    ? Math.min(100, Math.max(0, progress))
    : undefined

  return (
    <article className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">{label}</p>
          <p className="mt-1 text-3xl font-black text-gray-900 leading-tight">{value > 0 ? value : '--'}</p>
          <p className="mt-1 text-xs text-gray-500">{helper}</p>
        </div>
        <div className={`h-11 w-11 rounded-xl border border-white/70 flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>

      {typeof clampedProgress === 'number' && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressClassName ?? 'bg-gray-700'}`}
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>
      )}
    </article>
  )
}

/* Icons */
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22a10 10 0 110-20 10 10 0 010 20z" />
    </svg>
  )
}
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22a10 10 0 110-20 10 10 0 010 20z" />
    </svg>
  )
}
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
