"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import { useDetailContext } from '../context'
import { APIResponseBridgeLightingOverview } from '@/types/bridge-lighting/overall-api'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'

interface Props {
  data?: APIResponseBridgeLightingOverview
  isWarranty?: string | null
  projectId?: string | string[] | null
}

const TitleSection: React.FC<Props> = (props) => {
  const { data, isWarranty, projectId } = props
  const router = useRouter()
  const location = data?.locations[0]
  const dispatch = useAppDispatch()

  const isInWarranty = isWarranty === 'true' ? true : false
  const isOnline = location?.is_online ? true : false

  return (
    <DetailTitleSection
      feature='BridgeLighting'
      roadCode={location?.road.code_name || '-'}
      installPoint={location?.solution.solution_name || '-'}
      onInfo={() =>
        dispatch(
          setProjectInfoModalOpen({
            open: true,
            project_id: projectId ?? null,
            road_id: location?.road.id ?? null,
          }),
        )
      }
      onBack={() => router.back()}
      warranty={{
        label: isInWarranty ? 'ในค้ำ' : 'หมดค้ำ',
        color: isInWarranty ? '#05F2DB' : '#979797',
      }}
      googleMap={{ coord: [Number(location?.geometry_point[0]), Number(location?.geometry_point[1])] }}
      anydesk={{ id: '' }}
      online={{
        isOnline: isOnline
      }}
    />
  )
}

export default React.memo<Props>(TitleSection)
