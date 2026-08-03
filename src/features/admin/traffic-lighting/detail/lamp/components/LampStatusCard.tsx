"use client"
import React from 'react'
import { Empty } from 'antd'
import { TbBulb } from 'react-icons/tb'
import {
  LAMP_FAULT_COLOR,
  LAMP_WORKING_COLOR,
  type MockLampSummary,
} from '../data/mockLampData'

interface Props {
  summary: MockLampSummary | null
}

const DONUT_SIZE = 168
const DONUT_THICKNESS = 26

/** One legend column — big count, then a dot + caption underneath. */
const Legend: React.FC<{ label: string; value: number; color: string; align: 'left' | 'right' }> = ({
  label, value, color, align,
}) => (
  <div className={`flex flex-col gap-[5px] ${align === 'right' ? 'items-end' : 'items-start'}`}>
    <span className='leading-6' style={{ color, fontSize: 20 }}>{label}</span>
    <span className='flex items-center gap-[5px] leading-[15px]' style={{ fontSize: 12, color: '#FFFFFF' }}>
      <span className='inline-block rounded-full shrink-0' style={{ width: 8, height: 8, background: color }} />
      {value.toLocaleString('en-US')} โคม
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
const LampStatusCard: React.FC<Props> = ({ summary }) => {
  const total = summary?.total ?? 0
  const workingPct = total > 0 ? (summary!.working / total) * 100 : 0

  return (
    <div
      className='shrink-0 w-full md:w-[440px] md:h-[330px] rounded-[20px] px-5 pt-4 pb-5 flex flex-col'
      style={{ background: 'rgba(25, 25, 25, 0.8)' }}
    >
      <div className='flex items-center gap-2.5 shrink-0'>
        <TbBulb size={30} style={{ color: '#05F2DB' }} className='shrink-0' />
        <p className='m-0 font-bold leading-[19px]' style={{ color: '#05F2DB', fontSize: 16 }}>
          สถานะโคมไฟวันนี้
        </p>
      </div>

      {summary ? (
        <div className='flex-1 min-h-0 flex items-center justify-between gap-3 mt-2'>
          <Legend label='ไม่ทำงาน' value={summary.notWorking} color={LAMP_FAULT_COLOR} align='left' />

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

          <Legend label='ทำงาน' value={summary.working} color={LAMP_WORKING_COLOR} align='right' />
        </div>
      ) : (
        <div className='flex-1 flex items-center justify-center min-h-0 w-full'>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ยังไม่มีข้อมูลสถานะรายโคมจาก API' />
        </div>
      )}
    </div>
  )
}

export default React.memo(LampStatusCard)
