import React, { useCallback, useMemo, useState } from 'react'
import {
  ContentContactList,
  FormSearchContact,
} from '../components'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getContractorListAPI } from '@/services/routes/ManageService'
import { Empty, Skeleton } from 'antd'
import AppPagination from '@/components/pagination/AppPagination'

interface Props {

}

const NewContactSection: React.FC<Props> = (props) => {
  const { } = props
  const [type, setType] = useState<'TABLE' | 'GRID'>('TABLE')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(3)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contacts', search, page, limit],
    queryFn: () => getContractorListAPI({
      page: page,
      limit: limit,
      search: search,
    }),
    placeholderData: keepPreviousData,
  })

  // A new search term invalidates whatever page the user was on — start over
  // at page 1 instead of possibly landing on a page past the new result set.
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const total = data?.data.meta_data.count ?? 0

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={true} active />
    if (isError) {
      return (
        <div className="block m-auto py-18">
          <Empty description="เกิดข้อผิดพลาด" />
        </div>
      )
    }
    if (!data?.data?.res_data || data.data.res_data.length === 0) return (
      <div className="block m-auto py-18">
        <Empty description="ไม่มีข้อมูลผู้ติดต่อ" />
      </div>
    )
    return (
      <ContentContactList
        type={type}
        data={data?.data}
        isLoading={isLoading}
        isError={isError}
      />
    )
  }, [isLoading, isError, data, type])

  return (
    <div>
      <section>
        <FormSearchContact
          type={type}
          setType={setType}
          search={search}
          setSearch={handleSearchChange}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
      {total > 0 && (
        <section className='mt-5'>
          <AppPagination
            align='center'
            current={page}
            pageSize={limit}
            total={total}
            showSizeChanger={false}
            // TODO: enable page-size changing once ready — uncomment below
            // and remove the `showSizeChanger={false}` line above.
            // showSizeChanger={true}
            // pageSizeOptions={[3, 10, 20, 50]}
            onChange={(newPage, newLimit) => {
              setPage(newPage)
              setLimit(newLimit)
            }}
          />
        </section>
      )}
    </div>
  )
}

export default React.memo<Props>(NewContactSection)
