import React from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import UsersTable from '@/components/users/UsersTable'

export default function ManageUsersPage() {
  return (
    <DashboardLayout>
      <Header 
        title="Manage Users" 
        subtitle="Add, edit, and manage system users" 
      />

      <UsersTable />
    </DashboardLayout>
  )
}