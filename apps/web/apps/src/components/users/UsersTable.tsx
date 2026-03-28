'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import AddUserModal from './AddUserModal'
import { api, BARANGAY_OPTIONS, getScopedBarangays, StaffUser, StaffStats } from '@/lib/api'
import { showToast } from '@/lib/toast'
import { TableSkeleton } from '@/components/ui/Skeleton'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { sanitizeAsciiText } from '@/lib/inputValidation'
import { useAuth } from '@/lib/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

type FilterStatus = 'all' | 'active' | 'pending' | 'inactive'
type FilterBarangay = string

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Not Active' },
]

// Barangay filter options are now computed dynamically via getScopedBarangays()

type AccountStatus = 'active' | 'pending' | 'inactive'

function getAccountStatus(user: Pick<StaffUser, 'isActive' | 'lastLoginAt'>): AccountStatus {
  if (!user.isActive) return 'inactive'
  if (!user.lastLoginAt) return 'pending'
  return 'active'
}

export default function UsersTable() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const BARANGAY_FILTER_OPTIONS = useMemo(() => [
    { value: 'all' as const, label: 'All Barangays' },
    ...getScopedBarangays(user?.role, user?.assignedBarangays).map((b) => ({ value: b, label: b })),
  ], [user?.role, user?.assignedBarangays])

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterBarangay, setFilterBarangay] = useState<FilterBarangay>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Data state
  const [users, setUsers] = useState<StaffUser[]>([])
  const [stats, setStats] = useState<StaffStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Row action dropdown
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const rowMenuRef = useRef<HTMLDivElement>(null)

  // Status filter dropdown
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const statusButtonRef = useRef<HTMLButtonElement>(null)

  // Barangay filter dropdown
  const [barangayDropdownOpen, setBarangayDropdownOpen] = useState(false)
  const barangayMenuRef = useRef<HTMLDivElement>(null)
  const barangayButtonRef = useRef<HTMLButtonElement>(null)

  // --- FETCH DATA ---
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

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.getStaffStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const shouldOpenAdd = searchParams.get('openAdd') === '1'
    if (!shouldOpenAdd) return
    setIsAddModalOpen(true)
    const next = new URLSearchParams(searchParams.toString())
    next.delete('openAdd')
    const query = next.toString()
    router.replace(query ? `/users?${query}` : '/users')
  }, [searchParams, router])

  // --- CLICK OUTSIDE HANDLER ---
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

  // --- TOGGLE ROW DROPDOWN LOGIC ---
  const toggleRowDropdown = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    if (activeDropdown === id) {
      setActiveDropdown(null)
      setDropdownPosition(null)
      return
    }

    const buttonRect = e.currentTarget.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    const menuHeight = 120
    const menuWidth = 192

    const shouldOpenUp = spaceBelow < menuHeight && spaceAbove >= menuHeight

    setDropdownPosition({
      top: shouldOpenUp ? buttonRect.top - menuHeight : buttonRect.bottom + 8,
      left: buttonRect.right - menuWidth,
      openUp: shouldOpenUp,
    })
    setActiveDropdown(id)
  }

  // --- USER ACTIONS ---
  const handleUserCreated = () => {
    fetchUsers()
    fetchStats()
  }

  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    try {
      await api.updateStaffUser(userId, { isActive: !currentlyActive })
      showToast.success(currentlyActive ? 'User deactivated.' : 'User activated.')
      fetchUsers()
      fetchStats()
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
      fetchStats()
    } catch (err) {
      console.error('Failed to delete user:', err)
      showToast.error('Failed to delete user.')
    } finally {
      setDeleting(false)
    }
  }

  // --- SUMMARY DATA ---
  const summary = useMemo(() => {
    if (stats) {
      return { total: stats.total, active: stats.active, inactive: stats.inactive }
    }
    const activeCount = users.filter(u => getAccountStatus(u) === 'active').length
    return {
      total: users.length,
      active: activeCount,
      inactive: users.length - activeCount,
    }
  }, [stats, users])

  const selectedStatusLabel =
    STATUS_OPTIONS.find(o => o.value === filterStatus)?.label ?? 'All Status'
  const selectedBarangayLabel =
    BARANGAY_FILTER_OPTIONS.find(o => o.value === filterBarangay)?.label ?? 'All Barangays'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <>
      {/* Top Metrics Ribbon */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl mb-6 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden">
        <StatSection 
          label="Total Staff" 
          value={summary.total} 
          icon={<UsersMenuIcon className="w-5 h-5 text-gray-500" />} 
        />
        <StatSection 
          label="Active Accounts" 
          value={summary.active} 
          icon={<CheckCircleIcon className="w-5 h-5 text-emerald-600" />} 
        />
        <StatSection 
          label="Inactive / Pending" 
          value={summary.inactive} 
          icon={<DeactivateIcon className="w-5 h-5 text-amber-500" />} 
        />
      </div>

      {/* Unified Table Container */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col overflow-hidden mb-12">
        {/* Integrated Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/40 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
               <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(sanitizeAsciiText(e.target.value))}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Status Filter */}
            <div className="relative min-w-[150px]">
              <button
                ref={statusButtonRef}
                type="button"
                onClick={() => {
                  setBarangayDropdownOpen(false)
                  setStatusDropdownOpen(v => !v)
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors"
              >
                <span className="truncate">{selectedStatusLabel}</span>
                <ChevronDownIcon />
              </button>

              {statusDropdownOpen && (
                <div
                  ref={statusMenuRef}
                  className="absolute right-0 top-full mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-lg p-1.5 z-50"
                >
                  {STATUS_OPTIONS.map(opt => {
                    const selected = opt.value === filterStatus
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFilterStatus(opt.value)
                          setStatusDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          selected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {selected && <CheckIcon className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Barangay Filter */}
            <div className="relative min-w-[180px]">
              <button
                ref={barangayButtonRef}
                type="button"
                onClick={() => {
                  setStatusDropdownOpen(false)
                  setBarangayDropdownOpen(v => !v)
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors"
              >
                <span className="truncate">{selectedBarangayLabel}</span>
                <ChevronDownIcon />
              </button>

              {barangayDropdownOpen && (
                <div
                  ref={barangayMenuRef}
                  className="absolute right-0 top-full mt-1.5 w-[120%] bg-white rounded-xl border border-gray-200 shadow-lg p-1.5 z-50 max-h-60 overflow-y-auto custom-scrollbar"
                >
                  {BARANGAY_FILTER_OPTIONS.map(opt => {
                    const selected = opt.value === filterBarangay
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFilterBarangay(opt.value)
                          setBarangayDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          selected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {selected && <CheckIcon className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Add User */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center whitespace-nowrap gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold shadow-sm transition-colors ml-1"
            >
              + New Staff
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full">
          {isLoading ? (
            <div className="p-16 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : error ? (
            <div className="text-center p-16">
              <p className="font-semibold text-lg text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchUsers}
                className="px-5 py-2.5 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800"
              >
                Retry Request
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse table-fixed min-w-[900px] lg:min-w-0">
              <thead className="bg-white border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-[30%]">Staff Member</th>
                  <th className="px-6 py-4 w-[25%]">Contact Email</th>
                  <th className="px-6 py-4 w-[15%]">Status</th>
                  <th className="px-6 py-4 w-[15%]">Registered On</th>
                  <th className="px-6 py-4 text-right pr-6 w-[15%]">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white text-sm">
                {users.length > 0 ? (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 text-gray-900 font-bold whitespace-normal break-words">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex flex-shrink-0 items-center justify-center text-xs">
                            {((u.firstName || u.fullName || 'S').charAt(0)).toUpperCase()}
                          </div>
                          <span className="font-bold text-gray-900">
                             {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.fullName || '—'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600 font-medium whitespace-normal break-words">
                        {u.email || '—'}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={getAccountStatus(u)} />
                      </td>

                      <td className="px-6 py-4 text-gray-600 font-medium whitespace-normal">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right pr-6 relative">
                        <div className="inline-block" data-row-menu>
                          <button
                            onClick={e => toggleRowDropdown(u.id, e)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-bold text-gray-700 rounded-lg bg-white hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
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
      </div>

      {/* Fixed position dropdown menu */}
      {activeDropdown !== null && dropdownPosition && (
        <div
          ref={rowMenuRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
          className="w-48 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-200 overflow-hidden"
        >
          <div className="py-2 flex flex-col">
            {/* Status Toggle */}
            {users.find(u => u.id === activeDropdown)?.isActive ? (
              <MenuItem 
                icon={<DeactivateIcon className="w-4 h-4" />} 
                label="Deactivate Account" 
                onClick={() => handleToggleActive(activeDropdown, true)}
              />
            ) : (
              <MenuItem 
                icon={<ActivateIcon className="w-4 h-4" />} 
                label="Activate Account" 
                onClick={() => handleToggleActive(activeDropdown, false)}
                variant="success"
              />
            )}
            <div className="border-t border-gray-100 my-1" />
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

      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={handleUserCreated}
      />

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

// --- HELPER COMPONENTS ---

function StatSection({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="flex-1 flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors">
      <div>
        <p className="text-[11px] font-bold tracking-wider text-gray-500 uppercase mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-900 leading-tight">{value > 0 ? value : '--'}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
        {icon}
      </div>
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
      ? 'text-red-600 hover:bg-red-50' 
      : variant === 'success' 
      ? 'text-emerald-600 hover:bg-emerald-50' 
      : 'text-gray-700 hover:bg-gray-50'
      
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors ${textColor}`}
    >
      <span className="opacity-80">{icon}</span>
      {label}
    </button>
  )
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const cls =
    status === 'active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'pending'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-gray-100 text-gray-600 border-gray-300'

  const dotCls =
    status === 'active'
      ? 'bg-emerald-500'
      : status === 'pending'
        ? 'bg-amber-500'
        : 'bg-gray-400'

  const label = status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Inactive'

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${dotCls}`} />
      {label}
    </span>
  )
}

/* ----- Icons ----- */

function SearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
function ChevronDownIcon({ className = "w-4 h-4 text-gray-400" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function UsersMenuIcon({ className = "w-4 h-4 text-gray-400" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function CheckCircleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function ActivateIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function DeactivateIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
}
function DeleteIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
    </svg>
  )
}
