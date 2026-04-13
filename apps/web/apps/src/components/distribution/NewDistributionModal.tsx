'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, ScanEligibleUser } from '../../lib/api'
import { useAuth } from '@/lib/AuthContext'

export type CreateDistributionPayload = {
  barangay: string
  assignedBarangays: string[]
  assignedStaffIds: string[]
  scheduled: string
  notes?: string
}

type StepFieldErrors = {
  barangay?: string
  assignedBarangays?: string
  scheduled?: string
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
const SCHEDULE_MIN_LEAD_MINUTES = 5
const DISTRIBUTION_START_HOUR = 6
const DISTRIBUTION_END_HOUR = 20

const STEP_DETAILS = {
  1: {
    eyebrow: 'Step 1 of 4',
    title: 'Choose the host barangay',
    description: 'Set the primary relief release location where the distribution will be hosted.',
  },
  2: {
    eyebrow: 'Step 2 of 4',
    title: 'Select covered barangays',
    description: 'Choose the barangays included in this distribution scope, excluding the host barangay.',
  },
  3: {
    eyebrow: 'Step 3 of 4',
    title: 'Set the distribution schedule',
    description: 'Define when the release happens and add optional notes for volunteers and staff.',
  },
  4: {
    eyebrow: 'Step 4 of 4',
    title: 'Assign staff and volunteers',
    description: 'Pick in-scope personnel who can manage scanning, verification, and release operations.',
  },
} as const

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

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
  const scheduleMinLocal = useMemo(() => {
    const minDate = new Date(Date.now() + SCHEDULE_MIN_LEAD_MINUTES * 60 * 1000)
    return formatDateTimeLocal(minDate)
  }, [open])
  const scheduleMaxLocal = useMemo(() => {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0, 0)
    return formatDateTimeLocal(endOfMonth)
  }, [open])

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
    const now = new Date()
    const minAllowed = Date.now() + SCHEDULE_MIN_LEAD_MINUTES * 60 * 1000
    if (!scheduled.trim()) {
      out.scheduled = 'Scheduled date/time is required.'
    } else if (Number.isNaN(date.getTime())) {
      out.scheduled = 'Scheduled date/time is invalid.'
    } else if (date.getTime() < minAllowed) {
      out.scheduled = `Scheduled date/time must be at least ${SCHEDULE_MIN_LEAD_MINUTES} minutes from now.`
    } else if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) {
      const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      out.scheduled = `Schedule must stay within ${monthLabel}. Next month is not allowed.`
    } else {
      const hour = date.getHours()
      const minute = date.getMinutes()
      const isBeforeStart = hour < DISTRIBUTION_START_HOUR
      const isAfterEnd = hour > DISTRIBUTION_END_HOUR || (hour === DISTRIBUTION_END_HOUR && minute > 0)
      if (isBeforeStart || isAfterEnd) {
        out.scheduled = `Schedule must be between ${DISTRIBUTION_START_HOUR}:00 and ${DISTRIBUTION_END_HOUR}:00 only.`
      }
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
        notes: notes.trim() ? notes.trim() : undefined,
      })
    } catch (error: unknown) {
      applyServerValidation(error)
    } finally {
      setIsCreating(false)
    }
  }

  const currentStepDetails = STEP_DETAILS[step as 1 | 2 | 3 | 4]

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={isCreating ? undefined : onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0F533A]">Create Distribution</p>
                <h3 className="mt-2 text-xl font-black text-gray-900">Plan a barangay relief release</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Keep your existing distribution workflow, now styled to match the disaster event setup experience.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`rounded-2xl border px-4 py-3 ${s === step ? 'border-[#0F533A] bg-[#0F533A]/6' : s < step ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${s === step ? 'text-[#0F533A]' : s < step ? 'text-emerald-700' : 'text-gray-500'}`}>
                    Step {s}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {s === 1 ? 'Host' : s === 2 ? 'Coverage' : s === 3 ? 'Schedule' : 'Team'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto px-6 py-5 flex-1 min-h-0" style={{ maxHeight: 'calc(92vh - 220px)' }}>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">{currentStepDetails.eyebrow}</p>
              <h4 className="mt-2 text-lg font-black text-gray-900">{currentStepDetails.title}</h4>
              <p className="mt-2 text-sm text-gray-600">{currentStepDetails.description}</p>
            </div>

            <div className="min-h-[280px]">
            {step === 1 && (
              <div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Relief Giving Location (Host Barangay)</label>

                  <div className="relative">
                    <button
                      ref={barangayBtnRef}
                      type="button"
                      onClick={() => setBarangayOpen((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none transition-colors hover:bg-gray-50 focus:border-gray-400"
                    >
                      <span className={barangay ? 'font-medium text-gray-900' : 'text-gray-400'}>
                        {barangay || 'Choose host barangay'}
                      </span>
                      <ChevronDownIcon />
                    </button>

                    {barangayOpen ? (
                      <div
                        ref={barangayMenuRef}
                        className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.14)]"
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
                                  'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                                  selected ? 'bg-[#0F533A]/6 text-[#0F533A]' : 'text-gray-700 hover:bg-gray-50',
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

                  <p className="mt-2 text-xs text-gray-500">This is the main relief release point for the distribution.</p>
                  {errors.barangay && <p className="mt-2 text-sm text-red-600">{errors.barangay}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Assigned Barangays ({MIN_ASSIGN}-{MAX_ASSIGN})</label>
                    <p className="text-xs text-gray-500">Choose the barangays covered by this release schedule.</p>
                  </div>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-600">
                    {assignedBarangays.length} selected
                  </span>
                </div>
                <div className="mt-3 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
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
                          disabled={disableSelect}
                          className={[
                            'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors',
                            selected ? 'border-[#0F533A] bg-[#0F533A]/5 text-[#0F533A]' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                            disableSelect ? 'opacity-50 cursor-not-allowed' : '',
                          ].join(' ')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current/20">{selected ? <CheckIcon /> : null}</span>
                          <span className="truncate">{b}</span>
                        </button>
                      )
                    })}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Selected: {assignedBarangays.length}/{MAX_ASSIGN} (minimum {MIN_ASSIGN})
                </div>
                {errors.assignedBarangays && <p className="mt-2 text-sm text-red-600">{errors.assignedBarangays}</p>}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Scheduled Date/Time</label>
                  <input
                    type="datetime-local"
                    value={scheduled}
                    min={scheduleMinLocal}
                    max={scheduleMaxLocal}
                    onChange={(e) => {
                      setScheduled(e.target.value)
                      setErrors({})
                    }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none transition-colors focus:border-gray-400"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Allowed: current month only, {DISTRIBUTION_START_HOUR}:00-{DISTRIBUTION_END_HOUR}:00, at least {SCHEDULE_MIN_LEAD_MINUTES} minutes ahead.
                  </p>
                  {errors.scheduled && <p className="mt-2 text-sm text-red-600">{errors.scheduled}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value)
                      setErrors({})
                    }}
                    rows={4}
                    placeholder="Add coordination notes, reminders, or release instructions."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 shadow-sm outline-none transition-colors focus:border-gray-400"
                  />
                  <div className="mt-1.5 text-xs text-gray-500">{notes.length}/{NOTES_MAX}</div>
                  {errors.notes && <p className="mt-2 text-sm text-red-600">{errors.notes}</p>}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Assign Staff / Volunteers</label>
                  <input
                    value={staffQuery}
                    onChange={(e) => setStaffQuery(e.target.value)}
                    placeholder="Search by name or email"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none transition-colors focus:border-gray-400"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
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
                        <label key={staff.id} className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${selected ? 'bg-[#0F533A]/4' : 'hover:bg-gray-50'}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleStaff(staff)}
                              className="h-4 w-4 rounded border-gray-300 text-[#0F533A] focus:ring-[#0F533A]"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{staff.fullName}</div>
                              <div className="text-[11px] text-gray-500 truncate">{staff.scopesSummary.join(', ') || 'No scope assigned'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-medium">
                              {staff.role}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${staff.inScope ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
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

                <div className="text-xs font-medium text-gray-600">Assigned: {assignedStaffIds.length}</div>

                {assignedStaffIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {assignedStaffIds.map((id) => {
                      const staff = selectedStaffRef.current.get(id)
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => setAssignedStaffIds((prev) => prev.filter((x) => x !== id))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] border border-emerald-100"
                        >
                          {staff?.fullName || id}
                          <span>x</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {errors.assignedStaffIds && <p className="text-sm text-red-600">{errors.assignedStaffIds}</p>}
              </div>
            )}

            {errors.global && <p className="text-sm text-red-600">{errors.global}</p>}
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4 bg-white shrink-0">
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={step === 1 ? onClose : goBack}
                disabled={isCreating}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!isCurrentStepValid}
                  className={[
                    'rounded-xl px-5 py-2.5 text-sm font-bold transition-colors',
                    isCurrentStepValid
                      ? 'bg-[#0F533A] hover:bg-[#0b412d] text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed',
                  ].join(' ')}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={doCreate}
                  disabled={!isCurrentStepValid || isCreating}
                  className={[
                    'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors',
                    isCurrentStepValid && !isCreating
                      ? 'bg-[#0F533A] hover:bg-[#0b412d] text-white'
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
    </div>,
    document.body,
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
