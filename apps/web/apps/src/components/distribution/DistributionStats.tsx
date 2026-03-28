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
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl mb-6 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden">
      <StatSection 
        label="Total Barangays" 
        value={barangays} 
        icon={<PinIcon className="w-5 h-5 text-gray-500" />} 
      />
      <StatSection 
        label="Households Served" 
        value={householdsServed} 
        icon={<UsersIcon className="w-5 h-5 text-blue-600" />} 
      />
      <StatSection 
        label="Claimed Subsidies" 
        value={claimed} 
        icon={<CheckCircleIcon className="w-5 h-5 text-emerald-600" />} 
      />
      <StatSection 
        label="Unclaimed / Pending" 
        value={unclaimed} 
        icon={<ClockIcon className="w-5 h-5 text-amber-500" />} 
      />
    </div>
  )
}

function StatSection({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="flex-1 flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors">
      <div>
        <p className="text-[11px] font-bold tracking-wider text-gray-500 uppercase mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-900 leading-tight">{value > 0 ? value : '--'}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
        {icon}
      </div>
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
