"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import ModalInfoTrafficLighting from '@/features/admin/traffic-lighting/overall/components/ModalInfoTrafficLighting'
import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'
import { useResolvedCoord } from '../../../shared/MapLightingDetail'
import { useLampContext } from '../context'

const WARRANTY_COLORS = {
  'in-warranty': '#05F2DB',
  expired: '#979797',
  unknown: '#979797',
} as const

interface Props {
  /** IMEI, or the solution id of a point without one — finds its position. */
  locationKey: string
  /** Outer horizontal padding, aligned with the page's sections. */
  className?: string
}

/** Lamp header — the shared detail header the phase page uses too (ⓘ, pills
 *  and Google Map the same on every detail page; user 2026-11-05). No tabs:
 *  a lamp point is one screen. */
const LampTitleSection: React.FC<Props> = ({ locationKey, className }) => {
  const router = useRouter()
  const { project } = useLampContext()
  const [infoProject, setInfoProject] = useState<TrafficLightingProject | null>(null)
  const warrantyLabel = project.warranty === 'in-warranty'
    ? 'ในค้ำ'
    : project.warranty === 'expired' ? 'หมดค้ำ' : '-'
  const coord = useResolvedCoord(project.coord, locationKey)

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/traffic-lighting')
    }
  }

  return (
    <>
      <DetailTitleSection
        feature='Street Light'
        roadCode={project.roadCode}
        installPoint={project.installPoint}
        onBack={handleBack}
        onInfo={() => setInfoProject(project)}
        warranty={{ label: warrantyLabel, color: WARRANTY_COLORS[project.warranty] }}
        // No position → the button stays, disabled (not a guessed spot).
        googleMap={{ coord, keepWhenEmpty: true }}
        // Unknown is not offline — no pill rather than a red one.
        online={project.connection === 'unknown' ? undefined : { isOnline: project.connection === 'online' }}
        className={className}
      />

      <ModalInfoTrafficLighting
        project={infoProject}
        onClose={() => setInfoProject(null)}
      />
    </>
  )
}

export default React.memo(LampTitleSection)
