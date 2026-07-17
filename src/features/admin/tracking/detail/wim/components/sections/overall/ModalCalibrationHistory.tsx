import React, { useMemo } from 'react'
import { INIT_MODAL_WEIGHT_LOG, useWIMContext } from '../../../context'
import { Empty, Modal, Skeleton } from 'antd'
import { CalibrationHistoryData } from '@/types/tracking/detail-api'
import { useStationDetail, useCalibrationHistoryList } from '../../../hooks'
import { TRACKING_STATION_TYPE } from '@/constants/tracking'
import TableCalibrationHistory from './TableCalibrationHistory'

interface Props {

}

interface ContentProps {
  data?: CalibrationHistoryData[]
  isLoading?: boolean
  stationLabel: string
  stationName?: string
}

const Content: React.FC<ContentProps> = (props) => {
  const { data, isLoading, stationLabel, stationName } = props

  return (
    <div>
      <section>
        <h3 className='text-(--yellow)'>ประวัติการ Calibrate เครื่องชั่ง </h3>
        <p className='fs-12 text-white/50'>{stationLabel} : {stationName ?? '-'}</p>
      </section>
      <section className='mt-3'>
        <p className='fs-12 mb-1.5'>พบประวัติการ Calibrate เครื่องชั่ง ทั้งหมด <span className='text-(--yellow)'>{data?.length ?? 0}</span> ครั้ง</p>
        <TableCalibrationHistory data={data} isLoading={isLoading} />
      </section>
    </div>
  )
}

const ModalCalibrationHistory: React.FC<Props> = (props) => {
  const { } = props
  const { openCalibrationHistoryModal, setOpenCalibrationHistoryModal } = useWIMContext()
  const { stationId, stationType } = openCalibrationHistoryModal

  // openCalibrationHistoryModal.stationType is the numeric station_type_id as a string
  // (per OverallCalibrateWeight's `stationTypeId?.toString()`), not the 'STATION'|'WIM'
  // string useStationDetail expects — convert before fetching the station name.
  const isStation = stationType === String(TRACKING_STATION_TYPE.STATION)
  const stationTypeName = isStation ? 'STATION' : 'WIM'
  const stationLabel = isStation ? 'สถานี' : 'Weight in Motion (WIM)'

  const { data: stationDetail } = useStationDetail(stationId as string | number | undefined, stationTypeName)

  const { data, isLoading, isError } = useCalibrationHistoryList(
    stationType ?? undefined,
    stationId as string | number | undefined,
    openCalibrationHistoryModal.open
  )

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description='ไม่พบข้อมูล' />
    return (
      <Content
        data={data?.data}
        isLoading={isLoading}
        stationLabel={stationLabel}
        stationName={stationDetail?.data.data.station_name}
      />
    )
  }, [data, isLoading, isError, stationLabel, stationDetail])

  return (
    <Modal
      title={false}
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={openCalibrationHistoryModal.open}
      onOk={() => setOpenCalibrationHistoryModal(INIT_MODAL_WEIGHT_LOG)}
      onCancel={() => setOpenCalibrationHistoryModal(INIT_MODAL_WEIGHT_LOG)}
      footer={null}
      destroyOnHidden
      width={1700}
    >
      {renderContent}
    </Modal>
  )
}

export default React.memo<Props>(ModalCalibrationHistory)
