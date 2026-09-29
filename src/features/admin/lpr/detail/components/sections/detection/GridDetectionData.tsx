import { Col, Empty, Row } from 'antd'
import React, { useMemo } from 'react'
import { CardDetectionVehicle } from '../../../components'

interface Props {

}

export interface DataType {
  id: string
  timestamp: string
  license_number: string
  license_province: string
  license_type: string
  confidence_level: string
  camera_name: string
  ip_address: string
  license_image: string
}

const GridDetectionData: React.FC<Props> = (props) => {
  const { } = props

  const data: DataType[] = useMemo(() => {
    return [
      {
        id: '1',
        timestamp: '20 เม.ย. 2569 15:20:36',
        license_number: 'กจ3849',
        license_province: 'สิงห์บุรี',
        license_type: 'รถกระบะ',
        confidence_level: '44.0%',
        camera_name: '69MST-SBR2006-LPR002-จุดที่1-กม.0+500-มุ่งหน้าที่พักสายตรวจตำบลน้ำตาล',
        ip_address: '192.168.3.171',
        license_image: 'https://i.pinimg.com/1200x/10/98/6b/10986b50aa46e4326e085125534046bd.jpg',
      },
      {
        id: '2',
        timestamp: '20 เม.ย. 2569 14:19:03',
        license_number: 'วง5692',
        license_province: 'สิงห์บุรี',
        license_type: 'รถยนต์',
        confidence_level: '44.0%',
        camera_name: '69MST-SBR2006-LPR002-จุดที่1-กม.0+500-มุ่งหน้าที่พักสายตรวจตำบลน้ำตาล',
        ip_address: '192.168.3.171',
        license_image: 'https://i.pinimg.com/1200x/10/98/6b/10986b50aa46e4326e085125534046bd.jpg',
      },
      {
        id: '3',
        timestamp: '20 เม.ย. 2569 12:29:29',
        license_number: 'กบ6554',
        license_province: 'สิงห์บุรี',
        license_type: 'รถกระบะ',
        confidence_level: '50.0%',
        camera_name: '69MST-SBR2006-LPR002-จุดที่1-กม.0+500-มุ่งหน้าที่พักสายตรวจตำบลน้ำตาล',
        ip_address: '192.168.3.171',
        license_image: 'https://i.pinimg.com/1200x/10/98/6b/10986b50aa46e4326e085125534046bd.jpg',
      },
      {
        id: '4',
        timestamp: '20 เม.ย. 2569 11:37:28',
        license_number: 'กว5168',
        license_province: 'สุพรรณบุรี',
        license_type: 'รถกระบะ',
        confidence_level: '51.0%',
        camera_name: '69MST-SBR2006-LPR001-จุดที่1-กม.0+500-มุ่งหน้าทางหลวงหมายเลข 32',
        ip_address: '192.168.3.170',
        license_image: 'https://i.pinimg.com/1200x/10/98/6b/10986b50aa46e4326e085125534046bd.jpg',
      },
      {
        id: '5',
        timestamp: '20 เม.ย. 2569 11:02:17',
        license_number: '2ขร2201',
        license_province: 'สิงห์บุรี',
        license_type: 'รถกระบะ',
        confidence_level: '12.8%',
        camera_name: '69MST-SBR2006-LPR001-จุดที่1-กม.0+500-มุ่งหน้าทางหลวงหมายเลข 32',
        ip_address: '192.168.3.170',
        license_image: 'https://i.pinimg.com/1200x/10/98/6b/10986b50aa46e4326e085125534046bd.jpg',
      },
    ]
  }, [])

  const renderDetectionData = useMemo(() => {
    return data.map(item => {
      return (
        <Col key={item.id} xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
          <CardDetectionVehicle data={item} />
        </Col>
      )
    })
  }, [data])

  if (!data.length) return <Empty description="No detection data available" />

  return (
    <Row gutter={[16, 16]}>
      {renderDetectionData}
    </Row>
  )
}

export default React.memo<Props>(GridDetectionData)
