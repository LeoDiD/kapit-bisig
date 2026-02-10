import React from 'react'

interface UserStatsCardsProps {
  stats: {
    total: number
    active: number
    inactive: number
  }
}

export default function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard value={stats.total} label="Total Staff" />
      <StatsCard value={stats.active} label="Active" />
      <StatsCard value={stats.inactive} label="Inactive" />
    </div>
  )
}

interface StatsCardProps {
  value: number
  label: string
}

function StatsCard({ value, label }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </div>
  )
}
