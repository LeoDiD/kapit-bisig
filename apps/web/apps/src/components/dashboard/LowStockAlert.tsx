'use client'

import React from 'react'
import Link from 'next/link'

interface AlertItem {
  id: string
  label: string
  detail: string
  severity: 'red' | 'yellow' | 'blue'
  actionHref?: string
  actionLabel?: string
}

interface AlertsPanelProps {
  pendingDistributions?: number
  unclaimedHouseholds?: number
  loading?: boolean
}

export default function LowStockAlert({
  pendingDistributions = 0,
  unclaimedHouseholds = 0,
  loading,
}: AlertsPanelProps) {
  const alerts: AlertItem[] = []

  if (pendingDistributions > 0) {
    alerts.push({
      id: 'pd',
      label: 'Distributions Awaiting Claims',
      detail: `${pendingDistributions} distribution cycle(s) currently open`,
      severity: 'yellow',
      actionHref: '/distribution',
      actionLabel: 'View Queue',
    })
  }

  if (unclaimedHouseholds > 0) {
    alerts.push({
      id: 'uh',
      label: 'Unclaimed Relief Packages',
      detail: `${unclaimedHouseholds} beneficiary household(s) not yet served`,
      severity: 'blue',
      actionHref: '/households',
      actionLabel: 'Check List',
    })
  }

  // System readiness score calculation
  const totalTasks = pendingDistributions + unclaimedHouseholds
  const readinessScore = totalTasks === 0 ? 100 : Math.max(20, Math.min(95, 100 - pendingDistributions * 10 - Math.floor(unclaimedHouseholds / 5)))

  if (loading) {
    return (
      <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-28 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800" />
          <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse dark:bg-slate-800" />
        </div>
        <div className="space-y-3">
          <div className="h-16 bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800" />
          <div className="h-16 bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Operational Alerts</h3>
            {alerts.length > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {alerts.length} Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                All Clear
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-slate-400">Live Status</span>
        </div>

        {/* Readiness Meter Card */}
        <div className="mb-3.5 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/80 border border-slate-200/80 dark:from-slate-800/80 dark:to-slate-800/40 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-ping" />
              Relief Pipeline Readiness
            </span>
            <span className={`font-bold ${readinessScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {readinessScore}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                readinessScore >= 80
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${readinessScore}%` }}
            />
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-2.5">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center rounded-xl bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800/30">
              <CheckCircleIcon className="w-8 h-8 text-emerald-500 mb-1.5" />
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">All Distributions Optimized</p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">No immediate pending backlog or alerts.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    alert.severity === 'yellow' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  }`}>
                    <AlertTriangleIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                      {alert.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {alert.detail}
                    </p>
                  </div>
                </div>
                {alert.actionHref && (
                  <Link
                    href={alert.actionHref}
                    className="shrink-0 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {alert.actionLabel || 'Action'}
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer System Banner */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Database sync active
        </span>
        <Link href="/reports" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
          Analytics →
        </Link>
      </div>
    </div>
  )
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

