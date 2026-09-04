import { ContractorData } from '@/types/manage/contractor-api';
import { APIResponseProjectList } from '@/types/manage/project-api';
import { Empty, Pagination, Skeleton, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useMemo } from 'react'
import StatusBadge from '../project/StatusBadge';
import SolutionTagList from './SolutionTagList';

interface Props {
  data?: APIResponseProjectList
  item: ContractorData
  page: number
  limit: number
  isLoading: boolean;
  isError: boolean;
  handlePageChange: (newPage: number, newLimit: number) => void;
}

const CardContact: React.FC<Props> = (props) => {
  const { data, page, limit, isLoading, isError, handlePageChange } = props

  const renderWarrantyDate = useCallback((startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return '-'
    return `${startDate ? dayjs(startDate).format('DD MMM BBBB') : '-'} - ${endDate ? dayjs(endDate).format('DD MMM BBBB') : '-'}`
  }, [])

  const renderProjectList = useMemo(() => {
    if (isLoading) return <Skeleton loading={true} active paragraph={{ rows: 4 }} />
    return data?.res_data.map((item) => {
      const solutionGroup = item.solution_group || []
      return (
        <div key={item.id} className="rounded-xl p-5 bg-(--gray)">
          <section>
            <span
              className='inline-flex items-center justify-center px-3 py-0.5 rounded-full fs-12 whitespace-nowrap'
              style={{ border: `1px solid var(--default-blue)`, color: 'var(--default-blue)' }}
            >
              {item.project_no || '-'}
            </span>
          </section>
          <section className='mt-5'>
            <Tooltip title={item.project_name || '-'}>
              <h3 className='line-clamp-2'>ชื่อโครงการ: {item.project_name || '-'} </h3>
            </Tooltip>
            <div className="mt-1.5">
              <p><strong>ผู้ว่าจ้าง:</strong> {item.department.department_short_name || '-'}</p>
              <p><strong>เลขที่สัญญา:</strong> {item.contract_no || '-'}</p>
              <p><strong>เริ่มต้น - สิ้นสุด:</strong> {renderWarrantyDate(item.warranty_start_date, item.warranty_end_date)}</p>
            </div>
          </section>
          <section className='mt-5'>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className='flex flex-col justify-start items-center gap-1.5'>
                <h4>การทำงาน</h4>
                <SolutionTagList items={solutionGroup} />
              </div>
              <div className='flex flex-col justify-start items-center gap-1.5'>
                <h4>สถานะการค้ำประกัน</h4>
                <StatusBadge status={item.is_warranty ? 'in-warranty' : 'expired'} />
              </div>
            </div>
          </section>
        </div>
      )
    })
  }, [data, isLoading, renderWarrantyDate])

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
