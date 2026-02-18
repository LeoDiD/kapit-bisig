'use client'

import React, { useEffect, useRef, useState } from 'react'
import HouseholdProfileModal from './HouseholdProfileModal'
import type { HouseholdRow } from '@/app/households/page'

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface HouseholdsTableProps {
  rows: HouseholdRow[]
  loading: boolean
  error: string | null
  hasAnyRows: boolean
  onRetry: () => void
  searchQuery: string
  onSearchChange: (v: string) => void
  barangay: string
  barangayOptions: string[]
  onBarangayChange: (v: string) => void
  status: string
  statusOptions: string[]
  onStatusChange: (v: string) => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HouseholdsTable({
  rows,
  loading,
  error,
  hasAnyRows,
  onRetry,
  searchQuery,
  onSearchChange,
  barangay,
  barangayOptions,
  onBarangayChange,
  status,
  statusOptions,
  onStatusChange,
}: HouseholdsTableProps) {
  // Row menu (3 dots)
  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const rowMenuRef = useRef<HTMLDivElement>(null)

  // Modal
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Dropdowns
  const [barangayOpen, setBarangayOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const barangayBtnRef = useRef<HTMLButtonElement>(null)
  const barangayMenuRef = useRef<HTMLDivElement>(null)
  const statusBtnRef = useRef<HTMLButtonElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const t = event.target as Node
      if (rowMenuRef.current && !rowMenuRef.current.contains(t)) setActiveRowMenu(null)
      if (!barangayBtnRef.current?.contains(t) && !barangayMenuRef.current?.contains(t)) setBarangayOpen(false)
      if (!statusBtnRef.current?.contains(t) && !statusMenuRef.current?.contains(t)) setStatusOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleRowMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (activeRowMenu === id) {
      setActiveRowMenu(null)
      setDropdownPosition(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const menuHeight = 140
    const menuWidth = 224
    const shouldOpenUp = spaceBelow < menuHeight && rect.top >= menuHeight
    setDropdownPosition({
      top: shouldOpenUp ? rect.top - menuHeight : rect.bottom + 8,
      left: rect.right - menuWidth,
    })
    setActiveRowMenu(id)
    setBarangayOpen(false)
    setStatusOpen(false)
  }

  const handleViewProfile = (household: HouseholdRow) => {
    setSelectedHousehold(household)
    setIsModalOpen(true)
    setActiveRowMenu(null)
  }

  /* ── Format helpers ── */
  function formatDate(iso: string | null): { line1: string; line2: string } {
    if (!iso) return { line1: '—', line2: '' }
    const d = new Date(iso)
    const month = d.toLocaleDateString('en-US', { month: 'long' })
    const day = d.getDate()
    const year = d.getFullYear()
    return { line1: `${month} ${day},`, line2: String(year) }
  }

  return (
    <>
      {/* Search + Filter Dropdowns */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4 items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search households..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* Barangay Dropdown */}
        <div className="relative min-w-[200px]">
          <button
            ref={barangayBtnRef}
            type="button"
            onClick={() => { setBarangayOpen((v) => !v); setStatusOpen(false); setActiveRowMenu(null) }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
          >
            <span className="text-sm">{barangay}</span>
            <ChevronDownIcon />
          </button>
          {barangayOpen && (
            <DropdownMenu
              menuRef={barangayMenuRef}
              items={barangayOptions.map((v) => ({ value: v, label: v }))}
              selected={barangay}
              onSelect={(v) => { onBarangayChange(v); setBarangayOpen(false) }}
            />
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative min-w-[170px]">
          <button
            ref={statusBtnRef}
            type="button"
            onClick={() => { setStatusOpen((v) => !v); setBarangayOpen(false); setActiveRowMenu(null) }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
          >
            <span className="text-sm">{status}</span>
            <ChevronDownIcon />
          </button>
          {statusOpen && (
            <DropdownMenu
              menuRef={statusMenuRef}
              items={statusOptions.map((v) => ({ value: v, label: v }))}
              selected={status}
              onSelect={(v) => { onStatusChange(v); setStatusOpen(false) }}
            />
          )}
        </div>
      </div>

      {/* ── States ── */}
      {loading ? (
        /* Skeleton rows */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-5 animate-pulse">
                <div className="h-4 w-36 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-12 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="flex-1" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        /* Error state */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <ExclamationIcon className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-sm text-gray-700 font-medium">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-sm text-green-700 hover:underline font-medium"
          >
            Retry
          </button>
        </div>
      ) : !hasAnyRows ? (
        /* Global empty state */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <UsersEmptyIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-700 font-medium">No registered households yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Households will appear here once residents complete registration.
          </p>
        </div>
      ) : (
        /* Table */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse table-fixed min-w-[900px] lg:min-w-0">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="px-4 py-4 font-medium w-[22%]">Family Head</th>
                  <th className="px-4 py-4 font-medium w-[15%]">Barangay</th>
                  <th className="px-4 py-4 font-medium w-[10%] leading-tight">
                    Family<br />Members
                  </th>
                  <th className="px-4 py-4 font-medium w-[13%]">Verification</th>
                  <th className="px-4 py-4 font-medium w-[12%]">Status</th>
                  <th className="px-4 py-4 font-medium w-[14%] leading-tight">
                    Last<br />Claimed
                  </th>
                  <th className="px-4 py-4 font-medium w-[6%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {rows.length > 0 ? (
                  rows.map((item) => {
                    const claimed = formatDate(item.lastClaimedAt)
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 relative">
                        <td className="px-4 py-4 whitespace-normal break-words">
                          <div>
                            <p className="font-medium text-gray-800">{item.familyHeadName}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <LocationIcon />
                              <span className="truncate">{item.address}</span>
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600 whitespace-normal break-words">
                          {item.barangay}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <UsersMiniIcon />
                            {item.familyMembersCount}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600 text-xs">
                          {item.verificationStatus}
                        </td>
                        <td className="px-4 py-4">
                          <ClaimStatusBadge status={item.claimStatus} />
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {claimed.line1}
                          {claimed.line2 && <p className="text-sm text-gray-500">{claimed.line2}</p>}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={(e) => toggleRowMenu(item.id, e)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <DotsIcon />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No households found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fixed-position row context menu */}
      {activeRowMenu !== null && dropdownPosition && (
        <div
          ref={rowMenuRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
          className="w-56 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-200 overflow-hidden"
        >
          <div className="py-2 flex flex-col">
            {rows.find((h) => h.id === activeRowMenu) && (
              <MenuItem
                icon={<EyeIcon />}
                label="View Profile"
                onClick={() => {
                  const household = rows.find((h) => h.id === activeRowMenu)
                  if (household) handleViewProfile(household)
                }}
              />
            )}
          </div>
        </div>
      )}

      <HouseholdProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedHousehold}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Dropdown menu                                                      */
/* ------------------------------------------------------------------ */

function DropdownMenu({
  menuRef,
  items,
  selected,
  onSelect,
}: {
  menuRef: React.RefObject<HTMLDivElement>
  items: { value: string; label: string }[]
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <div
      ref={menuRef}
      className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1 z-50 max-h-64 overflow-y-auto"
    >
      {items.map((opt) => {
        const isSelected = opt.value === selected
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={[
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
              isSelected ? 'bg-[#EAB308] text-gray-900' : 'text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            <span className="w-5 flex items-center justify-center">
              {isSelected ? <CheckIcon /> : null}
            </span>
            <span className="truncate">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors text-gray-700 hover:bg-gray-50"
    >
      <span className="text-gray-500">{icon}</span>
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Badges                                                             */
/* ------------------------------------------------------------------ */

function ClaimStatusBadge({ status }: { status: 'Claimed' | 'Not Claimed' }) {
  const style = status === 'Claimed' ? 'bg-green-600 text-white' : 'bg-[#EAB308] text-white'
  return (
    <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function LocationIcon() {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function UsersMiniIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function DotsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  )
}
function UsersEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
