import React from 'react'
import Link from 'next/link'

interface QuickAction {
  label: string
  href: string
  icon: React.ReactNode
}

const actions: QuickAction[] = [
  { 
    label: 'View Reports', 
    href: '/reports',
    icon: <ReportsIcon className="w-5 h-5" />
  },
  { 
    label: 'Blockchain Ledger', 
    href: '/blockchain-ledger',
    icon: <ShieldIcon className="w-5 h-5" />
  },
  { 
    label: 'New Distribution', 
    href: '/distribution/new',
    icon: <DistributionIcon className="w-5 h-5" />
  },
  { 
    label: 'Add User', 
    href: '/users?openAdd=1',
    icon: <UserAddIcon className="w-5 h-5" />
  },
]

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 h-full flex flex-col">
      <h3 className="text-base font-bold text-gray-800 mb-3">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-3 flex-1 content-center">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-green-100 flex items-center justify-center text-gray-500 group-hover:text-green-600 transition-colors">
              {action.icon}
            </div>
            <span className="text-xs font-medium text-gray-600 group-hover:text-green-700 text-center leading-tight">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
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
