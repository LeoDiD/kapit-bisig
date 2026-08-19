'use client'

import React, { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { showToast } from '@/lib/toast'
import { DistributionRow } from './DistributionsTable'

interface RescheduleDistributionModalProps {
  open: boolean
  distribution: DistributionRow | null
  onClose: () => void
  onSuccess: () => void
}

const OPERATING_HOUR_START = 6
const OPERATING_HOUR_END = 20

function formatCurrentScheduled(dateString?: string | null): string {
  if (!dateString) return '--'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return String(dateString)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function RescheduleDistributionModal({
  open,
  distribution,
  onClose,
  onSuccess,
}: RescheduleDistributionModalProps) {
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize date/time defaults when modal opens
  useEffect(() => {
    if (!open || !distribution) return
    setError(null)
    setReason('')

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const yyyy = tomorrow.getFullYear()
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const dd = String(tomorrow.getDate()).padStart(2, '0')
    setScheduledDate(`${yyyy}-${mm}-${dd}`)
    setScheduledTime('09:00')
  }, [open, distribution])

  if (!open || !distribution) return null

  const validate = (): string | null => {
    if (!scheduledDate || !scheduledTime) {
      return 'Please choose both a new date and time.'
    }

    const scheduledDateObj = new Date(`${scheduledDate}T${scheduledTime}`)
    if (isNaN(scheduledDateObj.getTime())) {
      return 'Selected date and time is invalid.'
    }

    const now = new Date()
    const minAllowed = new Date(now.getTime() + 5 * 60 * 1000)
    if (scheduledDateObj.getTime() < minAllowed.getTime()) {
      return 'New schedule must be at least 5 minutes from now.'
    }

    const hour = scheduledDateObj.getHours()
    const minute = scheduledDateObj.getMinutes()
    if (hour < OPERATING_HOUR_START || hour > OPERATING_HOUR_END || (hour === OPERATING_HOUR_END && minute > 0)) {
      return `Operating hours are 6:00 AM to 8:00 PM.`
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const scheduledIso = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      const res = await api.rescheduleDistribution(distribution.id, {
        scheduled: scheduledIso,
        reason: reason.trim() || undefined,
      })

      if (res.success) {
        showToast.success(`Distribution for ${distribution.barangay} rescheduled.`)
        onSuccess()
        onClose()
      } else {
        setError(res.message || 'Failed to reschedule distribution.')
      }
    } catch (err: any) {
      console.error('Failed to reschedule distribution:', err)
      const serverMessage =
        err?.response?.message || err?.message || 'Failed to reschedule distribution.'
      setError(serverMessage)
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()
  const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Delay / Postponement
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Reschedule Distribution
                </h3>
              </div>
            </div>
            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              {distribution.barangay}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current schedule info */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Schedule:</p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
              {formatCurrentScheduled(distribution.scheduled)}
            </p>
          </div>

          {/* New Date & Time */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              New Date & Time
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Date</label>
                <input
                  type="date"
                  min={todayYmd}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 shadow-sm focus:border-slate-400 focus:outline-none dark:focus:border-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Time (06:00 - 20:00)</label>
                <input
                  type="time"
                  min="06:00"
                  max="20:00"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 shadow-sm focus:border-slate-400 focus:outline-none dark:focus:border-slate-500"
                />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Operating hours: 6:00 AM - 8:00 PM</p>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Reason for Rescheduling / Delay Notes <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Severe rainfall and flooding; moving relief operation to tomorrow morning."
              maxLength={500}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 shadow-sm focus:border-slate-400 focus:outline-none dark:focus:border-slate-500"
            />
          </div>

          {/* Error notice */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 dark:bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 dark:hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Rescheduling...
                </>
              ) : (
                'Confirm Reschedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CalendarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function SpinnerIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" className="opacity-20" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
