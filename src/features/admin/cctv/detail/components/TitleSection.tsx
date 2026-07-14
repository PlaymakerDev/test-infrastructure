"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import type { CctvInstallDetail } from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  detail: CctvInstallDetail
}

// Header uses the shared DetailTitleSection (back arrow, "<feature> : สายทาง
// <road>", solution name + ⓘ → central Project Info modal, warranty pill,
// Google Map button). CCTV has fewer fields than the analytics features:
// it's a multi-camera solution, so there's no single AnyDesk id and no single
// online/offline state — those are intentionally omitted ("มีเท่านี้").
const TitleSection: React.FC<Props> = ({ detail }) => {
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Match the CCTV feature's own warranty palette (overall table / cards) so
  // the colour stays consistent across overall → detail.
  const isInWarranty = detail.warrantyStatus === 'in-warranty'

  return (
    <DetailTitleSection
      feature='CCTV'
      roadCode={detail.roadCode || '-'}
      installPoint={detail.location || '-'}
      onBack={() => router.back()}
      onInfo={() =>
        dispatch(
          setProjectInfoModalOpen({
            open: true,
            project_id: detail.projectId ?? null,
            road_id: detail.roadId ?? null,
          }),
        )
      }
      warranty={{
        label: isInWarranty ? 'ในค้ำ' : 'หมดค้ำ',
        color: isInWarranty ? '#05F2DB' : '#979797',
      }}
      googleMap={{ coord: detail.coord }}
    />
  )
}

export default React.memo<Props>(TitleSection)
