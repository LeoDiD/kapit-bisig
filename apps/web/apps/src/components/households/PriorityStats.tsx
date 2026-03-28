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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard 
        label="Total Households" 
        value={total} 
        icon={<UsersIcon className="w-5 h-5" />} 
        accent="text-blue-600 bg-blue-50" 
      />
      <StatCard 
        label="Claimed Subsidies" 
        value={claimed} 
        icon={<CheckCircleIcon className="w-5 h-5" />} 
        accent="text-emerald-600 bg-emerald-50" 
      />
      <StatCard 
        label="Pending / Unclaimed" 
        value={notClaimed} 
        icon={<HourglassIcon className="w-5 h-5" />} 
        accent="text-[#D97706] bg-amber-50" 
      />
      <StatCard 
        label="With Claim History" 
        value={withClaimHistory} 
        icon={<HistoryIcon className="w-5 h-5" />} 
        accent="text-slate-600 bg-slate-100" 
      />
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  icon, 
  accent 
}: { 
  label: string, 
  value: number, 
  icon: React.ReactNode, 
  accent: string 
}) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex items-center justify-between transition-shadow hover:shadow-md">
       <div>
         <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-1">{label}</p>
         <h3 className="text-3xl font-black text-gray-900">{value > 0 ? value : '--'}</h3>
       </div>
       <div className={`w-12 h-12 rounded-full flex items-center justify-center ${accent}`}>
         {icon}
       </div>
    </div>
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
