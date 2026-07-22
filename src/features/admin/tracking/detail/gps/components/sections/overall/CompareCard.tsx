import { AnalyticProvinceTrafficData } from '@/types/tracking/detail-gps-api'
import { fmtNumber } from '@/utils/formatNumber'
import { getProvinceRegion } from '@/utils/getProvinceRegion'
import { Empty, Skeleton } from 'antd'
import React, { useMemo } from 'react'

interface Props {
  data?: AnalyticProvinceTrafficData[]
  isLoading?: boolean
  isError?: boolean
}

interface RegionData {
  region: string
  routes: number
  totalTraffic: number
  dailyAverage: number
}

// Fixed display order — positionally matched against `borderClasses` below,
// so it must stay a 6-item list even when `data` doesn't cover every region yet.
const REGION_ORDER = [
  'ภาคเหนือ',
  'ภาคตะวันออกเฉียงเหนือ',
  'ภาคตะวันออก',
  'ภาคกลาง',
  'ภาคตะวันตก',
  'ภาคใต้',
]

// Breakpoints: 1-col → md:2-col → lg:3-col → xl:3-col → 2xl:6-col
// Border rules per index for each layout:
//   1-col: border-b on all except last
//   2-col (md): left col (0,2,4) gets border-r; last row (4,5) no border-b
//   3-col (lg/xl): first two per row (0,1,3,4) get border-r; last row (3,4,5) no border-b
//   6-col (2xl): items 0-4 get border-r; no border-b
const borderClasses: string[] = [
  'border-b md:border-r 2xl:border-b-0',
  'border-b lg:border-r 2xl:border-b-0',
  'border-b md:border-r lg:border-r-0 2xl:border-r 2xl:border-b-0',
  'border-b lg:border-r lg:border-b-0',
  'border-b md:border-r md:border-b-0',
  '',
]

const CompareCard: React.FC<Props> = (props) => {
  const { data, isError, isLoading } = props

  const regionData: RegionData[] = useMemo(() => {
    const totals = new Map<string, { routes: number; totalTraffic: number; dailyAverage: number }>()
    for (const item of data ?? []) {
      const region = getProvinceRegion(item.province)
      if (!region) continue
      const current = totals.get(region) ?? { routes: 0, totalTraffic: 0, dailyAverage: 0 }
      current.routes += item.road_count ?? 0
      current.totalTraffic += item.total_vehicles ?? 0
      current.dailyAverage += item.avg_per_road_day ?? 0
      totals.set(region, current)
    }
    return REGION_ORDER.map((region) => ({
      region,
      ...(totals.get(region) ?? { routes: 0, totalTraffic: 0, dailyAverage: 0 }),
    }))
  }, [data])

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} paragraph={{ rows: 4 }} active />
    return (
      <div className='border-2 rounded-lg border-(--yellow) p-5'>
        <div className='flex flex-wrap'>
          {regionData.map((item, index) => (
            <div
              key={item.region}
              className={`w-full md:w-1/2 lg:w-1/3 2xl:w-1/6 flex flex-col items-center text-center justify-between gap-2 py-3 px-4 border-(--yellow)/40 ${borderClasses[index]}`}
            >
              {/* Sizes per design 2026-07-20: region name + numbers = fs-14
                * (16px desktop), sub-labels = fs-12 (14px). */}
              <div>
                <h3 className='fs-14 font-semibold text-white leading-snug'>{item.region}</h3>
                <p className='fs-12 text-white/50'>{fmtNumber(Number(item.routes)) || 0} สายทาง</p>
              </div>
              <div>
                <p className='fs-12 text-(--yellow) mb-0.5'>รถวิ่งผ่านรวม</p>
                <p className='fs-14 font-bold text-(--yellow) leading-tight'>{fmtNumber(Number(item.totalTraffic)) || 0}</p>
              </div>
              <div>
                <p className='fs-12 text-blue-400 mb-0.5'>เฉลี่ยต่อวัน</p>
                <p className='fs-14 font-bold text-blue-400 leading-tight'>{fmtNumber(Number(item.dailyAverage)) || 0}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }, [isLoading, regionData])

  if (isError) return <Empty description='เกิดข้อผิดพลาดในการโหลดข้อมูล' />

  return renderContent
}

export default React.memo(CompareCard)
