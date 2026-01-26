import React from 'react'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-8 pb-2 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add New Inventory Item</h2>
            <p className="text-gray-500 mt-1">Add a new relief supply item to the inventory.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 pt-6 space-y-6">
          
          {/* Item Name */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Item name</label>
            <input 
              type="text" 
              placeholder="e.g., Rice (5kg)" 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-gray-800 placeholder-gray-400 transition-colors"
            />
          </div>

          {/* Row 1: Category & Units */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Category</label>
              <div className="relative">
                <select className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-gray-800 appearance-none cursor-pointer">
                  <option value="" disabled selected>Select category</option>
                  <option value="Food">Food</option>
                  <option value="Medical">Medical</option>
                  <option value="Non Food">Non Food</option>
                  <option value="Beverage">Beverage</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Units</label>
              <input 
                type="text" 
                placeholder="e.g., packs, cans" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-gray-800 placeholder-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Row 2: Initial Quantity & Minimum Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Initial Quantity</label>
              <input 
                type="number" 
                placeholder="0" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-gray-800 placeholder-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Minimum Stock</label>
              <input 
                type="number" 
                placeholder="0" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-gray-800 placeholder-gray-400 transition-colors"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-8 pt-2 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            className="px-6 py-3 rounded-xl bg-[#0F533A] text-white font-medium hover:bg-[#0a3f2c] transition-colors shadow-lg shadow-green-900/20"
          >
            Add Item
          </button>
        </div>

      </div>
    </div>
  )
}