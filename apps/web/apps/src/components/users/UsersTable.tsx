'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import AddUserModal from './AddUserModal'

type Role = 'Admin' | 'Staff' | 'Barangay Official'
type FilterRole = 'All' | Role

const ROLE_OPTIONS: { value: FilterRole; label: string }[] = [
  { value: 'All', label: 'All Roles' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Staff', label: 'Staff' },
]

export default function UsersTable() {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<FilterRole>('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Row action dropdown
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null)
  const rowMenuRef = useRef<HTMLDivElement>(null)

  // Role filter dropdown
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const roleMenuRef = useRef<HTMLDivElement>(null)
  const roleButtonRef = useRef<HTMLButtonElement>(null)

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      // close row dropdown
      if (rowMenuRef.current && !rowMenuRef.current.contains(target)) {
        setActiveDropdown(null)
      }

      // close role dropdown
      const clickedRoleButton = roleButtonRef.current?.contains(target)
      const clickedRoleMenu = roleMenuRef.current?.contains(target)
      if (!clickedRoleButton && !clickedRoleMenu) {
        setRoleDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // --- TOGGLE ROW DROPDOWN LOGIC ---
  const toggleRowDropdown = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
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
    const menuWidth = 192 // w-48 = 12rem = 192px

    // Prefer opening upward if not enough space below
    const shouldOpenUp = spaceBelow < menuHeight && spaceAbove >= menuHeight

    setDropdownPosition({
      top: shouldOpenUp ? buttonRect.top - menuHeight : buttonRect.bottom + 8,
      left: buttonRect.right - menuWidth,
      openUp: shouldOpenUp,
    })
    setActiveDropdown(id)
  }

  // --- MOCK DATA (match Figma roles) ---
  const users = [
    { id: 1, name: 'Bryle Agra', email: 'bryle.agra@lgu.gov.ph', role: 'Admin' as Role, barangay: 'Brgy. Somewhere', status: 'Active', created: 'January 12, 2026' },
    { id: 2, name: 'Jachin Aliman', email: 'jachin.aliman@lgu.gov.ph', role: 'Staff' as Role, barangay: 'Brgy. Pogi', status: 'Active', created: 'January 12, 2026' },
    { id: 3, name: 'Peter Diaz Arenas', email: 'peter.arenas@gmail.com', role: 'Staff' as Role, barangay: 'Brgy. Bukignon', status: 'Active', created: 'January 12, 2026' },
    { id: 4, name: 'Emmanuel De Vera', email: 'emman.pogi@lgu.gov.ph', role: 'Staff' as Role, barangay: 'Brgy. London', status: 'Active', created: 'January 12, 2026' },
    { id: 5, name: 'Charlie Padilla', email: 'charlie.padilla@gmail.com', role: 'Admin' as Role, barangay: 'Brgy. Pogi', status: 'Inactive', created: 'January 12, 2026' },
  ]

  // --- FILTER LOGIC ---
  const filteredUsers = users.filter((user) => {
    const matchesRole = filterRole === 'All' || user.role === filterRole
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
    return matchesRole && matchesSearch
  })

  // --- SUMMARY CARDS (match screenshot) ---
  const summary = useMemo(() => {
    const admins = users.filter((u) => u.role === 'Admin').length
    const staffs = users.filter((u) => u.role === 'Staff').length
    return { admins, staffs }
  }, [users])

  const selectedRoleLabel =
    ROLE_OPTIONS.find((o) => o.value === filterRole)?.label ?? 'All Roles'

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Header Actions */}
        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Role Filter (custom dropdown like Figma) */}
            <div className="relative min-w-[180px]">
              <button
                ref={roleButtonRef}
                type="button"
                onClick={() => setRoleDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
              >
                <span className="text-sm">{selectedRoleLabel}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {roleDropdownOpen && (
                <div
                  ref={roleMenuRef}
                  className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1 z-50"
                >
                  {ROLE_OPTIONS.map((opt) => {
                    const selected = opt.value === filterRole
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFilterRole(opt.value)
                          setRoleDropdownOpen(false)
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
          </div>

          {/* Add User */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#0F533A] hover:bg-[#0a3f2c] text-white px-5 py-2 rounded-xl transition-colors font-medium text-sm shadow-[0_2px_10px_rgba(0,0,0,0.10)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px] lg:min-w-0">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="px-4 py-3 font-medium w-[18%]">Name</th>
                <th className="px-4 py-3 font-medium w-[22%]">Email</th>
                <th className="px-4 py-3 font-medium w-[15%]">Role</th>
                <th className="px-4 py-3 font-medium w-[15%]">Barangay</th>
                <th className="px-4 py-3 font-medium w-[12%]">Status</th>
                <th className="px-4 py-3 font-medium w-[10%]">Created</th>
                <th className="px-4 py-3 font-medium text-right w-[8%]"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 relative">
                    <td className="px-4 py-3 text-gray-800 font-medium whitespace-normal break-words">
                      {user.name}
                    </td>

                    <td className="px-4 py-3 text-gray-600 whitespace-normal break-words">
                      {user.email}
                    </td>

                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="px-4 py-3 text-gray-600 whitespace-normal break-words">
                      {user.barangay}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>

                    <td className="px-4 py-3 text-gray-600 whitespace-normal">
                      {user.created}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => toggleRowDropdown(user.id, e)}
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
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards (like Figma bottom) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard value={summary.admins} label="Administrators" />
        <SummaryCard value={summary.staffs} label="Staffs" />
      </div>

      {/* Fixed position dropdown menu - renders outside table to avoid scroll issues */}
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
            <MenuItem icon={<EditIcon />} label="Edit" />
            <MenuItem icon={<DeleteIcon />} label="Delete" variant="danger" />
          </div>
        </div>
      )}

      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  )
}

// --- HELPER COMPONENTS ---

function SummaryCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center">
      <div className="text-4xl font-semibold text-gray-900">{value}</div>
      <div className="mt-2 text-gray-600">{label}</div>
    </div>
  )
}

function MenuItem({
  icon,
  label,
  variant = 'default',
}: {
  icon: React.ReactNode
  label: string
  variant?: 'default' | 'danger'
}) {
  const textColor =
    variant === 'danger' ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
  return (
    <button className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${textColor}`}>
      <span className={variant === 'danger' ? 'text-red-500' : 'text-gray-500'}>{icon}</span>
      {label}
    </button>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    Admin: 'bg-[#0F533A] text-white',
    Staff: 'bg-[#EAB308] text-white',
    'Barangay Official': 'bg-[#EAB308] text-white',
    Volunteer: 'bg-white border border-gray-200 text-gray-600',
  }

  return (
    <span
      title={role}
      className={[
        'inline-flex items-center justify-center',
        // ✅ fixed sizing for all roles (same pill size)
        'h-6 w-[120px] rounded-full',
        'px-2 text-[11px] font-semibold',
        'overflow-hidden whitespace-nowrap text-ellipsis',
        styles[role] ?? 'bg-gray-100 text-gray-700',
      ].join(' ')}
    >
      {role}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: 'bg-green-500 text-white',
    Inactive: 'bg-red-500 text-white',
  }
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}
function DeleteIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
