'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { showToast } from '@/lib/toast'
import { notificationsApi, type NotificationData } from '@/lib/api'

/* ================================================================== */
/*  Notification Bell + Dropdown                                      */
/* ================================================================== */

const ALL_NOTIFICATIONS_PAGE_SIZE = 25

export function NotificationBell() {
  const { user, loading: authLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [showAllModal, setShowAllModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NotificationData | 'all' | null>(null)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [allNotifications, setAllNotifications] = useState<NotificationData[]>([])
  const [allTotal, setAllTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [allLoading, setAllLoading] = useState(false)
  const [allLoadingMore, setAllLoadingMore] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const rateLimitedUntilRef = useRef<number>(0)
  const inFlightRef = useRef(false)
  const bellRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    // Don't fetch if not authenticated
    if (authLoading || !user) return
    if (Date.now() < rateLimitedUntilRef.current) return
    if (inFlightRef.current) return

    inFlightRef.current = true
    setLoading(true)
    try {
      const res = await notificationsApi.getNotifications({ limit: 10 })
      if (res.success && res.data) {
        setNotifications(res.data.notifications)
        setUnreadCount(res.data.unreadCount)
      }
    } catch (err) {
      const e = err as { status?: number }
      if (e.status === 429) {
        // Back off client polling when server rate-limit is reached.
        rateLimitedUntilRef.current = Date.now() + 60_000
      }
    } finally {
      inFlightRef.current = false
      setLoading(false)
    }
  }, [authLoading, user])

  const fetchAllNotifications = useCallback(async (offset = 0, append = false) => {
    if (authLoading || !user) return
    if (append) setAllLoadingMore(true)
    else setAllLoading(true)
    try {
      const res = await notificationsApi.getNotifications({
        limit: ALL_NOTIFICATIONS_PAGE_SIZE,
        offset,
      })
      if (res.success && res.data) {
        setAllNotifications((prev) => {
          if (!append) return res.data!.notifications
          const existingIds = new Set(prev.map((n) => n._id || n.id))
          const incoming = res.data!.notifications.filter((n) => !existingIds.has(n._id || n.id))
          return [...prev, ...incoming]
        })
        setAllTotal(res.data.total)
        setUnreadCount(res.data.unreadCount)
      }
    } catch {
      showToast.error('Failed to load notifications')
    } finally {
      if (append) setAllLoadingMore(false)
      else setAllLoading(false)
    }
  }, [authLoading, user])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  useEffect(() => {
    if (showAllModal) fetchAllNotifications()
  }, [showAllModal, fetchAllNotifications])

  // Poll for unread count every 60 seconds (only when authenticated)
  useEffect(() => {
    if (authLoading || !user) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications, authLoading, user])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [open])

  useEffect(() => {
    if (!showAllModal) return
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleteTarget) setShowAllModal(false)
    }
    document.addEventListener('keydown', keyHandler)
    return () => document.removeEventListener('keydown', keyHandler)
  }, [showAllModal, deleteTarget])

  useEffect(() => {
    if (!deleteTarget) return
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) setDeleteTarget(null)
    }
    document.addEventListener('keydown', keyHandler)
    return () => document.removeEventListener('keydown', keyHandler)
  }, [deleteTarget, deleting])

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifications((n) => n.map((x) => ({ ...x, isRead: true })))
      setAllNotifications((n) => n.map((x) => ({ ...x, isRead: true })))
      setUnreadCount(0)
    } catch {
      showToast.error('Failed to mark all as read')
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id)
      setNotifications((n) => n.map((x) => (x._id === id || x.id === id ? { ...x, isRead: true } : x)))
      setAllNotifications((n) => n.map((x) => (x._id === id || x.id === id ? { ...x, isRead: true } : x)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      //
    }
  }

  const handleDeleteClick = (n: NotificationData) => {
    setDeleteTarget(n)
  }

  const handleDeleteAllClick = () => {
    setDeleteTarget('all')
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget === 'all') {
        await notificationsApi.deleteAllNotifications()
        setNotifications([])
        setAllNotifications([])
        setAllTotal(0)
        setUnreadCount(0)
        showToast.success('All notifications deleted')
      } else {
        const targetId = deleteTarget._id || deleteTarget.id
        const wasUnread = !deleteTarget.isRead
        await notificationsApi.deleteNotification(targetId)
        setNotifications((n) => n.filter((x) => (x._id || x.id) !== targetId))
        setAllNotifications((n) => n.filter((x) => (x._id || x.id) !== targetId))
        setAllTotal((t) => Math.max(0, t - 1))
        if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
        showToast.success('Notification deleted')
      }
      setDeleteTarget(null)
    } catch {
      showToast.error('Failed to delete notification')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-[100] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                  <CheckIcon className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAllClick}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <TrashIcon className="w-3.5 h-3.5" /> Delete all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellOffIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id || n.id}
                  className={`w-full flex items-start gap-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    !n.isRead ? 'bg-green-50/40' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => { if (!n.isRead) handleMarkRead(n._id || n.id) }}
                    className="flex flex-1 items-start gap-3 min-w-0 text-left"
                  >
                    <NotificationTypeIcon type={n.type} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                  <div className="flex items-start gap-1.5 mt-0.5 shrink-0">
                    {!n.isRead && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(n)}
                      className="w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Delete notification"
                      title="Delete notification"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-2.5 text-center">
            <button
              onClick={() => {
                setOpen(false)
                setShowAllModal(true)
              }}
              className="text-xs text-green-600 hover:text-green-700 font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}

      {showAllModal && createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAllModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900">All notifications</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {allTotal} total{unreadCount > 0 ? ` - ${unreadCount} unread` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                  >
                    <CheckIcon className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
                {allTotal > 0 && (
                  <button
                    onClick={handleDeleteAllClick}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <TrashIcon className="w-3.5 h-3.5" /> Delete all
                  </button>
                )}
                <button
                  onClick={() => setShowAllModal(false)}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-label="Close notifications"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(85vh-120px)] overflow-y-auto">
              {allLoading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : allNotifications.length === 0 ? (
                <div className="p-10 text-center">
                  <BellOffIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notifications yet.</p>
                </div>
              ) : (
                allNotifications.map((n) => (
                  <div
                    key={n._id || n.id}
                    className={`w-full flex items-start gap-2 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                      !n.isRead ? 'bg-green-50/40' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => { if (!n.isRead) handleMarkRead(n._id || n.id) }}
                      className="flex flex-1 items-start gap-3 min-w-0 text-left"
                    >
                      <NotificationTypeIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </button>
                    <div className="flex items-start gap-1.5 mt-0.5 shrink-0">
                      {!n.isRead && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(n)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Delete notification"
                        title="Delete notification"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!allLoading && allNotifications.length < allTotal && (
              <div className="border-t border-gray-100 px-5 py-3 text-center">
                <button
                  onClick={() => fetchAllNotifications(allNotifications.length, true)}
                  disabled={allLoadingMore}
                  className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                >
                  {allLoadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => { if (!deleting) setDeleteTarget(null) }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <TrashIcon className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center">
              {deleteTarget === 'all' ? 'Delete all notifications?' : 'Delete notification?'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 text-center">
              {deleteTarget === 'all'
                ? 'This will permanently remove all notifications from your list.'
                : 'This notification will be permanently removed from your list.'}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

/* ================================================================== */
/*  Profile Dropdown                                                  */
/* ================================================================== */

export function ProfileDropdown() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [profileEmail, setProfileEmail] = useState('')
  const displayName = user?.fullName || user?.username || 'User'
  const roleLabel = user?.role === 'SUPERADMIN' ? 'Superadmin' : 'LGU Staff'
  const initial = useMemo(() => {
    const ch = displayName.trim()[0]
    return ch ? ch.toUpperCase() : 'U'
  }, [displayName])

  // Fetch email from profile on mount (only when authenticated)
  useEffect(() => {
    if (!user) return
    import('@/lib/api').then(({ profileApi }) => {
      profileApi.getProfile().then((res) => {
        if (res.success && res.data?.email) {
          setProfileEmail(res.data.email)
        }
      }).catch(() => {})
    })
  }, [user])

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [open])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      showToast.success('Logged out successfully')
      router.replace('/login')
    } catch {
      showToast.error('Logout failed. Please try again.')
      setLoggingOut(false)
    }
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="hidden md:flex shrink-0 items-center gap-3 bg-white dark:bg-slate-800 rounded-xl px-3 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.1)] hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        <div className="w-9 h-9 rounded-full bg-[#0F533A] flex items-center justify-center text-white font-bold text-sm">
          {initial}
        </div>
        <div className="text-right max-w-[160px]">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate whitespace-nowrap">{displayName}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate whitespace-nowrap">{roleLabel}</p>
        </div>
      </button>

      {/* Mobile avatar */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden w-10 h-10 rounded-full bg-[#0F533A] flex items-center justify-center text-white font-bold text-sm outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
      >
        {initial}
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-12 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-[100] overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{displayName}</p>
            {profileEmail && <p className="text-xs text-green-600 truncate">{profileEmail}</p>}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <DropdownItem
              icon={<UserSmIcon className="w-4 h-4" />}
              label="View Profile"
              onClick={() => { setOpen(false); router.push('/settings?tab=account') }}
            />
            <DropdownItem
              icon={<SettingsSmIcon className="w-4 h-4" />}
              label="Settings"
              onClick={() => { setOpen(false); router.push('/settings') }}
            />
            <DropdownItem
              icon={<HelpSmIcon className="w-4 h-4" />}
              label="Help"
              onClick={() => { setOpen(false); router.push('/settings?tab=help') }}
            />
          </div>

          <div className="border-t border-gray-100 dark:border-slate-700 py-1">
            <button
              onClick={() => { setOpen(false); setShowLogoutModal(true) }}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <LogoutSmIcon className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !loggingOut && setShowLogoutModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center">Confirm Logout</h3>
            <p className="mt-2 text-sm text-gray-500 text-center">
              Are you sure you want to log out? You will need to sign in again to access the system.
            </p>
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
    </div>
  )
}

/* ================================================================== */
/*  Time Ago Helper                                                   */
/* ================================================================== */

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const d = new Date(dateStr).getTime()
  const diffMs = now - d
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  return new Date(dateStr).toLocaleDateString()
}

/* ================================================================== */
/*  Notification Type Icon                                            */
/* ================================================================== */

function NotificationTypeIcon({ type }: { type: string }) {
  const base = 'w-9 h-9 rounded-xl flex items-center justify-center shrink-0'
  switch (type) {
    case 'dispatch':
      return <span className={`${base} bg-blue-50`}><TruckIcon className="w-4 h-4 text-blue-600" /></span>
    case 'status_update':
      return <span className={`${base} bg-amber-50`}><AlertIcon className="w-4 h-4 text-amber-600" /></span>
    case 'volunteer':
      return <span className={`${base} bg-green-50`}><UsersIcon className="w-4 h-4 text-green-600" /></span>
    case 'security':
      return <span className={`${base} bg-red-50`}><ShieldIcon className="w-4 h-4 text-red-500" /></span>
    case 'system':
      return <span className={`${base} bg-gray-100`}><InfoIcon className="w-4 h-4 text-gray-600" /></span>
    default:
      return <span className={`${base} bg-gray-100`}><InfoIcon className="w-4 h-4 text-gray-500" /></span>
  }
}

/* ================================================================== */
/*  Dropdown Item                                                     */
/* ================================================================== */

function DropdownItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
    >
      {icon}
      {label}
    </button>
  )
}

/* ================================================================== */
/*  Icons                                                             */
/* ================================================================== */

function BellIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
}

function BellOffIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
}

function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
}

function CloseIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
}

function TrashIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" /></svg>
}

function TruckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
}

function AlertIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
}

function UsersIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
}

function ShieldIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
}

function InfoIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}

function UserSmIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
}

function SettingsSmIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}

function HelpSmIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}

function LogoutSmIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
}
