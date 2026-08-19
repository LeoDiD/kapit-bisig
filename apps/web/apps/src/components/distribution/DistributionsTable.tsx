'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import DistributionDetailsModal from './DistributionDetailsModal'
import ViewHouseholdsModal from './ViewHouseholdsModal'

export type DistributionStatus = 'Unclaimed' | 'Partially Claimed' | 'Claimed'
export type DistributionLifecycleStatus = 'Upcoming' | 'Active' | 'Completed' | 'Archived'

export type DistributionRow = {
  id: string
  barangay: string
  assignedBarangays: string[]
  scheduled: string
  endsAt: string | null
  households: number
  registeredHouseholds: number
  claimedHouseholds: number
  notes?: string
  requiresBeneficiaryApproval?: boolean
  status: DistributionStatus
  claimedAt: string | null
  createdAt: string
  archivedAt: string | null
  archivedBy: string | null
  lifecycleStatus: DistributionLifecycleStatus
}

type BarangayFilter = 'All' | string
type StatusFilter = 'All' | DistributionStatus

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'All', label: 'All Status' },
  { value: 'Claimed', label: 'Claimed' },
  { value: 'Partially Claimed', label: 'Partially Claimed' },
  { value: 'Unclaimed', label: 'Unclaimed' },
]

export default function DistributionsTable({
  rows,
  onOpenCreate,
  onMarkClaimed,
  canCreate = true,
  lifecycleView,
  canManageLifecycle = false,
  onArchive,
  onRestore,
}: {
  rows: DistributionRow[]
  onOpenCreate: () => void
  onMarkClaimed: (id: string) => void
  canCreate?: boolean
  lifecycleView: 'upcoming' | 'active' | 'completed' | 'archived'
  canManageLifecycle?: boolean
  onArchive?: (id: string) => void
  onRestore?: (id: string) => void
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

  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; opensUp: boolean } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [selectedDistribution, setSelectedDistribution] = useState<DistributionRow | null>(null)
  const [householdsDistribution, setHouseholdsDistribution] = useState<DistributionRow | null>(null)

  const barangayOptions = useMemo(() => {
    const unique = Array.from(new Set(rows.map((r) => r.barangay))).sort()
    return [{ value: 'All', label: 'All Barangays' }, ...unique.map((b) => ({ value: b, label: b }))]
  }, [rows])

  const closeRowMenu = useCallback(() => {
    setActiveMenu(null)
    setMenuPos(null)
  }, [])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      const inBrgyBtn = barangayBtnRef.current?.contains(target)
      const inBrgyMenu = barangayMenuRef.current?.contains(target)
      if (!inBrgyBtn && !inBrgyMenu) setBarangayOpen(false)

      const inStatusBtn = statusBtnRef.current?.contains(target)
      const inStatusMenu = statusMenuRef.current?.contains(target)
      if (!inStatusBtn && !inStatusMenu) setStatusOpen(false)

      const inRowMenuBtn = target.closest('[data-row-menu]')
      const inPortalMenu = menuRef.current?.contains(target)
      if (!inRowMenuBtn && !inPortalMenu) closeRowMenu()
    }

    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [closeRowMenu])

  useEffect(() => {
    if (!activeMenu) return
    const close = () => closeRowMenu()
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [activeMenu, closeRowMenu])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return rows.filter((r) => {
      const matchesQuery = !q || r.barangay.toLowerCase().includes(q)
      const matchesBarangay = barangay === 'All' || r.barangay === barangay
      const matchesStatus = status === 'All' || r.status === status
      return matchesQuery && matchesBarangay && matchesStatus
    })
  }, [rows, query, barangay, status])

  const toggleRowMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (activeMenu === id) {
      closeRowMenu()
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const opensUp = spaceBelow < 200

    setMenuPos({
      top: opensUp ? rect.top : rect.bottom + 8,
      left: rect.right - 224,
      opensUp,
    })
    setActiveMenu(id)
    setBarangayOpen(false)
    setStatusOpen(false)
  }

  const barangayLabel = barangay === 'All' ? 'All Barangays' : barangay
  const statusLabel = status === 'All' ? 'All Status' : status

  return (
    <>
      <DistributionDetailsModal
        open={selectedDistribution !== null}
        onClose={() => setSelectedDistribution(null)}
        distribution={selectedDistribution}
        onMarkClaimed={onMarkClaimed}
      />

      <ViewHouseholdsModal
        open={householdsDistribution !== null}
        onClose={() => setHouseholdsDistribution(null)}
        distribution={householdsDistribution}
      />

      <div className="mb-12 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Distribution Directory</p>
              <h3 className="mt-2 text-xl font-bold tracking-[-0.03em] text-slate-950">
                {lifecycleView === 'archived' ? 'Archived distribution history' : `${lifecycleView.charAt(0).toUpperCase()}${lifecycleView.slice(1)} distributions`}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {filtered.length} visible distribution{filtered.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {barangay !== 'All' ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  Barangay: {barangayLabel}
                </span>
              ) : null}
              {status !== 'All' ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  Status: {statusLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search distributions..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition-colors focus:border-slate-400 focus:bg-white focus:ring-0"
              />
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
              <div className="relative min-w-[180px]">
                <button
                  ref={barangayBtnRef}
                  type="button"
                  onClick={() => {
                    setBarangayOpen((v) => !v)
                    setStatusOpen(false)
                    setActiveMenu(null)
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white"
                >
                  <span className="truncate">{barangayLabel}</span>
                  <ChevronDownIcon />
                </button>
                {barangayOpen ? (
                  <DropdownMenu
                    menuRef={barangayMenuRef}
                    items={barangayOptions}
                    selected={barangay}
                    onSelect={(value) => {
                      setBarangay(value)
                      setBarangayOpen(false)
                    }}
                  />
                ) : null}
              </div>

              <div className="relative min-w-[150px]">
                <button
                  ref={statusBtnRef}
                  type="button"
                  onClick={() => {
                    setStatusOpen((v) => !v)
                    setBarangayOpen(false)
                    setActiveMenu(null)
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white"
                >
                  <span className="truncate">{statusLabel}</span>
                  <ChevronDownIcon />
                </button>
                {statusOpen ? (
                  <DropdownMenu
                    menuRef={statusMenuRef}
                    items={statusOptions}
                    selected={status}
                    onSelect={(value) => {
                      setStatus(value)
                      setStatusOpen(false)
                    }}
                  />
                ) : null}
              </div>

              {canCreate ? (
                <button
                  type="button"
                  onClick={onOpenCreate}
                  className="ml-1 inline-flex items-center justify-center whitespace-nowrap gap-2 rounded-xl bg-[#0F533A] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0b412d]"
                >
                  + New Distribution
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Barangay</th>
                <th className="px-6 py-4">Registered Households</th>
                <th className="px-6 py-4">Claims</th>
                <th className="px-6 py-4">Scheduled For</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4">Claimed / Archived</th>
                <th className="px-6 py-4 text-right pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length ? (
                filtered.map((row) => (
                  <tr key={row.id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                          {row.barangay.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{row.barangay}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <UsersMiniIcon />
                        {row.registeredHouseholds > 0 ? row.registeredHouseholds : '--'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {row.claimedHouseholds > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            <CheckMiniIcon />
                            {row.claimedHouseholds}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-slate-400">0</span>
                        )}
                        {row.registeredHouseholds > 0 ? (
                          <span className="text-[11px] font-bold text-slate-400">/ {row.registeredHouseholds}</span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      <div>{new Date(row.scheduled).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                      {row.endsAt ? (
                        <div className="mt-1 text-xs font-normal text-slate-400">
                          Ends {new Date(row.endsAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <LifecyclePill status={row.lifecycleStatus} />
                        <div><StatusPill status={row.status} /></div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {row.archivedAt
                        ? <>
                            <div>{new Date(row.archivedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                            <div className="mt-1 text-xs text-slate-400">Archived by {row.archivedBy || 'Super admin'}</div>
                          </>
                        : row.claimedAt
                        ? new Date(row.claimedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '--'}
                    </td>

                    <td className="px-6 py-4 text-right pr-6">
                      <div className="inline-block" data-row-menu>
                        <button
                          onClick={(e) => toggleRowMenu(row.id, e)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                        >
                          Manage <ChevronDownIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="font-medium text-slate-500">No distributions found matching your filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeMenu && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                top: menuPos.opensUp ? undefined : menuPos.top,
                bottom: menuPos.opensUp ? window.innerHeight - menuPos.top + 8 : undefined,
                left: menuPos.left,
              }}
              className="z-[9999] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
            >
              <div className="py-2">
                {(() => {
                  const row = filtered.find((item) => item.id === activeMenu)
                  if (!row) return null

                  return (
                    <>
                      <MenuItem
                        icon={<EyeIcon />}
                        label="View Details"
                        onClick={() => {
                          setSelectedDistribution(row)
                          closeRowMenu()
                        }}
                      />
                      <MenuItem icon={<QrIcon />} label="Show QR Code" onClick={closeRowMenu} />
                      <MenuItem
                        icon={<HouseholdsIcon />}
                        label="View Households"
                        onClick={() => {
                          setHouseholdsDistribution(row)
                          closeRowMenu()
                        }}
                      />
                      {row.status !== 'Claimed' && row.lifecycleStatus === 'Active' ? (
                        <MenuItem
                          icon={<CheckGreenIcon />}
                          label="Mark as claimed"
                          tone="success"
                          onClick={() => {
                            onMarkClaimed(row.id)
                            closeRowMenu()
                          }}
                        />
                      ) : null}
                      {canManageLifecycle && row.lifecycleStatus === 'Completed' && onArchive ? (
                        <MenuItem
                          icon={<ArchiveIcon />}
                          label="Archive"
                          onClick={() => {
                            onArchive(row.id)
                            closeRowMenu()
                          }}
                        />
                      ) : null}
                      {canManageLifecycle && row.lifecycleStatus === 'Archived' && onRestore ? (
                        <MenuItem
                          icon={<RestoreIcon />}
                          label="Restore"
                          onClick={() => {
                            onRestore(row.id)
                            closeRowMenu()
                          }}
                        />
                      ) : null}
                    </>
                  )
                })()}
              </div>
            </div>,
            document.body,
          )
        : null}
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
  onSelect: (value: any) => void
}) {
  return (
    <div
      ref={menuRef}
      className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
    >
      {items.map((option) => {
        const isSelected = option.value === selected
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={[
              'w-full rounded-xl px-4 py-2.5 text-left text-sm transition-colors',
              isSelected ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50',
            ].join(' ')}
          >
            <span className="flex items-center gap-2">
              <span className="flex w-5 items-center justify-center">{isSelected ? <CheckIcon /> : null}</span>
              <span className="truncate">{option.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function StatusPill({ status }: { status: DistributionStatus }) {
  const classes =
    status === 'Claimed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'Partially Claimed'
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : 'border-amber-200 bg-amber-50 text-amber-700'

  const dotClass =
    status === 'Claimed'
      ? 'bg-emerald-500'
      : status === 'Partially Claimed'
        ? 'bg-blue-500'
        : 'bg-amber-500'

  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${classes}`}>
      <span className={`mr-2 h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {status}
    </span>
  )
}

function LifecyclePill({ status }: { status: DistributionLifecycleStatus }) {
  const classes = status === 'Active'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : status === 'Upcoming'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : status === 'Archived'
        ? 'border-slate-300 bg-slate-100 text-slate-600'
        : 'border-violet-200 bg-violet-50 text-violet-700'
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${classes}`}>{status}</span>
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
  const classes = tone === 'success' ? 'text-green-600 hover:bg-green-50' : 'text-slate-700 hover:bg-slate-50'
  const iconClass = tone === 'success' ? 'text-green-600' : 'text-slate-500'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${classes}`}
    >
      <span className={iconClass}>{icon}</span>
      {label}
    </button>
  )
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function UsersMiniIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function QrIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14h1v1h-1v-1zM16 16h1v1h-1v-1zM18 14h-1v1h1v3h-3v-1h-1v-3h2" />
    </svg>
  )
}

function CheckGreenIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CheckMiniIcon() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function HouseholdsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14v11H5V8zm-1-4h16v4H4V4zm5 8h6" />
    </svg>
  )
}

function RestoreIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12a9 9 0 109-9 9.2 9.2 0 00-6.4 2.6L3 8m0-5v5h5" />
    </svg>
  )
}
