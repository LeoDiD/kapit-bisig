'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import PriorityStats from '@/components/households/PriorityStats'
import HouseholdsTable from '@/components/households/HouseholdsTable'
import api from '@/lib/api'

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

const BARANGAY_OPTIONS = [
  'All Barangays',
  'Bolo',
  'Bongalon',
  'Dulig',
  'Laois',
  'Magsaysay',
  'Poblacion',
  'San Gonzalo',
  'San Jose',
  'Tobuan',
  'Uyong',
] as const
type BarangayFilter = (typeof BARANGAY_OPTIONS)[number]

const STATUS_OPTIONS = ['All Status', 'Claimed', 'Not Claimed'] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HouseholdsPage() {
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
        setError('Unable to connect to the server. Make sure the backend is running on http://localhost:3001.')
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

    // Resident.verification.aiVerificationStatus is: "High Match" | "Medium Match" | "Low Match"
    // Map "Low Match" -> High Priority (needs review), "Medium Match" -> Medium, "High Match" -> Low.
    const highPriority = allRows.filter((h) => h.verificationStatus === 'Low Match').length
    const mediumPriority = allRows.filter((h) => h.verificationStatus === 'Medium Match').length
    const lowPriority = allRows.filter((h) => h.verificationStatus === 'High Match').length

    return { total, highPriority, mediumPriority, lowPriority }
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

      <PriorityStats counts={statCounts} />

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