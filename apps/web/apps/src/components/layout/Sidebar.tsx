'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

// Navigation items configuration
const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { name: 'Manage Users', href: '/users', icon: UsersIcon },
  { name: 'Verify Residents', href: '/verify-residents', icon: VerifyResidentsIcon },
  { name: 'Households', href: '/households', icon: HouseholdsIcon },
  { name: 'Distribution', href: '/distribution', icon: DistributionIcon },
  { name: 'Blockchain Ledger', href: '/blockchain-ledger', icon: BlockchainIcon },
  { name: 'Reports', href: '/reports', icon: ReportsIcon },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.replace('/login')
  }

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-[linear-gradient(to_bottom,#004A1C_0%,#2F7F6A_50%,#8FAE6A_100%)] text-white flex flex-col shadow-xl z-50 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-48'
      }`}
    >
      {/* Header with Hamburger and Logo */}
      <div className={`p-2 flex items-center gap-2 border-b border-white/10 ${isCollapsed ? 'justify-center' : ''}`}>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          <HamburgerIcon className="w-4 h-4" />
        </button>
        {!isCollapsed && (
          <>
            <Image
              src="/images/logo1.png"
              alt="Kapit-Bisig Logo"
              width={32}
              height={32}
              priority
              className="object-contain shrink-0"
            />
            <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
              Kapit-Bisig
            </span>
          </>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <NavItem
              key={item.name}
              href={item.href}
              icon={item.icon}
              isActive={isActive}
              isCollapsed={isCollapsed}
            >
              {item.name}
            </NavItem>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-2 py-3 border-t border-white/10 space-y-1">
        <NavItem
          href="/settings"
          icon={SettingsIcon}
          isActive={pathname === '/settings'}
          isCollapsed={isCollapsed}
        >
          Settings
        </NavItem>

        {/* Logout button */}
        <button
          onClick={() => setShowLogoutModal(true)}
          title={isCollapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-200 text-white/90 hover:bg-white/10 hover:text-white ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogoutIcon className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="text-xs whitespace-nowrap">Logout</span>}
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !loggingOut && setShowLogoutModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in duration-200">
            {/* Warning icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            {/* Text */}
            <h3 className="text-lg font-semibold text-gray-900 text-center">
              Confirm Logout
            </h3>
            <p className="mt-2 text-sm text-gray-500 text-center">
              Are you sure you want to log out? You will need to sign in again to access the system.
            </p>
            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loggingOut ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Logging out…
                  </>
                ) : (
                  'Logout'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  )
}

// NavItem Component
interface NavItemProps {
  href: string
  icon: React.FC<{ className?: string }>
  isActive: boolean
  isCollapsed: boolean
  children: React.ReactNode
}

function NavItem({ href, icon: Icon, isActive, isCollapsed, children }: NavItemProps) {
  return (
    <Link
      href={href}
      title={isCollapsed ? String(children) : undefined}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-yellow-500 text-green-900 font-semibold shadow-lg'
          : 'text-white/90 hover:bg-white/10 hover:text-white' 
      } ${isCollapsed ? 'justify-center' : ''}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!isCollapsed && <span className="text-xs whitespace-nowrap">{children}</span>}
    </Link>
  )
}

// --- Icon Components ---

function HamburgerIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
}
function DashboardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
}
function UsersIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
}
function VerifyResidentsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
}
function HouseholdsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function DistributionIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
}
function BlockchainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6" />
    </svg>
  )
}
function ReportsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function LogoutIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
}