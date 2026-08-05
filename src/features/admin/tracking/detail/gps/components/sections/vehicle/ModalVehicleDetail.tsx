import React, { useMemo } from 'react'
import { INIT_VEHICLE_DETAIL, useGPSContext } from '../../../context'
import { Empty, Modal, Skeleton } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getTrackingGPSVehicleHistoryAPI } from '@/services/routes/TrackingGPSService'
import { VehicleHistoryData } from '@/types/tracking/detail-gps-api'
import VehicleDetail from '../overall/VehicleDetail'
import VehicleRoute from '../overall/VehicleRoute'

interface Props {

}

interface ContentProps {
  unitId?: string
  data?: VehicleHistoryData
}

const Content: React.FC<ContentProps> = (props) => {
  const { unitId, data } = props

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
      <VehicleDetail
        data={data}
        isModal={true}
      />
      <VehicleRoute
        data={data}
        unitId={unitId}
        isModal={true}
      />
    </div>
  )
}

const ModalVehicleDetail: React.FC<Props> = (props) => {
  const { } = props
  const { vehicleDetail, setVehicleDetail } = useGPSContext()
  const { open, unit_id } = vehicleDetail

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vehicle_history_detail', unit_id],
    queryFn: () => getTrackingGPSVehicleHistoryAPI({
      unit_id: String(unit_id)
    }),
    enabled: !!unit_id,
  })

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} />
    if (isError) return <Empty description="ไม่พบข้อมูลรถ" />
    return (
      <Content
        unitId={unit_id!}
        data={data?.data.data}
      />
    )
  }, [isLoading, isError, data, unit_id])

  return (
    <Modal
      title={'ข้อมูลรถบรรทุก'}
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={open}
      onOk={() => setVehicleDetail(INIT_VEHICLE_DETAIL)}
      onCancel={() => setVehicleDetail(INIT_VEHICLE_DETAIL)}
      footer={null}
      destroyOnHidden
      classNames={{
        container: 'border-2! border-(--default-blue)!'
      }}
      width={1000}
    >
      {renderContent}
    </Modal>
  )
}

export default React.memo<Props>(ModalVehicleDetail)
