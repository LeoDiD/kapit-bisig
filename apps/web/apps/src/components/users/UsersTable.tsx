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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
        {/* Header Actions */}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-2 justify-between items-center">
          <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(sanitizeAsciiText(e.target.value))}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[140px]">
              <button
                ref={statusButtonRef}
                type="button"
                onClick={() => {
                  setBarangayDropdownOpen(false)
                  setStatusDropdownOpen(v => !v)
                }}
                className="w-full flex items-center justify-between px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
              >
                <span className="text-xs">{selectedStatusLabel}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {statusDropdownOpen && (
                <div
                  ref={statusMenuRef}
                  className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1 z-50"
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
                        className={[
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                          selected ? 'bg-[#EAB308] text-gray-900' : 'text-gray-700 hover:bg-gray-50',
                        ].join(' ')}
                      >
                        <span className="w-5 flex items-center justify-center">
                          {selected ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        <span>{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Barangay Filter */}
            <div className="relative min-w-[170px]">
              <button
                ref={barangayButtonRef}
                type="button"
                onClick={() => {
                  setStatusDropdownOpen(false)
                  setBarangayDropdownOpen(v => !v)
                }}
                className="w-full flex items-center justify-between px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
              >
                <span className="text-xs truncate">{selectedBarangayLabel}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {barangayDropdownOpen && (
                <div
                  ref={barangayMenuRef}
                  className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1 z-50"
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
                        className={[
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                          selected ? 'bg-[#EAB308] text-gray-900' : 'text-gray-700 hover:bg-gray-50',
                        ].join(' ')}
                      >
                        <span className="w-5 flex items-center justify-center">
                          {selected ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Add User */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#0F533A] hover:bg-[#0a3f2c] text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm shadow-[0_2px_10px_rgba(0,0,0,0.10)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Staff
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full">
          {isLoading ? (
            <TableSkeleton rows={6} columns={5} />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={fetchUsers}
                className="px-4 py-2 bg-[#0F533A] text-white rounded-xl hover:bg-[#0a3f2c]"
              >
                Retry
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse table-fixed min-w-[900px] lg:min-w-0">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="px-4 py-3 font-medium w-[25%]">Name</th>
                  <th className="px-4 py-3 font-medium w-[30%]">Email</th>
                  <th className="px-4 py-3 font-medium w-[10%]">Status</th>
                  <th className="px-4 py-3 font-medium w-[18%]">Created</th>
                  <th className="px-4 py-3 font-medium text-right w-[17%]"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 relative">
                      <td className="px-4 py-3 text-gray-800 font-medium whitespace-normal break-words">
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName || '—'}
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-normal break-words">
                        {user.email || '—'}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={getAccountStatus(user)} />
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-normal">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={e => toggleRowDropdown(user.id, e)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No staff users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard value={summary.total} label="Total Staff" color="green" />
        <SummaryCard value={summary.active} label="Active" color="yellow" />
        <SummaryCard value={summary.inactive} label="Not Active" color="gray" />
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
          className="w-48 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden"
        >
          <div className="py-2 flex flex-col">
            {/* Status Toggle */}
            {users.find(u => u.id === activeDropdown)?.isActive ? (
              <MenuItem 
                icon={<DeactivateIcon />} 
                label="Deactivate" 
                onClick={() => handleToggleActive(activeDropdown, true)}
              />
            ) : (
              <MenuItem 
                icon={<ActivateIcon />} 
                label="Activate" 
                onClick={() => handleToggleActive(activeDropdown, false)}
              />
            )}
            <MenuItem
              icon={<DeleteIcon />}
              label="Delete"
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

function SummaryCard({ value, label, color }: { value: number; label: string; color: 'green' | 'yellow' | 'gray' }) {
  const colorClasses = {
    green: 'text-[#0F533A]',
    yellow: 'text-[#EAB308]',
    gray: 'text-gray-600',
  }
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] p-6 flex flex-col items-center justify-center">
      <div className={`text-3xl font-semibold ${colorClasses[color]}`}>{value}</div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
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
  variant?: 'default' | 'danger'
  onClick?: () => void
}) {
  const textColor =
    variant === 'danger' ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${textColor}`}
    >
      <span className={variant === 'danger' ? 'text-red-500' : 'text-gray-500'}>{icon}</span>
      {label}
    </button>
  )
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const style =
    status === 'active'
      ? 'bg-green-500 text-white'
      : status === 'pending'
      ? 'bg-amber-500 text-white'
      : 'bg-gray-400 text-white'
  const label = status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Inactive'

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

function ActivateIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function DeactivateIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
    </svg>
  )
}
