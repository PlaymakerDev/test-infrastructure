"use client"
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { Col, Row } from 'antd'
import React from 'react'

interface Props {}

type ActionType = 'เปลี่ยนข้อความ' | 'ข้อผิดพลาด'

interface ControlRecord {
  key: string
  actionType: ActionType
  timestamp: string
  signName: string
  message: string
  ipAddress: string
}

const mockData: ControlRecord[] = [
  { key: '1', actionType: 'เปลี่ยนข้อความ', timestamp: '20 เม.ย. 2569 18:14:21 น.', signName: 'CAM-F03B-VMS-กม.6+300-มุ่งหน้าบางนา-ตราด', message: 'ระวังอุบัติเหตุ ลดความเร็ว', ipAddress: '10.101.27.1' },
  { key: '2', actionType: 'เปลี่ยนข้อความ', timestamp: '20 เม.ย. 2569 12:48:02 น.', signName: 'CAM-B01-VMS-กม.6+300-มุ่งหน้าลาดกระบัง', message: 'ทางปิด โปรดใช้เส้นทางอื่น', ipAddress: '10.101.27.2' },
  { key: '3', actionType: 'ข้อผิดพลาด', timestamp: '20 เม.ย. 2569 12:10:58 น.', signName: '68SET-PKT3033-B001-กม.1+400', message: 'Connection timeout', ipAddress: '10.101.27.3' },
  { key: '4', actionType: 'เปลี่ยนข้อความ', timestamp: '20 เม.ย. 2569 12:07:01 น.', signName: 'CAM-F03B-VMS-กม.6+300-มุ่งหน้าบางนา-ตราด', message: 'ระวังรถบรรทุกขนาดใหญ่', ipAddress: '10.101.27.1' },
]

const CCTVControlData: React.FC<Props> = () => {
  return (
    <Row gutter={[16, 16]}>
      {mockData.map((item) => (
        <Col key={item.key} xs={24} sm={24} md={12} lg={12} xl={6} xxl={6}>
          <div className='p-5 bg-(--gray) rounded-lg'>
            <div className='mb-2'>
              <h4 className={item.actionType === 'ข้อผิดพลาด' ? 'text-red-500' : 'text-yellow-500'}>{item.actionType}</h4>
              <p className='fs-12 text-gray-400'>{item.timestamp}</p>
              <p className='fs-12 text-white/80 mt-1'>{item.message}</p>
            </div>
            <figure className='flex-1 min-h-0 rounded-lg overflow-hidden mb-1.5'>
              <HLSLivePlayer figureClassName='h-full' />
            </figure>
            <div>
              <h4 className='text-blue-500'>{item.signName}</h4>
              <p className='fs-12 text-gray-400'>IP Address : {item.ipAddress}</p>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  )
}

export default React.memo<Props>(CCTVControlData)
