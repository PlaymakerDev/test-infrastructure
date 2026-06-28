"use client"
import React from 'react'
import { DetailProvider } from '../context'
import { buildTrafficLightingProject } from '@/features/admin/traffic-lighting/shared/buildTrafficLightingProject'
import { useLightingDetailBootstrap } from '@/features/admin/traffic-lighting/shared/useLightingDetailBootstrap'
import PhaseLayout from '../layouts/PhaseLayout'

interface Props {
  id: string
}

const TrafficLightingDetailScreen: React.FC<Props> = ({ id }) => {
  const { type, imei, row, ready } = useLightingDetailBootstrap(id)

  if (!ready) return null

  const project = buildTrafficLightingProject(id, row, type || null)

  return (
    <DetailProvider project={project} imei={imei}>
      <div className='main-screen px-3 sm:px-6 xl:px-10 pt-3 pb-6'>
        <PhaseLayout />
      </div>
    </DetailProvider>
  )
}

export default React.memo(TrafficLightingDetailScreen)
