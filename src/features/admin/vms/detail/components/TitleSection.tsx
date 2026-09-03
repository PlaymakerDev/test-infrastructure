"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'

interface Props {
  data?: APIResponseVMSDetail
  isWarranty?: boolean
  isOnline?: boolean
  /** Opens the นำออกเอกสาร dialog — rendered far-right on the AnyDesk row. */
  onExport?: () => void
}

/** Migrated from a bespoke header to the shared DetailTitleSection
 *  (2026-09-02, while adding the export button) — per the CLAUDE.md rule that
 *  detail-header export points ride DetailTitleSection's `onExport` prop
 *  instead of hand-rolled buttons. `is_warranty`/`is_online` still travel via
 *  URL query params (documented VMS-detail quirk), not the detail API. */
const TitleSection: React.FC<Props> = (props) => {
  const { data, isWarranty, isOnline, onExport } = props
  const router = useRouter()
  const dispatch = useAppDispatch()

  const point = data?.solution?.geometry_point
  const coord: [number, number] | null =
    point && point.length >= 2 && !(point[0] === 0 && point[1] === 0)
      ? [point[0], point[1]]
      : null

  return (
    <DetailTitleSection
      feature='VMS'
      roadCode={data?.solution?.solution_location?.project_roads?.road?.road_code || '-'}
      installPoint={`VMS >> ${data?.solution?.solution_name || '-'}`}
      onBack={() => router.back()}
      onInfo={() =>
        dispatch(
          setProjectInfoModalOpen({
            open: true,
            project_id: data?.solution?.solution_location?.project_roads?.project_id,
            road_id: data?.solution?.solution_location?.project_roads?.road_id,
          }),
        )
      }
      warranty={{
        label: isWarranty ? 'ในค้ำ' : 'หมดค้ำ',
        color: isWarranty ? '#05F2DB' : '#979797',
      }}
      googleMap={{ coord, keepWhenEmpty: true }}
      anydesk={{ id: data?.solution?.anydesk || undefined }}
      online={{ isOnline: !!isOnline }}
      onExport={onExport}
    />
  )
}

export default React.memo<Props>(TitleSection)
