'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout, Header } from '@/components/layout'
import api, { getScopedBarangays, ResidentRecord } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { showToast } from '@/lib/toast'
import FilterDropdown from '@/components/ui/FilterDropdown'
import { AiMatchBadge, ResidentStatusBadge } from '@/components/residents/ResidentTableBadges'

function maskResidentName(record: ResidentRecord): string {
  const raw =
    record.fullName?.trim() ||
    `${record.firstName || ''} ${record.lastName || ''}`.trim()
  if (!raw) return 'Uxxxx Uxxxx'

  const parts = raw.split(/\s+/).filter(Boolean)
  const firstInitial = (parts[0]?.[0] || 'U').toUpperCase()
  const lastInitial = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[0] || 'U').toUpperCase()
  return `${firstInitial}xxxx ${lastInitial}xxxx`
}

function maskMobileNumber(_mobile: string | undefined): string {
  return '09XXXXXXXXX'
}

export default function ResidentRegistrationPage() {
  const { user, loading, isSuperadmin } = useAuth()
  const router = useRouter()

  const [rows, setRows] = useState<ResidentRecord[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [barangay, setBarangay] = useState('All Barangays')

  const barangayOptions = useMemo(
    () => ['All Barangays', ...getScopedBarangays(user?.role, user?.assignedBarangays)],
    [user?.role, user?.assignedBarangays],
  )

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
    } else if (!isSuperadmin) {
      router.replace('/dashboard')
    }
  }, [loading, user, isSuperadmin, router])

  const fetchResidents = useCallback(async () => {
    setFetching(true)
    setError(null)
    try {
      const response = await api.getResidents({
        status: 'Pending',
        barangay,
        page: 1,
        limit: 50,
      })
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.message || 'Failed to load resident registrations.')
      }
      setRows(response.data)
      setSelectedIds([])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load resident registrations.'
      setError(message)
      setRows([])
    } finally {
      setFetching(false)
    }
  }, [barangay])

  const pendingRows = useMemo(
    () => rows.filter((row) => row.status === 'Pending'),
    [rows],
  )

  const pendingIds = useMemo(
    () => pendingRows.map((row) => row._id || row.id).filter((id): id is string => Boolean(id)),
    [pendingRows],
  )

  const allPendingSelected = useMemo(
    () => pendingIds.length > 0 && pendingIds.every((id) => selectedIds.includes(id)),
    [pendingIds, selectedIds],
  )

  const selectedPendingIds = useMemo(
    () => selectedIds.filter((id) => pendingIds.includes(id)),
    [selectedIds, pendingIds],
  )

  useEffect(() => {
    if (!user) return
    fetchResidents()
  }, [user, fetchResidents])

  const onApprove = useCallback(
    async (residentId: string) => {
      const isBulk = selectedPendingIds.length > 1 && selectedPendingIds.includes(residentId)
      const targetIds = isBulk ? selectedPendingIds : [residentId]
      const confirmMessage = isBulk
        ? `Approve ${targetIds.length} selected registrations?`
        : 'Approve this registration?'
      const confirmed = window.confirm(confirmMessage)
      if (!confirmed) return

      if (isBulk) setBulkBusy(true)
      setBusyId(residentId)
      try {
        const results = await Promise.allSettled(
          targetIds.map((id) => api.updateResidentStatus(id, { status: 'Approved' })),
        )

        const approvedIds: string[] = []
        let failedCount = 0
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') approvedIds.push(targetIds[index])
          else failedCount += 1
        })

        if (approvedIds.length > 0) {
          setRows((prev) => prev.filter((r) => !approvedIds.includes(r._id || r.id || '')))
          setSelectedIds((prev) => prev.filter((id) => !approvedIds.includes(id)))
        }

        if (approvedIds.length > 0 && failedCount === 0) {
          showToast.success(
            isBulk
              ? `Approved ${approvedIds.length} registration(s).`
              : 'Registration approved.',
          )
        } else if (approvedIds.length > 0 && failedCount > 0) {
          showToast.error(`Approved ${approvedIds.length}, but ${failedCount} failed.`)
        } else {
          showToast.error(
            isBulk ? 'Failed to approve selected registrations.' : 'Failed to approve registration.',
          )
        }
      } catch (e) {
        showToast.error(
          e instanceof Error
            ? e.message
            : isBulk
              ? 'Failed to approve selected registrations.'
              : 'Failed to approve registration.',
        )
      } finally {
        setBusyId(null)
        if (isBulk) setBulkBusy(false)
      }
    },
    [selectedPendingIds],
  )

  const onReject = useCallback(
    async (residentId: string) => {
      const isBulk = selectedPendingIds.length > 1 && selectedPendingIds.includes(residentId)
      const targetIds = isBulk ? selectedPendingIds : [residentId]
      const confirmMessage = isBulk
        ? `Reject ${targetIds.length} selected registrations?`
        : 'Reject this registration?'
      const confirmed = window.confirm(confirmMessage)
      if (!confirmed) return

      const reasonPrompt = isBulk
        ? 'Enter rejection reason for selected registrations:'
        : 'Enter rejection reason:'
      const reason = window.prompt(reasonPrompt)
      if (!reason || !reason.trim()) return

      if (isBulk) setBulkBusy(true)
      setBusyId(residentId)
      try {
        const trimmedReason = reason.trim()
        const results = await Promise.allSettled(
          targetIds.map((id) =>
            api.updateResidentStatus(id, {
              status: 'Rejected',
              rejectionReason: trimmedReason,
            }),
          ),
        )

        const rejectedIds: string[] = []
        let failedCount = 0
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') rejectedIds.push(targetIds[index])
          else failedCount += 1
        })

        if (rejectedIds.length > 0) {
          setRows((prev) => prev.filter((r) => !rejectedIds.includes(r._id || r.id || '')))
          setSelectedIds((prev) => prev.filter((id) => !rejectedIds.includes(id)))
        }

        if (rejectedIds.length > 0 && failedCount === 0) {
          showToast.success(
            isBulk
              ? `Rejected ${rejectedIds.length} registration(s).`
              : 'Registration rejected.',
          )
        } else if (rejectedIds.length > 0 && failedCount > 0) {
          showToast.error(`Rejected ${rejectedIds.length}, but ${failedCount} failed.`)
        } else {
          showToast.error(
            isBulk ? 'Failed to reject selected registrations.' : 'Failed to reject registration.',
          )
        }
      } catch (e) {
        showToast.error(
          e instanceof Error
            ? e.message
            : isBulk
              ? 'Failed to reject selected registrations.'
              : 'Failed to reject registration.',
        )
      } finally {
        setBusyId(null)
        if (isBulk) setBulkBusy(false)
      }
    },
    [selectedPendingIds],
  )

  const toggleSelectRow = useCallback((residentId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(residentId)) return prev
        return [...prev, residentId]
      }
      return prev.filter((id) => id !== residentId)
    })
  }, [])

  const toggleSelectAllPending = useCallback((checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        const merged = new Set([...prev, ...pendingIds])
        return Array.from(merged)
      }
      return prev.filter((id) => !pendingIds.includes(id))
    })
  }, [pendingIds])

  if (loading || !user || !isSuperadmin) return null

  return (
    <DashboardLayout>
      <Header
        title="Resident Registration"
        subtitle="Pending registration requests from mobile app with approval actions"
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Data Privacy: Resident personally identifiable information is masked in this table.
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <FilterDropdown
            value={barangay}
            onChange={(v) => setBarangay(v)}
            options={barangayOptions.map((item) => ({ value: item, label: item }))}
          />
          <button
            type="button"
            onClick={fetchResidents}
            className="rounded-xl bg-[#226538] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.10)] transition-colors hover:bg-[#1a4f2b]"
          >
            Refresh
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            Selected pending registrations: <span className="font-semibold">{selectedPendingIds.length}</span>
          </p>
          <span className="text-xs text-gray-500">Use row Approve/Reject to apply selected items.</span>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse table-fixed min-w-[980px] lg:min-w-0">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="px-4 py-3 font-medium w-[6%]">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      disabled={pendingIds.length === 0 || bulkBusy}
                      onChange={(e) => toggleSelectAllPending(e.target.checked)}
                      aria-label="Select all pending registrations"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium w-[18%]">Name</th>
                  <th className="px-4 py-3 font-medium w-[14%]">Mobile</th>
                  <th className="px-4 py-3 font-medium w-[14%]">Barangay</th>
                  <th className="px-4 py-3 font-medium w-[18%]">AI Match</th>
                  <th className="px-4 py-3 font-medium w-[18%]">Submitted</th>
                  <th className="px-4 py-3 font-medium w-[10%]">Status</th>
                  <th className="px-4 py-3 font-medium w-[18%]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
              {fetching ? (
                <tr>
                  <td className="px-4 py-5 text-gray-500" colSpan={8}>
                    Loading registrations...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 text-gray-500" colSpan={8}>
                    No registrations found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const id = r._id || r.id || ''
                  const isPending = r.status === 'Pending'
                  const isBusy = busyId === id || bulkBusy
                  const isSelected = selectedIds.includes(id)
                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isPending || isBusy || !id}
                          onChange={(e) => toggleSelectRow(id, e.target.checked)}
                          aria-label={`Select registration ${maskResidentName(r)}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{maskResidentName(r)}</td>
                      <td className="px-4 py-3 text-gray-700">{maskMobileNumber(r.mobileNumber)}</td>
                      <td className="px-4 py-3 text-gray-700">{r.barangay}</td>
                      <td className="px-4 py-3">
                        <AiMatchBadge record={r} />
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <ResidentStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        {isPending ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onApprove(id)}
                              className="rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onReject(id)}
                              className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500">No action</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </DashboardLayout>
  )
}
