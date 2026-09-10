import { APIResponseProjectDepartment, ProjectListData } from '@/types/manage/project-api'
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
  onEdit?: (row: ProjectListData) => void
  onDelete?: (row: ProjectListData) => void
}

const ProjectCollapseList: React.FC<Props> = (props) => {
  const { data, isLoading, search, budgetYear, contractorId, onEdit, onDelete } = props

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
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )
    })
  }, [data, isLoading, search, budgetYear, contractorId, onEdit, onDelete])

  return renderCollapseDept
}

export default React.memo<Props>(ProjectCollapseList)
