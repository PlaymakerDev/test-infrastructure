import { MobileDailyCountData } from '@/types/tracking/detail-api';
import { fmtNumber } from '@/utils/formatNumber';
import React from 'react'
import { TbChartAreaLine, TbTrafficCone, TbTruck, TbUserShield } from "react-icons/tb";
// import AutoFitText from '@/components/common/AutoFitText';

interface Props {
  data?: MobileDailyCountData
}

const MobileInfoCard: React.FC<Props> = (props) => {
  const { data } = props

  const closeStation = Number(data?.total_station_count) - Number(data?.open_station_count)
  const different = Number(data?.plan) - Number(data?.actual)

  return (
    <div className='flex flex-col gap-4'>
      <div className='bg-[#66AEFF1A] border-2 border-(--yellow) p-3 rounded-2xl'>
        <div className='flex items-center gap-2 mb-2'>
          <TbUserShield className='fs-22 text-(--yellow) shrink-0' />
          <h4 className='text-(--yellow) mb-0'>ด่านเคลื่อนที่ทั้งหมด</h4>
        </div>
        <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(Number(data?.open_station_count)) || 0}</span> <span className='fs-14'>ด่าน</span></p>
        <p className='fs-12 text-gray-400 mb-0'>{data?.top_region || '-'} ({fmtNumber(Number(data?.top_region_percent))}%)</p>
      </div>
      <div className='bg-[#66AEFF1A] border-2 border-(--default-blue) p-3 rounded-2xl'>
        <div className='flex items-center gap-2 mb-2'>
          <TbTruck className='fs-22 text-(--default-blue) shrink-0' />
          <h4 className='text-(--default-blue) mb-0'>รถเข้าชั่งทั้งหมด</h4>
        </div>
        <div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(Number(data?.sum_total)) || 0}</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน ({fmtNumber(Number(data?.max_grossweight_not_over)) || 0} ตัน)</p>
        </div>
      </div>
      <div className='bg-[#66AEFF1A] border-2 border-red-500 p-3 rounded-2xl'>
        <div className='flex items-center gap-2 mb-2'>
          <TbTruck className='fs-22 text-red-500 shrink-0' />
          <h4 className='text-red-500 mb-0'>รถน้ำหนักเกิน</h4>
        </div>
        <div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(Number(data?.sum_total_over)) || 0}</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน ({fmtNumber(Number(data?.max_grossweight_over)) || 0} ตัน)</p>
        </div>
      </div>
      <div className='bg-[#66AEFF1A] border-2 border-white p-3 rounded-2xl'>
        <div className='flex items-center gap-2 mb-2'>
          <TbTrafficCone className='fs-22 shrink-0' />
          <h4 className='mb-0'>สถานะด่านตรวจสอบน้ำหนักเคลื่อนที่</h4>
        </div>
        <div className='flex flex-wrap gap-1.5'>
          <div className='overflow-hidden bg-[#66AEFF1A] border border-(--default-blue) px-2 py-1 rounded-3xl'>
            <p className='fs-12 text-(--default-blue) text-center'>{fmtNumber(Number(data?.open_station_count)) || 0} เปิดด่าน</p>
          </div>
          <div className='overflow-hidden bg-[#66AEFF1A] border border-red-500 px-2 py-1 rounded-3xl'>
            <p className='fs-12 text-red-500 text-center'>{fmtNumber(closeStation) || 0} ปิดด่าน</p>
          </div>
        </div>
        {/* <div className='flex flex-nowrap gap-1.5'>
          <div className='flex-1 min-w-0 overflow-hidden bg-[#66AEFF1A] border border-green-500 px-2 py-1 rounded-3xl'>
            <AutoFitText className='text-green-500 text-center'>{fmtNumber(Number(data?.open_station_count)) || 0} เปิดด่าน</AutoFitText>
          </div>
          <div className='flex-1 min-w-0 overflow-hidden bg-[#66AEFF1A] border border-red-500 px-2 py-1 rounded-3xl'>
            <AutoFitText className='text-red-500 text-center'>{fmtNumber(closeStation) || 0} ปิดด่าน</AutoFitText>
          </div>
        </div> */}
      </div>
      <div className='bg-[#66AEFF1A] border-2 border-white p-3 rounded-2xl'>
        <div className='flex items-center gap-2 mb-2'>
          <TbChartAreaLine className='fs-22 shrink-0' />
          <h4 className='mb-0'>เปรียบเทียบแผน-ผล</h4>
        </div>
        <div className='flex flex-wrap gap-1.5'>
          <div className='bg-[#66AEFF1A] border border-(--yellow) px-2 py-1 rounded-3xl'>
            <p className='fs-12 text-(--yellow) text-center'>{fmtNumber(Number(data?.plan)) || 0} แผน</p>
          </div>
          <div className='bg-[#66AEFF1A] border border-(--default-blue) px-2 py-1 rounded-3xl'>
            <p className='fs-12 text-(--default-blue) text-center'>{fmtNumber(Number(data?.actual)) || 0} ผล</p>
          </div>
          <div className='bg-[#66AEFF1A] border border-red-500 px-2 py-1 rounded-3xl'>
            <p className='fs-12 text-red-500 text-center'>{fmtNumber(different) || 0} ส่วนต่าง</p>
          </div>
        </div>
        {/* <div className='flex flex-nowrap gap-1.5'>
          <div className='flex-1 min-w-0 overflow-hidden bg-[#66AEFF1A] border border-yellow-500 px-2 py-1 rounded-3xl'>
            <AutoFitText className='text-yellow-500 text-center'>{fmtNumber(Number(data?.plan)) || 0} แผน</AutoFitText>
          </div>
          <div className='flex-1 min-w-0 overflow-hidden bg-[#66AEFF1A] border border-blue-500 px-2 py-1 rounded-3xl'>
            <AutoFitText className='text-blue-500 text-center'>{fmtNumber(Number(data?.actual)) || 0} ผล</AutoFitText>
          </div>
          <div className='flex-1 min-w-0 overflow-hidden bg-[#66AEFF1A] border border-red-500 px-2 py-1 rounded-3xl'>
            <AutoFitText className='text-red-500 text-center'>{fmtNumber(different) || 0} ส่วนต่าง</AutoFitText>
          </div>
        </div> */}
      </div>
    </div>
  )
}

export default React.memo<Props>(MobileInfoCard)
