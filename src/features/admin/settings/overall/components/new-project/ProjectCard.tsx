import { useAppDispatch } from '@/stores/hooks'
import { setProjectModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { APIResponseProjectList, ProjectDepartmentData, ProjectListData } from '@/types/manage/project-api'
import { CaretRightOutlined } from '@ant-design/icons'
import { Collapse, Empty, TableProps, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import React, { useCallback, useMemo } from 'react'
import { TbCalendarWeekFilled, TbHourglassHigh, TbPencilMinus, TbTrash } from 'react-icons/tb'

interface Props {
  data?: ProjectDepartmentData
  item?: ProjectListData
}

const ProjectCard: React.FC<Props> = (props) => {
  const { data, item } = props
  const router = useRouter()
  const dispatch = useAppDispatch()

  const onOpenProjectModal = useCallback((type: 'UPDATE' | 'DELETE') => {
    if (item) dispatch(setProjectModalOpen({ open: true, type, data: item }))
  }, [dispatch, item])

  const warrantyClassName = useMemo(() => {
    let className = 'text-white'
    if (dayjs().isBefore(dayjs(item?.warranty_start_date))) {
      className = 'text-[#66AEFF]'
    } else {
      if (item?.is_warranty) {
        className = 'text-[#05F2DB]'
      } else {
        className = 'text-[#FF6666]'
      }
    }
    return className
  }, [item?.warranty_start_date, item?.is_warranty])

  const renderWarrantyDuration = useMemo(() => {
    if (dayjs().isBefore(dayjs(item?.warranty_start_date))) {
      return {
        remaining_days: '0 วัน',
        remaining_status: 'ระยะเวลาที่เหลือ',
        warranty_status: 'ระหว่างส่งมอบ'
      }
    } else {
      if (item?.is_warranty) {
        return {
          remaining_days: dayjs(item?.warranty_end_date).diff(dayjs(item?.warranty_start_date), 'day') + ' วัน',
          remaining_status: 'ระยะเวลาที่เหลือ',
          warranty_status: 'ในค้ำ'
        }
      } else {
        return {
          remaining_days: '0 วัน',
          remaining_status: 'หมดค้ำประกัน',
          warranty_status: 'หมดค้ำ'
        }
      }
    }
  }, [item?.warranty_start_date, item?.warranty_end_date, item?.is_warranty])

  return (
    <div className="rounded-xl p-5 bg-(--gray)">
      <section>
        <div className='flex items-center justify-between gap-1.5'>
          <span
            className='inline-flex items-center justify-center px-3 py-0.5 rounded-full fs-12 whitespace-nowrap'
            style={{ border: `1px solid var(--default-blue)`, color: 'var(--default-blue)' }}
          >
            {item?.department.department_short_name || '-'}
          </span>
          <div className='flex items-center gap-2 shrink-0'>
            <TbPencilMinus
              className='fs-22 text-orange-300 cursor-pointer'
              title='แก้ไขข้อมูลโครงการ'
              onClick={() => onOpenProjectModal('UPDATE')}
            />
            <TbTrash
              className='fs-22 text-red-500 cursor-pointer'
              title='ลบโครงการ'
              onClick={() => onOpenProjectModal('DELETE')}
            />
          </div>
        </div>
      </section>
      <section className='mt-3'>
        <h4 className='text-(--yellow) font-normal!'>
          {item?.contractor.contractor.company_name || '-'}
        </h4>
        <div className="mt-1.5">
          <Tooltip title="กดเพื่อดูรายละเอียด">
            <p
              className='line-clamp-2 cursor-pointer hover:text-(--yellow) transition-colors duration-200'
              onClick={() => router.push(`/admin/settings/detail/project/${item?.id}`)}
            >
              <span className='text-white/50'>ชื่อโครงการ:</span> {item?.project_name || '-'}
            </p>
          </Tooltip>
          <p><span className='text-white/50'>รหัสโครงการ:</span> {item?.project_no || '-'}</p>
          <p><span className='text-white/50'>เลขที่สัญญา:</span> {item?.contract_no || '-'}</p>
          <p><span className='text-white/50'>สถานะการค้ำประกัน:</span> <span className={warrantyClassName}>{renderWarrantyDuration.warranty_status || '-'}</span></p>
        </div>
      </section>
      <section className='mt-3'>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className='flex flex-col justify-start items-center'>
            <TbCalendarWeekFilled className='fs-24' />
            <h3>{item?.warranty_start_date ? dayjs(item?.warranty_start_date).format('DD MMM BBBB') : '-'}</h3>
            <p className='fs-12 text-white/50'>เริ่มต้นการรับประกัน</p>
          </div>
          <div className='flex flex-col justify-start items-center'>
            <TbCalendarWeekFilled className='fs-24' />
            <h3>{item?.warranty_end_date ? dayjs(item?.warranty_end_date).format('DD MMM BBBB') : '-'}</h3>
            <p className='fs-12 text-white/50'>สิ้นสุดการรับประกัน</p>
          </div>
          <div className='flex flex-col justify-start items-center'>
            <TbHourglassHigh className={`fs-24 ${warrantyClassName}`} />
            <h3 className={warrantyClassName}>{renderWarrantyDuration.remaining_days || '-'}</h3>
            <p className='fs-12 text-white/50'>{renderWarrantyDuration.remaining_status || '-'}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(ProjectCard)
