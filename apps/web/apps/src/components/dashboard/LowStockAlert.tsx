import React from 'react'
import Link from 'next/link'

interface AlertItem {
  id: string
  label: string
  detail: string
  severity: 'red' | 'yellow' | 'blue'
}

interface AlertsPanelProps {
  pendingWrites?: number
  pendingDistributions?: number
  unclaimedHouseholds?: number
  loading?: boolean
}

export default function LowStockAlert({ pendingWrites = 0, pendingDistributions = 0, unclaimedHouseholds = 0, loading }: AlertsPanelProps) {
  const alerts: AlertItem[] = []

  if (pendingWrites > 0) {
    alerts.push({ id: 'pw', label: 'Blockchain writes pending', detail: `${pendingWrites} transaction(s) confirming`, severity: 'yellow' })
  }
  if (pendingDistributions > 0) {
    alerts.push({ id: 'pd', label: 'Distributions unclaimed', detail: `${pendingDistributions} distribution(s) awaiting claims`, severity: 'red' })
  }
  if (unclaimedHouseholds > 0) {
    alerts.push({ id: 'uh', label: 'Unclaimed households', detail: `${unclaimedHouseholds} household(s) not yet served`, severity: 'blue' })
  }

  const severityStyles = {
    red: { bg: 'bg-red-50', border: 'border-red-100', iconBg: 'bg-red-100', iconColor: 'text-red-500', textColor: 'text-red-600' },
    yellow: { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', iconColor: 'text-amber-500', textColor: 'text-amber-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-500', textColor: 'text-blue-600' },
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Alerts</h3>
        {alerts.length > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {alerts.length} Active
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-3">Status updates that need attention</p>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircleIcon className="w-8 h-8 text-emerald-400 mb-2" />
          <p className="text-sm text-gray-500">All clear — no alerts right now</p>
        </div>
      ) : (
        <div className="space-y-2.5 mb-4">
          {alerts.map((alert) => {
            const s = severityStyles[alert.severity]
            return (
              <div key={alert.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${s.bg} ${s.border}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.iconBg}`}>
                  <AlertTriangleIcon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 leading-tight">{alert.label}</p>
                  <p className={`text-xs ${s.textColor} mt-0.5`}>{alert.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Link
        href="/blockchain-ledger"
        className="block w-full py-2.5 text-center border-2 border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        Open Blockchain Ledger
      </Link>
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
