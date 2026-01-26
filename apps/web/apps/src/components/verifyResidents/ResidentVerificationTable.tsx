'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import VerificationDetailsModal from './VerifyResidentsModal'

type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected'
type AIVerification = 'High Match' | 'Medium Match' | 'Low Match'
type IDType = 'PhilID' | 'Passport' | 'Voter ID'

type Application = {
  id: number
  name: string
  email: string
  barangay: string
  idType: IDType
  idNumber: string
  aiVerification: AIVerification
  status: ApplicationStatus
  applied: string
  confidence: number // 0-100
  contactNumber: string
  address: string
  rejectionReason?: string
  verifiedBy?: string
}

type FilterStatus = 'All' | ApplicationStatus
type FilterBarangay = 'All' | string

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'All', label: 'All Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
]

function uniqueBarangays(items: Application[]) {
  const set = new Set(items.map((i) => i.barangay))
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export default function ResidentVerificationTable() {
  // --- MOCK DATA (UI-focused) ---
  const [apps, setApps] = useState<Application[]>([
    {
      id: 1,
      name: 'Bryle Agra',
      email: 'bryle.agra@gmail.com',
      barangay: 'Barangay San Jose',
      idType: 'PhilID',
      idNumber: 'VIN-12345678',
      aiVerification: 'High Match',
      status: 'Approved',
      applied: 'January 12, 2026',
      confidence: 100,
      contactNumber: '09123456789',
      address: '123 Pogi Street',
      verifiedBy: '',
    },
    {
      id: 2,
      name: 'Jachin Aliman',
      email: 'jachin.aliman@gmail.com',
      barangay: 'Barangay Santo Nino',
      idType: 'PhilID',
      idNumber: 'VIN-12345678',
      aiVerification: 'High Match',
      status: 'Pending',
      applied: 'January 12, 2026',
      confidence: 58,
      contactNumber: '09123456789',
      address: '123 Pogi Street',
    },
    {
      id: 3,
      name: 'Peter Arenas',
      email: 'arenas.peter@gmail.com',
      barangay: 'Barangay San Jose',
      idType: 'PhilID',
      idNumber: 'VIN-12345678',
      aiVerification: 'Medium Match',
      status: 'Pending',
      applied: 'January 12, 2026',
      confidence: 58,
      contactNumber: '09123456789',
      address: '123 Pogi Street',
    },
    {
      id: 4,
      name: 'Emmanuel De Vera',
      email: 'emman@gmail.com',
      barangay: 'Barangay San Jose',
      idType: 'Passport',
      idNumber: 'VIN-12345678',
      aiVerification: 'High Match',
      status: 'Approved',
      applied: 'January 12, 2026',
      confidence: 100,
      contactNumber: '09123456789',
      address: '123 Pogi Street',
      verifiedBy: '',
    },
    {
      id: 5,
      name: 'Charlie Padilla',
      email: 'charlie.padilla@gmail.com',
      barangay: 'Barangay Santo Nino',
      idType: 'Voter ID',
      idNumber: 'VIN-12345678',
      aiVerification: 'Low Match',
      status: 'Rejected',
      applied: 'January 12, 2026',
      confidence: 20,
      contactNumber: '09123456789',
      address: '123 Pogi Street',
      rejectionReason:
        'ID photo does not match face scan. Please resubmit with clearer photos',
      verifiedBy: '',
    },
  ])

  // --- FILTERS ---
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All')
  const [barangayFilter, setBarangayFilter] = useState<FilterBarangay>('All')

  // custom dropdowns
  const [statusOpen, setStatusOpen] = useState(false)
  const [barangayOpen, setBarangayOpen] = useState(false)
  const statusBtnRef = useRef<HTMLButtonElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const barangayBtnRef = useRef<HTMLButtonElement>(null)
  const barangayMenuRef = useRef<HTMLDivElement>(null)

  // row menu
  const [activeMenu, setActiveMenu] = useState<number | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const rowMenuRef = useRef<HTMLDivElement>(null)

  // modal
  const [selected, setSelected] = useState<Application | null>(null)

  const barangayOptions = useMemo(() => {
    const list = uniqueBarangays(apps)
    return [{ value: 'All' as const, label: 'All Barangays' }, ...list.map((b) => ({ value: b, label: b }))]
  }, [apps])

  // close dropdowns/menus on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node

      // close row menu
      if (rowMenuRef.current && !rowMenuRef.current.contains(t)) {
        setActiveMenu(null)
      }

      // close status dropdown
      const inStatusBtn = statusBtnRef.current?.contains(t)
      const inStatusMenu = statusMenuRef.current?.contains(t)
      if (!inStatusBtn && !inStatusMenu) setStatusOpen(false)

      // close barangay dropdown
      const inBrgyBtn = barangayBtnRef.current?.contains(t)
      const inBrgyMenu = barangayMenuRef.current?.contains(t)
      if (!inBrgyBtn && !inBrgyMenu) setBarangayOpen(false)
    }

    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return apps.filter((a) => {
      const matchesQ =
        !query ||
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.barangay.toLowerCase().includes(query) ||
        a.idType.toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'All' || a.status === statusFilter
      const matchesBarangay = barangayFilter === 'All' || a.barangay === barangayFilter

      return matchesQ && matchesStatus && matchesBarangay
    })
  }, [apps, q, statusFilter, barangayFilter])

  const summary = useMemo(() => {
    const pending = apps.filter((a) => a.status === 'Pending').length
    const approved = apps.filter((a) => a.status === 'Approved').length
    const rejected = apps.filter((a) => a.status === 'Rejected').length
    return { pending, approved, rejected }
  }, [apps])

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'All Status'
  const barangayLabel =
    barangayOptions.find((o) => o.value === barangayFilter)?.label ?? 'All Barangays'

  const toggleRowMenu = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (activeMenu === id) {
      setActiveMenu(null)
      setDropdownPosition(null)
      return
    }

    // Calculate fixed position
    const rect = e.currentTarget.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const menuHeight = 160
    const menuWidth = 208 // w-52 = 13rem = 208px

    // Prefer opening upward if not enough space below
    const shouldOpenUp = spaceBelow < menuHeight && spaceAbove >= menuHeight

    setDropdownPosition({
      top: shouldOpenUp ? rect.top - menuHeight : rect.bottom + 8,
      left: rect.right - menuWidth,
    })
    setActiveMenu(id)
  }

  const openDetails = (app: Application) => {
    setSelected(app)
    setActiveMenu(null)
  }

  const approveApp = (id: number) => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Approved',
              confidence: 100,
              rejectionReason: undefined,
            }
          : a
      )
    )
  }

  const rejectApp = (id: number, reason: string) => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Rejected',
              confidence: Math.min(a.confidence, 20),
              rejectionReason: reason,
            }
          : a
      )
    )
  }

  return (
    <>
      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          value={summary.pending}
          label="Pending Review"
          tone="warning"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22a10 10 0 110-20 10 10 0 010 20z" />
            </svg>
          }
        />
        <StatCard
          value={summary.approved}
          label="Approved"
          tone="success"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          value={summary.rejected}
          label="Rejected"
          tone="danger"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4 items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search applications..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* Status dropdown */}
        <div className="relative min-w-[180px]">
          <button
            ref={statusBtnRef}
            type="button"
            onClick={() => {
              setStatusOpen((v) => !v)
              setBarangayOpen(false)
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
          >
            <span className="text-sm">{statusLabel}</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {statusOpen && (
            <DropdownMenu
              menuRef={statusMenuRef}
              items={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              selected={statusFilter}
              onSelect={(v) => {
                setStatusFilter(v as FilterStatus)
                setStatusOpen(false)
              }}
            />
          )}
        </div>

        {/* Barangay dropdown */}
        <div className="relative min-w-[200px]">
          <button
            ref={barangayBtnRef}
            type="button"
            onClick={() => {
              setBarangayOpen((v) => !v)
              setStatusOpen(false)
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
          >
            <span className="text-sm truncate">{barangayLabel}</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {barangayOpen && (
            <DropdownMenu
              menuRef={barangayMenuRef}
              items={barangayOptions}
              selected={barangayFilter}
              onSelect={(v) => {
                setBarangayFilter(v as FilterBarangay)
                setBarangayOpen(false)
              }}
            />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-fixed min-w-[980px] lg:min-w-0">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="px-4 py-3 font-medium w-[22%]">Resident</th>
                <th className="px-4 py-3 font-medium w-[18%]">Barangay</th>
                <th className="px-4 py-3 font-medium w-[14%]">ID Type</th>
                <th className="px-4 py-3 font-medium w-[16%]">AI Verification</th>
                <th className="px-4 py-3 font-medium w-[12%]">Status</th>
                <th className="px-4 py-3 font-medium w-[12%]">Applied</th>
                <th className="px-4 py-3 font-medium text-right w-[6%]"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.length ? (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 relative">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{a.name}</div>
                      <div className="text-xs text-gray-400">{a.email}</div>
                    </td>

                    <td className="px-4 py-3 text-gray-600 whitespace-normal break-words">
                      {a.barangay}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <IdCardIcon />
                        {a.idType}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <AIVerificationBadge value={a.aiVerification} />
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge value={a.status} />
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {a.applied}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => toggleRowMenu(a.id, e)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed position dropdown menu - renders outside table to avoid scroll issues */}
      {activeMenu !== null && dropdownPosition && (
        <div
          ref={rowMenuRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
          className="w-52 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden"
        >
          <div className="py-2 flex flex-col">
            {filtered.find((a) => a.id === activeMenu) && (
              <>
                <RowMenuItem
                  icon={<EyeIcon />}
                  label="View Details"
                  onClick={() => {
                    const app = filtered.find((a) => a.id === activeMenu)
                    if (app) openDetails(app)
                  }}
                />
                <RowMenuItem
                  icon={<CheckCircleIcon />}
                  label="Approve"
                  tone="success"
                  onClick={() => {
                    if (activeMenu !== null) {
                      approveApp(activeMenu)
                      setActiveMenu(null)
                      setDropdownPosition(null)
                    }
                  }}
                />
                <RowMenuItem
                  icon={<XCircleIcon />}
                  label="Reject"
                  tone="danger"
                  onClick={() => {
                    const app = filtered.find((a) => a.id === activeMenu)
                    if (app) openDetails(app)
                  }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <VerificationDetailsModal
        open={!!selected}
        application={selected}
        onClose={() => setSelected(null)}
        onApprove={(id: number) => {
          approveApp(id)
          setSelected(null)
        }}
        onReject={(id: number, reason: string) => {
          rejectApp(id, reason)
          setSelected(null)
        }}
      />
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
  onSelect: (value: string) => void
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
              {isSelected ? (
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
  )
}

function StatCard({
  value,
  label,
  icon,
  tone,
}: {
  value: number
  label: string
  icon: React.ReactNode
  tone: 'warning' | 'success' | 'danger'
}) {
  const toneBox =
    tone === 'warning'
      ? 'bg-[#FEF3C7] text-[#A16207]'
      : tone === 'success'
      ? 'bg-[#D1FAE5] text-[#166534]'
      : 'bg-[#FECACA] text-[#991B1B]'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${toneBox}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xl font-semibold text-gray-900 leading-tight">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  )
}

function RowMenuItem({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone?: 'default' | 'success' | 'danger'
}) {
  const cls =
    tone === 'success'
      ? 'text-green-600 hover:bg-green-50'
      : tone === 'danger'
      ? 'text-red-500 hover:bg-red-50'
      : 'text-gray-700 hover:bg-gray-50'

  const iconCls =
    tone === 'success'
      ? 'text-green-600'
      : tone === 'danger'
      ? 'text-red-500'
      : 'text-gray-500'

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

function StatusBadge({ value }: { value: ApplicationStatus }) {
  const styles: Record<ApplicationStatus, string> = {
    Approved: 'bg-green-500 text-white',
    Pending: 'bg-[#EAB308] text-white',
    Rejected: 'bg-red-500 text-white',
  }
  return (
    <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium ${styles[value]}`}>
      {value}
    </span>
  )
}

function AIVerificationBadge({ value }: { value: AIVerification }) {
  const styles: Record<AIVerification, string> = {
    'High Match': 'bg-red-500 text-white',
    'Medium Match': 'bg-[#EAB308] text-white',
    'Low Match': 'bg-green-600 text-white',
  }
  return (
    <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium ${styles[value]}`}>
      {value}
    </span>
  )
}

function IdCardIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h5M8 14h8" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22a10 10 0 110-20 10 10 0 010 20z" />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22a10 10 0 110-20 10 10 0 010 20z" />
    </svg>
  )
}
