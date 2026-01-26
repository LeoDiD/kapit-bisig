'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { DistributionItem } from './DistributionsTable'

export type CreateDistributionPayload = {
  barangay: string
  items: DistributionItem[]
  scheduled: string
  households: number
  notes?: string
}

const itemOptions: { name: string; defaultQty: number }[] = [
  { name: 'Rice (5kg)', defaultQty: 80 },
  { name: 'Canned Goods', defaultQty: 150 },
  { name: 'Bottled Water', defaultQty: 240 },
  { name: 'Medicine Kit', defaultQty: 40 },
]

export default function NewDistributionModal({
  open,
  onClose,
  onCreate,
  barangayOptions,
}: {
  open: boolean
  onClose: () => void
  onCreate: (payload: CreateDistributionPayload) => void
  barangayOptions: string[]
}) {
  const [barangay, setBarangay] = useState('')
  const [barangayOpen, setBarangayOpen] = useState(false)

  const [itemsOpen, setItemsOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})

  const [scheduled, setScheduled] = useState('')
  const [notes, setNotes] = useState('')
  const [households, setHouseholds] = useState(40)

  const barangayBtnRef = useRef<HTMLButtonElement>(null)
  const barangayMenuRef = useRef<HTMLDivElement>(null)
  const itemsBtnRef = useRef<HTMLButtonElement>(null)
  const itemsMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setBarangay('')
    setBarangayOpen(false)
    setItemsOpen(false)
    setSelectedItems({})
    setScheduled('')
    setNotes('')
    setHouseholds(40)
  }, [open])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node

      const inBrgyBtn = barangayBtnRef.current?.contains(t)
      const inBrgyMenu = barangayMenuRef.current?.contains(t)
      if (!inBrgyBtn && !inBrgyMenu) setBarangayOpen(false)

      const inItemsBtn = itemsBtnRef.current?.contains(t)
      const inItemsMenu = itemsMenuRef.current?.contains(t)
      if (!inItemsBtn && !inItemsMenu) setItemsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const chosenItems = useMemo(() => {
    return itemOptions
      .filter((o) => selectedItems[o.name])
      .map((o) => ({ name: o.name, qty: o.defaultQty }))
  }, [selectedItems])

  const itemsLabel = useMemo(() => {
    if (!chosenItems.length) return 'Select items to distribute'
    if (chosenItems.length === 1) return chosenItems[0].name
    return `${chosenItems.length} items selected`
  }, [chosenItems])

  const canCreate =
    barangay.trim().length > 0 &&
    chosenItems.length > 0 &&
    scheduled.trim().length > 0

  if (!open) return null

  const doCreate = () => {
    if (!canCreate) return
    onCreate({
      barangay,
      items: chosenItems,
      scheduled,
      households,
      notes: notes.trim() ? notes.trim() : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="min-h-full px-4 py-10 flex items-start justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col max-h-[calc(100vh-5rem)]">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-white shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Create Barangay Distribution
                </div>
                <div className="text-sm text-gray-500">
                  Schedule a relief distribution for a barangay
                </div>
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
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Barangay */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Barangay
              </label>

              <div className="relative">
                <button
                  ref={barangayBtnRef}
                  type="button"
                  onClick={() => {
                    setBarangayOpen((v) => !v)
                    setItemsOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
                >
                  <span className={`text-sm ${barangay ? 'text-gray-700' : 'text-gray-400'}`}>
                    {barangay || 'Choose a barangay'}
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
                            setBarangayOpen(false)
                          }}
                          className={[
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                            selected ? 'bg-[#EAB308] text-gray-900' : 'text-gray-700 hover:bg-gray-50',
                          ].join(' ')}
                        >
                          <span className="w-5 flex items-center justify-center">
                            {selected ? <CheckIcon /> : null}
                          </span>
                          {b}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Items */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Relief Items
              </label>

              <div className="relative">
                <button
                  ref={itemsBtnRef}
                  type="button"
                  onClick={() => {
                    setItemsOpen((v) => !v)
                    setBarangayOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
                >
                  <span className={`text-sm ${chosenItems.length ? 'text-gray-700' : 'text-gray-400'}`}>
                    {itemsLabel}
                  </span>
                  <ChevronDownIcon />
                </button>

                {itemsOpen ? (
                  <div
                    ref={itemsMenuRef}
                    className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-2 z-50"
                  >
                    {itemOptions.map((opt) => {
                      const checked = !!selectedItems[opt.name]
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() =>
                            setSelectedItems((prev) => ({
                              ...prev,
                              [opt.name]: !checked,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between text-sm text-gray-700"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={[
                                'w-4 h-4 rounded border flex items-center justify-center',
                                checked ? 'bg-[#0F533A] border-[#0F533A]' : 'border-gray-300 bg-white',
                              ].join(' ')}
                            >
                              {checked ? <MiniCheckWhite /> : null}
                            </span>
                            {opt.name}
                          </span>
                          <span className="text-xs text-gray-400">x{opt.defaultQty}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Scheduled Date
              </label>
              <div className="relative">
                <input
                  value={scheduled}
                  onChange={(e) => setScheduled(e.target.value)}
                  placeholder="dd/mm/yy"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CalendarIcon />
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add distribution notes..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Footer buttons */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={doCreate}
                disabled={!canCreate}
                className={[
                  'px-6 py-2.5 rounded-xl text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)]',
                  canCreate
                    ? 'bg-[#0F533A] hover:bg-[#0a3f2c] text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed',
                ].join(' ')}
              >
                Create Distribution
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Icons */
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
function MiniCheckWhite() {
  return (
    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
    </svg>
  )
}
