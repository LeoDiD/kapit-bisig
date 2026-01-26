import React from 'react'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content - Added max-h-[85vh] and flex-col */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
        
        {/* Header - Stays fixed at top */}
        <div className="p-8 pb-2 flex justify-between items-start shrink-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
            <p className="text-gray-500 mt-1">Create a new user account for the relief system</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-8 pt-6 space-y-5 overflow-y-auto">
          
          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Full Name</label>
            <input 
              type="text" 
              placeholder="Enter full name" 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-gray-800 placeholder-gray-400 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
            <input 
              type="email" 
              placeholder="Enter email address" 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-gray-800 placeholder-gray-400 transition-colors"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Role</label>
            <div className="relative">
              <select className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-gray-800 appearance-none cursor-pointer">
                <option value="" disabled selected>Select role</option>
                <option value="Admin">Admin</option>
                <option value="Barangay Official">Barangay Official</option>
                <option value="Volunteer">Volunteer</option>
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </span>
            </div>
          </div>

          {/* Barangay (Optional) */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Barangay (optional)</label>
            <input 
              type="text" 
              placeholder="Enter barangay assignment" 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-gray-800 placeholder-gray-400 transition-colors"
            />
          </div>

        </div>

        {/* Footer Actions - Stays fixed at bottom */}
        <div className="p-8 pt-2 flex justify-end gap-3 shrink-0 bg-white z-10">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            className="px-6 py-3 rounded-xl bg-[#0F533A] text-white font-medium hover:bg-[#0a3f2c] transition-colors shadow-lg shadow-green-900/20"
          >
            Create User
          </button>
        </div>

      </div>
    </div>
  )
}