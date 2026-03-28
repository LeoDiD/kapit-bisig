'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import HouseholdStats from '@/components/households/PriorityStats'
import HouseholdsTable from '@/components/households/HouseholdsTable'
import api, { getScopedBarangays } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

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

type BarangayFilter = string
const STATUS_OPTIONS = ['All Status', 'Claimed', 'Not Claimed'] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]

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

  const fetchHouseholds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const pageSize = 50
      let page = 1
      let totalPages = 1
      const mergedRows: HouseholdRow[] = []

      do {
        const res = await api.getHouseholds({ page, limit: pageSize })
        if (!res.success || !Array.isArray(res.data)) break
        mergedRows.push(...(res.data as HouseholdRow[]))
        totalPages = res.pagination?.totalPages || 1
        page += 1
      } while (page <= totalPages)

      setAllRows(mergedRows)
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string }
      if (err?.status === 401) setError('Your session has expired. Please log in again.')
      else if (err?.status === 403) setError('You do not have access to view households.')
      else if (typeof err?.status === 'number') setError(err.message || 'Failed to fetch households.')
      else setError('Unable to connect to the server. Please make sure the backend is running.')
      setAllRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHouseholds()
  }, [fetchHouseholds])

  const statCounts = useMemo(() => {
    const total = allRows.length
    const claimed = allRows.filter((h) => h.claimStatus === 'Claimed').length
    const notClaimed = allRows.filter((h) => h.claimStatus === 'Not Claimed').length
    const withClaimHistory = allRows.filter((h) => Boolean(h.lastClaimedAt)).length
    return { total, claimed, notClaimed, withClaimHistory }
  }, [allRows])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allRows.filter((h) => {
      const matchesSearch =
        !q ||
        h.familyHeadName.toLowerCase().includes(q) ||
        h.householdCode.toLowerCase().includes(q) ||
        h.barangay.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q)

      const matchesBarangay = barangay === 'All Barangays' || h.barangay === barangay
      const matchesStatus = status === 'All Status' || h.claimStatus === status
      return matchesSearch && matchesBarangay && matchesStatus
    })
  }, [searchQuery, barangay, status, allRows])

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto w-full">
        <Header
          title="Households"
          subtitle="Manage and oversee registered household records"
        />

        <div className="mt-6">
          <HouseholdStats counts={statCounts} />
        </div>

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
      </div>
    </DashboardLayout>
  )
}
