import React from 'react'

type UserStatsCardsProps = {
  total?: number
  active?: number
  pending?: number
  inactive?: number
}

export default function UserStatsCards({
  total = 0,
  active = 0,
  pending = 0,
  inactive = 0,
}: UserStatsCardsProps) {
  const items = [
    { label: 'Total Staff', value: total },
    { label: 'Active', value: active },
    { label: 'Pending', value: pending },
    { label: 'Inactive', value: inactive },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{item.value > 0 ? item.value : '--'}</p>
        </div>
      ))}
    </div>
  )
}
