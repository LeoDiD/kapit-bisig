'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { api, ScanEligibleUser } from '../../lib/api'
import { useAuth } from '@/lib/AuthContext'

export type CreateDistributionPayload = {
  barangay: string
  assignedBarangays: string[]
  assignedStaffIds: string[]
  scheduled: string
  households: number
  notes?: string
}

type StepFieldErrors = {
  barangay?: string
  assignedBarangays?: string
  scheduled?: string
  households?: string
  notes?: string
  assignedStaffIds?: string
  global?: string
}

type ScanEligibleData = {
  items: ScanEligibleUser[]
  nextCursor: number | null
}

const MIN_ASSIGN = 2
const MAX_ASSIGN = 4
const DEBOUNCE_MS = 300
const NOTES_MAX = 2000

export default function NewDistributionModal({
  open,
  onClose,
  onCreate,
  barangayOptions,
}: {
  open: boolean
  onClose: () => void
  onCreate: (payload: CreateDistributionPayload) => void | Promise<void>
  barangayOptions: string[]
}) {
  const { user } = useAuth()
  const isLguStaff = user?.role === 'LGU_STAFF'

  const [step, setStep] = useState(1)
  const [barangay, setBarangay] = useState('')
  const [assignedBarangays, setAssignedBarangays] = useState<string[]>([])
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([])
  const [barangayOpen, setBarangayOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const [scheduled, setScheduled] = useState('')
  const [notes, setNotes] = useState('')
  const [households, setHouseholds] = useState(40)

  const [errors, setErrors] = useState<StepFieldErrors>({})

  const [staffQuery, setStaffQuery] = useState('')
  const [debouncedStaffQuery, setDebouncedStaffQuery] = useState('')
  const [staffData, setStaffData] = useState<ScanEligibleData>({ items: [], nextCursor: null })
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)

  const cacheRef = useRef<Map<string, ScanEligibleData>>(new Map())
  const selectedStaffRef = useRef<Map<string, ScanEligibleUser>>(new Map())

  const barangayBtnRef = useRef<HTMLButtonElement>(null)
  const barangayMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setBarangay('')
    setAssignedBarangays([])
    setAssignedStaffIds([])
    setBarangayOpen(false)
    setScheduled('')
    setNotes('')
    setHouseholds(40)
    setErrors({})
    setStaffQuery('')
    setDebouncedStaffQuery('')
    setStaffData({ items: [], nextCursor: null })
    setIsCreating(false)
    setIsLoadingStaff(false)
    cacheRef.current = new Map()
    selectedStaffRef.current = new Map()
  }, [open])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node

      const inBrgyBtn = barangayBtnRef.current?.contains(t)
      const inBrgyMenu = barangayMenuRef.current?.contains(t)
      if (!inBrgyBtn && !inBrgyMenu) setBarangayOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStaffQuery(staffQuery.trim())
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [staffQuery])

  const targetScope = useMemo(() => [barangay, ...assignedBarangays], [barangay, assignedBarangays])

  const hasScopeCoverage = (scopes: string[]) => {
    return targetScope.every((target) => scopes.includes(target))
  }

  const validateStep1 = (): StepFieldErrors => {
    const out: StepFieldErrors = {}
    if (!barangay.trim()) {
      out.barangay = 'Host barangay is required.'
    }
    return out
  }

  const validateStep2 = (): StepFieldErrors => {
    const out: StepFieldErrors = {}
    if (assignedBarangays.length < MIN_ASSIGN || assignedBarangays.length > MAX_ASSIGN) {
      out.assignedBarangays = `Select ${MIN_ASSIGN}-${MAX_ASSIGN} assigned barangays.`
    } else if (new Set(assignedBarangays).size !== assignedBarangays.length) {
      out.assignedBarangays = 'Assigned barangays must be unique.'
    } else if (barangay && assignedBarangays.includes(barangay)) {
      out.assignedBarangays = 'Host barangay cannot be in assigned barangays.'
    }
    return out
  }

  const validateStep3 = (): StepFieldErrors => {
    const out: StepFieldErrors = {}
    const date = new Date(scheduled)
    const minAllowed = Date.now() + 5 * 60 * 1000
    if (!scheduled.trim()) {
      out.scheduled = 'Scheduled date/time is required.'
    } else if (Number.isNaN(date.getTime()) || date.getTime() < minAllowed) {
      out.scheduled = 'Scheduled date/time must be at least 5 minutes from now.'
    }

    if (!Number.isInteger(households) || households < 1) {
      out.households = 'Household count must be an integer >= 1.'
    }

    if (notes.length > NOTES_MAX) {
      out.notes = `Notes must be ${NOTES_MAX} characters or fewer.`
    }

    return out
  }

  const validateStep4 = (): StepFieldErrors => {
    const out: StepFieldErrors = {}
    if (assignedStaffIds.length < 1) {
      out.assignedStaffIds = 'Select at least 1 staff member.'
      return out
    }

    const unknownIds = assignedStaffIds.filter((id) => !selectedStaffRef.current.has(id))
    if (unknownIds.length > 0) {
      out.assignedStaffIds = 'Some selected staff are out of scope for this distribution.'
      return out
    }

    if (isLguStaff) {
      const outOfScope = assignedStaffIds.some((id) => {
        const candidate = selectedStaffRef.current.get(id)
        if (!candidate) return true
        return !hasScopeCoverage(candidate.scopesSummary)
      })

      if (outOfScope) {
        out.assignedStaffIds = 'Some selected staff are out of scope for this distribution.'
      }
    }

    return out
  }

  const stepErrors = useMemo(() => {
    if (step === 1) return validateStep1()
    if (step === 2) return validateStep2()
    if (step === 3) return validateStep3()
    return validateStep4()
  }, [
    step,
    barangay,
    assignedBarangays,
    scheduled,
    households,
    notes,
    assignedStaffIds,
    isLguStaff,
    targetScope,
  ])

  const isCurrentStepValid = Object.keys(stepErrors).length === 0

  const cacheKey = (cursor: number) => {
    return [barangay, assignedBarangays.join(','), debouncedStaffQuery, cursor].join('|')
  }

  const loadEligibleStaff = async (cursor = 0, append = false) => {
    if (!barangay || assignedBarangays.length < MIN_ASSIGN || assignedBarangays.length > MAX_ASSIGN) return

    const key = cacheKey(cursor)
    const cached = cacheRef.current.get(key)
    if (cached) {
      setStaffData((prev) => ({
        items: append ? [...prev.items, ...cached.items] : cached.items,
        nextCursor: cached.nextCursor,
      }))
      for (const staff of cached.items) {
        selectedStaffRef.current.set(staff.id, staff)
      }
      return
    }

    setIsLoadingStaff(true)
    try {
      const response = await api.getScanEligibleUsers({
        hostBarangayId: barangay,
        assignedBarangayIds: assignedBarangays,
        q: debouncedStaffQuery,
        cursor,
        limit: 20,
      })

      const data = response.data ?? { items: [], nextCursor: null }
      cacheRef.current.set(key, data)

      for (const staff of data.items) {
        selectedStaffRef.current.set(staff.id, staff)
      }

      setStaffData((prev) => ({
        items: append ? [...prev.items, ...data.items] : data.items,
        nextCursor: data.nextCursor,
      }))
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch eligible staff'
      setErrors((prev) => ({ ...prev, global: message }))
      setStaffData({ items: [], nextCursor: null })
    } finally {
      setIsLoadingStaff(false)
    }
  }

  useEffect(() => {
    if (!open || step !== 4) return
    if (assignedBarangays.length < MIN_ASSIGN || assignedBarangays.length > MAX_ASSIGN || !barangay) return
    setStaffData({ items: [], nextCursor: null })
    void loadEligibleStaff(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, barangay, assignedBarangays.join(','), debouncedStaffQuery])

  const setStepErrors = (nextErrors: StepFieldErrors) => {
    setErrors((prev) => ({ ...prev, ...nextErrors }))
  }

  const goNext = () => {
    const current = step === 1
      ? validateStep1()
      : step === 2
        ? validateStep2()
        : step === 3
          ? validateStep3()
          : validateStep4()

    setStepErrors(current)

    if (Object.keys(current).length > 0) return
    setErrors({})
    setStep((s) => Math.min(4, s + 1))
  }

  const goBack = () => {
    setErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  const toggleStaff = (staff: ScanEligibleUser) => {
    const allowedRoles = new Set(['VOLUNTEER', 'LGU_STAFF', 'SUPERADMIN'])
    if (!allowedRoles.has(staff.role)) return

    selectedStaffRef.current.set(staff.id, staff)

    setAssignedStaffIds((prev) => {
      if (prev.includes(staff.id)) return prev.filter((id) => id !== staff.id)
      return [...prev, staff.id]
    })
  }

  const applyServerValidation = (error: unknown) => {
    const nextErrors: StepFieldErrors = {}
    const err = error as {
      response?: {
        code?: string
        message?: string
        errors?: Array<{ path?: string; message?: string }>
      }
      message?: string
    }

    const code = err.response?.code
    const message = err.response?.message || err.message || 'Failed to create distribution'

    if (code === 'OUT_OF_SCOPE_STAFF' || code === 'INVALID_ASSIGNED_STAFF' || code === 'STAFF_NOT_FOUND') {
      nextErrors.assignedStaffIds = code === 'OUT_OF_SCOPE_STAFF'
        ? 'Some selected staff are out of scope for this distribution.'
        : code === 'STAFF_NOT_FOUND'
          ? 'Some selected staff no longer exist.'
          : 'Some selected staff are invalid for assignment.'
      setStep(4)
    }

    for (const issue of err.response?.errors || []) {
      const path = issue.path || ''
      if (path.includes('barangay')) {
        nextErrors.barangay = issue.message || 'Host barangay is required.'
        setStep(1)
      }
      if (path.includes('assignedBarangays')) {
        nextErrors.assignedBarangays = issue.message || 'Assigned barangays are invalid.'
        setStep(2)
      }
      if (path.includes('scheduled')) {
        nextErrors.scheduled = issue.message || 'Scheduled date/time is invalid.'
        setStep(3)
      }
      if (path.includes('households')) {
        nextErrors.households = issue.message || 'Household count is invalid.'
        setStep(3)
      }
      if (path.includes('notes')) {
        nextErrors.notes = issue.message || `Notes must be ${NOTES_MAX} characters or fewer.`
        setStep(3)
      }
      if (path.includes('assignedStaffIds')) {
        nextErrors.assignedStaffIds = issue.message || 'Select at least 1 staff member.'
        setStep(4)
      }
    }

    if (Object.keys(nextErrors).length === 0) {
      nextErrors.global = message
    }

    setErrors(nextErrors)
  }

  const doCreate = async () => {
    const current = validateStep4()
    if (Object.keys(current).length > 0 || isCreating) {
      setStepErrors(current)
      return
    }

    setIsCreating(true)
    setErrors({})

    try {
      await onCreate({
        barangay,
        assignedBarangays,
        assignedStaffIds,
        scheduled: new Date(scheduled).toISOString(),
        households,
        notes: notes.trim() ? notes.trim() : undefined,
      })
    } catch (error: unknown) {
      applyServerValidation(error)
    } finally {
      setIsCreating(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="min-h-full px-4 py-10 flex items-start justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col max-h-[calc(100vh-5rem)]">
          <div className="p-5 border-b border-gray-100 bg-white shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">Create Barangay Distribution</div>
                <div className="text-xs text-gray-500">Step {step} of 4</div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-[#0F533A]' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {step === 1 && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Relief Giving Location (Host Barangay)</label>

                <div className="relative">
                  <button
                    ref={barangayBtnRef}
                    type="button"
                    onClick={() => setBarangayOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
                  >
                    <span className={`text-sm ${barangay ? 'text-gray-900' : 'text-gray-400'}`}>
                      {barangay || 'Choose host barangay'}
                    </span>
                    <ChevronDownIcon />
                  </button>

                  {barangayOpen ? (
                    <div
                      ref={barangayMenuRef}
                      className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1 z-50"
                    >
                      {barangayOptions.map((b) => {
                        const selected = b === barangay
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              setBarangay(b)
                              setAssignedBarangays((prev) => prev.filter((x) => x !== b))
                              setErrors({})
                              setBarangayOpen(false)
                            }}
                            className={[
                              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors',
                              selected ? 'bg-[#EAB308] text-gray-900' : 'text-gray-700 hover:bg-gray-50',
                            ].join(' ')}
                          >
                            <span className="w-5 flex items-center justify-center">{selected ? <CheckIcon /> : null}</span>
                            {b}
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>

                {errors.barangay && <p className="mt-2 text-sm text-red-600">{errors.barangay}</p>}
              </div>
            )}

            {step === 2 && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Assigned Barangays ({MIN_ASSIGN}-{MAX_ASSIGN})</label>
                <div className="rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-2 space-y-1 max-h-56 overflow-y-auto">
                  {barangayOptions
                    .filter((b) => b !== barangay)
                    .map((b) => {
                      const selected = assignedBarangays.includes(b)
                      const disableSelect = !selected && assignedBarangays.length >= MAX_ASSIGN
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            setAssignedBarangays((prev) => {
                              if (prev.includes(b)) return prev.filter((x) => x !== b)
                              if (prev.length >= MAX_ASSIGN) return prev
                              return [...prev, b]
                            })
                            setErrors({})
                          }}
                          className={[
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors',
                            selected ? 'bg-[#EAB308] text-gray-900' : 'text-gray-700 hover:bg-gray-50',
                            disableSelect ? 'opacity-50 cursor-not-allowed' : '',
                          ].join(' ')}
                        >
                          <span className="w-5 flex items-center justify-center">{selected ? <CheckIcon /> : null}</span>
                          <span className="truncate">{b}</span>
                        </button>
                      )
                    })}
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  Selected: {assignedBarangays.length}/{MAX_ASSIGN} (minimum {MIN_ASSIGN})
                </div>
                {errors.assignedBarangays && <p className="mt-2 text-sm text-red-600">{errors.assignedBarangays}</p>}
              </div>
            )}

            {step === 3 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Scheduled Date/Time</label>
                  <input
                    type="datetime-local"
                    value={scheduled}
                    onChange={(e) => {
                      setScheduled(e.target.value)
                      setErrors({})
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-green-500 text-sm text-gray-900"
                  />
                  {errors.scheduled && <p className="mt-2 text-sm text-red-600">{errors.scheduled}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Household Count</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={households}
                    onChange={(e) => {
                      setHouseholds(Number.parseInt(e.target.value || '0', 10))
                      setErrors({})
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-green-500 text-sm text-gray-900"
                  />
                  {errors.households && <p className="mt-2 text-sm text-red-600">{errors.households}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value)
                      setErrors({})
                    }}
                    rows={3}
                    placeholder="Add distribution notes..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-green-500 text-sm text-gray-900 placeholder-gray-400"
                  />
                  <div className="mt-1 text-[11px] text-gray-500">{notes.length}/{NOTES_MAX}</div>
                  {errors.notes && <p className="mt-2 text-sm text-red-600">{errors.notes}</p>}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Assign Staff / Volunteers</label>
                  <input
                    value={staffQuery}
                    onChange={(e) => setStaffQuery(e.target.value)}
                    placeholder="Search by name or email"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-green-500 text-sm text-gray-900"
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {isLoadingStaff ? (
                    <div className="p-4 text-sm text-gray-600 flex items-center gap-2">
                      <SpinnerIcon />
                      Loading eligible staff...
                    </div>
                  ) : staffData.items.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No staff found for this scope.</div>
                  ) : (
                    staffData.items.map((staff) => {
                      const selected = assignedStaffIds.includes(staff.id)
                      return (
                        <label key={staff.id} className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleStaff(staff)}
                              className="h-4 w-4"
                            />
                            <div className="min-w-0">
                              <div className="text-sm text-gray-900 truncate">{staff.fullName}</div>
                              <div className="text-[11px] text-gray-500 truncate">{staff.scopesSummary.join(', ') || 'No scope assigned'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-medium">
                              {staff.role}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${staff.inScope ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                              {staff.inScope ? 'In-scope' : 'Out-of-scope'}
                            </span>
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>

                {staffData.nextCursor !== null && !isLoadingStaff && (
                  <button
                    type="button"
                    onClick={() => void loadEligibleStaff(staffData.nextCursor || 0, true)}
                    className="text-sm text-[#0F533A] font-medium hover:underline"
                  >
                    Load more
                  </button>
                )}

                <div className="text-xs text-gray-600">Assigned: {assignedStaffIds.length}</div>

                {assignedStaffIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {assignedStaffIds.map((id) => {
                      const staff = selectedStaffRef.current.get(id)
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => setAssignedStaffIds((prev) => prev.filter((x) => x !== id))}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-[11px] border border-green-100"
                        >
                          {staff?.fullName || id}
                          <span>x</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {errors.assignedStaffIds && <p className="text-sm text-red-600">{errors.assignedStaffIds}</p>}
              </>
            )}

            {errors.global && <p className="text-sm text-red-600">{errors.global}</p>}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={step === 1 ? onClose : goBack}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!isCurrentStepValid}
                  className={[
                    'px-5 py-2 rounded-xl text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)]',
                    isCurrentStepValid
                      ? 'bg-[#0F533A] hover:bg-[#0a3f2c] text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed',
                  ].join(' ')}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={doCreate}
                  disabled={!isCurrentStepValid || isCreating}
                  className={[
                    'px-5 py-2 rounded-xl text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)] flex items-center gap-2',
                    isCurrentStepValid && !isCreating
                      ? 'bg-[#0F533A] hover:bg-[#0a3f2c] text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed',
                  ].join(' ')}
                >
                  {isCreating ? (
                    <>
                      <SpinnerIcon />
                      Creating distribution...
                    </>
                  ) : (
                    'Create Distribution'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}
