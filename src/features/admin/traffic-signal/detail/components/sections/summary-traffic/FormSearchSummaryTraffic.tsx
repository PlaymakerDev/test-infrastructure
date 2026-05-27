"use client"
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import dayjs, { Dayjs } from 'dayjs'
import { Button, Col, ConfigProvider, DatePicker, Row } from 'antd'
import { TbPrinter } from 'react-icons/tb'

const { RangePicker } = DatePicker

interface Props { }

interface FormSearchValues {
  date: [Dayjs | null, Dayjs | null] | null
}

const FormSearchSummaryTraffic: React.FC<Props> = () => {
  const { control, handleSubmit } = useForm<FormSearchValues>({
    defaultValues: { date: [dayjs().subtract(7, 'day'), dayjs()] },
  })

  const onSubmit = useCallback((data: FormSearchValues) => {
    console.log('submit', data)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Row gutter={[16, 16]} align='bottom'>
        <Col xs={24} sm={24} md={12} lg={10} xl={8} xxl={6}>
          <Controller
            control={control}
            name='date'
            render={({ field }) => (
              <fieldset>
                <label className='block fs-12 text-(--yellow)'>วันที่แสดงข้อมูล</label>
                <RangePicker
                  value={field.value}
                  onChange={(dates) => field.onChange(dates)}
                  onBlur={field.onBlur}
                  name={field.name}
                  placeholder={['เลือกวันที่เริ่มต้น', 'เลือกวันที่สิ้นสุด']}
                  format='DD/MM/YYYY'
                  size='large'
                  className='w-full!'
                />
              </fieldset>
            )}
          />
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
    </form>
  )
}

export default React.memo<Props>(FormSearchSummaryTraffic)
