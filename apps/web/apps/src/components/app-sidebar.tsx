'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldCheck,
  UserPlus,
  House,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { showToast } from '@/lib/toast'
import { Sidebar, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, superadminOnly: false },
  { name: 'Manage Users', href: '/users', icon: Users, superadminOnly: true },
  { name: 'Resident Registration', href: '/resident-registration', icon: UserPlus, superadminOnly: true },
  { name: 'Verified Residents', href: '/verified-residents', icon: UserCheck, superadminOnly: true },
  { name: 'Code Generation', href: '/code-generation', icon: ShieldCheck, superadminOnly: true },
  { name: 'Households', href: '/households', icon: House, superadminOnly: false },
  { name: 'Distribution', href: '/distribution', icon: ArrowLeftRight, superadminOnly: false },
  { name: 'Reports', href: '/reports', icon: ChartNoAxesCombined, superadminOnly: false },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, isSuperadmin } = useAuth()
  const { open, toggleSidebar } = useSidebar()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      showToast.info('Signing out...')
      await new Promise((r) => setTimeout(r, 400))
      showToast.success('Logged out successfully.')
      router.replace('/login')
    } catch {
      showToast.error('Logout failed. Please try again.')
      setLoggingOut(false)
    }
  }

  return (
    <Sidebar className="bg-[linear-gradient(to_bottom,#004A1C_0%,#2F7F6A_50%,#8FAE6A_100%)] text-white shadow-xl">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        title={open ? 'Collapse sidebar' : 'Expand sidebar'}
        className="absolute right-0 top-6 z-50 inline-flex h-6 w-6 translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-yellow-400 bg-yellow-500 text-green-900 shadow-sm transition-colors duration-200 hover:bg-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/70"
      >
        {open ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      <div className="flex items-center border-b border-white/10 px-2 py-2">
        <span className="flex w-12 shrink-0 items-center justify-center">
          <Image
            src="/images/Logo1.png"
            alt="Kapit Bisig Logo"
            width={32}
            height={32}
            priority
            className="object-contain"
            style={{ width: 'auto', height: 'auto' }}
          />
        </span>
        <span
          aria-hidden={!open}
          className={cn(
            'overflow-hidden whitespace-nowrap text-sm font-bold tracking-tight text-white transition-[max-width,opacity,transform] duration-200',
            open ? 'max-w-[160px] opacity-100 translate-x-0' : 'max-w-0 opacity-0 -translate-x-2'
          )}
        >
          Kapit Bisig
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {mainNavItems
          .filter((item) => !item.superadminOnly || isSuperadmin)
          .map((item) => (
            <NavItem
              key={item.name}
              href={item.href}
              icon={item.icon}
              isActive={pathname === item.href}
              isOpen={open}
            >
              {item.name}
            </NavItem>
          ))}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-2 py-3">
        <NavItem href="/settings" icon={Settings} isActive={pathname === '/settings'} isOpen={open}>
          Settings
        </NavItem>

        <button
          onClick={() => setShowLogoutModal(true)}
          title={!open ? 'Logout' : undefined}
          className="w-full rounded-xl py-2 pr-2 text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white"
        >
          <span className="flex items-center">
            <span className="flex w-12 shrink-0 items-center justify-center">
              <LogOut className="h-4 w-4" />
            </span>
            <span
              aria-hidden={!open}
              className={cn(
                'overflow-hidden whitespace-nowrap text-xs transition-[max-width,opacity,transform] duration-200',
                open ? 'max-w-[220px] opacity-100 translate-x-0' : 'max-w-0 opacity-0 -translate-x-2'
              )}
            >
              Logout
            </span>
          </span>
        </button>
      </div>

      {showLogoutModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !loggingOut && setShowLogoutModal(false)}
            />
            <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                  <LogOut className="h-7 w-7 text-red-500" />
                </div>
              </div>
              <h3 className="text-center text-lg font-semibold text-gray-900">Confirm Logout</h3>
              <p className="mt-2 text-center text-sm text-gray-500">
                Are you sure you want to log out? You will need to sign in again to access the system.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={loggingOut}
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </Sidebar>
  )
}

function NavItem({
  href,
  icon: Icon,
  isActive,
  isOpen,
  children,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  isOpen: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      title={!isOpen ? String(children) : undefined}
      className={cn(
        'flex items-center rounded-xl py-2 pr-2 transition-colors duration-200',
        isActive ? 'bg-yellow-500 font-semibold text-green-900 shadow-lg' : 'text-white/90 hover:bg-white/10 hover:text-white'
      )}
    >
      <span className="flex w-12 shrink-0 items-center justify-center">
        <Icon className="h-4 w-4" />
      </span>
      <span
        aria-hidden={!isOpen}
        className={cn(
          'overflow-hidden whitespace-nowrap text-xs transition-[max-width,opacity,transform] duration-200',
          isOpen ? 'max-w-[220px] opacity-100 translate-x-0' : 'max-w-0 opacity-0 -translate-x-2'
        )}
      >
        {children}
      </span>
    </Link>
  )
}
