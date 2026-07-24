import { VehicleHistoryData } from '@/types/tracking/detail-gps-api'
import { fmtNumber } from '@/utils/formatNumber'
import { Col, Row } from 'antd'
import React from 'react'

interface Props {
  data?: VehicleHistoryData
}

// Movement-status pill — same buckets + colors as the 3 KPI cards
// (VehicleStat: รถกำลังเคลื่อนที่ / รถจอดนิ่ง / รถประวัติน้ำหนักเกิน) and the
// same speed rule the map markers use (VehicleMarkerLayer: speed === 0 = ส้ม).
// The red overweight bucket stays unreachable here until /vehicle_history
// returns an isoverweight flag (only /vehical_location's CarList has it) —
// extend `deriveStatus` when the backend adds the field.
const STATUS_PILL = {
  moving: { label: 'รถกำลังเคลื่อนที่', color: '#B2FF00' },
  stopped: { label: 'รถจอดนิ่ง', color: '#FF6A00' },
  overweight: { label: 'รถประวัติน้ำหนักเกิน', color: '#E94C4C' },
} as const

const deriveStatus = (speed: number): keyof typeof STATUS_PILL =>
  speed > 0 ? 'moving' : 'stopped'

const VehicleDetail: React.FC<Props> = (props) => {
  const { data } = props
  const pill = data ? STATUS_PILL[deriveStatus(data.vehicle.speed)] : null

  return (
    <div className='rounded-2xl p-5 bg-(--mid-gray) lg:-mr-3'>
      <section>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h2 className='font-bold text-white leading-tight'>{data?.vehicle.plate_no || '-'}</h2>
            <p className='fs-12 text-gray-400 mt-1'>{data?.vehicle.plate_province || '-'}</p>
          </div>
          {pill && (
            <div
              className='inline-block py-0.5 px-3.5 rounded-full text-xs whitespace-nowrap border mt-1'
              style={{ borderColor: pill.color, color: pill.color }}
            >
              <p className='fs-12'>{pill.label}</p>
            </div>
          )}
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
              {/* ลักษณะรถ (kind_desc เช่น "ลากจูง") — moved down here from the
                * header pill, which now shows movement STATUS instead. */}
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>ลักษณะรถ</p>
                <p className='fs-12'>{data?.vehicle.kind_desc || '-'}</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>น้ำหนัก</p>
                <p className='fs-12'>{fmtNumber(Number(data?.vehicle.wgt)) || 0} กิโลกรัม</p>
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
