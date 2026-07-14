"use client"
import React from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import { Button, Col, ConfigProvider, DatePicker, Row } from 'antd'
import thTH from 'antd/locale/th_TH'
import { TbCalendar, TbPrinter } from 'react-icons/tb'
import { thaiDateBE } from '@/utils/thaiDate'

// `BBBB` (Buddhist-Era year) for the picker's `D MMM BBBB` display format.
dayjs.extend(buddhistEra)

interface Props {
  /** Reference date — the parent treats this as the end of a fixed 7-day
   *  window and computes start = value − 6 internally. Controlled. */
  value: Dayjs
  /** Fires when the user picks a new reference date. */
  onChange: (value: Dayjs) => void
}

const FormSearchSummaryTraffic: React.FC<Props> = ({ value, onChange }) => {
  // The picked date is the END of a fixed 7-day window; start = end − 6 days.
  // Show the resolved range so the user sees exactly which days are displayed
  // (selection stays single-date per the design).
  const rangeText = `${thaiDateBE(value.subtract(6, 'day').toDate())} – ${thaiDateBE(value.toDate())}`
  return (
    <Row gutter={[16, 16]} align='top'>
      <Col xs={24} sm={24} md={12} lg={10} xl={8} xxl={6}>
        <fieldset>
          <label className='block fs-12 text-(--yellow)'>วันที่แสดงข้อมูล</label>
          <ConfigProvider locale={thTH}>
            <DatePicker
              value={value}
              onChange={(d) => {
                // Ignore clears — parent always expects a valid date.
                if (!d) return
                onChange(d)
              }}
              allowClear={false}
              // Forbid future dates — backend has no data past "now".
              disabledDate={(d) => d.isAfter(dayjs(), 'day')}
              placeholder='เลือกวันที่'
              format='D MMM BBBB'
              size='large'
              className='w-full!'
              suffixIcon={<TbCalendar className='text-(--yellow)' size={18} />}
            />
          </ConfigProvider>
          <p className='fs-11 text-gray-400 mt-1 mb-0'>
            ช่วงข้อมูล : {rangeText}
          </p>
        </fieldset>
      </Col>
      <Col xs={24} sm={24} md={12} lg={6} xl={4}>
        <fieldset>
          {/* Invisible label spacer — matches the date field's label height so
            * the button lines up with the date input row (not the helper text). */}
          <label className='block fs-12' aria-hidden>&nbsp;</label>
          <ConfigProvider
            theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}
          >
            <Button
              type='primary'
              size='large'
              shape='round'
              icon={<TbPrinter />}
              className='w-full! sm:w-auto! sm:min-w-45!'
              onClick={() => alert('TODO: นำออกเอกสาร')}
            >
              <span>นำออกเอกสาร</span>
            </Button>
          </ConfigProvider>
        </fieldset>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(FormSearchSummaryTraffic)
