"use client"
import React from 'react'
import { Pagination } from 'antd'

interface Props {
  /** 1-based current page. */
  current: number
  /** Items per page. */
  pageSize: number
  /** Total item count (NOT page count). */
  total: number
  /** Fires on page OR page-size change: (page, pageSize). */
  onChange: (page: number, pageSize: number) => void
  /** Page-size options for the "X / หน้า" selector. */
  pageSizeOptions?: number[]
  /** Toggle the page-size selector (default true). */
  showSizeChanger?: boolean
  align?: 'start' | 'center' | 'end'
}

/** App-standard list pagination — the Incident Detection style: right-aligned,
 *  total text ("X จาก Y"), prev/next arrows, yellow active page (from the antd
 *  theme), and a page-size selector. Use this everywhere instead of hand-rolled
 *  prev/next controls so every list paginates identically. */
const AppPagination: React.FC<Props> = ({
  current,
  pageSize,
  total,
  onChange,
  pageSizeOptions = [10, 20, 50, 100],
  showSizeChanger = true,
  align = 'end',
}) => (
  <Pagination
    align={align}
    current={current}
    pageSize={pageSize}
    total={total}
    showSizeChanger={showSizeChanger}
    pageSizeOptions={pageSizeOptions}
    showTotal={(t, range) => `${range[1] - range[0] + 1} จาก ${t}`}
    onChange={onChange}
    locale={{
      items_per_page: '/ หน้า'
    }}
  />
)

export default React.memo<Props>(AppPagination)
