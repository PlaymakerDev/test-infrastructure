"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { Button, ConfigProvider } from 'antd'
import { TbArrowBigLeftFilled, TbInfoSquareRoundedFilled } from 'react-icons/tb'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import type { CctvInstallDetail } from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  detail: CctvInstallDetail
}

// Header mirrors the traffic-signal / VMS detail headers (back arrow,
// "<feature> : สายทาง <road>", solution name + ⓘ → central Project Info modal,
// warranty pill, Google Map button). CCTV has fewer fields than those features:
// it's a multi-camera solution, so there's no single AnyDesk id and no single
// online/offline state — those are intentionally omitted ("มีเท่านี้").
const TitleSection: React.FC<Props> = ({ detail }) => {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const isInWarranty = detail.warrantyStatus === 'in-warranty'
  // Match the CCTV feature's own warranty palette (overall table / cards) so
  // the colour stays consistent across overall → detail.
  const warrantyColor = isInWarranty ? '#05F2DB' : '#979797'
  const warrantyLabel = isInWarranty ? 'ในค้ำ' : 'หมดค้ำ'

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/cctv')
    }
  }

  const handleOpenGoogleMap = () => {
    const url =
      detail.googleMapUrl ?? `https://maps.google.com/?q=${detail.coord[1]},${detail.coord[0]}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className='px-3'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2 shrink-0'
          onClick={handleBack}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow) wrap-break-word'>
            CCTV : สายทาง {detail.roadCode || '-'}
          </h1>

          {/* Sub-info row — stacks on mobile, single inline row on sm+ */}
          <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2'>
            <div className='flex items-center gap-2 w-full sm:w-auto min-w-0'>
              <p className='text-white mb-0 truncate'>{detail.location}</p>
              <TbInfoSquareRoundedFilled
                size={24}
                className='text-white cursor-pointer hover:text-(--yellow) shrink-0'
                title='ดูข้อมูลโครงการ'
                onClick={() =>
                  dispatch(
                    setProjectInfoModalOpen({
                      open: true,
                      project_id: detail.projectId ?? null,
                      road_id: detail.roadId ?? null,
                    }),
                  )
                }
              />
            </div>

            {/* Warranty pill */}
            <span
              className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'
              style={{ borderColor: warrantyColor, color: warrantyColor }}
            >
              {warrantyLabel}
            </span>

            {/* Google Map button */}
            <ConfigProvider
              theme={{ token: { colorPrimary: '#1B3F8B', colorTextLightSolid: '#FFFFFF' } }}
            >
              <Button
                type='primary'
                size='middle'
                shape='round'
                className='w-full! sm:w-auto!'
                onClick={handleOpenGoogleMap}
              >
                <p>Google Map</p>
              </Button>
            </ConfigProvider>
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
