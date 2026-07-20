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
 *  poll from `useLPRPoints`.
 *
 *  Layout mirrors incident-detection's InfoCardSection (plain flex column,
 *  md 3-col grid) — the previous antd Row/Col gutter added ±8px negative
 *  margins that overflowed the rail and drew a horizontal scrollbar. */
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
  // `min-h-40` floors every card to the tallest card's natural size so the
  // three stay visually identical (same trick as incident-detection).
  const cardClass = 'min-h-40 border-2 rounded-2xl p-5'

  return (
    <div className='flex flex-col gap-4 md:grid md:grid-cols-3 lg:flex lg:flex-col'>
      <div className={`${cardClass} bg-[#FFB1001A] border-(--yellow)`}>
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
      <div className={`${cardClass} bg-[#05F2DB1A] border-teal-500`}>
        <TbLicense className='fs-24 text-teal-500 mb-1' />
        <h3 className='text-teal-500'>ตรวจจับป้ายวันนี้</h3>
        <p>
          <span className='fs-24 font-bold'>{fmt(stats.eventsToday)}</span> ครั้ง
        </p>
        <p className='fs-12 text-gray-400'>
          เฉลี่ย {fmt(Math.round(stats.eventsToday / Math.max(1, stats.totalPoints)))} ครั้ง / จุด
        </p>
      </div>
      <div className={`${cardClass} bg-[#66AEFF1A] border-(--default-blue)`}>
        <TbBolt className='fs-24 text-(--default-blue) mb-1' />
        <h3 className='text-(--default-blue)'>ชั่วโมงล่าสุด</h3>
        <p>
          <span className='fs-24 font-bold'>{fmt(stats.eventsHour)}</span> ครั้ง
        </p>
        <p className='fs-12 text-gray-400'>
          จาก {fmt(stats.activeHour)} จุดที่ Active
        </p>
      </div>
    </div>
  )
}

export default React.memo<Props>(InfoCardSection)
