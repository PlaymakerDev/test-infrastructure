"use client"
import { Col, Row } from 'antd'
import React, { useMemo } from 'react'
import { TbChartBar, TbShield } from 'react-icons/tb'
import { useTrafficVolumeTotals } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {}

/** Right rail — 3 stat cards summarising the traffic-volume fleet.
 *  Data: `GET /counting/departments/{deptId}/overview/totals` */
const InfoCardTrafficVolume: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { data, isLoading } = useTrafficVolumeTotals(deptId)

  const stats = useMemo(() => {
    const cameraTotal = data?.camera.total ?? 0
    const cameraOnline = data?.camera.online ?? 0
    const inWarranty = data?.warranty.active ?? 0
    const expired = data?.warranty.expired ?? 0
    // Warranty totals don't sum to camera.total — they count projects, not
    // cameras. Use the warranty sum as the denominator for ใน/หมดค้ำ %s.
    const warrantyTotal = inWarranty + expired
    const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100)
    return {
      cameraTotal,
      cameraOnline,
      cameraOnlinePct: pct(cameraOnline, cameraTotal),
      inWarranty,
      inWarrantyPct: pct(inWarranty, warrantyTotal),
      expired,
      expiredPct: pct(expired, warrantyTotal),
    }
  }, [data])

  // Keep the layout stable while loading.
  const dim = isLoading ? 'opacity-50' : ''

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#FFB1001A] border-2 rounded-[20px] p-5 border-(--yellow) ${dim}`}>
          <TbChartBar className='fs-24 text-(--yellow) mb-1' />
          <h3 className='text-(--yellow)'>กล้องนับรถในระบบทั้งหมด</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.cameraTotal.toLocaleString()}</span> กล้อง
          </p>
          <p className='fs-11 text-gray-400'>
            Active : {fmtNumber(stats.cameraOnline, 0)} ({fmtNumber(stats.cameraOnlinePct, 1)}%)
          </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#05F2DB1A] border-2 rounded-[20px] p-5 border-teal-500 ${dim}`}>
          <TbShield className='fs-24 text-teal-500 mb-1' />
          <h3 className='text-teal-500'>ในค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.inWarranty.toLocaleString()}</span> โครงการ
          </p>
          <p className='fs-11 text-gray-400'>{fmtNumber(stats.inWarrantyPct, 1)}%</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#9797971A] border-2 rounded-[20px] p-5 border-gray-500 ${dim}`}>
          <TbShield className='fs-24 text-gray-400 mb-1' />
          <h3 className='text-gray-400'>หมดค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.expired.toLocaleString()}</span> โครงการ
          </p>
          <p className='fs-11 text-gray-400'>{fmtNumber(stats.expiredPct, 1)}%</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardTrafficVolume)
