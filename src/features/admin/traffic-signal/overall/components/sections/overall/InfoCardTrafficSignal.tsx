"use client"
import { Col, Row } from 'antd'
import React, { useMemo } from 'react'
import { TbShield, TbTrafficLights } from 'react-icons/tb'
import { useTrafficTotals } from '@/hooks/queries/traffic-signal'
import { useDeptId } from '@/hooks/useDeptId'

interface Props {}

/** Right rail — 3 stat cards summarising the traffic-signal fleet.
 *  Data: `GET /traffic/departments/{deptId}/overview/totals` */
const InfoCardTrafficSignal: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { data, isLoading } = useTrafficTotals(deptId)

  const stats = useMemo(() => {
    const total = data?.solution.total ?? 0
    const online = data?.solution.online ?? 0
    const inWarranty = data?.warranty.active ?? 0
    const expired = data?.warranty.expired ?? 0
    const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100)
    return {
      total,
      online,
      totalPct: pct(online, total),
      inWarranty,
      inWarrantyPct: pct(inWarranty, total),
      expired,
      expiredPct: pct(expired, total),
    }
  }, [data])

  // While loading, render the same skeleton so the layout doesn't jump.
  const dim = isLoading ? 'opacity-50' : ''

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#FFB1001A] border-2 rounded-[20px] p-5 border-(--yellow) ${dim}`}>
          <TbTrafficLights className='fs-24 text-(--yellow) mb-1' />
          <h3 className='text-(--yellow)'>แยกจราจรในระบบทั้งหมด</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.total.toLocaleString()}</span> จุดติดตั้ง
          </p>
          <p className='fs-11 text-gray-400'>
            Active : {stats.online} ({stats.totalPct.toFixed(1)}%)
          </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#05F2DB1A] border-2 rounded-[20px] p-5 border-teal-500 ${dim}`}>
          <TbShield className='fs-24 text-teal-500 mb-1' />
          <h3 className='text-teal-500'>ในค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.inWarranty.toLocaleString()}</span> จุดติดตั้ง
          </p>
          <p className='fs-11 text-gray-400'>{stats.inWarrantyPct.toFixed(1)}%</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#9797971A] border-2 rounded-[20px] p-5 border-gray-500 ${dim}`}>
          <TbShield className='fs-24 text-gray-400 mb-1' />
          <h3 className='text-gray-400'>หมดค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.expired.toLocaleString()}</span> จุดติดตั้ง
          </p>
          <p className='fs-11 text-gray-400'>{stats.expiredPct.toFixed(1)}%</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardTrafficSignal)
