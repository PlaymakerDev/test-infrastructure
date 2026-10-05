"use client"
import React from 'react'
import { notFound, useParams } from 'next/navigation'
import ContractorSummaryScreen from '@/features/admin/settings/contractor-summary/screen'

/** สรุปข้อมูลผู้รับจ้าง — `[id]` is the contractor's user_id. */
const ContractorSummaryPage: React.FC = () => {
  const params = useParams()
  const id = typeof params.id === 'string' ? decodeURIComponent(params.id) : ''
  if (!id) notFound()
  return <ContractorSummaryScreen id={id} />
}

export default ContractorSummaryPage
