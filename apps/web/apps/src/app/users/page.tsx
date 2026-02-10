'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { DashboardLayout, Header } from '@/components/layout'
import UsersTable from '@/components/users/UsersTable'

export default function ManageUsersPage() {
  const { user, loading, isSuperadmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
    } else if (!isSuperadmin) {
      router.replace('/dashboard')
    }
  }, [user, loading, isSuperadmin, router])

  // While auth is loading or redirecting, show nothing
  if (loading || !user || !isSuperadmin) return null

  return (
    <DashboardLayout>
      <Header 
        title="Manage Users" 
        subtitle="Add, edit, and manage LGU Staff accounts" 
      />

      <UsersTable />
    </DashboardLayout>
  )
}