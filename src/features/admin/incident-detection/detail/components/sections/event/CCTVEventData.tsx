"use client"
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { Col, Row } from 'antd'
import React from 'react'

interface Props {}

type EventType = 'ขับรถย้อนศร' | 'รถจอดกีดขวาง' | 'อุบัติเหตุ'

interface EventRecord {
  key: string; eventType: EventType; timestamp: string; cameraName: string; ipAddress: string
}

const EVENT_COLOR: Record<EventType, string> = {
  'ขับรถย้อนศร': 'text-red-500',
  'รถจอดกีดขวาง': 'text-orange-500',
  'อุบัติเหตุ': 'text-yellow-500',
}

const mockData: EventRecord[] = [
  { key: '1', eventType: 'ขับรถย้อนศร', timestamp: '20 เม.ย. 2569 18:14:21 น.', cameraName: '68SET-CCO4050-FAI012-จุดที่8-กม.10+550-ปุ่งหน้าปากน้ำโสภาคดี', ipAddress: '10.12.7.3' },
  { key: '2', eventType: 'รถจอดกีดขวาง', timestamp: '20 เม.ย. 2569 12:48:02 น.', cameraName: '68FTD-NPM3015-FAI052-จุดที่26-กม.13+850-ปุ่งหน้าโรงเรียนบ้านน้ำเพิ่ม', ipAddress: '10.12.2.1' },
  { key: '3', eventType: 'รถจอดกีดขวาง', timestamp: '20 เม.ย. 2569 12:10:58 น.', cameraName: '68SET-CCO4050-FAI012-จุดที่8-กม.10+550-ปุ่งหน้าปากน้ำโสภาคดี', ipAddress: '10.12.7.3' },
  { key: '4', eventType: 'อุบัติเหตุ', timestamp: '20 เม.ย. 2569 10:22:15 น.', cameraName: '68FTD-NPM3015-FAI052-จุดที่26-กม.13+850-ปุ่งหน้าโรงเรียนบ้านน้ำเพิ่ม', ipAddress: '10.12.2.1' },
]

const CCTVEventData: React.FC<Props> = () => {
  return (
    <Row gutter={[16, 16]}>
      {mockData.map((item) => (
        <Col key={item.key} xs={24} sm={24} md={12} lg={12} xl={6} xxl={6}>
          <div className='p-5 bg-(--gray) rounded-lg'>
            <div className='mb-2'>
              <h4 className={EVENT_COLOR[item.eventType]}>{item.eventType}</h4>
              <p className='fs-12 text-gray-400'>{item.timestamp}</p>
            </div>
            <figure className='flex-1 min-h-0 rounded-lg overflow-hidden mb-1.5'>
              <HLSLivePlayer figureClassName='h-full' />
            </figure>
            <div>
              <h4 className='text-blue-500'>{item.cameraName}</h4>
              <p className='fs-12 text-gray-400'>IP Address : {item.ipAddress}</p>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  )
}

export default React.memo<Props>(CCTVEventData)
