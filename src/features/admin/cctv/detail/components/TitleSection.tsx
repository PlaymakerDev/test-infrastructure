"use client"
import React, { useMemo } from 'react'
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

  const renderIsWarranty = useMemo(() => {
    const isInWarranty = detail.warrantyStatus === 'in-warranty'
    // Match the CCTV feature's own warranty palette (overall table / cards) so
    // the colour stays consistent across overall → detail.
    const warrantyColor = isInWarranty ? '#05F2DB' : '#979797'
    const warrantyLabel = isInWarranty ? 'ในค้ำ' : 'หมดค้ำ'

    return (
      <span className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border border-[${warrantyColor}] text-[${warrantyColor}] w-full sm:w-auto`}>
        {warrantyLabel}
      </span>
    )
  }, [detail.warrantyStatus])
  return (
    <div className='px-8'>
      <p
        className='block mb-3 lg:hidden text-(--yellow) cursor-pointer'
        onClick={() => router.back()}
      >
        &lt; ย้อนกลับ
      </p>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2 hidden lg:block'
          onClick={() => router.back()}
        />
        <div className='flex-1 min-w-0'>
          <h1 className='text-(--yellow)'>CCTV : สายทาง {detail.roadCode || '-'}</h1>
          <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <p>{detail.location || '-'}</p>
              <TbInfoSquareRoundedFilled
                size={24}
                className='text-white/50 cursor-pointer hover:text-(--yellow)'
                onClick={() =>
                  dispatch(
                    setProjectInfoModalOpen({
                      open: true,
                      project_id: detail.projectId ?? null,
                      road_id: detail.roadId ?? null,
                    }),
                  )
                } />
              {renderIsWarranty}
            </div>
            <ConfigProvider theme={{ token: { colorPrimary: '#1B3F8B', colorTextLightSolid: '#FFFFFF' } }}>
              <Button
                type='primary'
                size='middle'
                shape='round'
                className='w-full sm:w-auto'
                onClick={() => window.open(`https://maps.google.com/?q=${detail.coord[1]},${detail.coord[0]}`, '_blank')}
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
