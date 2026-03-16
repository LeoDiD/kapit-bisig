'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout, Header } from '@/components/layout'
import api, { getScopedBarangays, ResidentRecord } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

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

export default function VerifiedResidentsPage() {
  const { user, loading, isSuperadmin } = useAuth()
  const router = useRouter()

  const [rows, setRows] = useState<ResidentRecord[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        status: 'Approved',
        barangay,
        page: 1,
        limit: 100,
      })
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.message || 'Failed to load verified residents.')
      }
      setRows(response.data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load verified residents.'
      setError(message)
      setRows([])
    } finally {
      setFetching(false)
    }
  }, [barangay])

  useEffect(() => {
    if (!user) return
    fetchResidents()
  }, [user, fetchResidents])

  const uniqueBarangayCount = useMemo(
    () => new Set(rows.map((r) => (r.barangay || '').trim()).filter(Boolean)).size,
    [rows],
  )
  const withHighMatch = useMemo(
    () => rows.filter((r) => r.verification?.aiVerificationStatus === 'High Match').length,
    [rows],
  )

  if (loading || !user || !isSuperadmin) return null

  return (
    <DashboardLayout>
      <Header
        title="Verified Residents"
        subtitle="All approved resident registrations"
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-700">Total Verified (Filtered)</p>
            <p className="text-lg font-semibold text-emerald-900">{rows.length}</p>
          </div>
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
            <p className="text-xs text-sky-700">Barangays Represented</p>
            <p className="text-lg font-semibold text-sky-900">{uniqueBarangayCount}</p>
          </div>
          <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
            <p className="text-xs text-violet-700">High AI Match</p>
            <p className="text-lg font-semibold text-violet-900">{withHighMatch}</p>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Data Privacy: Resident personally identifiable information is masked in this table.
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">Filter verified residents by barangay.</p>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-72"
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
          >
            {barangayOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
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
              </tr>
            </thead>
            <tbody>
              {fetching ? (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={6}>
                    Loading verified residents...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={6}>
                    No verified residents found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const id = r._id || r.id || ''
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
