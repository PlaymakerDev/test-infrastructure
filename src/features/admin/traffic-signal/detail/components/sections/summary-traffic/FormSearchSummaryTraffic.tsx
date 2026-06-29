"use client"
import React from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Button, Col, ConfigProvider, DatePicker, Row } from 'antd'
import { TbPrinter } from 'react-icons/tb'

interface Props {
  /** Reference date — the parent treats this as the end of a fixed 7-day
   *  window and computes start = value − 6 internally. Controlled. */
  value: Dayjs
  /** Fires when the user picks a new reference date. */
  onChange: (value: Dayjs) => void
}

const FormSearchSummaryTraffic: React.FC<Props> = ({ value, onChange }) => {
  return (
    <Row gutter={[16, 16]} align='bottom'>
      <Col xs={24} sm={24} md={12} lg={10} xl={8} xxl={6}>
        <fieldset>
          <label className='block fs-12 text-(--yellow)'>วันที่แสดงข้อมูล</label>
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
            format='DD/MM/YYYY'
            size='large'
            className='w-full!'
          />
        </fieldset>
      </Col>
      <Col xs={24} sm={24} md={12} lg={6} xl={4}>
        <ConfigProvider
          theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#FFFFFF' } }}
        >
          <Button
            type='primary'
            size='large'
            shape='round'
            icon={<TbPrinter />}
            className='w-full!'
            onClick={() => alert('TODO: นำออกเอกสาร')}
          >
            นำออกเอกสาร
          </Button>
        </ConfigProvider>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(FormSearchSummaryTraffic)
