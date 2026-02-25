'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import {
  StatsCard,
  ApprovedUsersByBarangayTable,
  LowStockAlert,
  QuickActions,
} from '@/components/dashboard'
import api from '@/lib/api'
import { showToast } from '@/lib/toast'

interface DashboardStats {
  totalHouseholds: number
  pendingDistributions: number
  completedToday: number
  pendingWrites: number
}

const INITIAL_STATS: DashboardStats = {
  totalHouseholds: 0,
  pendingDistributions: 0,
  completedToday: 0,
  pendingWrites: 0,
}

function countCompletedToday(ledgerRows: Array<{ status?: string; dateTimeISO?: string }>) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let completedToday = 0
  for (const row of ledgerRows) {
    if (row.status !== 'Confirmed') continue
    const createdAt = row.dateTimeISO ? new Date(row.dateTimeISO) : null
    if (!createdAt || Number.isNaN(createdAt.getTime())) continue
    if (createdAt >= startOfToday) completedToday += 1
  }

  return completedToday
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS)
  const [loading, setLoading] = useState(true)

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true)
    try {
      const [householdsRes, distributionsRes, ledgerRes] = await Promise.all([
        api.getHouseholds({ page: 1, limit: 1 }),
        api.getDistributions(),
        api.getLedger(),
      ])

      const totalHouseholds =
        householdsRes.pagination?.totalDocs ??
        (Array.isArray(householdsRes.data) ? householdsRes.data.length : 0)

      const distributions = Array.isArray(distributionsRes.data) ? distributionsRes.data : []
      const pendingDistributions = distributions.filter((d) => d.status !== 'Claimed').length

      const ledgerRows = Array.isArray(ledgerRes.data)
        ? (ledgerRes.data as Array<{ status?: string; dateTimeISO?: string }>)
        : []

      let pendingWrites = 0
      for (const row of ledgerRows) {
        if (row.status === 'Pending/Confirming') pendingWrites += 1
      }

      setStats({
        totalHouseholds,
        pendingDistributions,
        completedToday: countCompletedToday(ledgerRows),
        pendingWrites,
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

  return (
    <DashboardLayout>
      <Header
        title="Dashboard"
        subtitle="Overview of relief distribution activities"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Households"
          value={loading ? '...' : stats.totalHouseholds.toLocaleString()}
          variant="blue"
          icon={<HouseholdIcon className="w-5 h-5" />}
        />
        <StatsCard
          title="Pending Distributions"
          value={loading ? '...' : stats.pendingDistributions.toLocaleString()}
          variant="yellow"
          icon={<PendingIcon className="w-5 h-5" />}
        />
        <StatsCard
          title="Completed Today"
          value={loading ? '...' : stats.completedToday.toLocaleString()}
          variant="green"
          icon={<CompletedIcon className="w-5 h-5" />}
        />
        <StatsCard
          title="Pending Writes"
          value={loading ? '...' : stats.pendingWrites.toLocaleString()}
          variant="orange"
          icon={<PendingIcon className="w-5 h-5" />}
        />
      </div>

      <div className="mb-6">
        <ApprovedUsersByBarangayTable />
      </div>

      {/* Bottom Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LowStockAlert />
        <QuickActions />
      </div>
    </DashboardLayout>
  )
}

// Icon Components
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

