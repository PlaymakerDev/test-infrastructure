"use client"
import React from 'react'
import ProjectDetailScreen from '@/features/admin/settings/new-detail/project/screen'
import { useParams } from 'next/navigation'

interface Props {

}

const ProjectDetailPage: React.FC<Props> = (props) => {
  const { } = props
  const params = useParams()

  return <ProjectDetailScreen id={params.id || 'ID_NOT_FOUND'} />
}

export default React.memo<Props>(ProjectDetailPage)
