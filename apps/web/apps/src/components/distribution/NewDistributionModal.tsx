'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, DisasterEventRecord, ScanEligibleUser } from '../../lib/api'
import { useAuth } from '@/lib/AuthContext'

export type CreateDistributionPayload = {
  disasterEventId: string
  barangay: string
  assignedBarangays: string[]
  assignedStaffIds: string[]
  scheduled: string
  notes?: string
}

type StepFieldErrors = {
  disasterEventId?: string
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
    title: 'Choose the disaster and host barangay',
    description: 'Link this release to an active disaster event, then choose its primary relief location.',
  },
  2: {
    eyebrow: 'Step 2 of 4',
    title: 'Select covered barangays',
    description: 'Choose the 2 to 4 additional barangays whose residents, together with the host barangay, are covered by this distribution. Residents will still need an approved beneficiary application before claiming.',
  },
  3: {
    eyebrow: 'Step 3 of 4',
    title: 'Set the distribution schedule',
    description: 'Define when the release happens and add optional notes for volunteers and staff.',
  },
  4: {
    eyebrow: 'Step 4 of 4',
    title: 'Assign staff and volunteers',
    description: 'Pick a team whose combined coverage matches the host and all beneficiary barangays for this distribution.',
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
  const [disasterEventId, setDisasterEventId] = useState('')
  const [activeEvents, setActiveEvents] = useState<DisasterEventRecord[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [barangay, setBarangay] = useState('')
  const [assignedBarangays, setAssignedBarangays] = useState<string[]>([])
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([])
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

  useEffect(() => {
    if (!open) return
    setStep(1)
    setDisasterEventId('')
    setBarangay('')
    setAssignedBarangays([])
    setAssignedStaffIds([])
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

  useEffect(() => {
    if (!open) return
    setEventsLoading(true)
    api.getBeneficiaryEvents({ status: 'Active', page: 1, limit: 100 })
      .then((response) => setActiveEvents(response.data ?? []))
      .catch(() => setActiveEvents([]))
      .finally(() => setEventsLoading(false))
  }, [open])
  const selectedEvent = useMemo(
    () => activeEvents.find((event) => (event.id || event._id) === disasterEventId) ?? null,
    [activeEvents, disasterEventId],
  )
  const availableBarangays = useMemo(
    () => selectedEvent
      ? barangayOptions.filter((option) => selectedEvent.barangays.includes(option))
      : [],
    [barangayOptions, selectedEvent],
  )
  const scheduleMaxLocal = useMemo(() => {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0, 0)
    return formatDateTimeLocal(endOfMonth)
  }, [open])

  const normalizedTargetScope = useMemo(
    () => Array.from(new Set(targetScope.filter(Boolean))),
    [targetScope],
  )

  const getCoveredTargets = (scopes: string[]) => {
    return normalizedTargetScope.filter((target) => scopes.includes(target))
  }

  const hasAnyScopeCoverage = (scopes: string[]) => {
    return getCoveredTargets(scopes).length > 0
  }

  const getUncoveredTargets = (staffIds: string[]) => {
    return normalizedTargetScope.filter((target) =>
      !staffIds.some((id) => selectedStaffRef.current.get(id)?.scopesSummary.includes(target)),
    )
  }

  const validateStep1 = (): StepFieldErrors => {
    const out: StepFieldErrors = {}
    if (!disasterEventId) {
      out.disasterEventId = 'Select an active disaster event.'
    }
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

    const outOfScope = assignedStaffIds.some((id) => {
      const candidate = selectedStaffRef.current.get(id)
      if (!candidate) return true
      return !hasAnyScopeCoverage(candidate.scopesSummary)
    })

    if (outOfScope) {
      out.assignedStaffIds = 'Some selected staff do not cover any barangay in this distribution.'
      return out
    }

    const uncoveredTargets = getUncoveredTargets(assignedStaffIds)
    if (uncoveredTargets.length > 0) {
      out.assignedStaffIds = `Selected staff still need coverage for: ${uncoveredTargets.join(', ')}.`
      return out
    }

    if (isLguStaff) {
      const outOfRequesterScope = assignedStaffIds.some((id) => {
        const candidate = selectedStaffRef.current.get(id)
        if (!candidate) return true
        return candidate.scopesSummary.some((scope) => !user?.assignedBarangays?.includes(scope))
      })

      if (outOfRequesterScope) {
        out.assignedStaffIds = 'Some selected staff are outside your barangay scope.'
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
    disasterEventId,
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
      console.error('Failed to fetch eligible staff:', error)
      setErrors((prev) => ({ ...prev, global: 'Failed to fetch eligible staff. Please try again.' }))
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
    const message = err.response?.message || 'Failed to create distribution. Please try again.'

    if (
      code === 'OUT_OF_SCOPE_STAFF' ||
      code === 'INVALID_ASSIGNED_STAFF' ||
      code === 'STAFF_NOT_FOUND' ||
      code === 'INSUFFICIENT_SCOPE_COVERAGE'
    ) {
      nextErrors.assignedStaffIds = code === 'OUT_OF_SCOPE_STAFF'
        ? 'Some selected staff are not assigned to any barangay in this distribution.'
        : code === 'STAFF_NOT_FOUND'
          ? 'Some selected staff no longer exist.'
          : code === 'INSUFFICIENT_SCOPE_COVERAGE'
            ? 'Selected staff do not collectively cover every barangay in this distribution.'
          : 'Some selected staff are invalid for assignment.'
      setStep(4)
    }

    for (const issue of err.response?.errors || []) {
      const path = issue.path || ''
      if (path.includes('disasterEventId')) {
        nextErrors.disasterEventId = issue.message || 'Select an active disaster event.'
        setStep(1)
      }
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
        disasterEventId,
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

      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl">
          <div className="border-b border-gray-100 dark:border-slate-800 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0F533A] dark:text-emerald-400">Create Distribution</p>
                <h3 className="mt-2 text-xl font-black text-gray-900 dark:text-slate-100">Plan a barangay relief release</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                  Keep your existing distribution workflow, now styled to match the disaster event setup experience.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className="rounded-full border border-gray-200 dark:border-slate-700 p-2 text-gray-500 dark:text-slate-400 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300 disabled:opacity-50"
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`rounded-2xl border px-4 py-3 ${s === step ? 'border-[#0F533A] bg-[#0F533A]/6 dark:border-[#0F533A]/50 dark:bg-[#0F533A]/30' : s < step ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-900/30' : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800'}`}
                >
                  <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${s === step ? 'text-[#0F533A] dark:text-emerald-400' : s < step ? 'text-emerald-700 dark:text-emerald-500' : 'text-gray-500 dark:text-slate-400'}`}>
                    Step {s}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-slate-100">
                    {s === 1 ? 'Host' : s === 2 ? 'Coverage' : s === 3 ? 'Schedule' : 'Team'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto px-6 py-5 flex-1 min-h-0" style={{ maxHeight: 'calc(92vh - 220px)' }}>
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-800/50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">{currentStepDetails.eyebrow}</p>
              <h4 className="mt-2 text-lg font-black text-gray-900 dark:text-slate-100">{currentStepDetails.title}</h4>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">{currentStepDetails.description}</p>
            </div>

            <div className="min-h-[280px]">
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Active disaster event</label>
                  <p className="text-xs text-gray-500">Approved residents from this event will be enrolled automatically when their barangay is covered.</p>
                  <select
                    value={disasterEventId}
                    disabled={eventsLoading}
                    onChange={(event) => {
                      setDisasterEventId(event.target.value)
                      setBarangay('')
                      setAssignedBarangays([])
                      setAssignedStaffIds([])
                      setErrors({})
                    }}
                    className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#0F533A]"
                  >
                    <option value="">{eventsLoading ? 'Loading active events...' : 'Select an active event'}</option>
                    {activeEvents.map((event) => (
                      <option key={event.id || event._id} value={event.id || event._id}>
                        {event.name} ({event.disasterType})
                      </option>
                    ))}
                  </select>
                  {!eventsLoading && activeEvents.length === 0 && (
                    <p className="mt-2 text-sm text-amber-700">Create or activate a disaster event before scheduling a distribution.</p>
                  )}
                  {errors.disasterEventId && <p className="mt-2 text-sm text-red-600">{errors.disasterEventId}</p>}
                </div>

                <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-200">Relief Giving Location (Host Barangay)</label>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Choose the main relief release point for this distribution.</p>
                  </div>
                  <span className="rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-gray-600 dark:text-slate-300">
                    {barangay ? '1 selected' : 'Pick 1'}
                  </span>
                </div>

                <div className="mt-3 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                  {availableBarangays.map((b) => {
                    const selected = b === barangay
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setBarangay(b)
                          setAssignedBarangays((prev) => prev.filter((x) => x !== b))
                          setErrors({})
                        }}
                        className={[
                          'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors',
                          selected ? 'border-[#0F533A] bg-[#0F533A]/5 dark:bg-[#0F533A]/20 text-[#0F533A] dark:text-emerald-400' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700',
                        ].join(' ')}
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current/20">
                          {selected ? <CheckIcon /> : null}
                        </span>
                        <span className="truncate">{b}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Selected host: {barangay || 'None'}
                </div>
                {errors.barangay && <p className="mt-2 text-sm text-red-600">{errors.barangay}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-200">Assigned Barangays ({MIN_ASSIGN}-{MAX_ASSIGN})</label>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Choose the additional barangays whose residents will claim at the selected host barangay. The host barangay is included automatically.</p>
                  </div>
                  <span className="rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-gray-600 dark:text-slate-300">
                    {assignedBarangays.length} selected
                  </span>
                </div>
                <div className="mt-3 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                  {availableBarangays
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
                            selected ? 'border-[#0F533A] bg-[#0F533A]/5 dark:bg-[#0F533A]/20 text-[#0F533A] dark:text-emerald-400' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700',
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
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-200">Scheduled Date/Time</label>
                  <input
                    type="datetime-local"
                    value={scheduled}
                    min={scheduleMinLocal}
                    max={scheduleMaxLocal}
                    onChange={(e) => {
                      setScheduled(e.target.value)
                      setErrors({})
                    }}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 shadow-sm outline-none transition-colors focus:border-gray-400 dark:focus:border-slate-500"
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-slate-400">
                    Allowed: current month only, {DISTRIBUTION_START_HOUR}:00-{DISTRIBUTION_END_HOUR}:00, at least {SCHEDULE_MIN_LEAD_MINUTES} minutes ahead.
                  </p>
                  {errors.scheduled && <p className="mt-2 text-sm text-red-600">{errors.scheduled}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-200">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value)
                      setErrors({})
                    }}
                    rows={4}
                    placeholder="Add coordination notes, reminders, or release instructions."
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-gray-700 dark:text-slate-200 shadow-sm outline-none transition-colors focus:border-gray-400 dark:focus:border-slate-500 placeholder-gray-400 dark:placeholder-slate-500"
                  />
                  <div className="mt-1.5 text-xs text-gray-500 dark:text-slate-400">{notes.length}/{NOTES_MAX}</div>
                  {errors.notes && <p className="mt-2 text-sm text-red-600">{errors.notes}</p>}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-200">Assign Staff / Volunteers</label>
                  <p className="mb-2 text-xs text-gray-500 dark:text-slate-400">
                    Each selected person should cover at least one barangay in this distribution, and the whole team must cover the host plus all selected barangays.
                  </p>
                  <input
                    value={staffQuery}
                    onChange={(e) => setStaffQuery(e.target.value)}
                    placeholder="Search by name or email"
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 shadow-sm outline-none transition-colors focus:border-gray-400 dark:focus:border-slate-500 placeholder-gray-400 dark:placeholder-slate-500"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm divide-y divide-gray-100 dark:divide-slate-700">
                  {isLoadingStaff ? (
                    <div className="p-4 text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
                      <SpinnerIcon />
                      Loading eligible staff...
                    </div>
                  ) : staffData.items.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 dark:text-slate-400">No staff found for this scope.</div>
                  ) : (
                    staffData.items.map((staff) => {
                      const selected = assignedStaffIds.includes(staff.id)
                      const coveredTargets = staff.coveredBarangays?.length
                        ? staff.coveredBarangays
                        : getCoveredTargets(staff.scopesSummary)
                      return (
                        <label key={staff.id} className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${selected ? 'bg-[#0F533A]/4 dark:bg-[#0F533A]/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleStaff(staff)}
                              className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-[#0F533A] dark:bg-slate-700 focus:ring-[#0F533A]"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{staff.fullName}</div>
                              <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                                Covers {coveredTargets.join(', ') || 'No target barangay'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 text-[11px] font-medium">
                              {staff.role}
                            </span>
                            <span className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              {coveredTargets.length} barangay{coveredTargets.length === 1 ? '' : 's'}
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

                <div className="text-xs font-medium text-gray-600">
                  Assigned: {assignedStaffIds.length} • Covered: {normalizedTargetScope.length - getUncoveredTargets(assignedStaffIds).length}/{normalizedTargetScope.length}
                </div>

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

          <div className="border-t border-gray-100 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={step === 1 ? onClose : goBack}
                disabled={isCreating}
                className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
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
