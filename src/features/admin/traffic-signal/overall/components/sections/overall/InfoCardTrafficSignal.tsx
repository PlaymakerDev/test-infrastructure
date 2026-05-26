"use client"
import { Col, Row } from 'antd'
import React, { useMemo } from 'react'
import { TbShield, TbTrafficLights } from 'react-icons/tb'
import { TRAFFIC_SIGNAL_PROJECTS } from '@/features/admin/traffic-signal/overall/data/trafficSignals'

interface Props {}

/** Right rail — 3 stat cards summarising the traffic-signal fleet.
 *  Visual style matches `crosswalk/InfoCardSection` (Row/Col, flat 10%
 *  background tint, `rounded-[20px]`, `fs-24` clamp icon/heading). */
const InfoCardTrafficSignal: React.FC<Props> = () => {
  const stats = useMemo(() => {
    const total = TRAFFIC_SIGNAL_PROJECTS.length
    const online = TRAFFIC_SIGNAL_PROJECTS.filter((p) => p.connection === 'online').length
    const inWarranty = TRAFFIC_SIGNAL_PROJECTS.filter((p) => p.warranty === 'in-warranty').length
    const inWarrantyOnline = TRAFFIC_SIGNAL_PROJECTS.filter(
      (p) => p.warranty === 'in-warranty' && p.connection === 'online'
    ).length
    const expired = TRAFFIC_SIGNAL_PROJECTS.filter((p) => p.warranty === 'expired').length
    const expiredOnline = TRAFFIC_SIGNAL_PROJECTS.filter(
      (p) => p.warranty === 'expired' && p.connection === 'online'
    ).length
    const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100)
    return {
      total, online, totalPct: pct(online, total),
      inWarranty, inWarrantyOnline, inWarrantyPct: pct(inWarrantyOnline, inWarranty),
      expired, expiredOnline, expiredPct: pct(expiredOnline, expired),
    }
  }, [])

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='h-full bg-[#FFB1001A] border-2 rounded-[20px] p-5 border-(--yellow)'>
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
        <div className='h-full bg-[#05F2DB1A] border-2 rounded-[20px] p-5 border-teal-500'>
          <TbShield className='fs-24 text-teal-500 mb-1' />
          <h3 className='text-teal-500'>ในค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.inWarranty.toLocaleString()}</span> จุดติดตั้ง
          </p>
          <p className='fs-11 text-gray-400'>
            Active : {stats.inWarrantyOnline} ({stats.inWarrantyPct.toFixed(1)}%)
          </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='h-full bg-[#9797971A] border-2 rounded-[20px] p-5 border-gray-500'>
          <TbShield className='fs-24 text-gray-400 mb-1' />
          <h3 className='text-gray-400'>หมดค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.expired.toLocaleString()}</span> จุดติดตั้ง
          </p>
          <p className='fs-11 text-gray-400'>
            Active : {stats.expiredOnline} ({stats.expiredPct.toFixed(1)}%)
          </p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardTrafficSignal)
