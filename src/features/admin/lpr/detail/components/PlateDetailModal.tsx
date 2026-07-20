"use client"
import React from 'react'
import Image from 'next/image'
import { Modal } from 'antd'
import type { LPRPointPlate, LPRSource } from '@/types/lpr/lpr-api'

const SOURCE_LABEL: Record<LPRSource, string> = { anpr: 'ANPR', wim: 'WIM' }

interface Props {
  item: LPRPointPlate | null
  onClose: () => void
}

/** Shared full-size plate/vehicle detail modal — opened from both the Recent
 *  Plates mini-list (Overall tab) and the paginated Detection table (Tab 2).
 *  Kept in the detail folder because it depends on the LPRPointPlate shape
 *  the two callers already have. */
const PlateDetailModal: React.FC<Props> = ({ item, onClose }) => (
  <Modal
    open={!!item}
    onCancel={onClose}
    footer={null}
    title={item ? `${item.plate_number} · ${item.plate_province}` : ''}
    width={720}
    destroyOnHidden
  >
    {item && (
      <div className='flex flex-col gap-3'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {item.vehicle_image && (
            <Image
              src={item.vehicle_image}
              alt='vehicle'
              width={640}
              height={360}
              unoptimized
              className='w-full h-auto rounded-lg bg-black'
            />
          )}
          {item.plate_image && (
            <Image
              src={item.plate_image}
              alt='plate'
              width={640}
              height={360}
              unoptimized
              className='w-full h-auto rounded-lg bg-black object-contain'
            />
          )}
        </div>
        <dl className='grid grid-cols-2 gap-x-4 gap-y-1 fs-13'>
          <dt className='text-gray-400'>เวลา</dt>
          <dd>{item.captured_at_display}</dd>
          <dt className='text-gray-400'>กล้อง</dt>
          <dd>{item.camera_name || '-'}</dd>
          <dt className='text-gray-400'>ที่มา</dt>
          <dd>{SOURCE_LABEL[item.source]}</dd>
          <dt className='text-gray-400'>ประเภทรถ</dt>
          <dd>{item.vehicle_type_name || '-'}</dd>
          <dt className='text-gray-400'>ยี่ห้อ</dt>
          <dd>{item.vehicle_brand || '-'}</dd>
          <dt className='text-gray-400'>สี</dt>
          <dd>{item.vehicle_color || '-'}</dd>
          {item.speed != null && (
            <>
              <dt className='text-gray-400'>ความเร็ว</dt>
              <dd>{item.speed.toLocaleString('th-TH')} กม./ชม.</dd>
            </>
          )}
          {item.is_overweight != null && (
            <>
              <dt className='text-gray-400'>น้ำหนักเกิน</dt>
              <dd className={item.is_overweight ? 'text-red-400' : ''}>
                {item.is_overweight ? 'ใช่' : 'ไม่'}
              </dd>
            </>
          )}
        </dl>
      </div>
    )}
  </Modal>
)

export default React.memo<Props>(PlateDetailModal)
