"use client"
import { Modal } from 'antd'
import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import type { FilterStats, ViewMode } from '@/components/searchable/SearchBar'
import type { MobileMasterData } from '@/types/tracking/detail-api'
import { useMobileCar } from '../../../hooks'
import { MOBILE_IS_OVER_WEIGHT_BY_FILTER, MobileWeightFilter } from '../../../data/mobileWeightFilters'
import { INIT_OPEN_MOBILE_LOG, useMobileContext } from '../../../context'
import FormSearchMobileLog from './FormSearchMobileLog'
import TableMobileDailyWeight from '../overall/TableMobileDailyWeight'
import MobileDailyWeightList from '../overall/MobileDailyWeightList'

dayjs.extend(buddhistEra)
dayjs.locale('th')

const DEFAULT_PAGE_SIZE = 10

interface ContentProps {
  record: MobileMasterData | null
}

const Content: React.FC<ContentProps> = (props) => {
  const { record } = props
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [weightFilter, setWeightFilter] = useState<MobileWeightFilter>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const handleFilterChange = (filter: MobileWeightFilter) => {
    setWeightFilter(filter)
    setPage(1)
  }

  const handlePageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage)
    setPageSize(nextPageSize)
  }

  const { data, isLoading, isError } = useMobileCar({
    tid: record?.TID,
    is_over_weight: MOBILE_IS_OVER_WEIGHT_BY_FILTER[weightFilter],
    page,
    page_size: pageSize,
  })

  // Dedicated page_size:1 reads purely for badge totals — MobileCarData's meta has
  // no summary breakdown (unlike wim's weightWIMLogMeta.summary), so each filter's
  // count needs its own request rather than coming free with the main table fetch.
  const allCount = useMobileCar({ tid: record?.TID, page: 1, page_size: 1 })
  const normalCount = useMobileCar({ tid: record?.TID, is_over_weight: MOBILE_IS_OVER_WEIGHT_BY_FILTER.normal, page: 1, page_size: 1 })
  const overweightCount = useMobileCar({ tid: record?.TID, is_over_weight: MOBILE_IS_OVER_WEIGHT_BY_FILTER.overweight, page: 1, page_size: 1 })

  const stats: FilterStats = useMemo(() => ({
    all: allCount.data?.data.data.meta.total,
    normal: normalCount.data?.data.data.meta.total,
    overweight: overweightCount.data?.data.data.meta.total,
  }), [allCount.data, normalCount.data, overweightCount.data])

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
            onPageChange={handlePageChange}
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
            onPageChange={handlePageChange}
          />
        )
      default:
        return null
    }
  }, [displayType, data, isLoading, isError, page, pageSize])

  return (
    <div>
      <section>
        <h3 className='text-(--yellow)'>รายละเอียดรถเข้าชั่ง</h3>
        <p className='fs-12 text-white/50'>ตรวจสอบน้ำหนักเคลื่อนที่ : {record?.WayID || '-'}</p>
        <p className='fs-12'>
          วันที่จัดตั้งด่าน : {record?.CreateDate ? dayjs(record.CreateDate, 'DD/MM/BBBB').format('DD MMM BBBB') : '-'}
        </p>
      </section>
      <section className='mt-5'>
        <FormSearchMobileLog
          activeFilter={weightFilter}
          onFilterChange={handleFilterChange}
          stats={stats}
          displayType={displayType}
          onDisplayTypeChange={setDisplayType}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

interface Props {

}

const ModalMobileLog: React.FC<Props> = () => {
  const { openMobileLog, setOpenMobileLog } = useMobileContext()
  const { open, record } = openMobileLog

  return (
    <Modal
      title={false}
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={open}
      onOk={() => setOpenMobileLog(INIT_OPEN_MOBILE_LOG)}
      onCancel={() => setOpenMobileLog(INIT_OPEN_MOBILE_LOG)}
      footer={null}
      destroyOnHidden
      width={1700}
    >
      <Content record={record} />
    </Modal>
  )
}

export default React.memo<Props>(ModalMobileLog)
