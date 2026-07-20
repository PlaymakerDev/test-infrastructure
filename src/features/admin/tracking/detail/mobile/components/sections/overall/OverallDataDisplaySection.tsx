import React, { useMemo, useState } from 'react'
import {
  TableMobileDailyWeight,
  MobileDailyWeightList,
  FormSearchDailyWeight
} from '@/features/admin/tracking/detail/mobile/components'
import { useMobileCar } from '@/features/admin/tracking/detail/mobile/hooks'
import { useMobileContext } from '@/features/admin/tracking/detail/mobile/context'


interface Props {

}

const DEFAULT_PAGE_SIZE = 10

const OverallDataDisplaySection: React.FC<Props> = () => {
  const { id } = useMobileContext()
  const [displayType, setDisplayType] = useState<'TABLE' | 'GRID'>('TABLE')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const { data, isLoading, isError } = useMobileCar({
    tid: String(id),
    page,
    page_size: pageSize
  })

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return (
          <TableMobileDailyWeight
            data={data?.data.data}
            isLoading={isLoading}
            isError={isError}
            page={page}
            pageSize={pageSize}
            total={data?.data.data.meta.total}
            onPageChange={(nextPage: number, nextPageSize: number) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            }}
          />
        )
      case 'GRID':
        return (
          <MobileDailyWeightList
            data={data?.data.data}
            isLoading={isLoading}
            isError={isError}
            page={page}
            pageSize={pageSize}
            total={data?.data.data.meta.total}
            onPageChange={(nextPage: number, nextPageSize: number) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            }}
          />
        )
      default:
        return null
    }
  }, [displayType, data, isLoading, isError, page, pageSize])

  return (
    <div>
      <section>
        <FormSearchDailyWeight
          displayType={displayType}
          setDisplayType={setDisplayType}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
