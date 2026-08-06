'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AddUserModal from './AddUserModal'
import { api, getScopedBarangays, StaffUser } from '@/lib/api'
import { showToast } from '@/lib/toast'
import ConfirmModal from '@/components/ui/ConfirmModal'
import SummaryMetricCard from '@/components/ui/SummaryMetricCard'
import { sanitizeAsciiText } from '@/lib/inputValidation'
import { useAuth } from '@/lib/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

type FilterStatus = 'all' | 'active' | 'pending' | 'inactive'
type FilterBarangay = string
type AccountStatus = 'active' | 'pending' | 'inactive'

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Not Active' },
]

function getAccountStatus(user: Pick<StaffUser, 'isActive' | 'lastLoginAt'>): AccountStatus {
  if (!user.isActive) return 'inactive'
  if (!user.lastLoginAt) return 'pending'
  return 'active'
}

export default function UsersTable() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const barangayOptions = useMemo(
    () => [
      { value: 'all' as const, label: 'All Barangays' },
      ...getScopedBarangays(user?.role, user?.assignedBarangays).map((b) => ({ value: b, label: b })),
    ],
    [user?.role, user?.assignedBarangays]
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterBarangay, setFilterBarangay] = useState<FilterBarangay>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const [users, setUsers] = useState<StaffUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const rowMenuRef = useRef<HTMLDivElement>(null)

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const statusButtonRef = useRef<HTMLButtonElement>(null)

  const [barangayDropdownOpen, setBarangayDropdownOpen] = useState(false)
  const barangayMenuRef = useRef<HTMLDivElement>(null)
  const barangayButtonRef = useRef<HTMLButtonElement>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params: { search?: string; status?: 'active' | 'pending' | 'inactive'; barangay?: string } = {}
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterBarangay !== 'all') params.barangay = filterBarangay
      if (searchQuery) params.search = searchQuery

      const response = await api.getStaffUsers(params)
      if (response.success && response.data) {
        setUsers(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setError('Failed to load staff users. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [filterBarangay, filterStatus, searchQuery])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    const shouldOpenAdd = searchParams.get('openAdd') === '1'
    if (!shouldOpenAdd) return
    setIsAddModalOpen(true)
    const next = new URLSearchParams(searchParams.toString())
    next.delete('openAdd')
    const query = next.toString()
    router.replace(query ? `/users?${query}` : '/users')
  }, [searchParams, router])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      if (rowMenuRef.current && !rowMenuRef.current.contains(target)) {
        setActiveDropdown(null)
      }

      const clickedStatusButton = statusButtonRef.current?.contains(target)
      const clickedStatusMenu = statusMenuRef.current?.contains(target)
      if (!clickedStatusButton && !clickedStatusMenu) {
        setStatusDropdownOpen(false)
      }

      const clickedBarangayButton = barangayButtonRef.current?.contains(target)
      const clickedBarangayMenu = barangayMenuRef.current?.contains(target)
      if (!clickedBarangayButton && !clickedBarangayMenu) {
        setBarangayDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleRowDropdown = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    if (activeDropdown === id) {
      setActiveDropdown(null)
      setDropdownPosition(null)
      return
    }

    const buttonRect = e.currentTarget.getBoundingClientRect()
    const menuWidth = 208
    setDropdownPosition({
      top: buttonRect.bottom + 8,
      left: buttonRect.right - menuWidth,
    })
    setActiveDropdown(id)
  }

  const handleUserCreated = () => {
    fetchUsers()
  }

  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    try {
      await api.updateStaffUser(userId, { isActive: !currentlyActive })
      showToast.success(currentlyActive ? 'User deactivated.' : 'User activated.')
      fetchUsers()
      setActiveDropdown(null)
    } catch (err) {
      console.error('Failed to update status:', err)
      showToast.error('Failed to update user status.')
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteStaffUser(deleteTarget.id)
      showToast.success('User deleted.')
      setDeleteTarget(null)
      setActiveDropdown(null)
      fetchUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
      showToast.error('Failed to delete user.')
    } finally {
      setDeleting(false)
    }
  }

  const metrics = useMemo(() => {
    const active = users.filter((u) => getAccountStatus(u) === 'active').length
    const pending = users.filter((u) => getAccountStatus(u) === 'pending').length
    const inactive = users.filter((u) => getAccountStatus(u) === 'inactive').length
    return {
      total: users.length,
      active,
      pending,
      inactive,
      activeRate: users.length > 0 ? Math.round((active / users.length) * 100) : 0,
    }
  }, [users])

  const selectedStatusLabel = STATUS_OPTIONS.find((o) => o.value === filterStatus)?.label ?? 'All Status'
  const selectedBarangayLabel = barangayOptions.find((o) => o.value === filterBarangay)?.label ?? 'All Barangays'

  const hasActiveFilters = searchQuery.trim().length > 0 || filterStatus !== 'all' || filterBarangay !== 'all'
  const activeFilterCount = [
    searchQuery.trim().length > 0,
    filterStatus !== 'all',
    filterBarangay !== 'all',
  ].filter(Boolean).length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <>
      <section className="mb-6 rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-700 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Team Access Overview</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-slate-100">
                Staff account summary
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Active rate {metrics.activeRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <SummaryMetricCard
            label="Total Staff"
            value={metrics.total}
            helper="Visible accounts"
            icon={<UsersMenuIcon className="h-5 w-5" />}
          />
          <SummaryMetricCard
            label="Active"
            value={metrics.active}
            helper="Can access platform"
            icon={<CheckCircleIcon className="h-5 w-5" />}
          />
          <SummaryMetricCard
            label="Pending"
            value={metrics.pending}
            helper="Awaiting first login"
            icon={<ClockIcon className="h-5 w-5" />}
          />
          <SummaryMetricCard
            label="Inactive"
            value={metrics.inactive}
            helper="Currently disabled"
            icon={<DeactivateIcon className="h-5 w-5" />}
          />
        </div>
      </section>

      <section className="mb-12 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)] dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-100 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] uppercase text-gray-500 dark:text-slate-400">User Directory</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">{isLoading ? 'Loading staff accounts...' : `${users.length} visible account(s)`}</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center whitespace-nowrap gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-gray-800 hover:shadow-[0_4px_14px_rgba(0,0,0,0.15)] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              + New Staff
            </button>
          </div>
        </div>

        <div className="border-b border-gray-100 bg-gray-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/70 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(sanitizeAsciiText(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors hover:border-[#004A1C]/30 hover:bg-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-[#ECC323]/50 dark:hover:bg-slate-800/50"
              />
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
              <div className="relative min-w-[150px] flex-1 sm:flex-none">
                <button
                  ref={statusButtonRef}
                  type="button"
                  onClick={() => {
                    setBarangayDropdownOpen(false)
                    setStatusDropdownOpen((v) => !v)
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-slate-50 hover:text-[#004A1C] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/50 dark:hover:text-[#ECC323]"
                >
                  <span className="truncate">{selectedStatusLabel}</span>
                  <ChevronDownIcon />
                </button>

                {statusDropdownOpen && (
                  <DropdownMenu
                    menuRef={statusMenuRef}
                    items={STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                    selected={filterStatus}
                    onSelect={(value) => {
                      setFilterStatus(value as FilterStatus)
                      setStatusDropdownOpen(false)
                    }}
                  />
                )}
              </div>

              <div className="relative min-w-[180px] flex-1 sm:flex-none">
                <button
                  ref={barangayButtonRef}
                  type="button"
                  onClick={() => {
                    setStatusDropdownOpen(false)
                    setBarangayDropdownOpen((v) => !v)
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-slate-50 hover:text-[#004A1C] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/50 dark:hover:text-[#ECC323]"
                >
                  <span className="truncate">{selectedBarangayLabel}</span>
                  <ChevronDownIcon />
                </button>

                {barangayDropdownOpen && (
                  <DropdownMenu
                    menuRef={barangayMenuRef}
                    items={barangayOptions}
                    selected={filterBarangay}
                    onSelect={(value) => {
                      setFilterBarangay(value)
                      setBarangayDropdownOpen(false)
                    }}
                    wide
                  />
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                    setFilterBarangay('all')
                  }}
                  className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-all duration-300 hover:bg-slate-50 hover:text-[#004A1C] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/50 dark:hover:text-[#ECC323]"
                >
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <SpinnerIcon className="h-8 w-8 text-gray-700" />
              <p className="mt-3 text-sm font-medium text-gray-600">Fetching staff accounts...</p>
            </div>
          ) : error ? (
            <div className="text-center p-16">
              <p className="mb-4 text-lg font-semibold text-red-600">{error}</p>
              <button
                onClick={fetchUsers}
                className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
              >
                Retry Request
              </button>
            </div>
          ) : (
            <table className="w-full min-w-[950px] border-collapse text-left">
              <thead className="border-b border-gray-200 bg-white text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Contact Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registered On</th>
                  <th className="px-6 py-4 text-right pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white text-sm dark:divide-slate-800 dark:bg-transparent">
                {users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-gray-900 dark:text-slate-100 font-bold whitespace-normal break-words">
                        <div className="flex items-center gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                            {((u.firstName || u.fullName || 'S').charAt(0)).toUpperCase()}
                          </div>
                          <span className="font-bold text-gray-900 dark:text-slate-100">
                            {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.fullName || '--'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300 font-medium whitespace-normal break-words">
                        {u.email || '--'}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={getAccountStatus(u)} />
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300 font-medium whitespace-normal">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right pr-6 relative">
                        <div className="inline-block" data-row-menu>
                          <button
                            onClick={(e) => toggleRowDropdown(u.id, e)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition-all duration-300 hover:border-[#004A1C]/30 hover:bg-slate-50 hover:text-[#004A1C] focus:outline-none focus:ring-2 focus:ring-[#004A1C]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-[#ECC323]/50 dark:hover:bg-slate-800/50 dark:hover:text-[#ECC323] dark:focus:ring-[#ECC323]/20"
                          >
                            Manage <ChevronDownIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-500 font-medium">
                      No staff accounts found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {activeDropdown !== null && dropdownPosition && (
        <div
          ref={rowMenuRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
          className="w-52 overflow-hidden rounded-2xl border border-[#DCDCDC] bg-[#ECECEC] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        >
          <div className="flex flex-col gap-1">
            {users.find((u) => u.id === activeDropdown)?.isActive ? (
              <MenuItem icon={<DeactivateIcon className="w-4 h-4" />} label="Deactivate Account" onClick={() => handleToggleActive(activeDropdown, true)} />
            ) : (
              <MenuItem icon={<ActivateIcon className="w-4 h-4" />} label="Activate Account" onClick={() => handleToggleActive(activeDropdown, false)} variant="success" />
            )}
            <div className="my-1 border-t border-gray-100" />
            <MenuItem
              icon={<DeleteIcon className="w-4 h-4" />}
              label="Delete User"
              variant="danger"
              onClick={() => {
                const target = users.find((u) => u.id === activeDropdown)
                if (target) setDeleteTarget(target)
                setActiveDropdown(null)
              }}
            />
          </div>
        </div>
      )}

      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handleUserCreated} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete User?"
        body={`This will permanently delete ${deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}`.trim() : 'this user'} and cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        loading={deleting}
        onConfirm={handleDeleteUser}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </>
  )
}

function DropdownMenu({
  menuRef,
  items,
  selected,
  onSelect,
  wide,
}: {
  menuRef: React.RefObject<HTMLDivElement>
  items: { value: string; label: string }[]
  selected: string
  onSelect: (value: string) => void
  wide?: boolean
}) {
  return (
    <div
      ref={menuRef}
      className={`absolute right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-[#DCDCDC] bg-[#ECECEC] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${
        wide ? 'w-[120%]' : 'w-full'
      }`}
    >
      {items.map((opt) => {
        const isSelected = opt.value === selected
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-left transition-colors ${
              isSelected ? 'bg-[#EAB308] text-gray-900 font-medium' : 'text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-700 font-medium'
            }`}
          >
            <span className="w-5 flex items-center justify-center">
              {isSelected ? <CheckIcon className="w-4 h-4" /> : null}
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
  variant = 'default',
  onClick,
}: {
  icon: React.ReactNode
  label: string
  variant?: 'default' | 'danger' | 'success'
  onClick?: () => void
}) {
  const textColor =
    variant === 'danger'
      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
      : variant === 'success'
        ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
        : 'text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-700'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${textColor}`}
    >
      <span className="opacity-80">{icon}</span>
      {label}
    </button>
  )
}

function StatusBadge({ status }: { status: AccountStatus }) {
  if (status === 'active') {
    return (
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
      </div>
    )
  }
  
  if (status === 'pending') {
    return (
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-400 dark:text-slate-500">Inactive</span>
    </div>
  )
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" className="opacity-20" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
function ChevronDownIcon({ className = 'w-4 h-4 text-gray-400' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function UsersMenuIcon({ className = 'w-4 h-4 text-gray-400' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function CheckCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 22a10 10 0 110-20 10 10 0 010 20z" />
    </svg>
  )
}
function ActivateIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function DeactivateIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
}
function DeleteIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
    </svg>
  )
}
