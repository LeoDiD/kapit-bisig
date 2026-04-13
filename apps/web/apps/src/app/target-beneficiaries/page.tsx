import React from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import TargetBeneficiariesPageClient from '@/components/beneficiaries/TargetBeneficiariesPageClient'

export default function TargetBeneficiariesPage() {
  return (
    <DashboardLayout>
      <Header
        title="Target Beneficiaries"
        subtitle="Review event-specific proof submissions and approve eligible residents"
      />
      <TargetBeneficiariesPageClient />
    </DashboardLayout>
  )
}
