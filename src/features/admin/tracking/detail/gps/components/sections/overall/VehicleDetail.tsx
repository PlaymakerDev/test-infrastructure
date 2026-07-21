import { VehicleHistoryData } from '@/types/tracking/detail-gps-api'
import { fmtNumber } from '@/utils/formatNumber'
import { Col, Row } from 'antd'
import React from 'react'

interface Props {
  data?: VehicleHistoryData
}

const VehicleDetail: React.FC<Props> = (props) => {
  const { data } = props

  return (
    <div className='rounded-2xl p-5 bg-(--mid-gray) lg:-mr-3'>
      <section>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h2 className='font-bold text-white leading-tight'>{data?.vehicle.plate_no || '-'}</h2>
            <p className='fs-12 text-gray-400 text-sm mt-1'>{data?.vehicle.plate_province || '-'}</p>
          </div>
          <span className='inline-block py-0.5 px-3.5 rounded-full text-xs whitespace-nowrap border border-(--yellow) text-(--yellow) mt-1'>
            {data?.vehicle.kind_desc || '-'}
          </span>
        </div>
      </section>
      <section className='mt-5'>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={12}>
            <h4 className='text-(--default-blue) font-normal! mb-3'>ข้อมูลรถบรรทุก</h4>
            <section>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>ยี่ห้อ</p>
                <p className='fs-12'>{data?.vehicle.brn_desc || '-'}</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>ประเภท</p>
                <p className='fs-12'>{data?.vehicle.type_desc || '-'}</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>น้ำหนัก</p>
                <p className='fs-12'>{fmtNumber(Number(data?.vehicle.wgt)) || 0} กม.</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>บริษัท</p>
                <p className='fs-12'>{data?.vehicle.com_name || '-'}</p>
              </div>
            </section>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={12}>
            <h4 className='text-(--default-blue) font-normal! mb-3'>ข้อมูลสายทาง</h4>
            <section>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>สายทาง</p>
                <p className='fs-12'>{data?.vehicle.road_name || '-'}</p>
              </div>
            </section>
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default React.memo<Props>(VehicleDetail)
