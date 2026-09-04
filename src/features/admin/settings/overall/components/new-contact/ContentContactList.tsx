import React, { useMemo } from 'react'
import {
  ListViewContact,
  GridViewContact
} from '../../components'
import { APIResponseContractorList, ContractorData } from '@/types/manage/contractor-api'

interface Props {
  type: 'TABLE' | 'GRID'
  data?: APIResponseContractorList
  isLoading: boolean
  isError: boolean
  onEdit: (item: ContractorData) => void
  onDelete: (item: ContractorData) => void
}

const ContentContactList: React.FC<Props> = (props) => {
  const { type, data, isLoading, isError, onEdit, onDelete } = props

  const renderContent = useMemo(() => {
    switch (type) {
      case 'TABLE':
        return <ListViewContact type={type} data={data} isLoading={isLoading} isError={isError} onEdit={onEdit} onDelete={onDelete} />
      case 'GRID':
        return <GridViewContact type={type} data={data} isLoading={isLoading} isError={isError} onEdit={onEdit} onDelete={onDelete} />
      default:
        return null
    }
  }, [type, data, isLoading, isError, onEdit, onDelete])

  return renderContent
}

export default React.memo<Props>(ContentContactList)
