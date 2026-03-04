'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import HouseholdStats from '@/components/households/PriorityStats'
import HouseholdsTable from '@/components/households/HouseholdsTable'
import api, { getScopedBarangays } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

/* ------------------------------------------------------------------ */
/*  Shared household type used by page + child components              */
/* ------------------------------------------------------------------ */

export interface HouseholdRow {
  id: string
  householdCode: string
  familyHeadName: string
  barangay: string
  address: string
  familyMembersCount: number
  contact: string
  verificationStatus: string
  verificationScore: number | null
  claimStatus: 'Claimed' | 'Not Claimed'
  lastClaimedAt: string | null
  registeredAt: string | null
}

/* ------------------------------------------------------------------ */
/*  Filter options                                                     */
/* ------------------------------------------------------------------ */

// Barangay options are now computed dynamically per-user

type BarangayFilter = string

const STATUS_OPTIONS = ['All Status', 'Claimed', 'Not Claimed'] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HouseholdsPage() {
  const { user } = useAuth()
  const BARANGAY_OPTIONS = useMemo(
    () => ['All Barangays', ...getScopedBarangays(user?.role, user?.assignedBarangays)],
    [user?.role, user?.assignedBarangays],
  )

  const [allRows, setAllRows] = useState<HouseholdRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [barangay, setBarangay] = useState<BarangayFilter>('All Barangays')
  const [status, setStatus] = useState<StatusFilter>('All Status')

  /* ── Fetch ── */
  const fetchHouseholds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getHouseholds()
      if (res.success && Array.isArray(res.data)) {
        setAllRows(res.data as HouseholdRow[])
      } else {
        setAllRows([])
      }
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string }

      if (err?.status === 401) {
        setError('Your session has expired. Please log in again.')
      } else if (err?.status === 403) {
        setError('You do not have access to view households.')
      } else if (typeof err?.status === 'number') {
        setError(err.message || 'Failed to fetch households.')
      } else {
        setError('Unable to connect to the server. Please make sure the backend is running.')
      }
      setAllRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHouseholds()
  }, [fetchHouseholds])

  /* ── Stats computed from all rows ── */
  const statCounts = useMemo(() => {
    const total = allRows.length
    const claimed = allRows.filter((h) => h.claimStatus === 'Claimed').length
    const notClaimed = allRows.filter((h) => h.claimStatus === 'Not Claimed').length
    const withClaimHistory = allRows.filter((h) => Boolean(h.lastClaimedAt)).length

    return { total, claimed, notClaimed, withClaimHistory }
  }, [allRows])

  /* ── Client-side filtering ── */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allRows.filter((h) => {
      const matchesSearch =
        !q ||
        h.familyHeadName.toLowerCase().includes(q) ||
        h.householdCode.toLowerCase().includes(q) ||
        h.barangay.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q)

      const matchesBarangay =
        barangay === 'All Barangays' || h.barangay === barangay

      const matchesStatus =
        status === 'All Status' || h.claimStatus === status

      return matchesSearch && matchesBarangay && matchesStatus
    })
  }, [searchQuery, barangay, status, allRows])

  return (
    <DashboardLayout>
      <Header
        title="Households"
        subtitle="Registered households from the database"
      />

      <HouseholdStats counts={statCounts} />

      <HouseholdsTable
        rows={filtered}
        loading={loading}
        error={error}
        hasAnyRows={allRows.length > 0}
        onRetry={fetchHouseholds}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        barangay={barangay}
        barangayOptions={BARANGAY_OPTIONS as unknown as string[]}
        onBarangayChange={(v) => setBarangay(v as BarangayFilter)}
        status={status}
        statusOptions={STATUS_OPTIONS as unknown as string[]}
        onStatusChange={(v) => setStatus(v as StatusFilter)}
      />
    </DashboardLayout>
  )
}


