"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { Button, ConfigProvider, Skeleton } from 'antd'
import { TbArrowBigLeftFilled, TbInfoSquareRoundedFilled, TbPrinter } from 'react-icons/tb'
import ContractorCountPills from '@/features/admin/settings/overall/components/new-contact/ContractorCountPills'
import type { ContractorData } from '@/types/manage/contractor-api'

interface Props {
  contractor: ContractorData | null | undefined
  isLoading: boolean
  onOpenInfo: () => void
  onExport: () => void
}

/** Page title + the contractor's name, ⓘ, the same three count pills as the
 *  ผู้รับจ้าง tab, and นำออกเอกสาร. */
const SummaryHeader: React.FC<Props> = ({ contractor, isLoading, onOpenInfo, onExport }) => {
  const router = useRouter()

  return (
    <div>
      <p className='fs-14 block mb-3 lg:hidden text-(--yellow) cursor-pointer' onClick={() => router.back()}>
        &lt; ย้อนกลับ
      </p>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2 hidden lg:block shrink-0'
          onClick={() => router.back()}
        />
        <div className='min-w-0'>
          <h1 className='fs-h1 text-(--yellow)'>สรุปข้อมูลผู้รับจ้าง</h1>
          <p className='fs-14 text-(--yellow)'>การจัดการข้อมูลพื้นฐานของระบบ</p>
        </div>
      </section>

      <section className='mt-6 lg:pl-10'>
        {isLoading ? (
          <Skeleton.Input active size='large' style={{ width: 420 }} />
        ) : contractor ? (
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-2 min-w-0'>
              <h2 className='fs-h2 mb-0 font-bold'>{contractor.company_name || '-'}</h2>
              <TbInfoSquareRoundedFilled
                size={26}
                title='ดูข้อมูลผู้รับจ้าง'
                className='text-white cursor-pointer hover:text-(--yellow) shrink-0'
                onClick={onOpenInfo}
              />
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <ContractorCountPills item={contractor} />
            </div>
            {/* Same button as the ผู้รับจ้าง tab's toolbar. */}
            <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
              <Button type='primary' shape='round' icon={<TbPrinter />} onClick={onExport}>
                <span className='fs-12 whitespace-nowrap'>นำออกเอกสาร</span>
              </Button>
            </ConfigProvider>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default React.memo<Props>(SummaryHeader)
