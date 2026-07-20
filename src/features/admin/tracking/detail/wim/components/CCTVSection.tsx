import React, { useMemo, useState } from 'react'
import { FormSearchCCTV, DataDisplaySection, ModalCCTVData } from '../components'
import { useWIMContext } from '../context'
import { useCctvList } from '../hooks'
import type { CameraFilter } from './sections/cctv/FormSearchCCTV'

interface Props {

}

const DEFAULT_PAGE_SIZE = 10
const STATS_PAGE_SIZE = 100

const CCTVSection: React.FC<Props> = (props) => {
  const { } = props
  const { id, stationTypeId } = useWIMContext()
  const [activeFilter, setActiveFilter] = useState<CameraFilter>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const isFiltering = activeFilter !== 'all'

  // No documented camera_status filter param on /cameras/list (APIRequestTrackingCCTVList
  // has none), so a status filter can only be applied client-side. This full-list read
  // (page_size:100, mirrors OverallCCTV's widget) always drives the online/offline/all
  // stat badges, and doubles as the list's data source while filtering — "page N of the
  // online-only list" can't be derived from a single server page.
  const statsQuery = useCctvList({
    station_id: id as string,
    station_type_id: stationTypeId as number,
    page: 1,
    page_size: STATS_PAGE_SIZE,
  })

  // Real server-side pagination — fetched (and only meaningful) when no status filter
  // is active, so onChangePage/onChangePageSize hit the API with real page/page_size.
  const pagedQuery = useCctvList(
    {
      station_id: id as string,
      station_type_id: stationTypeId as number,
      page,
      page_size: pageSize,
    },
    !isFiltering,
  )

  const handleFilterChange = (filter: CameraFilter) => {
    setActiveFilter(filter)
    setPage(1)
  }

  const handlePageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage)
    setPageSize(nextPageSize)
  }

  const allCameras = useMemo(() => statsQuery.data?.data.data ?? [], [statsQuery.data])

  const stats = useMemo(() => ({
    all: allCameras.length,
    online: allCameras.filter((item) => item.camera_status === 'Online').length,
    offline: allCameras.filter((item) => item.camera_status === 'Offline').length,
  }), [allCameras])

  const filteredCameras = useMemo(() => {
    switch (activeFilter) {
      case 'online':
        return allCameras.filter((item) => item.camera_status === 'Online')
      case 'offline':
        return allCameras.filter((item) => item.camera_status === 'Offline')
      default:
        return allCameras
    }
  }, [allCameras, activeFilter])

  const displayData = isFiltering
    ? filteredCameras.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
    : pagedQuery.data?.data.data ?? []

  const displayTotal = isFiltering
    ? filteredCameras.length
    : pagedQuery.data?.data.meta.total ?? 0

  const isLoading = isFiltering ? statsQuery.isLoading : pagedQuery.isLoading
  const isError = isFiltering ? statsQuery.isError : pagedQuery.isError

  return (
    <div>
      <section>
        <FormSearchCCTV
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          stats={stats}
        />
      </section>
      <section className='mt-5'>
        <DataDisplaySection
          data={displayData}
          isLoading={isLoading}
          isError={isError}
          page={page}
          pageSize={pageSize}
          total={displayTotal}
          onPageChange={handlePageChange}
        />
      </section>
      <ModalCCTVData />
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
