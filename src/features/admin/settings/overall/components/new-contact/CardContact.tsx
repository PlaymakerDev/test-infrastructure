import { ContractorData } from '@/types/manage/contractor-api';
import { APIResponseProjectList, ProjectListData } from '@/types/manage/project-api';
import { Empty, Pagination, Skeleton, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation';
import StatusBadge from '../project/StatusBadge';
import SolutionTagList from './SolutionTagList';
import { TbCalendarWeekFilled, TbHourglassHigh } from 'react-icons/tb';

interface Props {
  data?: APIResponseProjectList
  item: ContractorData
  page: number
  limit: number
  isLoading: boolean;
  isError: boolean;
  handlePageChange: (newPage: number, newLimit: number) => void;
  canEdit: boolean;
}

const CardContact: React.FC<Props> = (props) => {
  const { data, page, limit, isLoading, isError, handlePageChange, canEdit } = props
  const router = useRouter();

  const renderWarrantyDate = useCallback((startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return '-'
    return `${startDate ? dayjs(startDate).format('DD MMM BBBB') : '-'} - ${endDate ? dayjs(endDate).format('DD MMM BBBB') : '-'}`
  }, [])

  const warrantyClassName = useCallback((item: ProjectListData) => {
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
  }, [])

  const renderWarrantyDuration = useCallback((item: ProjectListData) => {
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
  }, [])

  const renderProjectList = useMemo(() => {
    if (isLoading) return <Skeleton loading={true} active paragraph={{ rows: 4 }} />
    return data?.res_data.map((item) => {
      return (
        <div key={item?.id} className="rounded-xl p-5 bg-(--gray)">
          <section>
            <div className='flex items-center justify-between gap-1.5'>
              <span
                className='inline-flex items-center justify-center px-3 py-0.5 rounded-full fs-12 whitespace-nowrap'
                style={{ border: `1px solid var(--default-blue)`, color: 'var(--default-blue)' }}
              >
                {item?.department.department_short_name || '-'}
              </span>
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
              {canEdit && (
                <p><span className='text-white/50'>รหัสโครงการ:</span> {item?.project_no || '-'}</p>
              )}
              <p><span className='text-white/50'>เลขที่สัญญา:</span> {item?.contract_no || '-'}</p>
              <p><span className='text-white/50'>สถานะการค้ำประกัน:</span> <span className={warrantyClassName(item)}>{renderWarrantyDuration(item).warranty_status || '-'}</span></p>
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
                <TbHourglassHigh className={`fs-24 ${warrantyClassName(item)}`} />
                <h3 className={warrantyClassName(item)}>{renderWarrantyDuration(item).remaining_days || '-'}</h3>
                <p className='fs-12 text-white/50'>{renderWarrantyDuration(item).remaining_status || '-'}</p>
              </div>
            </div>
          </section>
        </div>
      )
    })
  }, [data?.res_data, isLoading, renderWarrantyDuration, router, warrantyClassName, canEdit])

  // FALLBACK UI for error or empty data
  if (isError) {
    return (
      <div className="block m-auto py-18">
        <Empty description="เกิดข้อผิดพลาด" />
      </div>
    )
  }

  if (!data?.res_data || data.res_data.length === 0) {
    return (
      <div className="block m-auto py-18">
        <Empty description="ไม่มีข้อมูลโครงการ" />
      </div>
    )
  }

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
        {renderProjectList}
      </div>
      <div className='flex justify-end mt-5'>
        <Pagination
          current={page}
          pageSize={limit}
          total={data?.meta_data.count}
          onChange={(newPage, newPageSize) => handlePageChange(newPage, newPageSize)}
        />
      </div>
    </div>
  )
}

export default React.memo<Props>(CardContact)
