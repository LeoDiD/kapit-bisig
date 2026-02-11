import React from 'react'

type Counts = {
  total: number
  highPriority: number
  mediumPriority: number
  lowPriority: number
}

export default function PriorityStats({
  counts,
}: {
  counts?: Partial<Counts>
}) {
  const total = counts?.total ?? 0
  const highPriority = counts?.highPriority ?? 0
  const mediumPriority = counts?.mediumPriority ?? 0
  const lowPriority = counts?.lowPriority ?? 0

  const totalDisplay = total > 0 ? String(total) : '--'
  const highDisplay = total > 0 && highPriority > 0 ? String(highPriority) : '--'
  const mediumDisplay = total > 0 && mediumPriority > 0 ? String(mediumPriority) : '--'
  const lowDisplay = total > 0 && lowPriority > 0 ? String(lowPriority) : '--'

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatItem
        icon={<AlertIcon className="w-5 h-5 text-red-600" />}
        value={highDisplay}
        label="High Priority"
        iconBg="bg-red-100"
      />
      <StatItem
        icon={<BulbIcon className="w-5 h-5 text-yellow-600" />}
        value={mediumDisplay}
        label="Medium Priority"
        iconBg="bg-yellow-100"
      />
      <StatItem
        icon={<SparkIcon className="w-5 h-5 text-green-600" />}
        value={lowDisplay}
        label="Low Priority"
        iconBg="bg-green-100"
      />
      <StatItem
        icon={<UsersIcon className="w-5 h-5 text-blue-600" />}
        value={totalDisplay}
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
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
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
function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
      />
    </svg>
  )
}

function BulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 2a7 7 0 00-4 12.74V17a2 2 0 002 2h4a2 2 0 002-2v-2.26A7 7 0 0012 2zm-1 20h2m-2-3h2"
      />
    </svg>
  )
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M19 3v4m-2-2h4M7 21l5-18 5 18-5-4-5 4z"
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
