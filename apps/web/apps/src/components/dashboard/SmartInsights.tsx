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
  type: 'success' | 'warning' | 'info'
  title: string
  description: string
}

/** AI-curated smart insights panel derived from distribution analytics. */
export default function SmartInsights(props: SmartInsightsProps) {
  const { loading } = props

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = []
    const { claimRate, totalUnclaimed, barangayBreakdown, verificationMethods, totalDistributions, totalClaimed } = props

    if (totalDistributions === 0) {
      result.push({ type: 'info', title: 'No distributions yet', description: 'Create your first distribution to see smart insights here.' })
      return result
    }

    // Claim rate insight
    if (claimRate >= 80) {
      result.push({ type: 'success', title: 'Strong claim rate', description: `${claimRate.toFixed(1)}% of registered households have claimed relief — excellent coverage.` })
    } else if (claimRate >= 50) {
      result.push({ type: 'info', title: 'Moderate claim rate', description: `${claimRate.toFixed(1)}% claim rate. Consider follow-ups with ${totalUnclaimed} unclaimed households.` })
    } else {
      result.push({ type: 'warning', title: 'Low claim rate detected', description: `Only ${claimRate.toFixed(1)}% claim rate with ${totalUnclaimed} households unclaimed. Immediate action recommended.` })
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
          title: `${lowest.barangay} needs attention`,
          description: `Only ${rate.toFixed(0)}% claim rate with ${lowest.registeredHouseholds - lowest.claimedHouseholds} unclaimed households.`,
        })
      }
    }

    // Top performing barangay
    if (withReg.length > 1) {
      const best = [...withReg].sort((a, b) => b.claimedHouseholds - a.claimedHouseholds)[0]
      result.push({
        type: 'success',
        title: `${best.barangay} leading`,
        description: `${best.claimedHouseholds} households claimed — highest across all barangays.`,
      })
    }

    // Verification methods
    if (verificationMethods) {
      const totalVer = verificationMethods.qr + verificationMethods.face + verificationMethods.unknown
      if (totalVer > 0 && verificationMethods.face > 0) {
        const facePct = ((verificationMethods.face / totalVer) * 100).toFixed(0)
        result.push({
          type: 'info',
          title: 'Face verification active',
          description: `${facePct}% of claims verified by face recognition, ${((verificationMethods.qr / totalVer) * 100).toFixed(0)}% by QR.`,
        })
      }
    }

    // Total claimed milestone
    if (totalClaimed >= 100) {
      result.push({ type: 'success', title: 'Milestone reached', description: `${totalClaimed.toLocaleString()} households served across ${totalDistributions} distributions.` })
    }

    return result.slice(0, 4)
  }, [props])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100/60 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
        <div className="h-4 w-32 bg-blue-200/50 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100/60 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Smart Insights</h3>
      </div>

      <div className="space-y-2.5">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white/60"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0">
                {insight.type === 'success' && <SuccessIcon />}
                {insight.type === 'warning' && <WarningIcon />}
                {insight.type === 'info' && <InfoIcon />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{insight.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}

        {insights.length === 0 && (
          <div className="text-center py-6 text-sm text-gray-400">
            No insights available yet
          </div>
        )}
      </div>
    </div>
  )
}

function SuccessIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
