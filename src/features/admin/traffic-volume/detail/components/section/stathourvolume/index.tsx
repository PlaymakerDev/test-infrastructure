"use client"
import React, { useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import FilterBarAnalytic from '../analyticvolume/FilterBarAnalytic'
import StackedHourlyBarChart from './StackedHourlyBarChart'
import PeakHourCards from './PeakHourCards'
import HourlyDataTable from './HourlyDataTable'
import { useTrafficVolumeSolutionCameras } from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import { useDeptId } from '@/hooks/useDeptId'

interface Props {}

/** Tab content for "สถิติรายชั่วโมงแยกตามประเภท". Layout per design:
 *  • TOP    — date picker + camera selector + export (shared toolbar).
 *  • CHART  — stacked hourly bar chart by vehicle type.
 *  • PEAKS  — 5 peak-hour cards.
 *  • TABLE  — hourly counts table by vehicle type. */
const StatHourVolume: React.FC<Props> = () => {
  const { id } = useDetailContext()
  const deptId = useDeptId()
  // Date + camera filters — hoisted so the chart, the peak cards, and the
  // table all share the same selection. Camera picker copies the รายงาน tab:
  // same `useTrafficVolumeSolutionCameras` list + `camera_id` narrowing.
  const [date, setDate] = useState<Dayjs | null>(dayjs())
  const [cameraId, setCameraId] = useState<string>('all')
  const dateStr = date ? date.format('YYYY-MM-DD') : undefined

  const { data: camerasData } = useTrafficVolumeSolutionCameras(deptId, id)
  const cameraOptions = useMemo(
    () => [
      { value: 'all', label: 'กล้องทั้งหมด' },
      ...(camerasData?.counting ?? []).map((c) => ({
        value: String(c.id),
        label: c.camera_name,
      })),
    ],
    [camerasData]
  )

  return (
    <div className='flex flex-col gap-6'>
      <FilterBarAnalytic
        defaultDate={date ?? undefined}
        onDateChange={setDate}
        cameraOptions={cameraOptions}
        defaultCamera={cameraId}
        onCameraChange={setCameraId}
      />
      <StackedHourlyBarChart date={dateStr} cameraId={cameraId} />
      <PeakHourCards date={dateStr} cameraId={cameraId} />
      <HourlyDataTable date={dateStr} cameraId={cameraId} />
    </div>
  )
}

export default React.memo<Props>(StatHourVolume)
