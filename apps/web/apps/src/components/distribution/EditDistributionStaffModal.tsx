'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { api, ScanEligibleUser, StaffUser } from '@/lib/api'
import { showToast } from '@/lib/toast'
import type { DistributionRow } from './DistributionsTable'
import { formatScheduledDate } from './DistributionsTable'

interface EditDistributionStaffModalProps {
  open: boolean
  onClose: () => void
  distribution: DistributionRow | null
  onSuccess?: () => void
}

const DEBOUNCE_MS = 250

export default function EditDistributionStaffModal({
  open,
  onClose,
  distribution,
  onSuccess,
}: EditDistributionStaffModalProps) {
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([])
  const [staffQuery, setStaffQuery] = useState('')
  const [debouncedStaffQuery, setDebouncedStaffQuery] = useState('')
  const [eligibleStaff, setEligibleStaff] = useState<ScanEligibleUser[]>([])
  const [allStaffMap, setAllStaffMap] = useState<Map<string, { id: string; fullName: string; assignedBarangays: string[] }>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStaffQuery(staffQuery.trim())
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [staffQuery])

  // Initialize state when modal opens or distribution changes
  useEffect(() => {
    if (!open || !distribution) {
      setAssignedStaffIds([])
      setStaffQuery('')
      setDebouncedStaffQuery('')
      setEligibleStaff([])
      setErrorMessage(null)
      return
    }

    const initialIds = (distribution.assignedStaffIds || []).map((id) => String(id))
    setAssignedStaffIds(initialIds)
    setStaffQuery('')
    setDebouncedStaffQuery('')
    setErrorMessage(null)

    // Pre-fetch all staff to ensure we have names for existing assignments
    const loadStaffMeta = async () => {
      try {
        const res = await api.getStaffUsers({ status: 'active' })
        if (res.success && res.data) {
          const map = new Map<string, { id: string; fullName: string; assignedBarangays: string[] }>()
          for (const s of res.data) {
            const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.fullName || 'Staff'
            map.set(s.id, { id: s.id, fullName, assignedBarangays: s.assignedBarangays || [] })
          }
          setAllStaffMap(map)
        }
      } catch (e) {
        console.error('Failed to load staff metadata:', e)
      }
    }

    void loadStaffMeta()
  }, [open, distribution])

  // Load eligible staff for this distribution's scope and date
  useEffect(() => {
    if (!open || !distribution) return

    let cancelled = false
    setIsLoading(true)
    setErrorMessage(null)

    const fetchEligible = async () => {
      try {
        const response = await api.getScanEligibleUsers({
          barangay: distribution.barangay,
          assignedBarangayIds: distribution.assignedBarangays,
          scheduled: distribution.scheduled,
          q: debouncedStaffQuery || undefined,
          limit: 30,
        })

        if (!cancelled && response.success && response.data) {
          setEligibleStaff(response.data.items || [])
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load eligible staff:', err)
          setErrorMessage('Failed to load eligible staff members.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void fetchEligible()

    return () => {
      cancelled = true
    }
  }, [open, distribution, debouncedStaffQuery])

  if (!open || !distribution) return null

  const coverageList = [distribution.barangay, ...(distribution.assignedBarangays || [])].filter(Boolean)

  const toggleStaff = (staffId: string) => {
    setErrorMessage(null)
    setAssignedStaffIds((prev) => {
      if (prev.includes(staffId)) {
        if (prev.length <= 1) {
          setErrorMessage('At least 1 staff member must remain assigned to the distribution.')
          return prev
        }
        return prev.filter((id) => id !== staffId)
      } else {
        return [...prev, staffId]
      }
    })
  }

  const handleSave = async () => {
    if (assignedStaffIds.length < 1) {
      setErrorMessage('Please select at least 1 staff member.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const response = await api.updateDistributionStaff(distribution.id, assignedStaffIds)
      if (response.success) {
        showToast.success('Assigned staff updated successfully.')
        onSuccess?.()
        onClose()
      } else {
        setErrorMessage(response.message || 'Failed to update assigned staff.')
      }
    } catch (err: unknown) {
      console.error('Failed to save distribution staff:', err)
      const errorObj = err as { message?: string; response?: { message?: string } }
      const msg = errorObj.response?.message || errorObj.message || 'Failed to update assigned staff.'
      setErrorMessage(msg)
      showToast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col border border-gray-100 dark:border-slate-800">
        {/* Header */}
        <div className="p-6 pb-4 flex justify-between items-start shrink-0 bg-white dark:bg-slate-900 z-10 border-b border-gray-100 dark:border-slate-800 rounded-t-3xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {distribution.barangay}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Scheduled: {formatScheduledDate(distribution.scheduled)}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-slate-100">
              Manage Assigned Staff
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Allocate staff members authorized to scan beneficiary QR codes in {distribution.barangay}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
            disabled={isSaving}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-700 ml-2 font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Currently Selected Staff summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                Currently Assigned ({assignedStaffIds.length})
              </span>
              {assignedStaffIds.length < 1 && (
                <span className="text-xs text-red-500 font-medium">Select at least 1 staff</span>
              )}
            </div>

            {assignedStaffIds.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                {assignedStaffIds.map((id) => {
                  const staffInfo = allStaffMap.get(id) || eligibleStaff.find((s) => s.id === id)
                  const displayName = staffInfo ? staffInfo.fullName : `Staff (${id.slice(-4)})`

                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800"
                    >
                      <span>{displayName}</span>
                      <button
                        type="button"
                        onClick={() => toggleStaff(id)}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-300 transition-colors"
                        title={`Remove ${displayName}`}
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-red-200 bg-red-50/50 text-center text-xs text-red-600">
                No staff currently assigned. Please select at least 1 staff member below.
              </div>
            )}
          </div>

          {/* Search Eligible Staff */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Available Staff with Coverage for {distribution.barangay}
            </label>
            <div className="relative">
              <input
                type="text"
                value={staffQuery}
                onChange={(e) => setStaffQuery(e.target.value)}
                placeholder="Search staff by name..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A]"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Eligible Staff List */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-gray-500">
                <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Checking eligible staff...
              </div>
            ) : eligibleStaff.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                {staffQuery ? 'No staff matching your search.' : 'No eligible staff found for this barangay scope.'}
              </div>
            ) : (
              eligibleStaff.map((staff) => {
                const isSelected = assignedStaffIds.includes(staff.id)
                const hasConflict = Boolean(staff.conflict) && !isSelected
                const disabled = hasConflict || !staff.inScope

                return (
                  <div
                    key={staff.id}
                    onClick={() => {
                      if (!disabled) toggleStaff(staff.id)
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                        : disabled
                        ? 'opacity-50 border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30 cursor-not-allowed'
                        : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-[#0F533A] border-[#0F533A] text-white'
                            : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{staff.fullName}</span>
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            {staff.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                          Assigned: {staff.scopesSummary?.join(', ') || 'No barangays'}
                        </div>
                      </div>
                    </div>

                    <div>
                      {hasConflict ? (
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                          Schedule conflict
                        </span>
                      ) : !staff.inScope ? (
                        <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">
                          Out of scope
                        </span>
                      ) : isSelected ? (
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          Assigned
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 hover:text-gray-600">
                          Add +
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-3xl flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-slate-400">
            <strong className="text-gray-900 dark:text-slate-100">{assignedStaffIds.length}</strong> staff member{assignedStaffIds.length === 1 ? '' : 's'} assigned
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || assignedStaffIds.length < 1}
              className="px-5 py-2 rounded-xl bg-[#0F533A] hover:bg-[#0a3f2c] text-white text-xs font-semibold shadow-md shadow-green-950/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSaving && (
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSaving ? 'Updating...' : 'Save Staff Assignments'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
