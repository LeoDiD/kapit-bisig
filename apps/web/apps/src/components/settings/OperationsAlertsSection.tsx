'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { profileApi, BARANGAY_OPTIONS, type UserPreferencesData } from '@/lib/api'
import { showToast } from '@/lib/toast'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function OperationsAlertsSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // State
  const [defaultBarangay, setDefaultBarangay] = useState('All')
  const [barangayDropdownOpen, setBarangayDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h')
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    distributionAlerts: true,
    securityAlerts: true,
  })

  // Initial state for dirty detection
  const [initialData, setInitialData] = useState<{
    defaultBarangay: string
    timeFormat: '12h' | '24h'
    notifications: typeof notifications
  }>({
    defaultBarangay: 'All',
    timeFormat: '12h',
    notifications: {
      emailNotifications: true,
      distributionAlerts: true,
      securityAlerts: true,
    },
  })

  useEffect(() => {
    loadPreferences()
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setBarangayDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const barangayOptions = useMemo(
    () => [
      { value: 'All', label: 'All Barangays (Municipality-Wide)' },
      ...BARANGAY_OPTIONS.map((b) => ({ value: b, label: `Barangay ${b}` })),
    ],
    [],
  )

  const selectedBarangayLabel = useMemo(() => {
    if (defaultBarangay === 'All') return 'All Barangays (Municipality-Wide)'
    return `Barangay ${defaultBarangay}`
  }, [defaultBarangay])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const res = await profileApi.getPreferences()
      if (res.success && res.data) {
        const dBarangay = res.data.defaultBarangay || 'All'
        const tFormat = res.data.timeFormat || '12h'
        const notifs = {
          emailNotifications: res.data.notifications?.emailNotifications ?? true,
          distributionAlerts: res.data.notifications?.distributionAlerts ?? true,
          securityAlerts: res.data.notifications?.securityAlerts ?? true,
        }

        setDefaultBarangay(dBarangay)
        setTimeFormat(tFormat)
        setNotifications(notifs)
        setInitialData({
          defaultBarangay: dBarangay,
          timeFormat: tFormat,
          notifications: notifs,
        })
      }
    } catch {
      showToast.error('Failed to load operational preferences')
    } finally {
      setLoading(false)
    }
  }

  const isDirty =
    defaultBarangay !== initialData.defaultBarangay ||
    timeFormat !== initialData.timeFormat ||
    notifications.emailNotifications !== initialData.notifications.emailNotifications ||
    notifications.distributionAlerts !== initialData.notifications.distributionAlerts ||
    notifications.securityAlerts !== initialData.notifications.securityAlerts

  const handleReset = () => {
    setDefaultBarangay(initialData.defaultBarangay)
    setTimeFormat(initialData.timeFormat)
    setNotifications({ ...initialData.notifications })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await profileApi.updatePreferences({
        defaultBarangay,
        timeFormat,
        notifications,
      })
      if (res.success) {
        showToast.success('Operational preferences saved successfully')
        setInitialData({
          defaultBarangay,
          timeFormat,
          notifications: { ...notifications },
        })
      } else {
        showToast.error(res.message || 'Failed to save preferences')
      }
    } catch (err) {
      console.error('Failed to update preferences:', err)
      showToast.error('An error occurred while saving preferences')
    } finally {
      setSaving(false)
      setConfirmOpen(false)
    }
  }

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (loading) return <PreferencesSkeleton />

  return (
    <div className="space-y-6">
      {/* ── Operational Defaults Card ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700/60 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#0F533A]/10 text-[#0F533A] dark:text-emerald-400">
              <MapPinIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Operational Defaults
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Preset your assigned base barangay and time standard for fast relief workflows.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#0F533A] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            LGU Rosario, Batangas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Default Barangay */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Default Assigned Barangay
            </label>
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setBarangayDropdownOpen((v) => !v)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  barangayDropdownOpen
                    ? 'border border-[#0F533A] dark:border-emerald-500 ring-2 ring-[#0F533A]/15 dark:ring-emerald-500/20 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-slate-50 hover:text-[#004A1C] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/50 dark:hover:text-[#ECC323]'
                }`}
              >
                <span className="truncate">{selectedBarangayLabel}</span>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform ${
                    barangayDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {barangayDropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-2xl border border-[#DCDCDC] bg-[#ECECEC] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                  {barangayOptions.map((opt) => {
                    const isSelected = opt.value === defaultBarangay
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setDefaultBarangay(opt.value)
                          setBarangayDropdownOpen(false)
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-left transition-colors font-medium ${
                          isSelected
                            ? 'bg-[#EAB308] text-gray-900 font-semibold'
                            : 'text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="w-5 flex items-center justify-center shrink-0">
                          {isSelected ? <CheckIcon className="w-4 h-4 text-gray-900" /> : null}
                        </span>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
              Automatically selects this barangay when opening distribution claims and resident lists.
            </p>
          </div>

          {/* Time & Clock Format */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Time & Timestamp Display
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTimeFormat('12h')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  timeFormat === '12h'
                    ? 'border-[#0F533A] dark:border-emerald-500 bg-[#0F533A]/10 text-[#0F533A] dark:text-emerald-300 ring-1 ring-[#0F533A]/20'
                    : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                12-Hour (02:30 PM PHT)
              </button>
              <button
                type="button"
                onClick={() => setTimeFormat('24h')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  timeFormat === '24h'
                    ? 'border-[#0F533A] dark:border-emerald-500 bg-[#0F533A]/10 text-[#0F533A] dark:text-emerald-300 ring-1 ring-[#0F533A]/20'
                    : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                24-Hour (14:30 PHT)
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
              Philippine Standard Time (UTC+8) formatting used on reports and claim logs.
            </p>
          </div>
        </div>
      </div>

      {/* ── Notification & Emergency Alerts Card ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700/60 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <BellIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Relief Alerts & Notifications
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Configure which operations events trigger email and in-app emergency updates.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
            {Object.values(notifications).filter(Boolean).length} Active
          </span>
        </div>

        <div className="space-y-4">
          {/* Toggle 1: Master Email */}
          <ToggleItem
            title="Official Email Notifications"
            description="Receive critical disaster declarations and municipal operational bulletins at your verified email."
            enabled={notifications.emailNotifications}
            onToggle={() => toggleNotif('emailNotifications')}
          />

          {/* Toggle 2: Distribution Schedules */}
          <ToggleItem
            title="Distribution Schedule Announcements"
            description="Notify when a relief drive is scheduled, modified, or completed for your assigned barangay."
            enabled={notifications.distributionAlerts}
            onToggle={() => toggleNotif('distributionAlerts')}
          />

          {/* Toggle 3: Security Alerts */}
          <ToggleItem
            title="Security & Sign-in Alerts"
            description="Receive immediate alerts for logins from new devices or password update requests."
            enabled={notifications.securityAlerts}
            onToggle={() => toggleNotif('securityAlerts')}
            badge="Recommended"
            badgeColor="emerald"
          />
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-5 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {isDirty ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                You have unsaved preferences
              </span>
            ) : (
              <span>All preferences up to date</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0F533A] hover:bg-[#0a3f2c] active:bg-[#073021] rounded-xl transition-all shadow-sm shadow-[#0F533A]/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Spinner /> : <SaveIcon className="w-4 h-4" />}
              Save Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Save Operational Preferences"
        body="Are you sure you want to update your default barangay and notification settings?"
        confirmLabel="Yes, Save"
        loading={saving}
        onConfirm={handleSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

/* ── Toggle Subcomponent ─────────────────────────────── */

function ToggleItem({
  title,
  description,
  enabled,
  onToggle,
  badge,
  badgeColor,
}: {
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
  badge?: string
  badgeColor?: 'red' | 'emerald'
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-gray-100 dark:border-slate-700/60 hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-gray-900 dark:text-white">{title}</p>
          {badge && (
            <span
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${
                badgeColor === 'red'
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Modern Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-[#0F533A]' : 'bg-gray-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function PreferencesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 p-6 space-y-4">
        <div className="h-5 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
        <div className="h-10 bg-gray-100 dark:bg-slate-700/60 rounded-xl" />
      </div>
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 p-6 space-y-4">
        <div className="h-5 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
        <div className="h-24 bg-gray-100 dark:bg-slate-700/60 rounded-xl" />
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}
