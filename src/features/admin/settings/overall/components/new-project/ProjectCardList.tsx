import { APIResponseProjectList, ProjectDepartmentData } from '@/types/manage/project-api'
import { Empty, Pagination, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import ProjectCard from './ProjectCard'
import { useAppSelector } from '@/stores/hooks'
import { isAdmin } from '@/utils/isAdmin'
import { is } from 'zod/v4/locales'

interface Props {
  /** The fetched project list — owned/fetched by CollapseDeptCard (same
   *  split as new-contact's ContentContactorList → CardContact) so the
   *  parent can decide whether to render itself at all once it knows
   *  whether a search/filter actually matched anything here. */
  data?: APIResponseProjectList
  item?: ProjectDepartmentData
  page: number
  limit: number
  isLoading: boolean
  isError: boolean
  handlePageChange: (newPage: number, newLimit: number) => void
}

const ProjectCardList: React.FC<Props> = (props) => {
  const { data, item: dptData, page, limit, isLoading, isError, handlePageChange } = props
  const { info } = useAppSelector(state => state.auth)
  const isAdminUser = isAdmin(info)

  const renderCardList = useMemo(() => {
    return data?.res_data.map((row) => {
      return (
        <ProjectCard
          key={row.id}
          data={dptData}
          item={row}
          canEdit={isAdminUser}
        />
      )
    })
  }, [data, dptData, isAdminUser])

  if (isLoading) return <Skeleton loading={true} active paragraph={{ rows: 4 }} />

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
    <div className='mb-5'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
        {renderCardList}
      </div>
      <div className='flex justify-end mt-5'>
        <Pagination
          current={page}
          pageSize={limit}
          total={data.meta_data.count}
          showSizeChanger
          onChange={handlePageChange}
          locale={{ items_per_page: '/ หน้า' }}
        />
      </div>
    </div>
  )
}

export default React.memo<Props>(ProjectCardList)
