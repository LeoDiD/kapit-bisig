'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SelectDropdown from '@/components/ui/SelectDropdown'
import { BARANGAY_OPTIONS } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api'

type ApprovedResident = {
  _id: string
  fullName: string
  barangay: string
  verifiedAt?: string
  createdAt: string
}

function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Uxxxx'
  if (parts.length === 1) return `${parts[0][0].toUpperCase()}xxxx`
  return `${parts[0][0].toUpperCase()}xxxx ${parts[1][0].toUpperCase()}xxxx`
}

export default function ApprovedUsersByBarangayTable() {
  const { user, loading: authLoading } = useAuth()
  const [rows, setRows] = useState<ApprovedResident[]>([])
  const [barangay, setBarangay] = useState('All Barangays')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Don't fetch if not authenticated
    if (authLoading || !user) {
      setLoading(false)
      return
    }
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}/residents?status=Approved&limit=50`, {
          credentials: 'include',
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load approved users')
        if (mounted) setRows(Array.isArray(data.data) ? data.data : [])
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load approved users')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [authLoading, user])

  const barangayOptions = useMemo(() => ['All Barangays', ...BARANGAY_OPTIONS], [])
  const barangayDropdownOptions = useMemo(
    () => barangayOptions.map((option) => ({ value: option, label: option })),
    [barangayOptions]
  )

  const filteredRows = useMemo(() => {
    if (barangay === 'All Barangays') return rows
    return rows.filter((r) => r.barangay === barangay)
  }, [rows, barangay])

  const columns = useMemo<ColumnDef<ApprovedResident>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Resident Name',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900">
            {maskName(row.original.fullName)}
          </span>
        ),
      },
      {
        accessorKey: 'barangay',
        header: 'Barangay',
      },
      {
        id: 'dateApproved',
        header: 'Date Approved',
        cell: ({ row }) => {
          const dt = row.original.verifiedAt || row.original.createdAt
          return new Date(dt).toLocaleDateString()
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Approved Users by Barangay</h2>
          <p className="text-sm text-gray-500">Names are masked for privacy.</p>
        </div>

        <div className="w-full sm:w-64">
          <label htmlFor="dashboard-barangay-filter" className="mb-1 block text-xs font-medium text-gray-600">
            Filter by Barangay
          </label>
          <SelectDropdown
            id="dashboard-barangay-filter"
            value={barangay}
            onChange={setBarangay}
            options={barangayDropdownOptions}
            ariaLabel="Filter by barangay"
            buttonClassName="h-10"
            menuClassName="max-h-72"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-sm text-gray-500">
                    Loading approved users...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-sm text-gray-500">
                    No approved users found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}



