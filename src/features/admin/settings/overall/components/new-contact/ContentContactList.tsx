import React, { useMemo } from 'react'
import {
  ListViewContact,
  GridViewContact
} from '../../components'
import { APIResponseContractorList } from '@/types/manage/contractor-api'

interface Props {
  type: 'TABLE' | 'GRID'
  data?: APIResponseContractorList
  isLoading: boolean
  isError: boolean
}

const ContentContactList: React.FC<Props> = (props) => {
  const { type, data, isLoading, isError } = props

  const renderContent = useMemo(() => {
    switch (type) {
      case 'TABLE':
        return <ListViewContact type={type} data={data} isLoading={isLoading} isError={isError} />
      case 'GRID':
        return <GridViewContact type={type} data={data} isLoading={isLoading} isError={isError} />
      default:
        return null
    }
  }, [type, data, isLoading, isError])

  return renderContent
}

export default React.memo<Props>(ContentContactList)
