"use client"
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import ModalInfoTrafficLighting from '@/features/admin/traffic-lighting/overall/components/ModalInfoTrafficLighting'
import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'
import type { TrafficLightingDetailTab } from '../context'
import { useDetailContext } from '../context'
import { FALLBACK_CENTER, useResolvedCoord } from '../../shared/MapLightingDetail'

const TAB_OPTIONS: { label: string; value: TrafficLightingDetailTab }[] = [
  { label: 'ภาพรวม', value: 'OVERVIEW' },
  { label: 'Lighting 4G IoT Monitor', value: 'IOT_MONITOR' },
  { label: 'รายงานสรุปการทำงาน', value: 'SUMMARY' },
]

const WARRANTY_COLORS = {
  'in-warranty': '#05F2DB',
  expired: '#979797',
  unknown: '#979797',
} as const

const TitleSection: React.FC = () => {
  const router = useRouter()
  const { project, currentTab, setCurrentTab, imei } = useDetailContext()
  const [infoProject, setInfoProject] = useState<TrafficLightingProject | null>(null)
  const warrantyLabel = project.warranty === 'in-warranty'
    ? 'ในค้ำ'
    : project.warranty === 'expired' ? 'หมดค้ำ' : '-'

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/traffic-lighting')
    }
  }

  const resolvedCoord = useResolvedCoord(project.coord, imei)

  const coords = useMemo<[number, number][]>(
    () => (resolvedCoord ? [resolvedCoord] : []),
    [resolvedCoord],
  )

  console.log(coords)

  return (
    <>
      <DetailTitleSection
        feature='Street Light'
        roadCode={project.roadCode}
        installPoint={project.installPoint}
        onBack={handleBack}
        onInfo={() => setInfoProject(project)}
        warranty={{
          label: warrantyLabel,
          color: WARRANTY_COLORS[project.warranty],
        }}
        googleMap={{ coord: coords[0] ?? FALLBACK_CENTER }}
        online={{ isOnline: project.connection === 'online' }}
        tabs={{
          options: TAB_OPTIONS,
          defaultActive: 'OVERVIEW',
          activeValue: currentTab,
          onChange: (value) => setCurrentTab(value as TrafficLightingDetailTab),
        }}
      />

      <ModalInfoTrafficLighting
        project={infoProject}
        onClose={() => setInfoProject(null)}
      />
    </>
  )
}

export default React.memo(TitleSection)
