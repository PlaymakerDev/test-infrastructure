"use client"
import { Col, Row } from 'antd'
import React, { useMemo } from 'react'
import { TbCar, TbShield } from 'react-icons/tb'
import { useTrafficVolumeCentralList, useTrafficVolumeTotals } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { fmtNumber } from '@/utils/formatNumber'
import { dedupeTrafficVolumeSolutions } from '@/features/admin/traffic-volume/overall/data/trafficVolumes'

interface Props {
  roadId?: string | null
}

/** Right rail — 3 stat cards summarising the traffic-volume fleet. Camera
 *  counts come from `/overview/totals`; per-card "Active" for the warranty
 *  cards is derived from `/overview/central/list` — projects with at least
 *  one online camera in each warranty bucket. Pattern mirrors
 *  `InfoCardTrafficSignal.tsx`. */
const InfoCardTrafficVolume: React.FC<Props> = ({ roadId }) => {
  const deptId = useDeptId()
  const { data, isLoading } = useTrafficVolumeTotals(deptId, roadId ? { road_id: roadId } : {})
  const { data: central } = useTrafficVolumeCentralList(deptId, roadId ? { road_id: roadId } : {})

  const stats = useMemo(() => {
    const cameraTotal = data?.camera.total ?? 0
    const cameraOnline = data?.camera.online ?? 0
    const inWarranty = data?.warranty.active ?? 0
    const expired = data?.warranty.expired ?? 0
    const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100)

    // Card 2/3 unit is โครงการ, so count distinct projects with at least
    // one online camera per warranty bucket (a project's warranty comes
    // from its first-seen solution — assumed consistent across the
    // solutions grouped under the same project_id).
    const projectActive = new Map<number, { isWarranty: boolean; hasOnline: boolean }>()
    for (const bureau of dedupeTrafficVolumeSolutions(central ?? [])) {
      for (const sub of bureau.sub_department ?? []) {
        for (const sol of sub.solutions ?? []) {
          const prior = projectActive.get(sol.project.id)
          const hasOnline = (prior?.hasOnline ?? false) || sol.online_count > 0
          projectActive.set(sol.project.id, {
            isWarranty: prior?.isWarranty ?? sol.is_warranty,
            hasOnline,
          })
        }
      }
    }
    let inWarrantyActive = 0
    let expiredActive = 0
    for (const p of projectActive.values()) {
      if (!p.hasOnline) continue
      if (p.isWarranty) inWarrantyActive++
      else expiredActive++
    }

    return {
      cameraTotal,
      cameraOnline,
      cameraOnlinePct: pct(cameraOnline, cameraTotal),
      inWarranty,
      inWarrantyActive,
      inWarrantyPct: pct(inWarrantyActive, inWarranty),
      expired,
      expiredActive,
      expiredPct: pct(expiredActive, expired),
    }
  }, [data, central])

  // Keep the layout stable while loading.
  const dim = isLoading ? 'opacity-50' : ''

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#FFB1001A] border-2 rounded-2xl p-5 border-(--yellow) ${dim}`}>
          <TbCar className='fs-24 text-(--yellow) mb-1' />
          <h3 className='text-(--yellow)'>กล้องนับรถในระบบทั้งหมด</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.cameraTotal.toLocaleString()}</span> กล้อง
          </p>
          <p className='fs-12 text-gray-400'>
            Active : {fmtNumber(stats.cameraOnline, 0)} ({fmtNumber(stats.cameraOnlinePct, 1)}%)
          </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#05F2DB1A] border-2 rounded-2xl p-5 border-teal-500 ${dim}`}>
          <TbShield className='fs-24 text-teal-500 mb-1' />
          <h3 className='text-teal-500'>ในค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.inWarranty.toLocaleString()}</span> โครงการ
          </p>
          <p className='fs-12 text-gray-400'>
            Active : {fmtNumber(stats.inWarrantyActive, 0)} ({fmtNumber(stats.inWarrantyPct, 1)}%)
          </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#9797971A] border-2 rounded-2xl p-5 border-gray-500 ${dim}`}>
          <TbShield className='fs-24 text-gray-400 mb-1' />
          <h3 className='text-gray-400'>หมดค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.expired.toLocaleString()}</span> โครงการ
          </p>
          <p className='fs-12 text-gray-400'>
            Active : {fmtNumber(stats.expiredActive, 0)} ({fmtNumber(stats.expiredPct, 1)}%)
          </p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardTrafficVolume)
