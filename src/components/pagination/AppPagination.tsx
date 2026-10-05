"use client"
import React from 'react'
import { Pagination, type PaginationProps, type SelectProps } from 'antd'

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

// Its text is set in the app's fs scale — fs-12, i.e. the 14px antd gives it
// anyway — so pages that size everything with fs classes stay consistent.
const SIZE_CHANGER: SelectProps = {
  labelRender: ({ label }) => <span className='fs-12'>{label}</span>,
  optionRender: (option) => <span className='fs-12'>{option.label}</span>,
}

const renderItem: PaginationProps['itemRender'] = (page, type, element) =>
  type === 'page' ? <a rel='nofollow' className='fs-12'>{page}</a> : element

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
    showSizeChanger={showSizeChanger && SIZE_CHANGER}
    pageSizeOptions={pageSizeOptions}
    showTotal={(t, range) => <span className='fs-12'>{`${range[1] - range[0] + 1} จาก ${t}`}</span>}
    itemRender={renderItem}
    onChange={onChange}
    locale={{
      items_per_page: '/ หน้า'
    }}
  />
)

export default React.memo<Props>(AppPagination)
