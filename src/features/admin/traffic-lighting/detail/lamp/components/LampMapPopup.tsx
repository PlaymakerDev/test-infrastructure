"use client"
import React, { useState } from 'react'
import { message, Spin, Tooltip } from 'antd'
import { TbClipboardCheck, TbClipboardCopy } from 'react-icons/tb'
import { useLightingLampCurrentHourly } from '@/hooks/queries/lighting'
import { LAMP_FAULT_COLOR, LAMP_WORKING_COLOR } from '../data/mockLampData'
import {
  connectionLabel,
  currentStats,
  lampCurrentPoints,
  workingLabel,
  type LampRow,
} from '../data/lampRows'

const UNKNOWN_COLOR = '#979797'
const COPIED_RESET_MS = 2000

interface Props {
  row: LampRow
  solutionId: number | null
  roadCode: string
}

/** A lamp's pin popup — which lamp, its state, and its current today from the
 *  per-lamp hourly endpoint, fetched only once the popup opens. Styled as
 *  the point's own pin popup (`MapLightingDetail`); the pin is red when the
 *  lamp is not working. Rendered in its own React root by the map, so the
 *  caller wraps it in the page's QueryClientProvider. */
const LampMapPopup: React.FC<Props> = ({ row, solutionId, roadCode }) => {
  const [copied, setCopied] = useState(false)
  const hourly = useLightingLampCurrentHourly(solutionId, row.deviceId)
  const today = currentStats(lampCurrentPoints(hourly.data?.hours))
  const color = row.isWorking == null ? UNKNOWN_COLOR : row.isWorking ? LAMP_WORKING_COLOR : LAMP_FAULT_COLOR
  const latLng = row.coord ? `${row.coord[1]}, ${row.coord[0]}` : '-'

  const handleCopy = () => {
    if (!row.coord) return
    navigator.clipboard.writeText(latLng)
    message.success('คัดลอกพิกัดแล้ว')
    setCopied(true)
    setTimeout(() => setCopied(false), COPIED_RESET_MS)
  }

  return (
    <div
      className='min-w-50 rounded-lg border px-3 py-2.5 bg-[rgba(5,13,26,0.96)]'
      style={{ borderColor: color }}
    >
      <p className='fs-12 font-bold tracking-wide' style={{ color }}>
        Street Light · {roadCode.trim() || '-'}
      </p>
      <Tooltip title='กดเพื่อคัดลอกพิกัด'>
        <div className='flex items-center gap-2 cursor-pointer' onClick={handleCopy}>
          <p className='fs-12 text-white/50 leading-snug mt-0.5'>{latLng}</p>
          {copied
            ? <TbClipboardCheck className='text-green-500 fs-12' />
            : <TbClipboardCopy className='text-white/50 fs-12' />}
        </div>
      </Tooltip>
      <p className='fs-14 font-semibold text-white leading-snug mt-0.5 whitespace-nowrap'>
        โคมที่ {row.order} · {row.code}
      </p>
      <p className='fs-12 font-semibold mt-1.5' style={{ color }}>
        ● {workingLabel(row.isWorking)} · {connectionLabel(row.isConnected)}
      </p>
      <p className='fs-12 text-white/50 mt-1'>อัพเดตล่าสุด : {row.updatedAt}</p>
      <div className='fs-12 text-white mt-1 flex items-center gap-1.5'>
        กระแสไฟฟ้าเฉลี่ยวันนี้ :
        {hourly.isLoading
          ? <Spin size='small' />
          : today.average == null ? ' -' : ` ${today.average.toFixed(2)} A`}
      </div>
      <p className='fs-12 text-white/50'>Peak Hour Current : {today.peakHour ?? '-'}</p>
    </div>
  )
}

export default LampMapPopup
