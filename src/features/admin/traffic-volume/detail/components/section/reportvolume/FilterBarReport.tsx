"use client"
import React, { useState } from 'react'
import { Button, ConfigProvider, DatePicker, Segmented, Select } from 'antd'
import thTH from 'antd/locale/th_TH'
import { dayjs, type Dayjs } from '@/features/admin/traffic-volume/shared/utils/dayjsThai'
import { TbCalendar, TbChevronDown, TbPrinter } from 'react-icons/tb'

const { RangePicker } = DatePicker

export type DateRange = [Dayjs | null, Dayjs | null]

/** Hour-report display modes — only relevant when `reportType === 'hour'`.
 *  BY_TYPE = current per-vehicle-type columns; MATRIX = to-be-implemented
 *  camera × hour grid. */
export type HourView = 'BY_TYPE' | 'MATRIX'

interface Props {
  /** Controlled range — when provided, the picker mirrors this value and
   *  internal state is ignored. */
  range?: DateRange
  /** Initial range used only when `range` is not supplied. Defaults to
   *  the last 7 days ending today. */
  defaultRange?: DateRange
  onRangeChange?: (range: DateRange) => void
  /** Lock the date picker (e.g. when reportType === 'year', the parent
   *  pins the range to a fixed year and the user shouldn't tweak it). */
  dateDisabled?: boolean
  reportTypeOptions?: { value: string; label: string }[]
  defaultReportType?: string
  onReportTypeChange?: (value: string) => void
  cameraOptions?: { value: string; label: string }[]
  defaultCamera?: string
  onCameraChange?: (value: string) => void
  /** Controlled hour display mode. Only rendered when `reportType === 'hour'`. */
  hourView?: HourView
  defaultHourView?: HourView
  onHourViewChange?: (value: HourView) => void
  onExport?: () => void
}

/** Toolbar for the รายงานการนับปริมาณจราจร tab: date-range picker + report
 *  type selector + camera selector + "นำออกเอกสาร" export button. */
const FilterBarReport: React.FC<Props> = ({
  range: controlledRange,
  defaultRange,
  onRangeChange,
  dateDisabled,
  reportTypeOptions = [
    { value: 'daily', label: 'รายงานสรุปรายวัน' },
    { value: 'hour', label: 'รายงานสรุปรายชั่วโมง' },
    { value: 'month', label: 'รายงานสรุปรายเดือน' },
    { value: 'year', label: 'รายงานสรุปรายปี' },
    { value: 'vehicle_type', label: 'รายงานวิเคราะห์ตามประเภทรถ' },
  ],
  defaultReportType = 'daily',
  onReportTypeChange,
  cameraOptions = [{ value: 'all', label: 'กล้องทั้งหมด' }],
  defaultCamera = 'all',
  onCameraChange,
  hourView: controlledHourView,
  defaultHourView = 'BY_TYPE',
  onHourViewChange,
  onExport,
}) => {
  const [internalRange, setInternalRange] = useState<DateRange>(
    defaultRange ?? [dayjs().subtract(6, 'day'), dayjs()]
  )
  // Prefer controlled value when the parent passes one; fall back to
  // internal state otherwise.
  const range = controlledRange ?? internalRange
  const [reportType, setReportType] = useState<string>(defaultReportType)
  const [camera, setCamera] = useState<string>(defaultCamera)
  const [internalHourView, setInternalHourView] = useState<HourView>(defaultHourView)
  const hourView = controlledHourView ?? internalHourView

  return (
    <div className='flex flex-wrap items-end gap-3'>
      {/* Date range — Thai BE year + yellow calendar icon */}
      <div className='flex flex-col gap-1'>
        <span className='fs-12 text-(--yellow)'>วันที่เริ่มต้นและสิ้นสุดแสดงข้อมูล</span>
        <ConfigProvider locale={thTH}>
          <RangePicker
            value={range}
            disabled={dateDisabled}
            format='D MMM BBBB'
            onChange={(r) => {
              const next: DateRange = [r?.[0] ?? null, r?.[1] ?? null]
              // Only update internal state when uncontrolled.
              if (controlledRange === undefined) setInternalRange(next)
              onRangeChange?.(next)
            }}
            placeholder={['วันเริ่ม', 'วันสิ้นสุด']}
            className='min-w-75'
            size='large'
            separator={<span className='text-white'>-</span>}
            suffixIcon={<TbCalendar className='text-(--yellow)' size={18} />}
          />
        </ConfigProvider>
      </div>

      {/* Report type */}
      <div className='flex flex-col gap-1 flex-1 min-w-50 max-w-75'>
        <span className='fs-12 text-(--yellow)'>ประเภทรายงาน</span>
        <Select
          value={reportType}
          options={reportTypeOptions}
          onChange={(v) => {
            setReportType(v)
            onReportTypeChange?.(v)
          }}
          size='large'
          suffixIcon={<TbChevronDown className='text-(--yellow)' size={18} />}
        />
      </div>

      {/* Camera */}
      <div className='flex flex-col gap-1 flex-1 min-w-65 max-w-105'>
        <span className='fs-12 text-(--yellow)'>เลือกกล้อง</span>
        <Select
          value={camera}
          options={cameraOptions}
          onChange={(v) => {
            setCamera(v)
            onCameraChange?.(v)
          }}
          size='large'
          suffixIcon={<TbChevronDown className='text-(--yellow)' size={18} />}
        />
      </div>

      {/* Hour display mode — only shown for the hourly report. Matches the
        * form-search violation section's segmented style (yellow outline +
        * yellow-filled active option). Green dot after "Matrix" is a small
        * "new / status" indicator per the design mock. */}
      {reportType === 'hour' && (
        <div className='flex flex-col gap-1'>
          <span className='fs-12 text-(--yellow)'>การแสดงผล</span>
          <Segmented
            value={hourView}
            onChange={(v) => {
              const next = v as HourView
              if (controlledHourView === undefined) setInternalHourView(next)
              onHourViewChange?.(next)
            }}
            options={[
              { label: 'แยกประเภทรถ', value: 'BY_TYPE' },
              {
                label: (
                  <span className='inline-flex items-center gap-1.5'>
                    Matrix
                  </span>
                ),
                value: 'MATRIX',
              },
            ]}
            size='large'
            classNames={{ root: 'border! border-(--yellow)!' }}
          />
        </div>
      )}

      {/* Export */}
      <ConfigProvider
        theme={{
          token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' },
        }}
      >
        <Button
          type='primary'
          size='large'
          shape='round'
          icon={<TbPrinter />}
          onClick={onExport}
        >
          นำออกเอกสาร
        </Button>
      </ConfigProvider>
    </div>
  )
}

export default React.memo<Props>(FilterBarReport)
