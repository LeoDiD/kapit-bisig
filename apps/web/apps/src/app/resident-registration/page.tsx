'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout, Header } from '@/components/layout'
import api, { getScopedBarangays, ResidentRecord } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { showToast } from '@/lib/toast'

type StatusFilter = 'Pending' | 'Approved' | 'Rejected' | 'All'

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

  const [barangay, setBarangay] = useState('All Barangays')
  const [status, setStatus] = useState<StatusFilter>('Pending')

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
        status,
        barangay,
        page: 1,
        limit: 50,
      })
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.message || 'Failed to load resident registrations.')
      }
      setRows(response.data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load resident registrations.'
      setError(message)
      setRows([])
    } finally {
      setFetching(false)
    }
  }, [status, barangay])

  useEffect(() => {
    if (!user) return
    fetchResidents()
  }, [user, fetchResidents])

  const onApprove = useCallback(
    async (residentId: string) => {
      setBusyId(residentId)
      try {
        await api.updateResidentStatus(residentId, { status: 'Approved' })
        setRows((prev) => prev.filter((r) => (r._id || r.id) !== residentId))
        showToast.success('Registration approved.')
      } catch (e) {
        showToast.error(e instanceof Error ? e.message : 'Failed to approve registration.')
      } finally {
        setBusyId(null)
      }
    },
    [],
  )

  const onReject = useCallback(
    async (residentId: string) => {
      const reason = window.prompt('Enter rejection reason:')
      if (!reason || !reason.trim()) return

      setBusyId(residentId)
      try {
        await api.updateResidentStatus(residentId, {
          status: 'Rejected',
          rejectionReason: reason.trim(),
        })
        setRows((prev) => prev.filter((r) => (r._id || r.id) !== residentId))
        showToast.success('Registration rejected.')
      } catch (e) {
        showToast.error(e instanceof Error ? e.message : 'Failed to reject registration.')
      } finally {
        setBusyId(null)
      }
    },
    [],
  )

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

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
          >
            {barangayOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="All">All</option>
          </select>
          <button
            type="button"
            onClick={fetchResidents}
            className="rounded-lg bg-[#226538] px-4 py-2 text-sm font-semibold text-white"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Mobile</th>
                <th className="px-3 py-2 font-semibold">Barangay</th>
                <th className="px-3 py-2 font-semibold">AI Match</th>
                <th className="px-3 py-2 font-semibold">Submitted</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {fetching ? (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={7}>
                    Loading registrations...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={7}>
                    No registrations found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const id = r._id || r.id || ''
                  const isPending = r.status === 'Pending'
                  const isBusy = busyId === id
                  return (
                    <tr key={id} className="border-b border-gray-100">
                      <td className="px-3 py-2">{maskResidentName(r)}</td>
                      <td className="px-3 py-2">{maskMobileNumber(r.mobileNumber)}</td>
                      <td className="px-3 py-2">{r.barangay}</td>
                      <td className="px-3 py-2">
                        {r.verification?.aiVerificationStatus || '-'}
                        {typeof r.verification?.overallConfidence === 'number'
                          ? ` (${r.verification.overallConfidence}%)`
                          : ''}
                      </td>
                      <td className="px-3 py-2">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-3 py-2">{r.status}</td>
                      <td className="px-3 py-2">
                        {isPending ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onApprove(id)}
                              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onReject(id)}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
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
      </section>
    </DashboardLayout>
  )
}
