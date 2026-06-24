import React, { useMemo } from 'react'
import { TbCalendarEvent, TbClipboard, TbFileDescription, TbHourglass, TbUserCircle } from 'react-icons/tb'
import { useControlVMSContext } from '../../../context'
import { Empty, Skeleton } from 'antd'
import { WARRANTY_STATUS } from '@/constants'
import { useContactDetail } from '../../../hooks/useContactDetail'

const DEFAULT_WARRANTY = { text: '-', color: '--light-gray-2' } as const

const VMSDetail: React.FC = () => {
  const { bureauSign } = useControlVMSContext()

  const { data, isLoading, isError } = useContactDetail(bureauSign?.project.id)

  const warranty = WARRANTY_STATUS[data?.data.warranty_status as keyof typeof WARRANTY_STATUS] ?? DEFAULT_WARRANTY

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูลโครงการ" />
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4'>
        <div className='flex flex-col items-center text-center'>
          <TbFileDescription className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>เลขที่สัญญา</p>
          <p className='text-white mb-0'>{data?.data.contract_no || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbUserCircle className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>ผู้รับจ้าง</p>
          <p className='text-white mb-0'>{data?.data.company_name || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbCalendarEvent className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>เริ่มต้นการรับประกัน</p>
          <p className='text-white mb-0'>{data?.data.warranty_start_date || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbCalendarEvent className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>สิ้นสุดการรับประกัน</p>
          <p className='text-white mb-0'>{data?.data.warranty_end_date || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbHourglass
            className='fs-22 mb-2'
            style={{ color: `var(${warranty.color})` }}
          />
          <p className='fs-12 text-gray-400 mb-0.5'>ระยะเวลาที่เหลือ</p>
          <p className='mb-0' style={{ color: `var(${warranty.color})` }}>
            {data?.data.warranty_date || 0} วัน
          </p>
        </div>
      </div>
    )
  }, [isLoading, isError, data, warranty])

  return (
    <div className="h-full bg-(--dark-black) rounded-lg p-5">
      <div className='flex items-center gap-2 mb-5'>
        <TbClipboard className='fs-22 text-blue-400 shrink-0' />
        <h4 className='text-blue-400 mb-0'>ข้อมูลโครงการ</h4>
      </div>

      <div className='mb-5'>
        <p className='fs-12'>{bureauSign?.project.project_name || '-'}</p>
      </div>

      {renderContent}
    </div>
  )
}

export default React.memo(VMSDetail)
