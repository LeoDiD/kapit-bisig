'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import DistributionStats from './DistributionStats'
import DistributionsTable, { DistributionRow } from './DistributionsTable'
import NewDistributionModal, { CreateDistributionPayload } from './NewDistributionModal'
import { api } from '../../lib/api'

const BARANGAY_OPTIONS = [
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
]

export default function DistributionPageClient() {
  const [rows, setRows] = useState<DistributionRow[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDistributions = useCallback(async () => {
    try {
      setError(null)
      const res = await api.getDistributions()
      if (res.success && res.data) {
        const mapped: DistributionRow[] = res.data.map((d) => ({
          id: d.id || d._id,
          barangay: d.barangay,
          scheduled: d.scheduled,
          households: d.households,
          registeredHouseholds: d.registeredHouseholds ?? 0,
          notes: d.notes,
          status: d.status as 'Unclaimed' | 'Claimed',
          claimedAt: d.claimedAt,
          createdAt: d.createdAt,
        }))
        setRows(mapped)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load distributions'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDistributions()
  }, [fetchDistributions])

  const unclaimedCount = useMemo(
    () => rows.filter((r) => r.status === 'Unclaimed').length,
    [rows]
  )
  const claimedCount = useMemo(
    () => rows.filter((r) => r.status === 'Claimed').length,
    [rows]
  )
  const barangaysCount = useMemo(() => {
    const set = new Set(rows.map((r) => r.barangay))
    return set.size
  }, [rows])

  const householdsServedCount = 0

  const bannerText = useMemo(() => {
    if (unclaimedCount <= 0) return ''
    return `${unclaimedCount} barangay distribution(s) are waiting to be claimed by residents.`
  }, [unclaimedCount])

  const handleCreate = async (payload: CreateDistributionPayload) => {
    try {
      setError(null)
      await api.createDistribution({
        barangay: payload.barangay,
        scheduled: payload.scheduled,
        households: payload.households,
        notes: payload.notes,
      })
      setCreateOpen(false)
      await fetchDistributions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create distribution'
      setError(message)
    }
  }

  const markClaimed = async (id: string) => {
    try {
      setError(null)
      await api.claimDistribution(id)
      await fetchDistributions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark as claimed'
      setError(message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 text-sm">Loading distributions...</div>
      </div>
    )
  }

  return (
    <div>
      <DistributionStats
        unclaimed={unclaimedCount}
        claimed={claimedCount}
        householdsServed={householdsServedCount}
        barangays={barangaysCount}
      />

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {unclaimedCount > 0 ? (
        <div className="mb-6 bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDE68A] flex items-center justify-center">
            <BoxIcon className="w-5 h-5 text-[#9A6A00]" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">Unclaimed Distributions</div>
            <div className="text-sm text-gray-600">{bannerText}</div>
          </div>
        </div>
      ) : null}

      <DistributionsTable
        rows={rows}
        onOpenCreate={() => setCreateOpen(true)}
        onMarkClaimed={markClaimed}
      />

      <NewDistributionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        barangayOptions={BARANGAY_OPTIONS}
      />
    </div>
  )
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8v8l9 5 9-5V8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13v8" />
    </svg>
  )
}
