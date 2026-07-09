import type { NormalizedDailyLog } from '@/features/admin/tracking/detail/wim/hooks'
import { fmtNumber } from '@/utils/formatNumber'
import { InfoCircleOutlined } from '@ant-design/icons'
import Image from 'next/image'
import React, { useMemo } from 'react'

interface Props {
  data?: NormalizedDailyLog
}

const TRUCK_IMG = '/atlas/images/vehicles/placeholder/truck-icon.svg'

const CardDailyOverweight: React.FC<Props> = (props) => {
  const { data } = props

  const findGrossWeightOver = useMemo(() => {
    const vehicleArr = data?.data.map(item => Number(item.gross_weight_over)) || [];
    const maxGrossWeightOver = vehicleArr.length ? Math.max(...vehicleArr) : 0;

    return maxGrossWeightOver
  }, [data?.data])

  const findGrossWeightPercentage = useMemo(() => {
    const legalWeightObj = data?.data.find(item => Number(item.gross_weight_over) === findGrossWeightOver);
    const calc = (findGrossWeightOver / Number(legalWeightObj?.legal_weight) * 100)

    return Number(calc || 0).toFixed(0)
  }, [findGrossWeightOver, data?.data])

  return (
    <div className="flex h-full bg-[#E982821A] border-2 rounded-xl border-red-500 overflow-hidden min-h-32.5">
      <div className="flex items-center justify-center p-3 w-2/5 shrink-0">
        <Image src={TRUCK_IMG} alt="truck" width={110} height={160} className="object-contain drop-shadow-lg" />
      </div>
      <div className="flex flex-col justify-between p-4 flex-1 text-right">
        <h4 className="text-red-500 mb-0">รถบรรทุกน้ำหนักเกินวันนี้</h4>
        <p className="mb-0">
          <span className="fs-22 font-bold">{fmtNumber(data?.meta.summary.overweight) || 0}</span>{' '}
          <span className="fs-12 text-gray-300">คัน</span>
        </p>
        <section>
          <p className="fs-12 text-gray-400 mb-0">น้ำหนักเกินสูงสุด/คัน</p>
          <p className="mb-0">{fmtNumber(findGrossWeightOver) || 0} ตัน</p>
        </section>
        <div className="flex items-center justify-end gap-1">
          <InfoCircleOutlined className="text-xs! text-red-500!" />
          <p className="text-red-500 fs-12 mb-0">เกินพิกัด {findGrossWeightPercentage}%</p>
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(CardDailyOverweight)
