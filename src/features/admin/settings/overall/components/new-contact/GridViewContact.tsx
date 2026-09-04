import React, { useMemo } from 'react'
import { ContentContactorList } from '../../components'
import { APIResponseContractorList, ContractorData } from '@/types/manage/contractor-api'

interface Props {
  type: 'TABLE' | 'GRID'
  data?: APIResponseContractorList
  isLoading: boolean
  isError: boolean
  onEdit: (item: ContractorData) => void
  onDelete: (item: ContractorData) => void
}

const GridViewContact: React.FC<Props> = (props) => {
  const { type, data, onEdit, onDelete } = props

  const renderContent = useMemo(() => {
    return data?.res_data.map((item) => {
      return (
        <ContentContactorList
          key={item.contractor_id}
          item={item}
          type={type}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )
    })
  }, [data, type, onEdit, onDelete])

  return renderContent
}

export default React.memo<Props>(GridViewContact)
