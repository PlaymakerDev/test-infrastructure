"use client"
import React from 'react'
import { Empty, Spin } from 'antd'
import { TbBulb } from 'react-icons/tb'
import { LAMP_FAULT_COLOR, LAMP_WORKING_COLOR } from '../data/mockLampData'
import { countWithShare, formatLampStamp, type LampSummary } from '../data/lampRows'

interface Props {
  summary: LampSummary | null
  /** When the newest lamp report came in. The split is today's — BE reads a
   *  lamp silent for 13 hours as ดับ — so this tells "all ดับ" apart from
   *  "nothing has reported since …". */
  reportedAt?: Date | null
  loading?: boolean
}

const DONUT_SIZE = 168
const DONUT_THICKNESS = 26

/** One legend column — the state in its colour, then "128 (32.2%)" (Figma). */
const Legend: React.FC<{ label: string; value: number; total: number; color: string; align: 'left' | 'right' }> = ({
  label, value, total, color, align,
}) => (
  <div className={`flex flex-col gap-[5px] ${align === 'right' ? 'items-end' : 'items-start'}`}>
    <span className='leading-6' style={{ color, fontSize: 20 }}>{label}</span>
    <span className='leading-[15px] whitespace-nowrap' style={{ fontSize: 12, color: '#FFFFFF' }}>
      {countWithShare(value, total)}
    </span>
  </div>
)

/** "สถานะโคมไฟวันนี้" — working / not-working split for the install point.
 *
 *  The donut is a CSS conic-gradient rather than the shared PieChart wrapper:
 *  that wrapper owns an entire card (its own background, header and right-hand
 *  legend), whereas this design places the legend either side of the ring
 *  inside a fixed 440×330 card. Two flat segments with no interaction don't
 *  justify fighting the wrapper's layout. */
const LampStatusCard: React.FC<Props> = ({ summary, reportedAt = null, loading = false }) => {
  const total = summary?.total ?? 0
  const workingPct = total > 0 ? (summary!.working / total) * 100 : 0

  return (
    <div
      className='shrink-0 w-full md:w-[440px] md:h-[330px] rounded-[20px] px-5 pt-4 pb-5 flex flex-col'
      style={{ background: 'rgba(25, 25, 25, 0.8)' }}
    >
      <div className='flex items-center gap-2.5 shrink-0'>
        <TbBulb size={30} style={{ color: '#05F2DB' }} className='shrink-0' />
        <div className='min-w-0'>
          <p className='m-0 font-bold leading-[19px]' style={{ color: '#05F2DB', fontSize: 16 }}>
            สถานะโคมไฟวันนี้
          </p>
          {summary && reportedAt && (
            <p className='m-0 mt-1 text-(--light-gray-3)' style={{ fontSize: 14 }}>
              โคมรายงานล่าสุด {formatLampStamp(reportedAt)}
            </p>
          )}
        </div>
      </div>

      {summary ? (
        <div className='flex-1 min-h-0 flex items-center justify-between gap-3 mt-2'>
          <Legend label='ไม่ทำงาน' value={summary.notWorking} total={total} color={LAMP_FAULT_COLOR} align='left' />

          <div
            className='relative shrink-0 rounded-full'
            style={{
              width: DONUT_SIZE,
              height: DONUT_SIZE,
              background: `conic-gradient(${LAMP_WORKING_COLOR} 0 ${workingPct}%, ${LAMP_FAULT_COLOR} ${workingPct}% 100%)`,
            }}
          >
            {/* Punches the ring's hole using the card colour so the centre
                text sits on the same surface as the rest of the card. */}
            <div
              className='absolute rounded-full flex flex-col items-center justify-center'
              style={{
                inset: DONUT_THICKNESS,
                background: '#191919',
              }}
            >
              <span className='font-bold leading-[39px]' style={{ color: '#05F2DB', fontSize: 32 }}>
                {total.toLocaleString('en-US')}
              </span>
              <span className='leading-[17px]' style={{ color: '#FFFFFF', fontSize: 14 }}>โคม</span>
            </div>
          </div>

          <Legend label='ทำงาน' value={summary.working} total={total} color={LAMP_WORKING_COLOR} align='right' />
        </div>
      ) : (
        <div className='flex-1 flex items-center justify-center min-h-0 w-full'>
          {loading
            ? <Spin />
            : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่มีข้อมูลสถานะโคมไฟ' />}
        </div>
      )}
    </div>
  )
}

export default React.memo(LampStatusCard)
