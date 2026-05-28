"use client"
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { Col, Row } from 'antd'
import React from 'react'

interface Props {}

type ViolationType = 'รถฝ่าฝืนสัญญาณไฟทางข้าม' | 'คนฝ่าฝืนสัญญาณไฟทางข้าม'

interface ViolationRecord {
  key: string
  violationType: ViolationType
  timestamp: string
  cameraName: string
  ipAddress: string
}

const mockData: ViolationRecord[] = [
  {
    key: '1',
    violationType: 'รถฝ่าฝืนสัญญาณไฟทางข้าม',
    timestamp: '20 เม.ย. 2569 18:14:21 น.',
    cameraName: '67FTD-SPK2001-F002จุดที่2-กม.1+020-ปุ่งหน้าบางนา-ตราด',
    ipAddress: '10.101.27.2',
  },
  {
    key: '2',
    violationType: 'คนฝ่าฝืนสัญญาณไฟทางข้าม',
    timestamp: '20 เม.ย. 2569 12:48:02 น.',
    cameraName: '67FTD-SPK2001-F004-จุดที่2-กม.1+020-ปุ่งหน้าลาดกระบัง',
    ipAddress: '10.101.27.4',
  },
  {
    key: '3',
    violationType: 'คนฝ่าฝืนสัญญาณไฟทางข้าม',
    timestamp: '20 เม.ย. 2569 12:10:58 น.',
    cameraName: '67FTD-SPK2001-F005-จุดที่2-กม.1+020-ปุ่งหน้าบางนา-ตราด',
    ipAddress: '10.101.27.3',
  },
  {
    key: '4',
    violationType: 'รถฝ่าฝืนสัญญาณไฟทางข้าม',
    timestamp: '20 เม.ย. 2569 12:07:01 น.',
    cameraName: '67FTD-SPK2001-F002จุดที่2-กม.1+020-ปุ่งหน้าบางนา-ตราด',
    ipAddress: '10.101.27.2',
  },
]

const CCTVViolationData: React.FC<Props> = () => {
  return (
    <Row gutter={[16, 16]}>
      {mockData.map((item) => (
        <Col key={item.key} xs={24} sm={24} md={12} lg={12} xl={6} xxl={6}>
          <div className='p-5 bg-(--gray) rounded-lg'>
            <div className='mb-2'>
              <h4 className={item.violationType === 'คนฝ่าฝืนสัญญาณไฟทางข้าม' ? 'text-red-500' : 'text-orange-500'}>{item.violationType}</h4>
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

export default React.memo<Props>(CCTVViolationData)
