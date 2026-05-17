"use client"
import { LicenseTimelineItem, LicenseTimelineStatus } from '@/components/list/LicenseList'
import { Image } from 'antd'
import React from 'react'
import { TbClipboardList, TbGauge, TbRoad, TbWeight } from 'react-icons/tb'

interface Props {
  item: LicenseTimelineItem
  isFirst?: boolean
}

const STATUS_STYLE: Record<LicenseTimelineStatus, string> = {
  'ไม่เกินพิกัด': 'border-blue-400 text-blue-400',
  'เกินพิกัด': 'border-red-400 text-red-400',
}

const TimelineCard: React.FC<Props> = ({ item, isFirst }) => {
  const isOverweight = item.status === 'เกินพิกัด'

  return (
    <div className={`@container ${isFirst ? 'bg-(--dark-black)' : 'bg-[#2B2B2B]'} p-4 rounded-lg`}>
      <div className='flex flex-col @sm:flex-row gap-4'>
        {/* Thumbnail */}
        <div className='w-full @sm:w-36 shrink-0 rounded-md overflow-hidden'>
          <Image
            src={item.image}
            alt={item.title}
            width={"100%"}
            height={"100%"}
            className='w-full h-full object-cover aspect-video @sm:aspect-auto @sm:h-24'
            preview={true}
          />
        </div>

        {/* Content */}
        <div className='flex-1 min-w-0 flex flex-col gap-2'>
          {/* Title row */}
          <div className='flex flex-wrap items-start justify-between gap-x-3 gap-y-1'>
            <div className='min-w-0'>
              <h4 className='leading-snug'>{item.title}</h4>
              <p className='text-white/50'>{item.timestamp}</p>
            </div>
            <span className={`shrink-0 text-xs border rounded-full px-3 py-0.5 whitespace-nowrap ${STATUS_STYLE[item.status]}`}>
              {item.status}
            </span>
          </div>

          {/* Camera name */}
          <p className='text-(--yellow) truncate'>
            ชื่อกล้อง : {item.camera_name}
          </p>

          {/* Stats */}
          <div className='grid grid-cols-1 @sm:grid-cols-2 @2xl:grid-cols-4 gap-3 mt-1'>
            <div className='flex flex-col items-center gap-1'>
              <TbGauge className='fs-24' />
              <p className='fs-11'>ความเร็ว : {item.speed} กม./ชม.</p>
            </div>
            <div className='flex flex-col items-center gap-1'>
              <TbRoad className='fs-24' />
              <p className='fs-11'>หมายเลขเลน : {item.lane}</p>
            </div>
            {item.weight && (
              <div className='flex flex-col items-center gap-1'>
                <TbWeight className='fs-24' />
                <p className='fs-11'>น้ำหนักที่ชั่งได้ : <span className={isOverweight ? 'text-(--red)' : ''}>{item.weight} ตัน</span></p>
              </div>
            )}
            {item.legal_weight && (
              <div className='flex flex-col items-center gap-1'>
                <TbClipboardList className='fs-24' />
                <p className='fs-11'>น้ำหนักตามมาตรฐาน : {item.legal_weight} ตัน</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(TimelineCard)
