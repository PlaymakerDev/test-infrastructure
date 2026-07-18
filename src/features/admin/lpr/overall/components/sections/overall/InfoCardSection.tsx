import { Col, Row } from 'antd'
import React, { useMemo } from 'react'
import { TbCamera, TbLicense, TbBolt } from 'react-icons/tb'
import { useLPRPoints } from '@/hooks/queries/lpr'
import { useDeptId } from '@/hooks/useDeptId'

interface Props {
  deptId?: string | string[] | number
}

/** Right-panel KPI stack for the LPR overall page — 3 tiles derived from the
 *  same `/lpr/points` payload the map + list use, so numbers stay in sync
 *  with the pins/rows the user sees. Every card auto-updates on the 60s
 *  poll from `useLPRPoints`. */
const InfoCardSection: React.FC<Props> = ({ deptId: deptIdProp }) => {
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdProp ?? deptIdFromUrl ?? '0')
  const { data: points } = useLPRPoints()

  const stats = useMemo(() => {
    const all = points ?? []
    const scoped = !deptId || deptId === '0'
      ? all
      : all.filter((p) => p.department_id === Number(deptId))
    const totalPoints = scoped.length
    const totalCameras = scoped.reduce((n, p) => n + p.camera_count, 0)
    const eventsToday = scoped.reduce((n, p) => n + p.events_today, 0)
    const eventsHour = scoped.reduce((n, p) => n + p.events_hour, 0)
    const activeHour = scoped.filter((p) => p.events_hour > 0).length
    return { totalPoints, totalCameras, eventsToday, eventsHour, activeHour }
  }, [points, deptId])

  const fmt = (n: number) => n.toLocaleString('th-TH')
  const colSpan = { xs: 24, sm: 24, md: 8, lg: 24, xl: 24, xxl: 24 } as const

  return (
    <Row gutter={[16, 16]}>
      <Col {...colSpan}>
        <div className='h-full bg-[#FFB1001A] border-2 rounded-2xl p-5 border-(--yellow)'>
          <TbCamera className='fs-24 text-(--yellow) mb-1' />
          <h3 className='text-(--yellow)'>จุดติดตั้ง LPR ในระบบ</h3>
          <p>
            <span className='fs-24 font-bold'>{fmt(stats.totalPoints)}</span> จุด
          </p>
          <p className='fs-12 text-gray-400'>
            รวมกล้อง {fmt(stats.totalCameras)} ตัว · Active ในชั่วโมงล่าสุด{' '}
            {fmt(stats.activeHour)} จุด
          </p>
        </div>
      </Col>
      <Col {...colSpan}>
        <div className='h-full bg-[#05F2DB1A] border-2 rounded-2xl p-5 border-teal-500'>
          <TbLicense className='fs-24 text-teal-500 mb-1' />
          <h3 className='text-teal-500'>ตรวจจับป้ายวันนี้</h3>
          <p>
            <span className='fs-24 font-bold'>{fmt(stats.eventsToday)}</span> ครั้ง
          </p>
          <p className='fs-12 text-gray-400'>
            เฉลี่ย {fmt(Math.round(stats.eventsToday / Math.max(1, stats.totalPoints)))} ครั้ง / จุด
          </p>
        </div>
      </Col>
      <Col {...colSpan}>
        <div className='h-full bg-[#66AEFF1A] border-2 rounded-2xl p-5 border-(--default-blue)'>
          <TbBolt className='fs-24 text-(--default-blue) mb-1' />
          <h3 className='text-(--default-blue)'>ชั่วโมงล่าสุด</h3>
          <p>
            <span className='fs-24 font-bold'>{fmt(stats.eventsHour)}</span> ครั้ง
          </p>
          <p className='fs-12 text-gray-400'>
            จาก {fmt(stats.activeHour)} จุดที่ Active
          </p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardSection)
