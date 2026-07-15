"use client"
import { Empty, Progress } from 'antd'
import React, { useMemo } from 'react'
import { TbCar, TbMap, TbWeight } from 'react-icons/tb'
import { useOverallContext } from '../../../context'
import { usePlateDetail } from '@/hooks/queries/lpr'
import type { LPRFrequentArea } from '@/types/lpr/lpr-api'

const areaIcon = (area: LPRFrequentArea) =>
  area.source === 'wim'
    ? <TbWeight className='fs-22 text-blue-400' />
    : <TbCar className='fs-22 text-blue-400' />

const StatSection: React.FC = () => {
  const { selected } = useOverallContext()
  const { data: detail } = usePlateDetail(selected?.plate_province, selected?.plate_number)

  const areas = useMemo(() => detail?.frequent_areas ?? [], [detail])
  const maxCount = useMemo(
    () => areas.reduce((max, a) => Math.max(max, a.count), 0),
    [areas]
  )

  return (
    <div className='rounded-lg p-5 bg-(--dark-black)'>
      {/* Header */}
      <div className='flex items-center gap-2 mb-4'>
        <TbMap className='fs-22 text-blue-400 shrink-0' />
        <h3 className='text-blue-400'>พื้นที่ตรวจพบบ่อย 30 วันย้อนหลัง</h3>
      </div>

      {/* List */}
      {areas.length === 0 ? (
        <Empty description='ไม่พบข้อมูล' />
      ) : (
        <div className='flex flex-col gap-4'>
          {areas.map((area, i) => (
            <div key={`${area.detection_point ?? 'unknown'}-${i}`} className='flex items-start gap-3'>
              {/* Icon box */}
              <div className='shrink-0 w-11 h-11 flex items-center justify-center rounded-lg bg-(--gray)'>
                {areaIcon(area)}
              </div>

              {/* Content */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between gap-2'>
                  <h4 className='truncate'>{area.detection_point ?? 'ไม่ระบุจุดตรวจจับ'}</h4>
                  <span className='shrink-0 text-blue-400 font-bold'>{area.count}</span>
                </div>
                <Progress
                  percent={maxCount > 0 ? Math.round((area.count / maxCount) * 100) : 0}
                  showInfo={false}
                  strokeColor='#60a5fa'
                  size={['100%', 5]}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default React.memo(StatSection)
