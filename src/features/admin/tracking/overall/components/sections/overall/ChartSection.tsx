import Barchart from '@/components/chart/Barchart'
import { Col, Row } from 'antd'
import React from 'react'
import { TbMapPin } from 'react-icons/tb'

interface Props {

}

const ChartSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
        <Barchart
          bars={[
            {
              color: '#66AEFF',
              dataKey: 'total',
              label: 'รถเข้าซั่งทั้งหมด'
            },
            {
              color: '#FCD116',
              dataKey: 'overweight',
              label: 'รถน้ำหนักเกิน'
            }
          ]}
          data={[
            {
              label: 'จ.\n27/03',
              overweight: 80,
              total: 1050
            },
            {
              label: 'อ.\n28/03',
              overweight: 60,
              total: 570
            },
            {
              label: 'พ.\n29/03',
              overweight: 120,
              total: 760
            },
            {
              label: 'พฤ.\n30/03',
              overweight: 20,
              total: 410
            },
            {
              label: 'ศ.\n31/03',
              overweight: 10,
              total: 900
            },
            {
              label: 'ส.\n01/04',
              overweight: 40,
              total: 650
            },
            {
              label: 'อ.\n02/04',
              overweight: 15,
              total: 420
            }
          ]}
          defaultPeriod="วัน"
          icon={<TbMapPin className="text-yellow-400" size={20} />}
          onPeriodChange={() => { }}
          periods={[
            'วัน',
            'เดือน',
            'ปี'
          ]}
          subtitle="สถิติผลการตรวจสอบน้ำหนัก"
          title="สถานีตรวจสอบน้ำหนัก"
          yAxisDomain={[
            0,
            1200
          ]}
          yAxisTicks={[
            0,
            200,
            400,
            600,
            800,
            1000,
            1200
          ]}
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
        <Barchart
          bars={[
            {
              color: '#66AEFF',
              dataKey: 'total',
              label: 'รถเข้าซั่งทั้งหมด'
            },
            {
              color: '#FCD116',
              dataKey: 'overweight',
              label: 'รถน้ำหนักเกิน'
            }
          ]}
          data={[
            {
              label: 'จ.\n27/03',
              overweight: 80,
              total: 1050
            },
            {
              label: 'อ.\n28/03',
              overweight: 60,
              total: 570
            },
            {
              label: 'พ.\n29/03',
              overweight: 120,
              total: 760
            },
            {
              label: 'พฤ.\n30/03',
              overweight: 20,
              total: 410
            },
            {
              label: 'ศ.\n31/03',
              overweight: 10,
              total: 900
            },
            {
              label: 'ส.\n01/04',
              overweight: 40,
              total: 650
            },
            {
              label: 'อ.\n02/04',
              overweight: 15,
              total: 420
            }
          ]}
          defaultPeriod="วัน"
          icon={<TbMapPin className="text-yellow-400" size={20} />}
          onPeriodChange={() => { }}
          periods={[
            'วัน',
            'เดือน',
            'ปี'
          ]}
          subtitle="สถิติผลการตรวจสอบน้ำหนัก"
          title="สถานีตรวจสอบน้ำหนัก"
          yAxisDomain={[
            0,
            1200
          ]}
          yAxisTicks={[
            0,
            200,
            400,
            600,
            800,
            1000,
            1200
          ]}
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8} xxxl={8}></Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8} xxxl={8}></Col>
    </Row>
  )
}

export default React.memo<Props>(ChartSection)
