'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import SelectDropdown from '@/components/ui/SelectDropdown'

const EXPIRY_DAYS = 30

type Props = {
  barangay: string
  setBarangay: (value: string) => void
  quantity: string
  setQuantity: (value: string) => void
  expirationLabel: string
  activeUnusedLabel: string
  quantityError: string
  canSubmit: boolean
  isLoading: boolean
  hasGeneratedBatch: boolean
  onOpenConfirm: () => void
  confirmOpen: boolean
  onCloseConfirm: () => void
  onConfirmGenerate: () => void
  barangayOptions: readonly string[]
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  )
}

function GenerateConfirmModal({
  open,
  barangay,
  quantity,
  expirationLabel,
  onCancel,
  onConfirm,
  isLoading,
}: {
  open: boolean
  barangay: string
  quantity: string
  expirationLabel: string
  onCancel: () => void
  onConfirm: () => void
  isLoading: boolean
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return

    const previousActive = document.activeElement as HTMLElement | null
    cancelBtnRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onCancel()
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable.length) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousActive?.focus()
    }
  }, [open, onCancel, isLoading])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-hidden={!open}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={isLoading ? undefined : onCancel} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-confirm-title"
        aria-describedby="generate-confirm-desc"
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 id="generate-confirm-title" className="text-lg font-semibold text-slate-900">
          Confirm Code Generation
        </h2>
        <div id="generate-confirm-desc" className="mt-4 space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-900">Barangay:</span> {barangay || 'Not selected'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Quantity:</span> {quantity || '0'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Expiration:</span> Codes expire in {EXPIRY_DAYS} days and can only be
            used once.
          </p>
          <p>
            <span className="font-medium text-slate-900">Expiration date:</span> {expirationLabel}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Spinner /> : null}
            Confirm Generate
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CodeGenerationForm({
  barangay,
  setBarangay,
  quantity,
  setQuantity,
  expirationLabel,
  activeUnusedLabel,
  quantityError,
  canSubmit,
  isLoading,
  hasGeneratedBatch,
  onOpenConfirm,
  confirmOpen,
  onCloseConfirm,
  onConfirmGenerate,
  barangayOptions,
}: Props) {
  const expirationLine = useMemo(
    () => `Expires in ${EXPIRY_DAYS} days • Expiration date: ${expirationLabel}`,
    [expirationLabel]
  )
  const barangayDropdownOptions = useMemo(
    () => [
      { value: '', label: 'Select barangay' },
      ...barangayOptions.map((option) => ({ value: option, label: option })),
    ],
    [barangayOptions]
  )

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div>
          <label htmlFor="code-generation-barangay" className="mb-2 block text-sm font-medium text-slate-700">
            Barangay
          </label>
          <SelectDropdown
            id="code-generation-barangay"
            value={barangay}
            onChange={setBarangay}
            options={barangayDropdownOptions}
            ariaLabel="Select barangay"
          />
          <p className="mt-2 text-xs text-slate-600">{activeUnusedLabel}</p>
        </div>

        <div>
          <label htmlFor="code-generation-quantity" className="mb-2 block text-sm font-medium text-slate-700">
            Quantity
          </label>
          <input
            id="code-generation-quantity"
            type="number"
            min={1}
            max={100}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            aria-invalid={Boolean(quantityError)}
            aria-describedby="code-generation-quantity-help code-generation-quantity-error"
          />
          <p id="code-generation-quantity-help" className="mt-1 text-xs text-slate-500">
            1-100
          </p>
          {quantityError ? (
            <p id="code-generation-quantity-error" className="mt-1 text-xs text-red-600" role="alert">
              {quantityError}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-slate-600">{expirationLine}</p>
        </div>

        <div className="flex flex-col justify-end gap-3">
          {hasGeneratedBatch ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Generating again will create NEW codes. Previously generated codes will remain valid unless revoked.
            </div>
          ) : null}

          <button
            type="button"
            onClick={onOpenConfirm}
            disabled={!canSubmit || isLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Generate codes"
          >
            {isLoading ? <Spinner /> : null}
            {isLoading ? 'Generating...' : 'Generate Codes'}
          </button>
        </div>
      </div>

      <GenerateConfirmModal
        open={confirmOpen}
        barangay={barangay}
        quantity={quantity}
        expirationLabel={expirationLabel}
        onCancel={onCloseConfirm}
        onConfirm={onConfirmGenerate}
        isLoading={isLoading}
      />
    </section>
  )
}

