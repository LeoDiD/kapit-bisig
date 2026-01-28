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
        return 'bg-gray-400 text-white'
      default:
        return 'bg-gray-300 text-gray-700'
    }
  }

  const getStatusBadgeStyles = (status: string) => {
    return status === 'Active'
      ? 'bg-green-100 text-green-700'
      : 'bg-orange-100 text-orange-700'
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Role</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Barangay</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Created</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{user.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-600">{user.email}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeStyles(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-600">{user.barangay}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyles(
                      user.status
                    )}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-600">{user.createdAt}</span>
                </td>
                <td className="px-6 py-4 relative">
                  <button
                    onClick={() => toggleMenu(user.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVerticalIcon className="w-5 h-5 text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === user.id && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-6 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20 min-w-[120px]">
                        <button
                          onClick={() => handleEdit(user.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <EditIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
          <p className="text-gray-500">No users found</p>
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
