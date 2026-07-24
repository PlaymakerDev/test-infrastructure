import React from 'react'
import { TbFlag, TbTruck, TbVideo } from "react-icons/tb";
import { fmtNumber } from '@/utils/formatNumber'
import { StationDailyCountData } from '@/types/tracking/detail-api';
// import AutoFitText from '@/components/common/AutoFitText';

interface Props {
  data?: StationDailyCountData
}

const WIMInfoCard: React.FC<Props> = (props) => {
  const { data } = props

  const totalCamera = fmtNumber(Number(data?.camera_online)) + fmtNumber(Number(data?.camera_offline))

  return (
    <div className='flex flex-col gap-4'>
      <div className='bg-[#66AEFF1A] border-2 border-(--yellow) p-3 rounded-2xl'>
        <div className='flex items-center gap-2 mb-2'>
          <TbFlag className='fs-22 text-(--yellow) shrink-0' />
          <h4 className='text-(--yellow) mb-0'>WIM ทั้งหมด</h4>
        </div>
        <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(Number(data?.total)) || 0}</span> <span className='fs-14'>คัน</span></p>
        <p className='fs-12 text-gray-400 mb-0'>{data?.top_region || '-'} ({fmtNumber(Number(data?.top_region_percent)) || 0}%)</p>
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
      <div className='bg-[#66AEFF1A] border-2 border-orange-500 p-3 rounded-2xl'>
        <div className='flex items-center gap-2 mb-2'>
          <TbTruck className='fs-22 text-orange-500 shrink-0' />
          <h4 className='text-orange-500 mb-0'>รถน้ำหนักเกิน 10%</h4>
        </div>
        <div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(Number(data?.sum_isover_10percent)) || 0}</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน ({fmtNumber(Number(data?.max_grossweight_over)) || 0} ตัน)</p>
        </div>
      </div>
      <div className='bg-[#66AEFF1A] border-2 border-white p-3 rounded-2xl'>
        <div className='flex items-center gap-2 mb-2'>
          <TbFlag className='fs-22 shrink-0' />
          <h4 className='mb-0'>สถานะ WIM</h4>
        </div>
        <div className='flex flex-wrap gap-1.5'>
          <div className='bg-[#66AEFF1A] border border-(--default-blue) px-2 py-1 rounded-3xl'>
            <p className='fs-12 text-(--default-blue) text-center'>{fmtNumber(Number(data?.normal)) || 0} เปิดปกติ</p>
          </div>
          <div className='bg-[#66AEFF1A] border border-(--yellow) px-2 py-1 rounded-3xl'>
            <p className='fs-12 text-(--yellow) text-center'>{fmtNumber(Number(data?.abnormal)) || 0} ระบบขัดข้อง</p>
          </div>
          <div className='bg-[#66AEFF1A] border border-red-500 px-2 py-1 rounded-3xl'>
            <p className='fs-12 text-red-500 text-center'>{fmtNumber(Number(data?.wim_disconnected)) || 0} ไม่ส่งข้อมูล</p>
          </div>
        </div>
        {/* <div className='flex flex-nowrap gap-1.5'>
          <div className='flex-1 min-w-0 overflow-hidden bg-[#66AEFF1A] border border-green-500 px-2 py-1 rounded-3xl'>
            <AutoFitText className='text-green-500 text-center'>{fmtNumber(Number(data?.normal)) || 0} เปิดปกติ</AutoFitText>
          </div>
          <div className='flex-1 min-w-0 overflow-hidden bg-[#66AEFF1A] border border-yellow-500 px-2 py-1 rounded-3xl'>
            <AutoFitText className='text-yellow-500 text-center'>{fmtNumber(Number(data?.abnormal)) || 0} ระบบขัดข้อง</AutoFitText>
          </div>
          <div className='flex-1 min-w-0 overflow-hidden bg-[#66AEFF1A] border border-red-500 px-2 py-1 rounded-3xl'>
            <AutoFitText className='text-red-500 text-center'>{fmtNumber(Number(data?.wim_disconnected)) || 0} ไม่ส่งข้อมูล</AutoFitText>
          </div>
        </div> */}
      </div>
      <div className='bg-[#66AEFF1A] border-2 border-white p-3 rounded-2xl'>
        <div className='flex items-center gap-2 mb-2'>
          <TbVideo className='fs-22 shrink-0' />
          <h4 className='mb-0'>สถานะกล้อง</h4>
        </div>
        <div className='flex flex-wrap gap-1.5'>
          <div className='bg-[#66AEFF1A] border border-(--yellow) px-2 py-1 rounded-3xl'>
            <p className='fs-12 text-(--yellow) text-center'>{fmtNumber(Number(totalCamera)) || 0} ทั้งหมด</p>
          </div>
          <div className='bg-[#66AEFF1A] border border-(--default-blue) px-2 py-1 rounded-3xl'>
            <p className='fs-12 text-(--default-blue) text-center'>{fmtNumber(Number(data?.camera_online)) || 0} ออนไลน์</p>
          </div>
          <div className='bg-[#66AEFF1A] border border-red-500 px-2 py-1 rounded-3xl'>
            <p className='fs-12 text-red-500 text-center'>{fmtNumber(Number(data?.camera_offline)) || 0} ออฟไลน์</p>
          </div>
        </div>
        {/* <div className='flex flex-nowrap gap-1.5'>
          <div className='flex-1 min-w-0 overflow-hidden bg-[#66AEFF1A] border border-yellow-500 px-2 py-1 rounded-3xl'>
            <AutoFitText className='text-yellow-500 text-center'>{fmtNumber(Number(totalCamera)) || 0} ทั้งหมด</AutoFitText>
          </div>
          <div className='flex-1 min-w-0 overflow-hidden bg-[#66AEFF1A] border border-blue-500 px-2 py-1 rounded-3xl'>
            <AutoFitText className='text-blue-500 text-center'>{fmtNumber(Number(data?.camera_online)) || 0} ออนไลน์</AutoFitText>
          </div>
          <div className='flex-1 min-w-0 overflow-hidden bg-[#66AEFF1A] border border-red-500 px-2 py-1 rounded-3xl'>
            <AutoFitText className='text-red-500 text-center'>{fmtNumber(Number(data?.camera_offline)) || 0} ออฟไลน์</AutoFitText>
          </div>
        </div> */}
      </div>
    </div>
  )
}

export default React.memo<Props>(WIMInfoCard)
