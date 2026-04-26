import React from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import TargetBeneficiariesPageClient from '@/components/beneficiaries/TargetBeneficiariesPageClient'

export default function TargetBeneficiariesPage() {
  return (
    <DashboardLayout>
      <Header
        title="Target Beneficiaries"
        subtitle="Review proof submissions, approve complete requests, and return incomplete ones for revision"
      />
      <TargetBeneficiariesPageClient />
    </DashboardLayout>
  )
}
