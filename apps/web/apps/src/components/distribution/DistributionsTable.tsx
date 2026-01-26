'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DistributionDetailsModal from './DistributionDetailsModal'

export type DistributionStatus = 'Unclaimed' | 'Claimed'
export type DistributionItem = { name: string; qty: number }

export type DistributionRow = {
  id: number
  barangay: string
  items: DistributionItem[]
  served: number
  households: number
  scheduled: string
  status: DistributionStatus
  claimedAt: string | null
}

type BarangayFilter = 'All' | string
type StatusFilter = 'All' | DistributionStatus

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'All', label: 'All Status' },
  { value: 'Claimed', label: 'Claimed' },
  { value: 'Unclaimed', label: 'Unclaimed' },
]

export default function DistributionsTable({
  rows,
  onOpenCreate,
  onMarkClaimed,
}: {
  rows: DistributionRow[]
  onOpenCreate: () => void
  onMarkClaimed: (id: number) => void
}) {
  const [query, setQuery] = useState('')
  const [barangay, setBarangay] = useState<BarangayFilter>('All')
  const [status, setStatus] = useState<StatusFilter>('All')

  const [barangayOpen, setBarangayOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  const barangayBtnRef = useRef<HTMLButtonElement>(null)
  const barangayMenuRef = useRef<HTMLDivElement>(null)
  const statusBtnRef = useRef<HTMLButtonElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  // 3-dots menu
  const [activeMenu, setActiveMenu] = useState<number | null>(null)
  const [menuOpensUp, setMenuOpensUp] = useState(false)

  // Details modal
  const [selectedDistribution, setSelectedDistribution] = useState<DistributionRow | null>(null)

  const barangayOptions = useMemo(() => {
    const unique = Array.from(new Set(rows.map((r) => r.barangay))).sort()
    return [{ value: 'All', label: 'All Barangays' }, ...unique.map((b) => ({ value: b, label: b }))]
  }, [rows])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement

      // close dropdowns
      const inBrgyBtn = barangayBtnRef.current?.contains(t)
      const inBrgyMenu = barangayMenuRef.current?.contains(t)
      if (!inBrgyBtn && !inBrgyMenu) setBarangayOpen(false)

      const inStatusBtn = statusBtnRef.current?.contains(t)
      const inStatusMenu = statusMenuRef.current?.contains(t)
      if (!inStatusBtn && !inStatusMenu) setStatusOpen(false)

      // close row menu - check if click is inside any row menu
      const inRowMenu = t.closest('[data-row-menu]')
      if (!inRowMenu) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        r.barangay.toLowerCase().includes(q) ||
        r.items.some((it) => it.name.toLowerCase().includes(q))

      const matchesBarangay = barangay === 'All' || r.barangay === barangay
      const matchesStatus = status === 'All' || r.status === status

      return matchesQuery && matchesBarangay && matchesStatus
    })
  }, [rows, query, barangay, status])

  const toggleRowMenu = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (activeMenu === id) {
      setActiveMenu(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    setMenuOpensUp(spaceBelow < 150)
    setActiveMenu(id)

    setBarangayOpen(false)
    setStatusOpen(false)
  }

  const barangayLabel =
    barangay === 'All' ? 'All Barangays' : barangay

  const statusLabel =
    status === 'All' ? 'All Status' : status

  return (
    <>
      {/* Details Modal */}
      <DistributionDetailsModal
        open={selectedDistribution !== null}
        onClose={() => setSelectedDistribution(null)}
        distribution={selectedDistribution}
        onMarkClaimed={onMarkClaimed}
      />

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-5 items-stretch lg:items-center">
        <div className="relative flex-1 max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search distributions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-800 placeholder-gray-400"
          />
        </div>

        <div className="relative min-w-[200px]">
          <button
            ref={barangayBtnRef}
            type="button"
            onClick={() => {
              setBarangayOpen((v) => !v)
              setStatusOpen(false)
              setActiveMenu(null)
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
          >
            <span className="text-sm">{barangayLabel}</span>
            <ChevronDownIcon />
          </button>

          {barangayOpen ? (
            <DropdownMenu
              menuRef={barangayMenuRef}
              items={barangayOptions}
              selected={barangay}
              onSelect={(v) => {
                setBarangay(v)
                setBarangayOpen(false)
              }}
            />
          ) : null}
        </div>

        <div className="relative min-w-[170px]">
          <button
            ref={statusBtnRef}
            type="button"
            onClick={() => {
              setStatusOpen((v) => !v)
              setBarangayOpen(false)
              setActiveMenu(null)
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
          >
            <span className="text-sm">{statusLabel}</span>
            <ChevronDownIcon />
          </button>

          {statusOpen ? (
            <DropdownMenu
              menuRef={statusMenuRef}
              items={statusOptions}
              selected={status}
              onSelect={(v) => {
                setStatus(v)
                setStatusOpen(false)
              }}
            />
          ) : null}
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F533A] hover:bg-[#0a3f2c] text-white text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)]"
        >
          + New Distribution
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-fixed min-w-[980px] lg:min-w-0">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="px-4 py-4 font-medium w-[16%]">Barangay</th>
                <th className="px-4 py-4 font-medium w-[22%]">Items</th>
                <th className="px-4 py-4 font-medium w-[14%]">Households</th>
                <th className="px-4 py-4 font-medium w-[14%]">Scheduled</th>
                <th className="px-4 py-4 font-medium w-[12%]">Status</th>
                <th className="px-4 py-4 font-medium w-[16%]">Claimed At</th>
                <th className="px-4 py-4 font-medium w-[6%]"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.length ? (
                filtered.map((r) => {
                  const complete = r.served >= r.households && r.households > 0
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <PinMiniIcon />
                          <div className="leading-tight">
                            <div className="text-xs text-gray-400">Barangay</div>
                            <div className="font-medium">{r.barangay.replace('Brgy. ', 'San ')?.includes('San ') ? r.barangay : r.barangay}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          {r.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="inline-flex w-fit px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-700"
                            >
                              {it.name} x{it.qty}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <UsersMiniIcon />
                          <span className="font-medium">{r.served}/{r.households}</span>
                          {complete ? (
                            <span className="ml-1 inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium bg-green-600 text-white">
                              Complete
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-600">{r.scheduled}</td>

                      <td className="px-4 py-4">
                        <StatusPill status={r.status} />
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {r.claimedAt ?? '-'}
                      </td>

                      <td className="px-4 py-4 text-right relative">
                        <div className="relative inline-block" data-row-menu>
                          <button
                            onClick={(e) => toggleRowMenu(r.id, e)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <DotsIcon />
                          </button>

                          {activeMenu === r.id ? (
                            <div
                              className={[
                                'absolute right-0 w-56 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-200 z-50 overflow-hidden',
                                menuOpensUp ? 'bottom-full mb-2' : 'top-full mt-2',
                              ].join(' ')}
                            >
                              <div className="py-2">
                                <MenuItem icon={<EyeIcon />} label="View Details" onClick={() => {
                                  setSelectedDistribution(r)
                                  setActiveMenu(null)
                                }} />
                                <MenuItem icon={<QrIcon />} label="Show QR Code" onClick={() => setActiveMenu(null)} />
                                {r.status === 'Unclaimed' ? (
                                  <MenuItem
                                    icon={<CheckGreenIcon />}
                                    label="Mark as claimed"
                                    tone="success"
                                    onClick={() => {
                                      onMarkClaimed(r.id)
                                      setActiveMenu(null)
                                    }}
                                  />
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No distributions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/* ----- UI helpers ----- */

function DropdownMenu({
  menuRef,
  items,
  selected,
  onSelect,
}: {
  menuRef: React.RefObject<HTMLDivElement>
  items: { value: string; label: string }[]
  selected: string
  onSelect: (value: any) => void
}) {
  return (
    <div
      ref={menuRef}
      className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1 z-50"
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

function StatusPill({ status }: { status: DistributionStatus }) {
  const cls =
    status === 'Claimed'
      ? 'bg-green-600 text-white'
      : 'bg-[#EAB308] text-white'

  return (
    <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone?: 'default' | 'success'
}) {
  const cls =
    tone === 'success'
      ? 'text-green-600 hover:bg-green-50'
      : 'text-gray-700 hover:bg-gray-50'

  const iconCls =
    tone === 'success' ? 'text-green-600' : 'text-gray-500'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${cls}`}
    >
      <span className={iconCls}>{icon}</span>
      {label}
    </button>
  )
}

/* ----- Icons ----- */

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
function DotsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
    </svg>
  )
}
function UsersMiniIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function PinMiniIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
function QrIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14h1v1h-1v-1zM16 16h1v1h-1v-1zM18 14h-1v1h1v3h-3v-1h-1v-3h2" />
    </svg>
  )
}
function CheckGreenIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
