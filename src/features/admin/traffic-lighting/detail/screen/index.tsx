"use client"
import React from 'react'
import { Alert, Button, Spin } from 'antd'
import { DetailProvider } from '../context'
import { resolveLightingImei } from '@/features/admin/traffic-lighting/shared/lightingDetailNavigation'
import { useLightingProject } from '@/features/admin/traffic-lighting/shared/useLightingProject'
import PhaseLayout from '../layouts/PhaseLayout'
import TrafficLightingMinimumFontSize from '../../shared/TrafficLightingMinimumFontSize'

interface Props {
  id: string
  imeiParam?: string
  typeParam?: string
}

const TrafficLightingDetailScreen: React.FC<Props> = ({ id, imeiParam, typeParam }) => {
  const requestedImei = resolveLightingImei(id, imeiParam)
  const type = typeParam?.trim() || null
  const projectQuery = useLightingProject(id, requestedImei, type)
  const { project } = projectQuery
  const imei = requestedImei || project.imei || ''

  if (projectQuery.isLoading) {
    return (
      <div className='main-screen min-h-64 flex items-center justify-center'>
        <Spin />
      </div>
    )
  }

  return (
    <DetailProvider project={project} imei={imei}>
      <div className='main-screen traffic-lighting-font-min-14'>
        <TrafficLightingMinimumFontSize />
        {projectQuery.isError && (
          <Alert
            className='mx-10 mb-4'
            type='error'
            showIcon
            message='ไม่สามารถโหลดข้อมูลโครงการได้'
            action={<Button size='small' onClick={projectQuery.refetch}>ลองใหม่</Button>}
          />
        )}
        <PhaseLayout />
      </div>
    </DetailProvider>
  )
}

export default React.memo(TrafficLightingDetailScreen)
