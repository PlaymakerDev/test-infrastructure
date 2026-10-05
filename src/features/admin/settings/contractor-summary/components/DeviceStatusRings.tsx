"use client"
import React from 'react'
import { Empty, Skeleton } from 'antd'
import type { DeviceRing } from '../hooks/useContractorDeviceRings'
import StatusRing from './StatusRing'

interface Props {
  rings: DeviceRing[]
  isLoading: boolean
  isError: boolean
}

/** ภาพรวมสถานะการทำงานของอุปกรณ์ทุกโครงการ — one ring per system the
 *  contractor has, in the fixed system order. */
const DeviceStatusRings: React.FC<Props> = ({ rings, isLoading, isError }) => {
  const renderBody = () => {
    if (isLoading) {
      return (
        <div className='flex flex-wrap gap-8'>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton.Avatar key={index} active size={index < 3 ? 190 : 116} shape='circle' />
          ))}
        </div>
      )
    }
    if (isError) return <Empty description={<span className='fs-12'>โหลดสถานะอุปกรณ์ไม่สำเร็จ</span>} />
    if (!rings.length) return <Empty description={<span className='fs-12'>ผู้รับจ้างนี้ยังไม่มีอุปกรณ์ในระบบ</span>} />
    const large = rings.filter((ring) => ring.system.large)
    const small = rings.filter((ring) => !ring.system.large)
    // One row when the screen is wide enough for all ten (as in the design);
    // otherwise the wide rings and the small ones each take a centred row of
    // their own instead of a ragged spill. Bottom-aligned, so names and
    // counts share a baseline whatever the ring's size.
    return (
      <div className='flex flex-wrap items-end justify-center gap-x-10 gap-y-10'>
        {large.length > 0 && (
          <div className='flex flex-wrap items-end justify-center gap-x-8 gap-y-10'>
            {large.map((ring) => <StatusRing key={ring.system.key} system={ring.system} totals={ring.totals} />)}
          </div>
        )}
        {small.length > 0 && (
          <div className='flex flex-wrap items-end justify-center gap-x-6 gap-y-10'>
            {small.map((ring) => <StatusRing key={ring.system.key} system={ring.system} totals={ring.totals} />)}
          </div>
        )}
      </div>
    )
  }

  return (
    <section>
      <p className='fs-18 mb-6'>ภาพรวมสถานะการทำงานของอุปกรณ์ทุกโครงการ</p>
      {renderBody()}
    </section>
  )
}

export default React.memo<Props>(DeviceStatusRings)
