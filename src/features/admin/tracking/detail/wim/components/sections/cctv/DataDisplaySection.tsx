import React from 'react'
import { CCTVList } from '../../../components'
import type { CCTVList as CCTVListItem } from '@/types/tracking/overall-api'

interface Props {
  data?: CCTVListItem[]
  isLoading?: boolean
  isError?: boolean
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number, pageSize: number) => void
}

const DataDisplaySection: React.FC<Props> = (props) => {
  const { data, isLoading, isError, page, pageSize, total, onPageChange } = props

  return (
    <div>
      <CCTVList
        data={data}
        isLoading={isLoading}
        isError={isError}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
