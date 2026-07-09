import React from 'react'
import { Empty, Skeleton } from 'antd'

interface Props {
  isLoading: boolean
  isError: boolean
  skeletonRows?: number
  emptyDescription?: string
  children: React.ReactNode
}

/** Shared loading/error/success ladder for TanStack Query reads — replaces the
 *  `if (isLoading) <Skeleton/>; if (isError) <Empty/>` block copy-pasted across
 *  most data-fetching components in this codebase. */
const QueryBoundary: React.FC<Props> = (props) => {
  const { isLoading, isError, skeletonRows = 4, emptyDescription = 'ไม่พบข้อมูล', children } = props

  if (isLoading) return <Skeleton active paragraph={{ rows: skeletonRows }} />
  if (isError) return <Empty description={emptyDescription} />
  return <>{children}</>
}

export default React.memo(QueryBoundary)
