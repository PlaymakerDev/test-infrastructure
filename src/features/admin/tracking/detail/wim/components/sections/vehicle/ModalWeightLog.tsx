import { ConfigProvider, Modal } from 'antd'
import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { INIT_MODAL_WEIGHT_LOG, useWIMContext } from '../../../context'
import { FormSearchWeightLog, TableWeightLog, OverallDailyWeightList } from '../../../components'
import { useDailyWeightLogList } from '../../../hooks'
import { IS_OVER_WEIGHT_BY_FILTER, WeightFilter } from '../../../data/weightFilters'
import type { FilterStats, ViewMode } from '@/components/searchable/SearchBar'
import { fmtNumber } from '@/utils/formatNumber'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {

}

const Content: React.FC<Props> = () => {
  const { openWeightLogModal } = useWIMContext()
  const { stationId, stationType, stationName, date } = openWeightLogModal
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [weightFilter, setWeightFilter] = useState<WeightFilter>('all')

  const stationLabel = stationType === 'STATION' ? 'สถานี' : 'Weight in Motion (WIM)'

  // Unfiltered (page_size 1) read, purely for meta.summary — mirrors OverallDataDisplaySection,
  // scoped to the same single day (`openWeightLogModal.date`) as the table below instead of always "today".
  const { meta: statsMeta } = useDailyWeightLogList(stationId as string | number | undefined, stationType, 1, 1, undefined, date)
  const summary = statsMeta?.summary

  const stats: FilterStats = useMemo(() => ({
    all: fmtNumber(Number(summary?.total)),
    normal: summary ? fmtNumber(Number(summary.total) - Number(summary.overweight)) : undefined,
    overweight: fmtNumber(Number(summary?.overweight)),
  }), [summary])

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableWeightLog isOverWeight={IS_OVER_WEIGHT_BY_FILTER[weightFilter]} />
      case 'GRID':
        return (
          <OverallDailyWeightList
            stationId={stationId}
            stationType={stationType}
            isOverWeight={IS_OVER_WEIGHT_BY_FILTER[weightFilter]}
            date={date}
          />
        )
      default:
        return null
    }
  }, [displayType, stationId, stationType, weightFilter, date])

  return (
    <div>
      <section>
        <h3 className='text-(--yellow)'>รายละเอียดรถเข้าชั่ง </h3>
        <p className='fs-12 text-white/50'>{stationLabel} : {stationName ?? '-'}</p>
        <p className='fs-12'>วันที่เข้าชั่ง : {date ? dayjs(date).format('DD MMM BBBB') : '-'}</p>
      </section>
      <section className='mt-5'>
        <FormSearchWeightLog
          activeFilter={weightFilter}
          onFilterChange={setWeightFilter}
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

const ModalWeightLog: React.FC<Props> = (props) => {
  const { } = props
  const { openWeightLogModal, setOpenWeightLogModal } = useWIMContext()

  return (
    <ConfigProvider
      theme={{
        token: {
          colorIcon: '#FFFFFF',
          colorIconHover: '#FFFFFF80',
        },
      }}
    >
      <Modal
        title={false}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={openWeightLogModal.open}
        onOk={() => setOpenWeightLogModal(INIT_MODAL_WEIGHT_LOG)}
        onCancel={() => setOpenWeightLogModal(INIT_MODAL_WEIGHT_LOG)}
        footer={null}
        destroyOnHidden
        width={1700}
      >
        <Content />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalWeightLog)
