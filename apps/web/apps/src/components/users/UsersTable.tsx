'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import AddUserModal from './AddUserModal'
import { api, StaffUser, StaffStats, BARANGAY_OPTIONS } from '@/lib/api'

type FilterStatus = 'all' | 'active' | 'inactive'

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export default function UsersTable() {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterBarangay, setFilterBarangay] = useState<string>('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Data state
  const [users, setUsers] = useState<StaffUser[]>([])
  const [stats, setStats] = useState<StaffStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Row action dropdown
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null)
  const rowMenuRef = useRef<HTMLDivElement>(null)

  // Status filter dropdown
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const statusButtonRef = useRef<HTMLButtonElement>(null)

  // Barangay filter dropdown
  const [brgyDropdownOpen, setBrgyDropdownOpen] = useState(false)
  const brgyMenuRef = useRef<HTMLDivElement>(null)
  const brgyButtonRef = useRef<HTMLButtonElement>(null)

  // Reset password modal
  const [resetPasswordTarget, setResetPasswordTarget] = useState<{ id: string; name: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  // --- FETCH DATA ---
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params: { search?: string; status?: 'active' | 'inactive'; barangay?: string } = {}
      if (filterStatus !== 'all') params.status = filterStatus
      if (searchQuery) params.search = searchQuery
      if (filterBarangay) params.barangay = filterBarangay
      
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
  }, [filterStatus, searchQuery, filterBarangay])

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

      const clickedBrgyButton = brgyButtonRef.current?.contains(target)
      const clickedBrgyMenu = brgyMenuRef.current?.contains(target)
      if (!clickedBrgyButton && !clickedBrgyMenu) {
        setBrgyDropdownOpen(false)
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
      fetchUsers()
      fetchStats()
      setActiveDropdown(null)
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update user status')
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordTarget || !newPassword) return
    
    try {
      setIsResetting(true)
      await api.resetStaffPassword(resetPasswordTarget.id, newPassword)
      setResetPasswordTarget(null)
      setNewPassword('')
      setActiveDropdown(null)
      alert('Password reset successfully')
    } catch (err) {
      console.error('Failed to reset password:', err)
      const e = err as { message?: string }
      alert(e.message || 'Failed to reset password')
    } finally {
      setIsResetting(false)
    }
  }

  // --- SUMMARY DATA ---
  const summary = useMemo(() => {
    if (stats) {
      return { total: stats.total, active: stats.active, inactive: stats.inactive }
    }
    return {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
    }
  }, [stats, users])

  const selectedStatusLabel =
    STATUS_OPTIONS.find(o => o.value === filterStatus)?.label ?? 'All Status'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Header Actions */}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-3 justify-between items-center">
          <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[150px]">
              <button
                ref={statusButtonRef}
                type="button"
                onClick={() => setStatusDropdownOpen(v => !v)}
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
                ref={brgyButtonRef}
                type="button"
                onClick={() => setBrgyDropdownOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
              >
                <span className="text-xs">{filterBarangay || 'All Barangays'}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {brgyDropdownOpen && (
                <div
                  ref={brgyMenuRef}
                  className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1 z-50 max-h-60 overflow-y-auto"
                >
                  {/* All option */}
                  <button
                    type="button"
                    onClick={() => { setFilterBarangay(''); setBrgyDropdownOpen(false) }}
                    className={[
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                      !filterBarangay ? 'bg-[#EAB308] text-gray-900' : 'text-gray-700 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <span className="w-5 flex items-center justify-center">
                      {!filterBarangay && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span>All Barangays</span>
                  </button>
                  {BARANGAY_OPTIONS.map(b => {
                    const selected = filterBarangay === b
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => { setFilterBarangay(b); setBrgyDropdownOpen(false) }}
                        className={[
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                          selected ? 'bg-[#EAB308] text-gray-900' : 'text-gray-700 hover:bg-gray-50',
                        ].join(' ')}
                      >
                        <span className="w-5 flex items-center justify-center">
                          {selected && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span>{b}</span>
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
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F533A]"></div>
              <span className="ml-3 text-gray-500">Loading staff users...</span>
            </div>
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
                  <th className="px-4 py-3 font-medium w-[18%]">Full Name</th>
                  <th className="px-4 py-3 font-medium w-[14%]">Username</th>
                  <th className="px-4 py-3 font-medium w-[28%]">Assigned Barangays</th>
                  <th className="px-4 py-3 font-medium w-[10%]">Status</th>
                  <th className="px-4 py-3 font-medium w-[18%]">Created</th>
                  <th className="px-4 py-3 font-medium text-right w-[12%]"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 relative">
                      <td className="px-4 py-3 text-gray-800 font-medium whitespace-normal break-words">
                        {user.fullName}
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-normal break-words">
                        {user.username}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.assignedBarangays.map(b => (
                            <span
                              key={b}
                              className="inline-block px-2 py-0.5 rounded-full bg-[#0F533A]/10 text-[#0F533A] text-[11px] font-medium"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge isActive={user.isActive} />
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
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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
        <SummaryCard value={summary.inactive} label="Inactive" color="gray" />
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
              icon={<KeyIcon />} 
              label="Reset Password" 
              onClick={() => {
                const user = users.find(u => u.id === activeDropdown)
                if (user) {
                  setResetPasswordTarget({ id: user.id, name: user.fullName })
                  setActiveDropdown(null)
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setResetPasswordTarget(null); setNewPassword('') }} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-gray-600 mb-4">
              Set a new password for <strong>{resetPasswordTarget.name}</strong>.
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value.replace(/\s/g, ''))}
              placeholder="New password (min. 16 characters)"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setResetPasswordTarget(null); setNewPassword('') }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 rounded-xl bg-[#0F533A] text-white hover:bg-[#0a3f2c] disabled:opacity-50"
                disabled={isResetting || !newPassword}
              >
                {isResetting ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={handleUserCreated}
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
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

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
      isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function KeyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
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
