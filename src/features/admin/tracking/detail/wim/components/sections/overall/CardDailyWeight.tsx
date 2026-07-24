import type { NormalizedDailyLog } from '@/features/admin/tracking/detail/wim/hooks'
import { fmtNumber } from '@/utils/formatNumber'
import Image from 'next/image'
import React, { useMemo } from 'react'

interface Props {
  data?: NormalizedDailyLog
}

const TRUCK_IMG = '/atlas/images/vehicles/placeholder/truck-icon.svg'

const CardDailyWeight: React.FC<Props> = (props) => {
  const { data } = props

  const findGrossWeight = useMemo(() => {
    const vehicleArr = data?.data.map(item => Number(item.gross_weight)) || [];
    const maxGrossWeight = vehicleArr.length ? Math.max(...vehicleArr) : 0;

    return maxGrossWeight
  }, [data?.data])

  return (
    <div className="flex h-full bg-[#66AEFF1A] border-2 rounded-2xl border-(--default-blue) overflow-hidden min-h-32.5">
      <div className="flex items-center justify-center p-3 w-2/5 shrink-0">
        <Image src={TRUCK_IMG} alt="truck" width={110} height={160} className="object-contain drop-shadow-lg" />
      </div>
      <div className="flex flex-col justify-between p-4 flex-1 text-right">
        <h4 className="text-(--default-blue) mb-0">รถบรรทุกเข้าชั่งวันนี้</h4>
        <p className="mb-0">
          <span className="fs-22 font-bold">{fmtNumber(data?.meta.summary.total) || 0}</span>{' '}
          <span className="fs-12 text-gray-400">คัน</span>
        </p>
        <section>
          <p className="fs-12 text-gray-400 mb-0">น้ำหนักที่ชั่งได้สูงสุด/คัน</p>
          <p className="mb-0">{fmtNumber(findGrossWeight, 1) || 0} ตัน</p>
        </section>
      </div>
    </div>
  )
}

export default React.memo<Props>(CardDailyWeight)
