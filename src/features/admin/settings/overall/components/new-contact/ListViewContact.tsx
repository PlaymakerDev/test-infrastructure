import React, { useMemo } from 'react'
import { ContentContactorList } from '../../components'
import { APIResponseContractorList } from '@/types/manage/contractor-api'

interface Props {
  type: 'TABLE' | 'GRID'
  data?: APIResponseContractorList
  isLoading: boolean
  isError: boolean
}

const ListViewContact: React.FC<Props> = (props) => {
  const { type, data } = props

  const renderContent = useMemo(() => {
    return data?.res_data.map((item) => {
      return (
        <ContentContactorList
          key={item.contractor_id}
          item={item}
          type={type}
        />
      )
    })
  }, [data, type])

  return renderContent
}

export default React.memo<Props>(ListViewContact)
