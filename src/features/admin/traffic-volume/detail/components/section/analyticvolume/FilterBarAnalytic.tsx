"use client"
import React, { useState } from 'react'
import { Button, ConfigProvider, DatePicker, Select } from 'antd'
import thTH from 'antd/locale/th_TH'
import { dayjs, type Dayjs } from '@/features/admin/traffic-volume/shared/utils/dayjsThai'
import { TbCalendar, TbChevronDown, TbPrinter } from 'react-icons/tb'

// `dayjsThai` extends the Buddhist Era plugin globally; combined with
// the Thai locale, `D MMM BBBB` outputs "20 เม.ย. 2569".

interface Props {
  /** Camera dropdown options — `value: 'all'` means "all cameras". */
  cameraOptions?: { value: string; label: string }[]
  /** Selected date. Uncontrolled — defaults to today. */
  defaultDate?: Dayjs
  onDateChange?: (date: Dayjs | null) => void
  defaultCamera?: string
  onCameraChange?: (value: string) => void
  onExport?: () => void
}

/** Toolbar for the วิเคราะห์ปริมาณจราจร tab: date picker + camera selector
 *  + "นำออกเอกสาร" export button. Mirrors the figma — date + camera labels
 *  use the yellow accent, export button uses brand yellow background. */
const FilterBarAnalytic: React.FC<Props> = ({
  cameraOptions = [{ value: 'all', label: 'กล้องทั้งหมด' }],
  defaultCamera = 'all',
  onCameraChange,
  defaultDate,
  onDateChange,
  onExport,
}) => {
  const [date, setDate] = useState<Dayjs | null>(defaultDate ?? dayjs())
  const [camera, setCamera] = useState<string>(defaultCamera)

  return (
    <div className='flex flex-wrap items-end gap-3'>
      <div className='flex flex-col gap-1'>
        <span className='fs-12 text-(--yellow)'>วันที่แสดงข้อมูล</span>
        {/* `locale={thTH}` gives the popup its Thai month/day labels; the
          * `BBBB` format token (from the buddhistEra plugin) renders the
          * year as พ.ศ. (2569 instead of 2026). Yellow calendar icon
          * matches the input's yellow border. */}
        <ConfigProvider locale={thTH}>
          <DatePicker
            value={date}
            format='D MMM BBBB'
            onChange={(d) => {
              setDate(d)
              onDateChange?.(d)
            }}
            placeholder='เลือกวันที่'
            className='min-w-45'
            size='large'
            suffixIcon={<TbCalendar className='text-(--yellow)' size={18} />}
          />
        </ConfigProvider>
      </div>

      {/* Camera — only rendered when the parent wires camera filtering (the
        * สถิติรายชั่วโมงแยกตามประเภท tab). Mirrors the รายงาน tab's picker. */}
      {onCameraChange && (
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
      )}

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

export default React.memo<Props>(FilterBarAnalytic)
