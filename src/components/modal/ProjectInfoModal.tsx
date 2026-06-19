import { getContactDetailAPI, getDepartmentByRoadAPI } from '@/services/routes/SharedService'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { APIResponseContactDetail } from '@/types/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ConfigProvider, Empty, Modal, Skeleton } from 'antd'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import { TbCalendarEvent, TbFileDescription, TbHourglass, TbLock, TbUser, TbUserShield } from 'react-icons/tb'

interface Props {

}

interface ContentProps {
  data?: APIResponseContactDetail
  roadId?: number | string | null;
}

const Content = (props: ContentProps) => {
  const { data, roadId } = props

  const { data: roadData, isLoading: roadLoading, isError: roadError } = useQuery({
    queryKey: ['road_detail'],
    queryFn: () => getDepartmentByRoadAPI({ road_id: Number(roadId)! }),
    enabled: !!roadId,
    placeholderData: keepPreviousData
  })

  const warrantyDays = (() => {
    if (!data?.warranty_start_date || !data?.warranty_end_date) return null
    const diff = dayjs(data.warranty_end_date, 'DD MMMM YYYY').diff(dayjs(data.warranty_start_date, 'DD MMMM YYYY'), 'day')
    if (diff <= 0) return "สิ้นสุดการรับประกัน"
    return isNaN(diff) ? null : diff
  })()

  const renderDepartmentName = useMemo(() => {
    if (roadLoading) return <Skeleton loading={roadLoading} active paragraph={false} />
    if (roadError) return <span className='text-red-500'>-</span>
    return roadData?.data.department_name || '-'
  }, [roadData, roadLoading, roadError])

  return (
    <>
      <div className='mb-5'>
        <p className='fs-12'>{data?.project_name || '-'}</p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-4'>
        <div className='flex flex-col items-center text-center'>
          <TbLock className='fs-22 text-white mb-2' />
          <p className='fs-11 text-gray-400 mb-0.5'>รหัสโครงการ</p>
          <p className='fs-12 text-white mb-0'>{data?.id || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbFileDescription className='fs-22 text-white mb-2' />
          <p className='fs-11 text-gray-400 mb-0.5'>เลขที่สัญญา</p>
          <p className='fs-12 text-white mb-0'>{data?.contract_no || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbUserShield className='fs-22 text-white mb-2' />
          <p className='fs-11 text-gray-400 mb-0.5'>หน่วยงานรับผิดชอบ</p>
          <p className='fs-12 text-white mb-0'>{renderDepartmentName}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbUser className='fs-22 text-white mb-2' />
          <p className='fs-11 text-gray-400 mb-0.5'>ผู้ว่าจ้าง</p>
          <p className='fs-12 text-white mb-0'>{data?.department_name || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbCalendarEvent className='fs-22 text-white mb-2' />
          <p className='fs-11 text-gray-400 mb-0.5'>เริ่มต้นการรับประกัน</p>
          <p className='fs-12 text-white mb-0'>{data?.warranty_start_date || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbCalendarEvent className='fs-22 text-white mb-2' />
          <p className='fs-11 text-gray-400 mb-0.5'>สิ้นสุดการรับประกัน</p>
          <p className='fs-12 text-white mb-0'>{data?.warranty_end_date || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbHourglass className={`fs-22 ${(warrantyDays !== "สิ้นสุดการรับประกัน" && warrantyDays !== null) ? 'text-teal-400' : 'text-red-400'} mb-2`} />
          <p className='fs-11 text-gray-400 mb-0.5'>ระยะเวลาที่เหลือ</p>
          <p className={`fs-12 ${(warrantyDays !== "สิ้นสุดการรับประกัน" && warrantyDays !== null) ? 'text-teal-400' : 'text-red-400'} mb-0`}>
            {warrantyDays !== null ? `${warrantyDays} วัน` : warrantyDays === "สิ้นสุดการรับประกัน" ? "สิ้นสุดการรับประกัน" : '-'}
          </p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbCalendarEvent className='fs-22 text-white mb-2' />
          <p className='fs-11 text-gray-400 mb-0.5'>ผู้รับจ้าง</p>
          <p className='fs-12 text-white mb-0'>{data?.company_name || '-'}</p>
        </div>
      </div>
    </>
  )
}

const ProjectInfoModal: React.FC<Props> = (props) => {
  const { } = props
  const { open, project_id, road_id } = useAppSelector(state => state.layout.project_info_modal)
  const dispatch = useAppDispatch()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contact_detail'],
    queryFn: () => getContactDetailAPI(String(project_id)!),
    enabled: !!project_id,
    placeholderData: keepPreviousData
  })

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูลกล้องวงจรปิด" />
    return <Content data={data?.data} roadId={road_id} />
  }, [isLoading, isError, data, road_id])


  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#FFFFFF',
          }
        }
      }}>
      <Modal
        title="ข้อมูลโครงการ"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={() => dispatch(resetProjectInfoModalOpen())}
        onCancel={() => dispatch(resetProjectInfoModalOpen())}
        footer={null}
        destroyOnHidden
        classNames={{
          container: 'border-2! border-(--default-blue)!'
        }}
        width={800}
      >
        {renderContent}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ProjectInfoModal)
