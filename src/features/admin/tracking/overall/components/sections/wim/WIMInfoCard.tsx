import { SumWim } from '@/types/tracking/overall-api';
import { Col, Row } from 'antd'
import React, { useMemo } from 'react'
import { TbFlag, TbTruck, TbVideo } from "react-icons/tb";
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  data?: SumWim[]
}

const DEFAULT_COUNT = {
  total_weight: 0,
  total_overweight: 0,
  total_10percent: 0,
  open: 0,
  no_data: 0,
  problem: 0,
  total_cameras: 0,
  offline_cameras: 0,
  stations_without_cameras: 0
}

const WIMInfoCard: React.FC<Props> = (props) => {
  const { data } = props

  const calcData = useMemo(() => {
    if (!data || !Array.isArray(data)) return DEFAULT_COUNT

    let open = 0;
    let no_data = 0;
    let problem = 0;
    let total_cameras = 0;
    let offline_cameras = 0;
    let stations_without_cameras = 0;

    data.forEach(item => {
      const total = Number(item.total);
      const totalCctv = Number(item.total_cctv) || 0;
      const offlineCctv = Number(item.offline_cctv) || 0;
      const onlineCctv = totalCctv - offlineCctv;

      if (total > 0) {
        open++;
      } else if (total === 0 && onlineCctv > 0) {
        no_data++;
      } else if (total === 0 && onlineCctv === 0) {
        problem++;
      }

      total_cameras += totalCctv;
      offline_cameras += offlineCctv;
      if (totalCctv === 0) {
        stations_without_cameras++;
      }
    });

    const totalVehicles = data.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
    const totalOverweight = data.reduce((sum, item) => sum + (Number(item.over) || 0), 0)
    const total10Percent = data.reduce((sum, item) => sum + (Number(item.over_10percent) || 0), 0)

    return {
      ...DEFAULT_COUNT,
      total_weight: totalVehicles,
      total_overweight: totalOverweight,
      total_10percent: total10Percent,
      open: open,
      no_data: no_data,
      problem: problem,
      total_cameras: total_cameras,
      offline_cameras: offline_cameras,
      stations_without_cameras: stations_without_cameras

    }
  }, [data])

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-yellow-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbFlag className='fs-22 text-yellow-500 shrink-0' />
            <h4 className='text-yellow-500 mb-0'>WIM ทั้งหมด</h4>
          </div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(data?.length) || 0}</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>ภาคตะวันออก (94.3%)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-blue-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-blue-500 shrink-0' />
            <h4 className='text-blue-500 mb-0'>รถเข้าชั่งทั้งหมด</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(calcData.total_weight) || 0}</span> <span className='fs-14'>คัน</span></p>
            <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (173.4 ตัน)</p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-red-500 shrink-0' />
            <h4 className='text-red-500 mb-0'>รถน้ำหนักเกิน</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(calcData.total_overweight) || 0}</span> <span className='fs-14'>คัน</span></p>
            <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (184.2 ตัน)</p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-orange-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-orange-500 shrink-0' />
            <h4 className='text-orange-500 mb-0'>รถน้ำหนักเกิน 10%</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(calcData.total_10percent) || 0}</span> <span className='fs-14'>คัน</span></p>
            <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (192.1 ตัน)</p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbFlag className='fs-22 shrink-0' />
            <h4 className='mb-0'>สถานะ WIM</h4>
          </div>
          <div className='flex flex-wrap gap-2'>
            <div className='bg-[#66AEFF1A] border border-green-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-green-500 mb-0'>{fmtNumber(calcData.open) || 0} เปิดปกติ</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-yellow-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-yellow-500 mb-0'>{fmtNumber(calcData.problem) || 0} ระบบขัดข้อง</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-red-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-red-500 mb-0'>{fmtNumber(calcData.no_data) || 0} ไม่ส่งข้อมูล</p>
            </div>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbVideo className='fs-22 shrink-0' />
            <h4 className='mb-0'>สถานะกล้อง</h4>
          </div>
          <div className='flex flex-wrap gap-2'>
            <div className='bg-[#66AEFF1A] border border-yellow-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-yellow-500 mb-0'>{fmtNumber(calcData.total_cameras) || 0} ทั้งหมด</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-blue-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-blue-500 mb-0'>{fmtNumber(calcData.total_cameras - calcData.offline_cameras) || 0} ออนไลน์</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-red-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-red-500 mb-0'>{fmtNumber(calcData.offline_cameras) || 0} ออฟไลน์</p>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(WIMInfoCard)
