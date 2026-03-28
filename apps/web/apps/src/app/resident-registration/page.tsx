'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout, Header } from '@/components/layout'
import api, { getScopedBarangays, ResidentRecord } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { showToast } from '@/lib/toast'
import FilterDropdown from '@/components/ui/FilterDropdown'
import { AiMatchBadge, ResidentStatusBadge } from '@/components/residents/ResidentTableBadges'

function getResidentName(record: ResidentRecord): string {
  const raw =
    record.fullName?.trim() ||
    `${record.firstName || ''} ${record.lastName || ''}`.trim()
  return raw || 'Unknown Resident'
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

      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col overflow-hidden mb-12">
        {/* Integrated Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/40 flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Action Group when selected */}
            {selectedPendingIds.length > 0 ? (
              <div className="flex items-center bg-blue-50/80 px-3 py-1.5 rounded-lg border border-blue-100">
                <span className="text-sm font-bold text-blue-800 mr-3">
                  {selectedPendingIds.length} Selected
                </span>
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={() => onApprove(selectedPendingIds[0])} // it determines bulk mode inside
                  className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 rounded-lg transition-colors mr-2 disabled:opacity-50 shadow-sm"
                >
                  Approve Selected
                </button>
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={() => onReject(selectedPendingIds[0])}
                  className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  Reject Selected
                </button>
              </div>
            ) : (
              <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Mobile numbers masked for data privacy
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Filters */}
            <div className="w-full lg:w-[200px]">
              <FilterDropdown
                value={barangay}
                onChange={(v) => setBarangay(v)}
                options={barangayOptions.map((item) => ({ value: item, label: item }))}
              />
            </div>
            
            {/* Refresh */}
            <button
              onClick={fetchResidents}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold shadow-sm transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full">
          {error ? (
            <div className="p-8 text-center text-red-600 font-semibold text-sm">
              {error}
            </div>
          ) : (
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px] lg:min-w-0">
              <thead className="bg-white border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-[5%]">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      disabled={pendingIds.length === 0 || bulkBusy}
                      onChange={(e) => toggleSelectAllPending(e.target.checked)}
                      aria-label="Select all pending registrations"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                    />
                  </th>
                  <th className="px-6 py-4 w-[18%]">Name</th>
                  <th className="px-6 py-4 w-[14%]">Mobile</th>
                  <th className="px-6 py-4 w-[14%]">Barangay</th>
                  <th className="px-6 py-4 w-[18%]">AI Match</th>
                  <th className="px-6 py-4 w-[13%]">Submitted</th>
                  <th className="px-6 py-4 w-[8%] text-center">Status</th>
                  <th className="px-6 py-4 w-[10%] text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-sm">
              {fetching ? (
                 <tr>
                 <td colSpan={8} className="px-6 py-16 text-center">
                   <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                 </td>
               </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-6 py-16 text-center text-gray-500 font-medium" colSpan={8}>
                    No pending resident registrations found filtering by {barangay}.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const id = r._id || r.id || ''
                  const isPending = r.status === 'Pending'
                  const isBusy = busyId === id || bulkBusy
                  const isSelected = selectedIds.includes(id)

                  return (
                    <tr key={id} className={`group border-l-[3px] transition-colors ${isSelected ? 'bg-blue-50/40 border-l-blue-500' : 'hover:bg-gray-50 border-l-transparent'}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isPending || isBusy || !id}
                          onChange={(e) => toggleSelectRow(id, e.target.checked)}
                          aria-label={`Select registration ${getResidentName(r)}`}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-normal break-words">{getResidentName(r)}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium whitespace-normal break-words">{maskMobileNumber(r.mobileNumber)}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{r.barangay}</td>
                      <td className="px-6 py-4">
                        <AiMatchBadge record={r} />
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-bold tracking-wide whitespace-normal">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <ResidentStatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-4 text-right pr-6">
                        {isPending ? (
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onApprove(id)}
                              className="rounded-lg border-[1.5px] border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-400 transition-all hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50"
                              title="Approve"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onReject(id)}
                              className="rounded-lg border-[1.5px] border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-400 transition-all hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 disabled:opacity-50"
                              title="Reject"
                            >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs font-bold">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
