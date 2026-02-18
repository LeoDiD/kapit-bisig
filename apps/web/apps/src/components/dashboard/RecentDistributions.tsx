import React from 'react'

interface Distribution {
  id: string
  name: string
  items: string
  assignee: string
  status: 'pending' | 'in-transit' | 'delivered'
  date: string
}

const distributions: Distribution[] = [
  {
    id: '1',
    name: 'Sana Piliin De Vera',
    items: '3 items',
    assignee: 'Peter Diaz',
    status: 'pending',
    date: 'January 11, 2025',
  },
  {
    id: '2',
    name: 'Bryle Agra',
    items: '2 items',
    assignee: 'Peter Diaz',
    status: 'in-transit',
    date: 'January 11, 2025',
  },
  {
    id: '3',
    name: 'Dwight Aliman',
    items: '3 items',
    assignee: 'Peter Diaz',
    status: 'delivered',
    date: 'January 11, 2025',
  },
]

const statusStyles = {
  pending: 'bg-yellow-500 text-white',
  'in-transit': 'bg-green-600 text-white',
  delivered: 'bg-gray-200 text-gray-600',
}

const statusLabels = {
  pending: 'Pending',
  'in-transit': 'In Transit',
  delivered: 'Delivered',
}

export default function RecentDistributions() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Recent Distributions</h3>
        <button className="text-xs text-green-600 hover:text-green-700 font-medium">
          View all
        </button>
      </div>

      <div className="space-y-3">
        {distributions.map((dist) => (
          <div 
            key={dist.id} 
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{dist.name}</p>
                <p className="text-xs text-gray-500">{dist.items} • {dist.assignee}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusStyles[dist.status]}`}>
                {statusLabels[dist.status]}
              </span>
              <p className="text-[11px] text-gray-400 mt-1">{dist.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
