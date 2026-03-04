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

  const totalDisplay = total > 0 ? String(total) : '--'
  const claimedDisplay = total > 0 ? String(claimed) : '--'
  const notClaimedDisplay = total > 0 ? String(notClaimed) : '--'
  const claimHistoryDisplay = total > 0 ? String(withClaimHistory) : '--'

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatItem
        icon={<UsersIcon className="w-5 h-5 text-blue-600" />}
        value={totalDisplay}
        label="Total Households"
        iconBg="bg-blue-100"
      />
      <StatItem
        icon={<CheckCircleIcon className="w-5 h-5 text-green-600" />}
        value={claimedDisplay}
        label="Claimed"
        iconBg="bg-green-100"
      />
      <StatItem
        icon={<HourglassIcon className="w-5 h-5 text-amber-600" />}
        value={notClaimedDisplay}
        label="Not Claimed"
        iconBg="bg-amber-100"
      />
      <StatItem
        icon={<HistoryIcon className="w-5 h-5 text-slate-600" />}
        value={claimHistoryDisplay}
        label="With Claim History"
        iconBg="bg-slate-100"
      />
    </div>
  )
}

function StatItem({
  icon,
  value,
  label,
  iconBg,
}: {
  icon: React.ReactNode
  value: string
  label: string
  iconBg: string
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

// Icons
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function HourglassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 2h12M6 22h12M8 2v6a4 4 0 002 3.464L12 13l2-1.536A4 4 0 0016 8V2m0 20v-6a4 4 0 00-2-3.464L12 11l-2 1.536A4 4 0 008 16v6"
      />
    </svg>
  )
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8m9-4v8l4 2"
      />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  )
}
