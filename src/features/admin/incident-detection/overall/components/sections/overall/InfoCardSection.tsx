"use client"
import React, { useMemo } from 'react'
import { TbCarCrash, TbShield } from 'react-icons/tb'
import {
  useIncidentCentralList,
  useIncidentCentralTotals,
} from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'
import { fmtNumber } from '@/utils/formatNumber'
import { dedupeIncidentSolutions } from '@/features/admin/incident-detection/overall/data/incidentData'

interface Props {
  roadId?: string | null
}

const InfoCardSection: React.FC<Props> = (props) => {
  const { roadId } = props
  const deptId = useDeptId()
  // central/totals — same scope as the table (/overview/central/list).
  const { data: totals } = useIncidentCentralTotals(deptId, roadId ? { road_id: Number(roadId) } : {})
  // central/list lets us count "active" solutions per warranty bucket — a
  // solution counts as Active when at least one of its cameras is online. The
  // API doesn't expose this split directly so we derive it here. Same source
  // the table consumes, so no extra request.
  const { data: central } = useIncidentCentralList(deptId, roadId ? { road_id: Number(roadId) } : {})

  const camera = totals?.camera
  const warranty = totals?.warranty
  const onlinePct = camera && camera.total > 0 ? Math.round((camera.online / camera.total) * 100) : 0

  const activeByWarranty = useMemo(() => {
    let inWarrantyActive = 0
    let expiredActive = 0
    for (const bureau of dedupeIncidentSolutions(central ?? [])) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          const cam = sol.camera
          const total = cam.total ?? 0
          // Same derivation as the table — handles the 3 inconsistent camera
          // shapes (online_count only, offline_count only, both present).
          const online = cam.online_count ?? (cam.offline_count != null ? total - cam.offline_count : 0)
          if (online > 0) {
            if (sol.is_warranty) inWarrantyActive++
            else expiredActive++
          }
        }
      }
    }
    return { inWarrantyActive, expiredActive }
  }, [central])

  const inWarrantyTotal = warranty?.active ?? 0
  const expiredTotal = warranty?.expired ?? 0
  const inWarrantyPct = inWarrantyTotal > 0
    ? Math.round((activeByWarranty.inWarrantyActive / inWarrantyTotal) * 1000) / 10
    : 0
  const expiredPct = expiredTotal > 0
    ? Math.round((activeByWarranty.expiredActive / expiredTotal) * 1000) / 10
    : 0

  // `min-h-40` floors every card to card 1's natural size — keeps all three
  // visually identical even though cards 2 & 3 have fewer text lines.
  const cardClass = 'min-h-40 border-2 rounded-2xl p-5'

  return (
    <div className='flex flex-col gap-4 md:grid md:grid-cols-3 lg:flex lg:flex-col'>
      <div className={`${cardClass} bg-[#FFB1001A] border-(--yellow)`}>
        <TbCarCrash className='fs-24 text-(--yellow) mb-1' />
        <h3 className='text-(--yellow)'>กล้องวิเคราะห์ในระบบทั้งหมด</h3>
        <p>
          <span className='fs-24 font-bold'>{fmtNumber(camera?.total ?? 0, 0)}</span> ตัว
        </p>
        <p className='fs-12 text-gray-400'>
          Active : {fmtNumber(camera?.online ?? 0, 0)} ({onlinePct}%)
        </p>
      </div>
      <div className={`${cardClass} bg-[#05F2DB1A] border-teal-500`}>
        <TbShield className='fs-24 text-teal-500 mb-1' />
        <h3 className='text-teal-500'>ในค้ำ</h3>
        <p>
          <span className='fs-24 font-bold'>{fmtNumber(inWarrantyTotal, 0)}</span> จุด
        </p>
        <p className='fs-12 text-gray-400'>
          Active : {fmtNumber(activeByWarranty.inWarrantyActive, 0)} ({inWarrantyPct}%)
        </p>
      </div>
      <div className={`${cardClass} bg-[#9797971A] border-gray-500`}>
        <TbShield className='fs-24 text-gray-500 mb-1' />
        <h3 className='text-gray-500'>หมดค้ำ</h3>
        <p>
          <span className='fs-24 font-bold'>{fmtNumber(expiredTotal, 0)}</span> จุด
        </p>
        <p className='fs-12 text-gray-400'>
          Active : {fmtNumber(activeByWarranty.expiredActive, 0)} ({expiredPct}%)
        </p>
      </div>
    </div>
  )
}

export default React.memo(InfoCardSection)
