'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import {
  LowStockAlert,
  QuickActions,
  DistributionTrendsChart,
  WeeklyClaimChart,
  BarangayDistributionChart,
  SmartInsights,
  RecentDistributions,
} from '@/components/dashboard'
import api from '@/lib/api'
import type { ReportSummaryData } from '@/lib/api'
import { showToast } from '@/lib/toast'

interface DashboardStats {
  totalHouseholds: number
  pendingDistributions: number
  completedToday: number

  claimRate: number
  totalDistributions: number
  totalRegistered: number
  totalClaimed: number
  totalUnclaimed: number
}

const INITIAL_STATS: DashboardStats = {
  totalHouseholds: 0,
  pendingDistributions: 0,
  completedToday: 0,

  claimRate: 0,
  totalDistributions: 0,
  totalRegistered: 0,
  totalClaimed: 0,
  totalUnclaimed: 0,
}

function computeWeeklyClaims(monthlyTrends: Array<{ month: string; claimed: number }>) {
  const now = new Date()
  const currentMonth = now.toLocaleDateString('en-US', { month: 'short' })
  const monthRow = monthlyTrends.find((row) => row.month === currentMonth)
  const monthClaimed = monthRow?.claimed ?? 0
  const basePerDay = Math.floor(monthClaimed / 7)
  const remainder = monthClaimed % 7
  const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return orderedDays.map((day, i) => ({ day, count: basePerDay + (i < remainder ? 1 : 0) }))
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS)
  const [reportData, setReportData] = useState<ReportSummaryData | null>(null)
  const [weeklyData, setWeeklyData] = useState<{ day: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true)
    try {
      const [householdsRes, distributionsRes, reportRes] = await Promise.all([
        api.getHouseholds({ page: 1, limit: 1 }),
        api.getDistributions(),
        api.getReportSummary(),
      ])

      const totalHouseholds =
        householdsRes.pagination?.totalDocs ??
        (Array.isArray(householdsRes.data) ? householdsRes.data.length : 0)

      const distributions = Array.isArray(distributionsRes.data) ? distributionsRes.data : []
      const pendingDistributions = distributions.filter((d) => d.status !== 'Claimed').length

      const report = reportRes.data ?? null
      setReportData(report)
      setWeeklyData(computeWeeklyClaims(report?.monthlyTrends ?? []))

      setStats({
        totalHouseholds,
        pendingDistributions,
        completedToday: report?.overview?.completedToday ?? 0,

        claimRate: report?.overview?.claimRate ?? 0,
        totalDistributions: report?.overview?.totalDistributions ?? 0,
        totalRegistered: report?.overview?.totalRegisteredHouseholds ?? 0,
        totalClaimed: report?.overview?.totalClaimedHouseholds ?? 0,
        totalUnclaimed: report?.overview?.totalUnclaimedHouseholds ?? 0,
      })
    } catch {
      showToast.error('Failed to load dashboard stats.')
      setStats(INITIAL_STATS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  const monthlyTrends = useMemo(() => reportData?.monthlyTrends ?? [], [reportData])
  const barangayBreakdown = useMemo(() => reportData?.barangayBreakdown ?? [], [reportData])
  const coverageRate = useMemo(
    () => (stats.totalRegistered > 0 ? Math.round((stats.totalClaimed / stats.totalRegistered) * 100) : 0),
    [stats.totalClaimed, stats.totalRegistered]
  )
  const currentPeriod = useMemo(
    () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    []
  )

  return (
    <DashboardLayout>
      <Header
        title="Dashboard"
        subtitle="Overview of relief distribution activities"
      />

      <section className="mb-8 rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Executive Summary
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-slate-100 sm:text-4xl">
                Relief distribution overview
              </h2>
            </div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{currentPeriod}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-200 dark:divide-slate-700 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <DeckMetricCell
            title="Households"
            value={loading ? '...' : stats.totalHouseholds.toLocaleString()}
            subtitle="Registered"
            icon={<HouseholdIcon className="h-5 w-5" />}
          />
          <DeckMetricCell
            title="Pending"
            value={loading ? '...' : stats.pendingDistributions.toLocaleString()}
            subtitle="Distributions"
            icon={<PendingIcon className="h-5 w-5" />}
          />
          <DeckMetricCell
            title="Completed"
            value={loading ? '...' : stats.completedToday.toLocaleString()}
            subtitle="Today"
            icon={<CompletedIcon className="h-5 w-5" />}
          />
          <DeckMetricCell
            title="Claim Rate"
            value={loading ? '...' : `${coverageRate}%`}
            subtitle={`${stats.totalClaimed} of ${stats.totalRegistered}`}
            icon={<ChartIcon className="h-5 w-5" />}
          />
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <DistributionTrendsChart data={monthlyTrends} loading={loading} />
        </div>
        <div className="lg:col-span-4">
          <LowStockAlert

            pendingDistributions={stats.pendingDistributions}
            unclaimedHouseholds={stats.totalUnclaimed}
            loading={loading}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <WeeklyClaimChart data={weeklyData} loading={loading} />
        </div>
        <div className="lg:col-span-8">
          <BarangayDistributionChart data={barangayBreakdown} loading={loading} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SmartInsights
            totalDistributions={stats.totalDistributions}
            claimRate={stats.claimRate}
            totalRegistered={stats.totalRegistered}
            totalClaimed={stats.totalClaimed}
            totalUnclaimed={stats.totalUnclaimed}
            barangayBreakdown={barangayBreakdown}
            verificationMethods={reportData?.verificationMethods}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-4">
          <QuickActions />
        </div>
        <div className="lg:col-span-4">
          <RecentDistributions />
        </div>
      </div>
    </DashboardLayout>
  )
}

function HouseholdIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function PendingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CompletedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function DeckMetricCell({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <div className="min-w-0 px-6 py-5 sm:px-7 sm:py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950 dark:text-slate-100">{value}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </div>
      </div>
    </div>
  )
}
