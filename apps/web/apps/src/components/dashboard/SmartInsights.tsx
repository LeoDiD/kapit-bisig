'use client'

import React, { useMemo } from 'react'

interface SmartInsightsProps {
  totalDistributions: number
  claimRate: number
  totalRegistered: number
  totalClaimed: number
  totalUnclaimed: number
  barangayBreakdown: { barangay: string; claimedHouseholds: number; registeredHouseholds: number }[]
  verificationMethods?: { qr: number; face: number; unknown: number }
  loading?: boolean
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'ai'
  title: string
  description: string
  tag: string
}

/** AI-curated smart insights derived from distribution analytics with impact chips. */
export default function SmartInsights(props: SmartInsightsProps) {
  const { loading } = props

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = []
    const { claimRate, totalUnclaimed, barangayBreakdown, verificationMethods, totalDistributions, totalClaimed } = props

    if (totalDistributions === 0) {
      result.push({
        type: 'info',
        title: 'Initial Setup In Progress',
        description: 'Create and dispatch your first relief distribution cycle to activate smart analytics.',
        tag: 'Getting Started',
      })
      return result
    }

    // Claim rate insight
    if (claimRate >= 80) {
      result.push({
        type: 'success',
        title: 'High Community Turnout',
        description: `${claimRate.toFixed(1)}% of registered households have claimed relief — top tier coverage efficiency.`,
        tag: 'Efficiency',
      })
    } else if (claimRate >= 50) {
      result.push({
        type: 'info',
        title: 'Steady Claim Momentum',
        description: `${claimRate.toFixed(1)}% claim rate. Recommend SMS or barangay follow-up with ${totalUnclaimed.toLocaleString()} pending households.`,
        tag: 'Opportunity',
      })
    } else {
      result.push({
        type: 'warning',
        title: 'Turnout Lagging Threshold',
        description: `Only ${claimRate.toFixed(1)}% turnout with ${totalUnclaimed.toLocaleString()} households unserved. Check distribution site scheduling.`,
        tag: 'Action Needed',
      })
    }

    // Low-performing barangay
    const withReg = barangayBreakdown.filter((b) => b.registeredHouseholds > 0)
    if (withReg.length > 0) {
      const lowest = [...withReg].sort((a, b) => {
        const rA = a.registeredHouseholds > 0 ? a.claimedHouseholds / a.registeredHouseholds : 0
        const rB = b.registeredHouseholds > 0 ? b.claimedHouseholds / b.registeredHouseholds : 0
        return rA - rB
      })[0]
      const rate = lowest.registeredHouseholds > 0 ? (lowest.claimedHouseholds / lowest.registeredHouseholds) * 100 : 0
      if (rate < 60) {
        result.push({
          type: 'warning',
          title: `Focus Sector: ${lowest.barangay}`,
          description: `${rate.toFixed(0)}% claim rate. ${lowest.registeredHouseholds - lowest.claimedHouseholds} households remaining to be reached.`,
          tag: 'Sector Alert',
        })
      }
    }

    // Top performing barangay
    if (withReg.length > 1) {
      const best = [...withReg].sort((a, b) => b.claimedHouseholds - a.claimedHouseholds)[0]
      result.push({
        type: 'success',
        title: `${best.barangay} Turnout Leader`,
        description: `${best.claimedHouseholds.toLocaleString()} households served — highest across all active sectors.`,
        tag: 'Top Performer',
      })
    }

    // Verification methods
    if (verificationMethods) {
      const totalVer = verificationMethods.qr + verificationMethods.face + verificationMethods.unknown
      if (totalVer > 0 && verificationMethods.face > 0) {
        const facePct = ((verificationMethods.face / totalVer) * 100).toFixed(0)
        result.push({
          type: 'ai',
          title: 'Biometric AI Security Active',
          description: `${facePct}% claims validated via Face Recognition, reducing fraud risk significantly.`,
          tag: 'Verification',
        })
      }
    }

    // Total claimed milestone
    if (totalClaimed >= 100) {
      result.push({
        type: 'success',
        title: 'Key Milestone Achieved',
        description: `${totalClaimed.toLocaleString()} total families supported across ${totalDistributions} scheduled batches.`,
        tag: 'Milestone',
      })
    }

    return result.slice(0, 3)
  }, [props])

  if (loading) {
    return (
      <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-32 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800" />
          <div className="h-4 w-12 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800" />
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800" />
          ))}
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
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs">
              ✨
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Smart Insights</h3>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            AI Digest
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Real-time pattern analysis and recommendations
        </p>

        {/* Insights Cards */}
        <div className="space-y-2.5">
          {insights.map((insight, i) => {
            const isSuccess = insight.type === 'success'
            const isWarning = insight.type === 'warning'
            const isAI = insight.type === 'ai'

            const badgeBg = isSuccess
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
              : isWarning
              ? 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
              : isAI
              ? 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40'
              : 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40'

            const iconBg = isSuccess
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300'
              : isWarning
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300'
              : isAI
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-300'
              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300'

            return (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700/70 dark:hover:bg-slate-800 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${iconBg}`}>
                      {isSuccess ? '✓' : isWarning ? '!' : isAI ? '⚡' : 'ℹ'}
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {insight.title}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${badgeBg}`}>
                    {insight.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug pl-8">
                  {insight.description}
                </p>
              </div>
            )
          })}

          {insights.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              No new insights at this time
            </div>
          )}
        </div>
      </div>

      {/* Footer Ribbon */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Updated continuously</span>
        <span className="font-semibold text-slate-500 dark:text-slate-400">✨ Self-optimizing model</span>
      </div>
    </div>
  )
}

