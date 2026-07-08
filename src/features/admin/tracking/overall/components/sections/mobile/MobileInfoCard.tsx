import { getTrackingTotalStationAPI } from '@/services/routes/TrackingService';
import { WIMMetaData } from '@/types/shared';
import { APIResponseTrackingViewSumPlanChart, MobileMasterData } from '@/types/tracking/overall-api';
import { fmtNumber } from '@/utils/formatNumber';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Col, Empty, Row, Skeleton } from 'antd'
import dayjs from 'dayjs';
import React, { useMemo } from 'react'
import { TbChartAreaLine, TbTrafficCone, TbTruck, TbUserShield } from "react-icons/tb";

interface Props {
  data?: MobileMasterData[]
  meta?: WIMMetaData
  sumPlanData?: APIResponseTrackingViewSumPlanChart
  isSumPlanLoading?: boolean
  isSumPlanError?: boolean
}

const DEFAULT_COUNT = {
  total: 0,
  total_weight: 0,
  total_overweight: 0,
  total_10percent: 0,
}

const MobileInfoCard: React.FC<Props> = (props) => {
  const { data, meta, sumPlanData, isSumPlanLoading, isSumPlanError } = props

  const {
    data: totalStationData,
    isLoading: isTotalStationLoading,
    isError: isTotalStationError
  } = useQuery({
    queryKey: ['total_station', 'mobile'],
    queryFn: () => getTrackingTotalStationAPI({
      date: dayjs().format('YYYY-MM-DD')
    }),
    placeholderData: keepPreviousData
  })

  const calcData = useMemo(() => {
    if (!data || !Array.isArray(data)) return DEFAULT_COUNT

    const total = data.reduce((sum, item) => sum + (Number(item.Total) || 0), 0)
    const totalWeight = data.reduce((sum, item) => sum + ((Number(item.Total) || 0) - (Number(item.TotalOver) || 0)), 0)
    const totalOverweight = data.reduce((sum, item) => sum + (Number(item.TotalOver) || 0), 0)

    return {
      ...DEFAULT_COUNT,
      total: total,
      total_weight: totalWeight,
      total_overweight: totalOverweight,
    }
  }, [data])

  const renderTotalStation = useMemo(() => {
    if (isTotalStationLoading) return <Skeleton loading={isTotalStationLoading} active paragraph={{ rows: 10 }} />
    if (isTotalStationError) return <Empty description="ไม่พบข้อมูล" />

    const totalMobileStation = Number(totalStationData?.data.mobile.total)
    const openMobileStation = Number(totalStationData?.data.station.open)
    const closedMobileStation = totalMobileStation - openMobileStation

    return (
      <>
        <div className='flex items-center gap-2 mb-2'>
          <TbTrafficCone className='fs-22 shrink-0' />
          <h4 className='mb-0'>สถานะด่านตรวจสอบน้ำหนักเคลื่อนที่</h4>
        </div>
        <div className='flex flex-wrap gap-2'>
          <div className='bg-[#66AEFF1A] border border-green-500 px-3 py-1 rounded-3xl'>
            <p className='fs-12 text-green-500 mb-0'>{openMobileStation || 0} เปิดด่าน</p>
          </div>
          <div className='bg-[#66AEFF1A] border border-red-500 px-3 py-1 rounded-3xl'>
            <p className='fs-12 text-red-500 mb-0'>{closedMobileStation || 0} ปิดด่าน</p>
          </div>
        </div>
      </>
    )
  }, [isTotalStationLoading, isTotalStationError, totalStationData])

  const renderSumPlan = useMemo(() => {
    if (isSumPlanLoading) return <Skeleton loading={isSumPlanLoading} active paragraph={{ rows: 10 }} />
    if (isSumPlanError) return <Empty description="ไม่พบข้อมูล" />

    const totalPlan = Number(sumPlanData?.all_sum.plan_total)
    const totalResult = Number(sumPlanData?.all_sum.result_total)
    const totalDifference = totalPlan - totalResult

    return (
      <>
        <div className='flex items-center gap-2 mb-2'>
          <TbChartAreaLine className='fs-22 shrink-0' />
          <h4 className='mb-0'>เปรียบเทียบแผน-ผล</h4>
        </div>
        <div className='flex flex-wrap gap-2'>
          <div className='bg-[#66AEFF1A] border border-yellow-500 px-3 py-1 rounded-3xl'>
            <p className='fs-12 text-yellow-500 mb-0'>{fmtNumber(totalPlan) || 0} แผน</p>
          </div>
          <div className='bg-[#66AEFF1A] border border-blue-500 px-3 py-1 rounded-3xl'>
            <p className='fs-12 text-blue-500 mb-0'>{fmtNumber(totalResult) || 0} ผล</p>
          </div>
          <div className='bg-[#66AEFF1A] border border-red-500 px-3 py-1 rounded-3xl'>
            <p className='fs-12 text-red-500 mb-0'>{fmtNumber(totalDifference) || 0} ส่วนต่าง</p>
          </div>
        </div>
      </>
    )
  }, [isSumPlanLoading, isSumPlanError, sumPlanData])

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-yellow-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbUserShield className='fs-22 text-yellow-500 shrink-0' />
            <h4 className='text-yellow-500 mb-0'>ด่านเคลื่อนที่ทั้งหมด</h4>
          </div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(meta?.total) || 0}</span> <span className='fs-14'>ด่าน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>ภาคตะวันออก (94.3%)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-blue-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-blue-500 shrink-0' />
            <h4 className='text-blue-500 mb-0'>รถเข้าชั่งทั้งหมด</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(calcData.total_weight) || 0}</span> <span className='fs-14'>คัน</span></p>
            <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (173.4 ตัน)</p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-red-500 shrink-0' />
            <h4 className='text-red-500 mb-0'>รถน้ำหนักเกิน</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(calcData.total_overweight) || 0}</span> <span className='fs-14'>คัน</span></p>
            <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (184.2 ตัน)</p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-orange-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-orange-500 shrink-0' />
            <h4 className='text-orange-500 mb-0'>รถน้ำหนักเกิน 10%</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(calcData.total_10percent) || 0}</span> <span className='fs-14'>คัน</span></p>
            <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (192.1 ตัน)</p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          {renderTotalStation}
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          {renderSumPlan}
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(MobileInfoCard)
