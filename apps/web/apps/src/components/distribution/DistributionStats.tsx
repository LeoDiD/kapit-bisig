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
  const total = claimed + unclaimed
  const claimRate = total > 0 ? Math.round((claimed / total) * 100) : 0
  const unclaimedRate = total > 0 ? Math.round((unclaimed / total) * 100) : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Barangays"
        value={barangays}
        icon={<PinIcon className="w-5 h-5" />}
        iconBg="bg-blue-50 text-blue-600"
        accentColor="border-blue-400"
        subtext="covered areas"
      />
      <StatCard
        label="Households Served"
        value={householdsServed}
        icon={<UsersIcon className="w-5 h-5" />}
        iconBg="bg-indigo-50 text-indigo-600"
        accentColor="border-indigo-400"
        subtext="total beneficiaries"
      />
      <StatCard
        label="Claimed Subsidies"
        value={claimed}
        icon={<CheckCircleIcon className="w-5 h-5" />}
        iconBg="bg-emerald-50 text-emerald-600"
        accentColor="border-emerald-400"
        subtext={`${claimRate}% claim rate`}
        progress={claimRate}
        progressColor="bg-emerald-500"
      />
      <StatCard
        label="Unclaimed / Pending"
        value={unclaimed}
        icon={<ClockIcon className="w-5 h-5" />}
        iconBg="bg-amber-50 text-amber-600"
        accentColor="border-amber-400"
        subtext={total > 0 ? `${unclaimedRate}% still pending` : 'no distributions'}
        progress={total > 0 ? unclaimedRate : 0}
        progressColor="bg-amber-400"
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  accentColor,
  subtext,
  progress,
  progressColor,
}: {
  label: string
  value: number
  icon: React.ReactNode
  iconBg: string
  accentColor: string
  subtext?: string
  progress?: number
  progressColor?: string
}) {
  return (
    <div className={`bg-white rounded-2xl border-t-4 ${accentColor} border-x border-b border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <span className="text-3xl font-black text-gray-900 leading-none">
          {value > 0 ? value : '--'}
        </span>
      </div>
      <div>
        <p className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">{label}</p>
        {subtext && (
          <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
        )}
      </div>
      {progress !== undefined && progressColor && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${progressColor} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
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
