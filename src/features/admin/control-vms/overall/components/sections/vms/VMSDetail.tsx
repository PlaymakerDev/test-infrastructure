import React, { useMemo } from 'react'
import { TbCalendarEvent, TbClipboard, TbClipboardCopy, TbFileDescription, TbHourglass, TbLock, TbUserCircle } from 'react-icons/tb'
import { useControlVMSContext } from '../../../context'
import { useQuery } from '@tanstack/react-query'
import { getContactDetailAPI } from '@/services/routes/SharedService'
import { Empty, Skeleton } from 'antd'
import { WARRANTY_STATUS } from '@/constants'

interface Props {

}

const VMSDetail: React.FC<Props> = (props) => {
  const { } = props
  const { bureauSign } = useControlVMSContext()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contact_detail', bureauSign?.project.id],
    queryFn: () => getContactDetailAPI(String(bureauSign?.project.id)!),
    enabled: !!bureauSign?.project.id,
    // placeholderData: keepPreviousData
  })

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูลโครงการ" />
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4'>
        {/* <div className='flex flex-col items-center text-center'>
          <TbLock className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>รหัสโครงการ</p>
          <p className='text-white mb-0'>MT25029</p>
        </div> */}

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
          <TbHourglass className={`fs-22 text-(${WARRANTY_STATUS[data?.data.warranty_status as keyof typeof WARRANTY_STATUS]?.color}) mb-2`} />
          <p className='fs-12 text-gray-400 mb-0.5'>ระยะเวลาที่เหลือ</p>
          <p className={`text-(${WARRANTY_STATUS[data?.data.warranty_status as keyof typeof WARRANTY_STATUS]?.color}) mb-0`}>
            {data?.data.warranty_date || 0} วัน
          </p>
        </div>
      </div>
    )
  }, [isLoading, isError, data])

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

export default React.memo<Props>(VMSDetail)
