"use client"
import React, { useMemo } from 'react'
import { TbVideo, TbShield } from 'react-icons/tb'
import type { APIResponseCCTVOverviewTotals } from '@/types/cctv/overview-api'
import { useCctvOverviewCentralList } from '@/hooks/queries/cctv'
import { useDeptId } from '@/hooks/useDeptId'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  totals: APIResponseCCTVOverviewTotals | null
}

/** Right-rail stat cards — visual style matches Traffic Signal and Incident
 *  Detection (solid tint + colored border + min-h floor). Active sub-lines on
 *  cards 2 & 3 derive from `/overview/central/list` (same cache as the table —
 *  no extra request). Active = solutions with ≥1 online camera. */
const StatsSectionCctv: React.FC<Props> = ({ totals }) => {
  const deptId = useDeptId()
  const { data: central } = useCctvOverviewCentralList(deptId)

  const camera = totals?.camera
  const warranty = totals?.warranty

  const active = useMemo(() => {
    let inWarrantyActive = 0
    let expiredActive = 0
    for (const bureau of central ?? []) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          if ((sol.camera.online ?? 0) > 0) {
            if (sol.is_warranty) inWarrantyActive++
            else expiredActive++
          }
        }
      }
    }
    return { inWarrantyActive, expiredActive }
  }, [central])

  const cameraPct = camera && camera.total > 0 ? (camera.online / camera.total) * 100 : 0
  const inWarrantyTotal = warranty?.active ?? 0
  const expiredTotal = warranty?.expired ?? 0
  const inWarrantyPct = inWarrantyTotal > 0 ? (active.inWarrantyActive / inWarrantyTotal) * 100 : 0
  const expiredPct = expiredTotal > 0 ? (active.expiredActive / expiredTotal) * 100 : 0

  // `min-h-40` floors each card to card 1's natural size — keeps the 3 cards
  // visually identical even though cards 2 & 3 have fewer text lines.
  // backdrop-blur softens the map content behind the 10% see-through gap.
  const cardClass = 'min-h-40 border-2 rounded-[20px] p-5 backdrop-blur-sm'
  /** Layered: tint over a 90%-opaque dark base. Lets the map peek through
   *  slightly while keeping the card readable as an overlay. */
  const cardBg = (tintHex: string) => ({
    background: `linear-gradient(${tintHex}, ${tintHex}), rgba(14,14,14,0.9)`,
  })

  return (
    <div className='flex flex-col gap-4 md:grid md:grid-cols-3 xl:flex xl:flex-col'>
      <div className={`${cardClass} border-(--yellow)`} style={cardBg('#FFB1001A')}>
        <TbVideo className='fs-24 text-(--yellow) mb-1' />
        <h3 className='text-(--yellow)'>กล้อง CCTV ในระบบทั้งหมด</h3>
        <p>
          <span className='fs-24 font-bold'>{fmtNumber(camera?.total ?? 0, 0)}</span> ตัว
        </p>
        <p className='fs-11 text-gray-400'>
          Active : {fmtNumber(camera?.online ?? 0, 0)} ({fmtNumber(cameraPct, 1)}%)
        </p>
      </div>
      <div className={`${cardClass} border-teal-500`} style={cardBg('#05F2DB1A')}>
        <TbShield className='fs-24 text-teal-500 mb-1' />
        <h3 className='text-teal-500'>ในค้ำ</h3>
        <p>
          <span className='fs-24 font-bold'>{fmtNumber(inWarrantyTotal, 0)}</span> จุด
        </p>
        <p className='fs-11 text-gray-400'>
          Active : {fmtNumber(active.inWarrantyActive, 0)} ({fmtNumber(inWarrantyPct, 1)}%)
        </p>
      </div>
      <div className={`${cardClass} border-gray-500`} style={cardBg('#9797971A')}>
        <TbShield className='fs-24 text-gray-400 mb-1' />
        <h3 className='text-gray-400'>หมดค้ำ</h3>
        <p>
          <span className='fs-24 font-bold'>{fmtNumber(expiredTotal, 0)}</span> จุด
        </p>
        <p className='fs-11 text-gray-400'>
          Active : {fmtNumber(active.expiredActive, 0)} ({fmtNumber(expiredPct, 1)}%)
        </p>
      </div>
    </div>
  )
}

export default React.memo<Props>(StatsSectionCctv)
