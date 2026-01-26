'use client'

import React, { useState, useEffect, useRef } from 'react'
import AddItemModal from './AddItemModal'

export default function InventoryTable() {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Dropdown States
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [dropdownOpenUp, setDropdownOpenUp] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // --- TOGGLE DROPDOWN LOGIC ---
  const toggleDropdown = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    
    if (activeDropdown === id) {
      setActiveDropdown(null)
      return
    }

    // Dynamic Positioning Logic
    const buttonRect = e.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - buttonRect.bottom
    const menuHeight = 160 // Approximate height for 3 items
    
    setDropdownOpenUp(spaceBelow < menuHeight)
    setActiveDropdown(id)
  }

  // --- DATA ---
  const items = [
    { id: 1, name: 'Rice (5kg)', category: 'Food', quantity: '500 packs', stockLevel: 80, minStock: '100 packs', status: 'Good', lastRestocked: 'January 12, 2026', iconColor: 'bg-green-100 text-green-600' },
    { id: 2, name: 'Canned Goods', category: 'Food', quantity: '1,200 cans', stockLevel: 90, minStock: '200 cans', status: 'Good', lastRestocked: 'January 10, 2026', iconColor: 'bg-green-100 text-green-600' },
    { id: 3, name: 'Bottled Water', category: 'Beverage', quantity: '800 bottles', stockLevel: 75, minStock: '150 bottles', status: 'Good', lastRestocked: 'January 9, 2026', iconColor: 'bg-green-100 text-green-600' },
    { id: 4, name: 'Medicine Kit', category: 'Medical', quantity: '45 kits', stockLevel: 25, minStock: '30 pieces', status: 'Low Stock', lastRestocked: 'January 8, 2026', iconColor: 'bg-green-100 text-green-600' },
    { id: 5, name: 'Blankets', category: 'Non Food', quantity: '150 pieces', stockLevel: 85, minStock: '50 kits', status: 'Good', lastRestocked: 'January 7, 2026', iconColor: 'bg-green-100 text-green-600' },
    { id: 6, name: 'Hygiene Kits', category: 'Non Food', quantity: '280 kits', stockLevel: 80, minStock: '80 kits', status: 'Good', lastRestocked: 'January 11, 2026', iconColor: 'bg-green-100 text-green-600' },
  ]

  // --- FILTER LOGIC ---
  const filteredItems = items.filter((item) => {
    const matchesCategory = filterCategory === 'All' || (filterCategory === 'Non Food' ? item.category === 'Non Food' : item.category === filterCategory)
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Search and Action Header */}
        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input 
                type="text" 
                placeholder="Search Items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-800 placeholder-gray-400"
              />
            </div>
            
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-green-500 text-gray-600 min-w-[160px]"
            >
              <option value="All">All Categories</option>
              <option value="Food">Food</option>
              <option value="Medical">Medical</option>
              <option value="Beverage">Beverage</option>
              <option value="Non Food">Non Food</option>
            </select>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#0F533A] hover:bg-[#0a3f2c] text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Item
          </button>
        </div>

        {/* Table Content */}
        {/* Changed to overflow-visible to allow dropdowns to pop out properly */}
        <div className="overflow-visible"> 
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Item Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Quantity</th>
                <th className="px-6 py-4 font-medium">Stock Level</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Last Restocked</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 relative">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.iconColor}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-600 bg-white">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.quantity}</td>
                    <td className="px-6 py-4 w-48">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div 
                          className={`h-2 rounded-full ${item.status === 'Low Stock' ? 'bg-red-500' : 'bg-[#0F533A]'}`} 
                          style={{ width: `${item.stockLevel}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400">Min: {item.minStock}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {item.lastRestocked}
                    </td>

                    {/* Action Column with Dropdown */}
                    <td className="px-6 py-4 text-right relative">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={(e) => toggleDropdown(item.id, e)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </button>

                        {activeDropdown === item.id && (
                          <div 
                            ref={menuRef}
                            className={`absolute right-0 w-48 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 z-50 overflow-hidden ${
                              dropdownOpenUp ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'
                            }`}
                          >
                            <div className="py-2 flex flex-col">
                              <MenuItem icon={<RestockIcon/>} label="Restock" />
                              <MenuItem icon={<EditIcon/>} label="Edit" />
                              <MenuItem icon={<DeleteIcon/>} label="Delete" variant="danger" />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddItemModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </>
  )
}

// --- HELPER COMPONENTS & ICONS ---

function MenuItem({ icon, label, variant = 'default' }: { icon: React.ReactNode, label: string, variant?: 'default' | 'danger' }) {
  const textColor = variant === 'danger' ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
  return (
    <button className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${textColor}`}>
      <span className={variant === 'danger' ? 'text-red-500' : 'text-gray-500'}>
        {icon}
      </span>
      {label}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isLow = status === 'Low Stock'
  return (
    <span className={`
      inline-block px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap text-center min-w-[100px]
      ${isLow ? 'bg-[#DC2626] text-white' : 'bg-green-500 text-white'}
    `}>
      {status}
    </span>
  )
}

function RestockIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
}
function EditIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
}
function DeleteIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
}