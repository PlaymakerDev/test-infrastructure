"use client"
import { Col, Row } from 'antd'
import React, { useMemo } from 'react'
import { TbVideo, TbShield } from 'react-icons/tb'
import type { APIResponseCCTVOverviewTotals } from '@/types/cctv/overview-api'
import { useCctvOverviewCentralList } from '@/hooks/queries/cctv'
import { useDeptId } from '@/hooks/useDeptId'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  totals: APIResponseCCTVOverviewTotals | null
}

/** Right-rail stat cards. Active sub-lines on cards 2 & 3 derive from
 *  `/overview/central/list` (same cache as the table — no extra request).
 *  Active = solutions with ≥1 online camera. */
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

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='h-full bg-[#FFB1001A] border-2 rounded-[20px] p-5 border-(--yellow)'>
          <TbVideo className='fs-24 text-(--yellow) mb-1' />
          <h3 className='text-(--yellow)'>กล้อง CCTV ในระบบทั้งหมด</h3>
          <p>
            <span className='fs-24 font-bold'>{fmtNumber(camera?.total ?? 0, 0)}</span> ตัว
          </p>
          <p className='fs-11 text-gray-400'>
            Active : {fmtNumber(camera?.online ?? 0, 0)} ({fmtNumber(cameraPct, 1)}%)
          </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='h-full bg-[#05F2DB1A] border-2 rounded-[20px] p-5 border-teal-500'>
          <TbShield className='fs-24 text-teal-500 mb-1' />
          <h3 className='text-teal-500'>ในค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{fmtNumber(inWarrantyTotal, 0)}</span> จุด
          </p>
          <p className='fs-11 text-gray-400'>
            Active : {fmtNumber(active.inWarrantyActive, 0)} ({fmtNumber(inWarrantyPct, 1)}%)
          </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='h-full bg-[#9797971A] border-2 rounded-[20px] p-5 border-gray-500'>
          <TbShield className='fs-24 text-gray-400 mb-1' />
          <h3 className='text-gray-400'>หมดค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{fmtNumber(expiredTotal, 0)}</span> จุด
          </p>
          <p className='fs-11 text-gray-400'>
            Active : {fmtNumber(active.expiredActive, 0)} ({fmtNumber(expiredPct, 1)}%)
          </p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(StatsSectionCctv)
