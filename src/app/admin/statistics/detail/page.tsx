"use client"
import React from 'react'
import { useSearchParams } from 'next/navigation'
import StatisticsDetailScreen from '@/features/admin/statistics/detail/screen'

const StatisticsDetailPage: React.FC = () => {
  const searchParams = useSearchParams()
  const detail = searchParams.get('detail') || ''

  return <StatisticsDetailScreen detail={detail} />
}

export default StatisticsDetailPage
