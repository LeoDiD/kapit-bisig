'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import DistributionStats from './DistributionStats'
import DistributionsTable, { DistributionRow } from './DistributionsTable'
import NewDistributionModal, { CreateDistributionPayload } from './NewDistributionModal'
import { api, getScopedBarangays } from '../../lib/api'
import { showToast } from '@/lib/toast'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/lib/AuthContext'

// Barangay options are now computed dynamically per-user

export default function DistributionPageClient() {
  const { user, loading: authLoading, isSuperadmin } = useAuth()
  const scopedBarangays = useMemo(
    () => getScopedBarangays(user?.role, user?.assignedBarangays),
    [user?.role, user?.assignedBarangays],
  )

  const [rows, setRows] = useState<DistributionRow[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lifecycleView, setLifecycleView] = useState<'upcoming' | 'active' | 'completed' | 'archived'>('upcoming')

  const fetchDistributions = useCallback(async () => {
    try {
      setError(null)
      const res = await api.getDistributions({ view: lifecycleView })
      if (res.success && res.data) {
        const mapped: DistributionRow[] = res.data.map((d) => ({
          id: d.id || d._id,
          barangay: d.barangay,
          assignedBarangays: d.assignedBarangays ?? [],
          scheduled: d.scheduled,
          endsAt: d.endsAt,
          households: d.households,
          registeredHouseholds: d.registeredHouseholds ?? 0,
          claimedHouseholds: d.claimedHouseholds ?? 0,
          notes: d.notes,
          requiresBeneficiaryApproval: d.requiresBeneficiaryApproval ?? false,
          status: d.status as 'Unclaimed' | 'Partially Claimed' | 'Claimed',
          claimedAt: d.claimedAt,
          createdAt: d.createdAt,
          archivedAt: d.archivedAt ?? null,
          archivedBy: d.archivedBy ?? null,
          lifecycleStatus: d.lifecycleStatus ?? 'Completed',
        }))
        setRows(mapped)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load distributions'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [lifecycleView])

  useEffect(() => {
    // Don't fetch if not authenticated
    if (authLoading || !user) {
      setLoading(false)
      return
    }
    fetchDistributions()
  }, [fetchDistributions, authLoading, user])

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

  const householdsServedCount = useMemo(
    () => rows.reduce((sum, r) => sum + r.claimedHouseholds, 0),
    [rows]
  )

  const handleCreate = async (payload: CreateDistributionPayload) => {
    try {
      setError(null)
      await api.createDistribution({
        disasterEventId: payload.disasterEventId,
        barangay: payload.barangay,
        assignedBarangays: payload.assignedBarangays,
        assignedStaffIds: payload.assignedStaffIds,
        scheduled: payload.scheduled,
        endsAt: payload.endsAt,
        notes: payload.notes,
      }, {
        idempotencyKey: crypto.randomUUID(),
      })
      setCreateOpen(false)
      showToast.success('Distribution created.')
      await fetchDistributions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create distribution'
      setError(message)
      showToast.error(message)
      throw err
    }
  }

  const archiveDistribution = async (id: string) => {
    if (!window.confirm('Archive this completed distribution? Residents and scanners will not see it, but claims and reports will be preserved.')) return
    try {
      await api.archiveDistribution(id)
      showToast.success('Distribution archived. Historical records were preserved.')
      await fetchDistributions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to archive distribution'
      showToast.error(message)
    }
  }

  const restoreDistribution = async (id: string) => {
    try {
      await api.restoreDistribution(id)
      showToast.success('Distribution restored to completed history.')
      await fetchDistributions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to restore distribution'
      showToast.error(message)
    }
  }

  const markClaimed = async (id: string) => {
    try {
      setError(null)
      await api.claimDistribution(id)
      showToast.success('Distribution marked as claimed.')
      await fetchDistributions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark as claimed'
      setError(message)
      showToast.error(message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-2xl p-4 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] bg-white animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="space-y-2"><div className="h-5 w-16 bg-gray-200 rounded" /><div className="h-3 w-24 bg-gray-200 rounded" /></div>
              </div>
            </div>
          ))}
        </div>
        <TableSkeleton rows={6} columns={6} />
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

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Distribution lifecycle">
        {(['upcoming', 'active', 'completed', 'archived'] as const).map((view) => (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={lifecycleView === view}
            onClick={() => setLifecycleView(view)}
            className={[
              'rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-colors',
              lifecycleView === view
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950',
            ].join(' ')}
          >
            {view}
          </button>
        ))}
      </div>

      <DistributionsTable
        rows={rows}
        onOpenCreate={() => setCreateOpen(true)}
        onMarkClaimed={markClaimed}
        canCreate={isSuperadmin}
        lifecycleView={lifecycleView}
        canManageLifecycle={isSuperadmin}
        onArchive={archiveDistribution}
        onRestore={restoreDistribution}
      />

      {isSuperadmin && (
        <NewDistributionModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
          barangayOptions={scopedBarangays}
        />
      )}
    </div>
  )
}
