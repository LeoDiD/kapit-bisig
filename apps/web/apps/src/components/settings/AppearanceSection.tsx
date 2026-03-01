'use client'

import React, { useState, useEffect } from 'react'
import { profileApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import ConfirmModal from '@/components/ui/ConfirmModal'
import SelectDropdown from '@/components/ui/SelectDropdown'

type Theme = 'light' | 'dark' | 'system'

export default function AppearanceSection() {
  const [theme, setTheme] = useState<Theme>('light')
  const [textSize, setTextSize] = useState('medium')
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    // Load persisted theme
    const stored = localStorage.getItem('kb-theme') as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setTheme(stored)
    }
  }, [])

  const applyTheme = (t: Theme) => {
    const root = document.documentElement
    if (t === 'dark') {
      root.classList.add('dark')
    } else if (t === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    } else {
      root.classList.remove('dark')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Persist locally
      localStorage.setItem('kb-theme', theme)
      applyTheme(theme)

      // Also persist to server (best-effort)
      await profileApi.updatePreferences({ theme }).catch(() => {})

      showToast.success('Preferences saved')
    } catch {
      showToast.error('Failed to save preferences')
    } finally {
      setSaving(false)
      setConfirmOpen(false)
    }
  }

  const options: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ]
  const textSizeOptions = [
    { value: 'medium', label: 'Medium (Default)' },
    { value: 'small', label: 'Small' },
    { value: 'large', label: 'Large' },
  ]

  return (
    <div>
      {/* Theme */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800">Theme</h2>
        <p className="text-sm text-gray-500 mt-1">Choose your preferred color scheme.</p>

        <div className="flex gap-4 mt-6">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl border-2 transition-all ${
                theme === opt.value
                  ? 'border-[#0F533A] bg-[#0F533A]/5 text-[#0F533A]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Size */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
        <h2 className="text-lg font-bold text-gray-800">Accessibility</h2>
        <p className="text-sm text-gray-500 mt-1">Adjust display preferences for comfort.</p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Text Size</label>
          <SelectDropdown
            value={textSize}
            onChange={setTextSize}
            options={textSizeOptions}
            ariaLabel="Select text size"
            className="w-full max-w-xs"
            buttonClassName="py-2.5"
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end mt-8">
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0F533A] rounded-xl hover:bg-[#0a3f2c] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Spinner />}
          Save Preferences
        </button>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirm Preferences"
        body="Save these appearance preferences?"
        confirmLabel="Yes, Save"
        loading={saving}
        onConfirm={handleSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
