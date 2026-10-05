"use client"
import React from 'react'
import LPRDetailScreen from '@/features/admin/lpr/detail/screen'
import { notFound, useParams } from 'next/navigation'

interface Props {

}

const LPRDetailPage: React.FC<Props> = (props) => {
  const { } = props
  const params = useParams()

  if (!params.id) notFound()

  return (
    <LPRDetailScreen id={params.id} />
  )
}

export default React.memo<Props>(LPRDetailPage)
