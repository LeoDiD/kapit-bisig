'use client'

import React, { useEffect, useRef, useState } from 'react'
import HouseholdProfileModal from './HouseholdProfileModal'
import type { HouseholdRow } from '@/app/households/page'

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const t = event.target as Node
      if (!barangayBtnRef.current?.contains(t) && !barangayMenuRef.current?.contains(t)) setBarangayOpen(false)
      if (!statusBtnRef.current?.contains(t) && !statusMenuRef.current?.contains(t)) setStatusOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleViewProfile = (household: HouseholdRow) => {
    setSelectedHousehold(household)
    setIsModalOpen(true)
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      {/* Table Container */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden flex flex-col mb-12">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full md:max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search households..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            {/* Barangay Filter */}
            <div className="relative min-w-[180px]">
              <button
                ref={barangayBtnRef}
                onClick={() => { setBarangayOpen(!barangayOpen); setStatusOpen(false) }}
                className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
              >
                <span className="truncate">{barangay}</span>
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

            {/* Status Filter */}
            <div className="relative min-w-[140px]">
              <button
                ref={statusBtnRef}
                onClick={() => { setStatusOpen(!statusOpen); setBarangayOpen(false) }}
                className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
              >
                <span className="truncate">{status}</span>
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
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 flex items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : error ? (
            <div className="p-16 text-center text-red-600">
               <p className="font-semibold text-lg">{error}</p>
               <button onClick={onRetry} className="mt-4 text-sm font-bold underline hover:text-red-800">Retry Fetch</button>
            </div>
          ) : !hasAnyRows || rows.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-gray-500">
               <UsersMenuIcon className="w-12 h-12 mb-4 opacity-50" />
               <p className="font-bold text-gray-900">No households found</p>
               <p className="text-sm mt-1">Try adjusting your active filters or clear them.</p>
            </div>
          ) : (
            <table className="w-full text-left min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Household & Address</th>
                  <th className="px-6 py-4 font-bold">Barangay</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Last Claimed</th>
                  <th className="px-6 py-4 font-bold">Members</th>
                  <th className="px-6 py-4 font-bold text-right pt-4 relative pr-10">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0">
                          {item.familyHeadName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.familyHeadName}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 truncate max-w-[200px]">
                            {item.householdCode ? `#${item.householdCode} · ` : ''}{item.address}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">{item.barangay}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        item.claimStatus === 'Claimed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.claimStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      {formatDate(item.lastClaimedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <UsersMenuIcon className="w-4 h-4 text-gray-400" />
                        {item.familyMembersCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      <button
                        onClick={() => handleViewProfile(item)}
                        className="inline-flex flex-shrink-0 items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-bold text-gray-700 rounded-lg bg-white hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <HouseholdProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedHousehold}
      />
    </>
  )
}

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
      className="absolute right-0 top-full mt-1.5 w-full md:w-[120%] rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg z-50 max-h-60 overflow-y-auto"
    >
      {items.map((opt) => {
        const isSelected = opt.value === selected
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'
            }`}
          >
            <span className="truncate">{opt.label}</span>
            {isSelected && <CheckIcon className="w-4 h-4" />}
          </button>
        )
      })}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function UsersMenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
