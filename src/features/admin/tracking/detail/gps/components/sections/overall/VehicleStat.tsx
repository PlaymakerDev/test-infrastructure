import { getTrackingGPSFleetKpiAPI } from '@/services/routes/TrackingGPSService'
import { useQuery } from '@tanstack/react-query'
import { Col, Empty, Row, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { TbNavigation, TbPlayerPauseFilled, TbTruck, TbTruckDelivery, TbWeight } from 'react-icons/tb'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {

}

const VehicleStat: React.FC<Props> = (props) => {
  const { } = props

  const { data, isLoading, isError } = useQuery({
    queryKey: ['fleet_kpi'],
    queryFn: () => getTrackingGPSFleetKpiAPI()
  })

  // PURE PERCENT
  const onRoadPct = Number(data?.data?.fresh) > 0 ? ((Number(data?.data?.on_drr_road) / Number(data?.data?.fresh)) * 100).toFixed(1) + '%' : '-'
  // SUB PERCENT
  const freshPct = Number(data?.data?.total_vehicles) > 0 ? ((Number(data?.data?.fresh) / Number(data?.data?.total_vehicles)) * 100).toFixed(1) + '%' : '-'
  const onDrrPct = Number(data?.data?.total_vehicles) > 0 ? ((Number(data?.data?.on_drr_road) / Number(data?.data?.total_vehicles)) * 100).toFixed(1) + '%' : '-'
  const overweightPct = Number(data?.data?.total_vehicles) > 0 ? ((Number(data?.data?.overweight_history) / Number(data?.data?.total_vehicles)) * 100).toFixed(1) + '%' : '-'

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 6 }} />
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
          <div className="h-full bg-[#66AEFF1A] border-2 rounded-lg p-5 border-blue-500">
            <TbNavigation className='fs-24 text-blue-500 mb-1' />
            <h3 className='text-blue-500'>รถในระบบทั้งหมด</h3>
            <p><span className='fs-24 font-bold'>{fmtNumber(Number(data?.data.total_vehicles)) || 0}</span> คัน</p>
            <p className='fs-12 text-gray-400'>Active : {fmtNumber(Number(data?.data.fresh)) || 0} ({freshPct})</p>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
          <div className="h-full bg-[#FFB1001A] border-2 rounded-lg p-5 border-yellow-500">
            <TbTruck className='fs-24 text-yellow-500 mb-1' />
            <h3 className='text-yellow-500'>รถบนสายทาง ทช.</h3>
            <p><span className='fs-24 font-bold'>{fmtNumber(Number(data?.data.on_drr_road)) || 0}</span> คัน</p>
            <p className='fs-12 text-gray-400'>{onDrrPct} ของรถที่ active</p>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
          <div className="h-full bg-[#05F2DB1A] border-2 rounded-lg p-5 border-teal-500">
            <TbTruckDelivery className='fs-24 text-teal-500 mb-1' />
            <h3 className='text-teal-500'>อัตรารถบนสายทาง</h3>
            <p className='fs-24 font-bold'>{onRoadPct}</p>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
          <div className="h-full bg-[#B2FF001A] border-2 rounded-lg p-5 border-lime-500">
            <TbTruckDelivery className='fs-24 text-lime-500 mb-1' />
            <h3 className='text-lime-500'>รถกำลังเคลื่อนที่</h3>
            <p><span className='fs-24 font-bold'>{fmtNumber(Number(data?.data.moving)) || 0}</span> คัน</p>
            <p className='fs-12 text-gray-400'>{"Speed > 0 และ < 10 นาที"}</p>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
          <div className="h-full bg-[#FF6A001A] border-2 rounded-lg p-5 border-orange-500">
            <TbPlayerPauseFilled className='fs-24 text-orange-500 mb-1' />
            <h3 className='text-orange-500'>รถจอดนิ่ง</h3>
            <p><span className='fs-24 font-bold'>{fmtNumber(Number(data?.data.stopped)) || 0}</span> คัน</p>
            <p className='fs-12 text-gray-400'>{"Speed = 0 และ < 10 นาที"}</p>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
          <div className="h-full bg-[#E94C4C1A] border-2 rounded-lg p-5 border-red-500">
            <TbWeight className='fs-24 text-red-500 mb-1' />
            <h3 className='text-red-500'>รถประวัติน้ำหนักเกิน</h3>
            <p><span className='fs-24 font-bold'>{fmtNumber(Number(data?.data.overweight_history)) || 0}</span> คัน</p>
            <p className='fs-12 text-gray-400'>{overweightPct} ของรถที่ active</p>
          </div>
        </Col>
      </Row>
    )
  }, [isLoading, data, onRoadPct, freshPct, onDrrPct, overweightPct])

  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  return renderContent
}

export default React.memo<Props>(VehicleStat)
