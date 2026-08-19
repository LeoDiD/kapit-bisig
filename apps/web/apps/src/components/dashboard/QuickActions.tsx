'use client'

import React from 'react'
import Link from 'next/link'

interface QuickAction {
  label: string
  subtitle: string
  href: string
  icon: React.ReactNode
  color: string
}

const actions: QuickAction[] = [
  {
    label: 'New Distribution',
    subtitle: 'Schedule & allocate',
    href: '/distribution',
    color: 'from-emerald-500 to-teal-600',
    icon: <DistributionIcon className="w-4 h-4 text-white" />,
  },
  {
    label: 'Generate Reports',
    subtitle: 'Export data & stats',
    href: '/reports',
    color: 'from-blue-500 to-indigo-600',
    icon: <ReportsIcon className="w-4 h-4 text-white" />,
  },
  {
    label: 'Beneficiaries',
    subtitle: 'Target & verify',
    href: '/target-beneficiaries',
    color: 'from-amber-500 to-orange-600',
    icon: <UserAddIcon className="w-4 h-4 text-white" />,
  },
  {
    label: 'Claim Codes',
    subtitle: 'Manage QR tokens',
    href: '/code-generation',
    color: 'from-purple-500 to-pink-600',
    icon: <QrTokenIcon className="w-4 h-4 text-white" />,
  },
]

export default function QuickActions() {
  return (
    <div className="h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Quick Actions</h3>
          <span className="text-[11px] font-semibold text-slate-400">Shortcuts</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Frequently accessed administrative tasks</p>

        <div className="grid grid-cols-2 gap-2.5">
          {actions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="group relative p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700/70 dark:hover:bg-slate-800 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <span className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors text-xs">
                  →
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                  {action.label}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {action.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer shortcut tip */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Press anywhere to navigate</span>
        <span className="font-semibold text-slate-500 dark:text-slate-400">⚡ Fast access</span>
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function QrTokenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  )
}

