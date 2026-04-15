'use client'

import React, { useState } from 'react'

interface User {
  id: number
  name: string
  email: string
  role: string
  barangay: string
  status: string
  createdAt: string
}

interface UserTableProps {
  users: User[]
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

export default function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-green-600 text-white'
      case 'Barangay Official':
        return 'bg-yellow-500 text-white'
      case 'Volunteer':
        return 'bg-slate-400 text-white dark:bg-slate-600'
      default:
        return 'bg-gray-300 text-gray-700 dark:bg-slate-700 dark:text-slate-200'
    }
  }

  const getStatusBadgeStyles = (status: string) => {
    return status === 'Active'
      ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
      : 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300'
  }

  const toggleMenu = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const handleEdit = (id: number) => {
    onEdit(id)
    setOpenMenuId(null)
  }

  const handleDelete = (id: number) => {
    onDelete(id)
    setOpenMenuId(null)
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.16)]">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Barangay</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-50 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900 dark:text-slate-100">{user.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-600 dark:text-slate-300">{user.email}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeStyles(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-600 dark:text-slate-300">{user.barangay}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(
                      user.status
                    )}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-600 dark:text-slate-300">{user.createdAt}</span>
                </td>
                <td className="px-4 py-3 relative">
                  <button
                    onClick={() => toggleMenu(user.id)}
                    className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <MoreVerticalIcon className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === user.id && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-4 top-10 z-20 min-w-[120px] rounded-xl border border-gray-100 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <button
                          onClick={() => handleEdit(user.id)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <EditIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <DeleteIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-slate-400">No users found</p>
        </div>
      )}
    </div>
  )
}

// Icon Components
function MoreVerticalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
