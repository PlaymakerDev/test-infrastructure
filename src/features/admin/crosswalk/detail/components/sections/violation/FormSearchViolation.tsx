"use client"
import React from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import { Col, ConfigProvider, DatePicker, Row, Segmented } from 'antd'
import thTH from 'antd/locale/th_TH'
import { TbCalendar } from 'react-icons/tb'
import {
  dateRangeForPeriod,
  type ViolationFilter,
  type ViolationPeriod,
  type ViolationStatus,
} from './filter'

// `BBBB` (Buddhist-Era year) for the picker's `D MMM BBBB` display format.
dayjs.extend(buddhistEra)

const { RangePicker } = DatePicker

interface Props {
  value: ViolationFilter
  onChange: (patch: Partial<ViolationFilter>) => void
}

const PERIOD_OPTIONS: { label: string; value: ViolationPeriod }[] = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: 'เมื่อวานนี้', value: 'YESTERDAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  // { label: 'ทั้งหมด', value: 'ALL' },
]

const STATUS_OPTIONS: { label: string; value: ViolationStatus }[] = [
  { label: 'คนฝ่าฝืน', value: 'PEDESTRIAN_VIOLATION' },
  { label: 'รถฝ่าฝืน', value: 'VEHICLE_VIOLATION' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const FormSearchViolation: React.FC<Props> = ({ value, onChange }) => {
  // RangePicker wants Dayjs objects; the filter stores strings. Convert on
  // the fly — empty strings (ALL period) render as `null` for a blank picker.
  const rangeValue: [Dayjs | null, Dayjs | null] = [
    value.startDate ? dayjs(value.startDate) : null,
    value.endDate ? dayjs(value.endDate) : null,
  ]

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    const [start, end] = dates ?? [null, null]
    // Manual date pick → clear the preset highlight (period becomes ALL, which
    // is what the UI uses for "custom range").
    onChange({
      startDate: start ? start.format('YYYY-MM-DD') : '',
      endDate: end ? end.format('YYYY-MM-DD') : '',
      period: 'ALL',
    })
  }

  const handlePeriodChange = (next: string | number) => {
    const period = next as ViolationPeriod
    onChange({ period, ...dateRangeForPeriod(period) })
  }

  const handleStatusChange = (next: string | number) => {
    onChange({ status: next as ViolationStatus })
  }

  return (
    <Row gutter={[16, 16]} align='bottom'>
      <Col xs={24} sm={24} md={24} lg={24} xl={8} xxl={6} xxxl={6}>
        <fieldset>
          <label className='block fs-12 text-(--yellow)'>วันที่แสดงข้อมูล</label>
          <ConfigProvider locale={thTH}>
            <RangePicker
              value={rangeValue}
              onChange={handleRangeChange}
              placeholder={['เลือกวันที่เริ่มต้น', 'เลือกวันที่สิ้นสุด']}
              format='D MMM BBBB'
              size='large'
              className='w-full! rounded-xl!'
              separator={<span className='text-white'>-</span>}
              suffixIcon={<TbCalendar className='text-(--yellow)' size={18} />}
            />
          </ConfigProvider>
        </fieldset>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
        <div>
          <label className='block fs-12 text-(--yellow)'>ช่วงเวลา</label>
          <div className='overflow-x-auto'>
            <Segmented
              block
              value={value.period}
              onChange={handlePeriodChange}
              options={PERIOD_OPTIONS}
              size='large'
              classNames={{
                root: 'min-w-max border! border-(--yellow)! rounded-xl! [&_.ant-segmented-item]:rounded-xl! [&_.ant-segmented-thumb]:rounded-xl!',
              }}
            />
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
        <div>
          <label className='block fs-12 text-(--yellow)'>สถานะ</label>
          <div className='overflow-x-auto'>
            <Segmented
              block
              value={value.status}
              onChange={handleStatusChange}
              options={STATUS_OPTIONS}
              size='large'
              classNames={{
                root: 'min-w-max border! border-(--yellow)! rounded-xl! [&_.ant-segmented-item]:rounded-xl! [&_.ant-segmented-thumb]:rounded-xl!',
              }}
            />
          </div>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(FormSearchViolation)
