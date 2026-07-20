"use client"
import React from 'react'
import { Empty } from 'antd'

/** The backend currently exposes cabinet-level lighting telemetry only. Keep
 * the section explicit and truthful until a per-lamp endpoint is available. */
const LampEquipmentTable: React.FC = () => (
  <section className='mt-4 pb-5 flex flex-col gap-3'>
    <h3 className='text-[#FCD116] text-base sm:text-lg font-bold m-0'>
      ตารางข้อมูลอุปกรณ์แต่ละจุดติดตั้ง
    </h3>
    <div className='min-h-[220px] rounded-[20px] bg-[#191919] flex items-center justify-center'>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description='ยังไม่มีข้อมูลรายโคมจาก API'
      />
    </div>
  </section>
)

export default React.memo(LampEquipmentTable)
