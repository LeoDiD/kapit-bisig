'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import HouseholdProfileModal from './HouseholdProfileModal'

type Priority = 'High' | 'Medium' | 'Low'
type ClaimStatus = 'Pending' | 'Claimed'

type ClaimItem = {
  date: string
  items: string
  verifiedBy: string
  status: 'Claimed'
}

type Household = {
  id: number
  head: string
  address: string
  barangay: string
  members: number
  score: number
  priority: Priority
  status: ClaimStatus
  lastClaimedMonthDay: string
  lastClaimedYear: string
  contact?: string
  riskFactors?: string[]
  claimHistory?: ClaimItem[]
}

type FilterPriority = 'All' | Priority

const PRIORITY_OPTIONS: { value: FilterPriority; label: string }[] = [
  { value: 'All', label: 'All Priorities' },
  { value: 'High', label: 'High Priority' },
  { value: 'Medium', label: 'Medium Priority' },
  { value: 'Low', label: 'Low Priority' },
]

export default function HouseholdsTable() {
  // Row menu (3 dots)
  const [activeRowMenu, setActiveRowMenu] = useState<number | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const rowMenuRef = useRef<HTMLDivElement>(null)

  // Modal
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filters
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityOpen, setPriorityOpen] = useState(false)
  const priorityBtnRef = useRef<HTMLButtonElement>(null)
  const priorityMenuRef = useRef<HTMLDivElement>(null)

  const households: Household[] = [
    {
      id: 1,
      head: 'Bryle Agra',
      address: '123 Rizal Street',
      barangay: 'Barangay San Jose',
      members: 7,
      score: 92,
      priority: 'High',
      status: 'Pending',
      lastClaimedMonthDay: 'January 12,',
      lastClaimedYear: '2026',
      contact: '09171234567',
      riskFactors: ['Senior Citizen', 'PWD Member', 'Flood Prone Area'],
      claimHistory: [],
    },
    {
      id: 2,
      head: 'Jachin Aliman',
      address: '456 Mabini Street',
      barangay: 'Barangay Santo Nino',
      members: 5,
      score: 88,
      priority: 'High',
      status: 'Pending',
      lastClaimedMonthDay: 'January 12,',
      lastClaimedYear: '2026',
      contact: '09189876543',
      riskFactors: ['Single Parent', 'Low Income'],
      claimHistory: [],
    },
    {
      id: 3,
      head: 'Peter Arenas',
      address: '789 Bonifacio Street',
      barangay: 'Barangay San Jose',
      members: 4,
      score: 65,
      priority: 'Medium',
      status: 'Claimed',
      lastClaimedMonthDay: 'January 12,',
      lastClaimedYear: '2026',
      contact: '09205554444',
      riskFactors: ['Large Family'],
      claimHistory: [
        {
          date: 'January 12, 2026',
          items: '2 packs Rice (5kg)   +   6 cans Canned Goods',
          verifiedBy: 'Emman Pogi',
          status: 'Claimed',
        },
        {
          date: 'January 12, 2026',
          items: '2 packs Rice   +   6 cans Canned Goods',
          verifiedBy: 'Emman Pogi',
          status: 'Claimed',
        },
      ],
    },
    {
      id: 4,
      head: 'Emmanuel De Vera',
      address: '321 Rizal Street',
      barangay: 'Barangay San Jose',
      members: 6,
      score: 58,
      priority: 'Medium',
      status: 'Pending',
      lastClaimedMonthDay: 'January 12,',
      lastClaimedYear: '2026',
      contact: '09123456789',
      riskFactors: ['Informal settler'],
      claimHistory: [],
    },
    {
      id: 5,
      head: 'Charlie Padilla',
      address: '654 Luna Street',
      barangay: 'Barangay Santo Nino',
      members: 6,
      score: 35,
      priority: 'Low',
      status: 'Pending',
      lastClaimedMonthDay: 'January 12,',
      lastClaimedYear: '2026',
      contact: '09998887777',
      riskFactors: ['None'],
      claimHistory: [],
    },
  ]

  // Close menus on outside click (IMPORTANT: rowMenuRef now wraps the whole menu area)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const t = event.target as Node

      // close row menu
      if (rowMenuRef.current && !rowMenuRef.current.contains(t)) {
        setActiveRowMenu(null)
      }

      // close priority dropdown
      const inPriorityBtn = priorityBtnRef.current?.contains(t)
      const inPriorityMenu = priorityMenuRef.current?.contains(t)
      if (!inPriorityBtn && !inPriorityMenu) {
        setPriorityOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleRowMenu = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (activeRowMenu === id) {
      setActiveRowMenu(null)
      setDropdownPosition(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const menuHeight = 220
    const menuWidth = 224 // w-56 = 14rem = 224px

    const shouldOpenUp = spaceBelow < menuHeight && spaceAbove >= menuHeight

    setDropdownPosition({
      top: shouldOpenUp ? rect.top - menuHeight : rect.bottom + 8,
      left: rect.right - menuWidth,
    })
    setActiveRowMenu(id)
    setPriorityOpen(false)
  }

  const handleViewProfile = (household: Household) => {
    setSelectedHousehold(household)
    setIsModalOpen(true)
    setActiveRowMenu(null)
  }

  const filteredHouseholds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return households.filter((item) => {
      const matchesPriority = filterPriority === 'All' || item.priority === filterPriority
      const matchesSearch =
        !q ||
        item.head.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.barangay.toLowerCase().includes(q)

      return matchesPriority && matchesSearch
    })
  }, [households, filterPriority, searchQuery])

  const priorityLabel =
    PRIORITY_OPTIONS.find((o) => o.value === filterPriority)?.label ?? 'All Priorities'

  return (
    <>
      {/* Search + Priority Dropdown */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4 items-stretch lg:items-center">
        <div className="relative flex-1 max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search households..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-800 placeholder-gray-400"
          />
        </div>

        <div className="relative min-w-[210px]">
          <button
            ref={priorityBtnRef}
            type="button"
            onClick={() => {
              setPriorityOpen((v) => !v)
              setActiveRowMenu(null)
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-gray-700"
          >
            <span className="text-sm">{priorityLabel}</span>
            <ChevronDownIcon />
          </button>

          {priorityOpen && (
            <DropdownMenu
              menuRef={priorityMenuRef}
              items={PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              selected={filterPriority}
              onSelect={(v) => {
                setFilterPriority(v as FilterPriority)
                setPriorityOpen(false)
              }}
            />
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-fixed min-w-[1000px] lg:min-w-0">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="px-4 py-4 font-medium w-[20%]">Family Head</th>
                <th className="px-4 py-4 font-medium w-[15%]">Barangay</th>
                <th className="px-4 py-4 font-medium w-[10%] leading-tight">
                  Family
                  <br />
                  Members
                </th>
                <th className="px-4 py-4 font-medium w-[10%]">AI Score</th>
                <th className="px-4 py-4 font-medium w-[15%]">Priority Level</th>
                <th className="px-4 py-4 font-medium w-[12%]">Status</th>
                <th className="px-4 py-4 font-medium w-[12%] leading-tight">
                  Last
                  <br />
                  Claimed
                </th>
                <th className="px-4 py-4 font-medium w-[6%]"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredHouseholds.length ? (
                filteredHouseholds.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 relative">
                    <td className="px-4 py-4 whitespace-normal break-words">
                      <div>
                        <p className="font-medium text-gray-800">{item.head}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <LocationIcon />
                          <span className="truncate">{item.address}</span>
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-600 whitespace-normal break-words">
                      {item.barangay}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <UsersMiniIcon />
                        {item.members}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-gray-600 font-medium">{item.score}</span>
                      <span className="text-gray-400 text-xs">/100</span>
                    </td>

                    <td className="px-4 py-4">
                      <PriorityBadge priority={item.priority} />
                    </td>

                    <td className="px-4 py-4">
                      <ClaimStatusBadge status={item.status} />
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {item.lastClaimedMonthDay}
                      <p className="text-sm text-gray-500">{item.lastClaimedYear}</p>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={(e) => toggleRowMenu(item.id, e)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <DotsIcon />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No households found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed position dropdown menu - renders outside table to avoid scroll issues */}
      {activeRowMenu !== null && dropdownPosition && (
        <div
          ref={rowMenuRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
          className="w-56 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-200 overflow-hidden"
        >
          <div className="py-2 flex flex-col">
            {filteredHouseholds.find((h) => h.id === activeRowMenu) && (
              <>
                <MenuItem
                  icon={<EyeIcon />}
                  label="View Profile"
                  onClick={() => {
                    const household = filteredHouseholds.find((h) => h.id === activeRowMenu)
                    if (household) handleViewProfile(household)
                  }}
                />
                <MenuItem
                  icon={<QrIcon />}
                  label="Show QR Code"
                  onClick={() => {
                    setActiveRowMenu(null)
                    setDropdownPosition(null)
                  }}
                />
                <MenuItem
                  icon={<BoxIcon />}
                  label="Assign Relief"
                  onClick={() => {
                    setActiveRowMenu(null)
                    setDropdownPosition(null)
                  }}
                />
                <MenuItem
                  icon={<EditIcon />}
                  label="Edit"
                  onClick={() => {
                    setActiveRowMenu(null)
                    setDropdownPosition(null)
                  }}
                />
                <MenuItem
                  icon={<TrashIcon />}
                  label="Delete"
                  tone="danger"
                  onClick={() => {
                    setActiveRowMenu(null)
                    setDropdownPosition(null)
                  }}
                />
              </>
            )}
          </div>
        </div>
      )}

      <HouseholdProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedHousehold}
      />
    </>
  )
}

/* ---------- Dropdown + Menu ---------- */

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
              {isSelected ? <CheckIcon /> : null}
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
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
}) {
  const cls =
    tone === 'danger'
      ? 'text-red-500 hover:bg-red-50'
      : 'text-gray-700 hover:bg-gray-50'
  const iconCls = tone === 'danger' ? 'text-red-500' : 'text-gray-500'

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

/* ---------- Badges ---------- */

function PriorityBadge({ priority }: { priority: Priority }) {
  const style =
    priority === 'High'
      ? 'bg-[#DC2626] text-white'
      : priority === 'Medium'
      ? 'bg-[#EAB308] text-white'
      : 'bg-green-600 text-white'

  const label =
    priority === 'High' ? 'High Priority' : priority === 'Medium' ? 'Medium' : 'Low'

  return (
    <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium min-w-[92px] ${style}`}>
      {label}
    </span>
  )
}

function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const style = status === 'Claimed' ? 'bg-green-600 text-white' : 'bg-[#EAB308] text-white'
  return (
    <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full text-xs fontளம்  font-medium ${style}`}>
      {status}
    </span>
  )
}

/* ---------- Icons ---------- */

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function LocationIcon() {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function UsersMiniIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function DotsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
function QrIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h3v3H7V7zM14 7h3v3h-3V7zM7 14h3v3H7v-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14h1v1h-1v-1zM16 16h1v1h-1v-1zM18 14h-1v1h1v3h-3v-1h-1v-3h2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6z" />
    </svg>
  )
}
function BoxIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8v8l9 5 9-5V8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13v8" />
    </svg>
  )
}
function EditIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 14.536A2 2 0 0111.122 15H9v-2.122A2 2 0 019.586 11z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19H5" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 11v6M14 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
    </svg>
  )
}
