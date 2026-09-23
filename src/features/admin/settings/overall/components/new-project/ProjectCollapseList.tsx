import { APIResponseProjectDepartment } from '@/types/manage/project-api'
import React, { useMemo } from 'react'
import { CollapseDeptCard } from '../../components'
import { Skeleton } from 'antd'

interface Props {
  data?: APIResponseProjectDepartment
  isLoading?: boolean
  /** FormSearchProject filters — forwarded to every department card so its
   *  own project-card fetch stays in sync with the search box. */
  search?: string
  budgetYear?: number
  contractorId?: string
}

const ProjectCollapseList: React.FC<Props> = (props) => {
  const { data, isLoading, search, budgetYear, contractorId } = props

  const renderCollapseDept = useMemo(() => {
    if (isLoading) return <Skeleton loading={true} active paragraph={{ rows: 4 }} />
    return data?.res_data.map((item, index) => {
      return (
        <CollapseDeptCard
          key={index}
          data={item}
          search={search}
          budgetYear={budgetYear}
          contractorId={contractorId}
        />
      )
    })
  }, [data, isLoading, search, budgetYear, contractorId])

  return renderCollapseDept
}

export default React.memo<Props>(ProjectCollapseList)
