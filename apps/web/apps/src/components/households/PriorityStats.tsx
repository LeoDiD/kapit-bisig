import React from 'react'

type Counts = {
  high: number
  medium: number
  low: number
  total: number
}

export default function PriorityStats({
  counts,
}: {
  counts?: Partial<Counts>
}) {
  const valueHigh = counts?.high ?? 2
  const valueMedium = counts?.medium ?? 2
  const valueLow = counts?.low ?? 1
  const valueTotal = counts?.total ?? 5

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatItem
        icon={<BrainIcon className="w-6 h-6 text-red-600" />}
        value={String(valueHigh)}
        label="High Priority"
        iconBg="bg-red-100"
      />
      <StatItem
        icon={<BrainIcon className="w-6 h-6 text-yellow-600" />}
        value={String(valueMedium)}
        label="Medium Priority"
        iconBg="bg-yellow-100"
      />
      <StatItem
        icon={<BrainIcon className="w-6 h-6 text-green-600" />}
        value={String(valueLow)}
        label="Low Priority"
        iconBg="bg-green-100"
      />
      <StatItem
        icon={<UsersIcon className="w-6 h-6 text-blue-600" />}
        value={String(valueTotal)}
        label="Total Families"
        iconBg="bg-blue-100"
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
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

// Icons
function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
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
