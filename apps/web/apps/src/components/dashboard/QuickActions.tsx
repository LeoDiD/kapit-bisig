import React from 'react'
import Link from 'next/link'

interface QuickAction {
  label: string
  href: string
  icon: React.ReactNode
}

const actions: QuickAction[] = [
  { 
    label: 'Add Household', 
    href: '/households/add',
    icon: <HouseIcon className="w-5 h-5" />
  },
  { 
    label: 'Add Inventory', 
    href: '/inventory/add',
    icon: <PackageIcon className="w-5 h-5" />
  },
  { 
    label: 'New Distribution', 
    href: '/distribution/new',
    icon: <DistributionIcon className="w-5 h-5" />
  },
  { 
    label: 'Add User', 
    href: '/users/add',
    icon: <UserAddIcon className="w-5 h-5" />
  },
]

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-green-100 flex items-center justify-center text-gray-500 group-hover:text-green-600 transition-colors">
              {action.icon}
            </div>
            <span className="text-sm font-medium text-gray-600 group-hover:text-green-700 text-center">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function HouseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function DistributionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}

function UserAddIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  )
}
