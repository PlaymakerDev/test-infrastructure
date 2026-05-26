import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import dayjs, { Dayjs } from 'dayjs'
import { Button, Col, ConfigProvider, DatePicker, Row, Segmented } from 'antd'
import { TbPrinter } from "react-icons/tb";

const { RangePicker } = DatePicker

interface Props { }

interface FormSearchValues {
  date: [Dayjs | null, Dayjs | null] | null
  period: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'ALL'
  status: 'ACTIVE' | 'INACTIVE' | 'NO_DATA' | 'ALL'
}

const PERIOD_OPTIONS = [
  { label: "วันนี้", value: "TODAY" },
  { label: "เมื่อวานนี้", value: "YESTERDAY" },
  { label: "7 วันที่ผ่านมา", value: "LAST_7_DAYS" },
  { label: "เดือนนี้", value: "THIS_MONTH" },
  { label: "ทั้งหมด", value: "ALL" },
]

const STATUS_OPTIONS = [
  { label: "คนฝ่าฝืน", value: "PEDESTRIAN_VIOLATION" },
  { label: "รถฝ่าฝืน", value: "VEHICLE_VIOLATION" },
  { label: "ทั้งหมด", value: "ALL" },
]

const FormSearchViolation: React.FC<Props> = (props) => {
  const { } = props
  const form = useForm<FormSearchValues>({
    defaultValues: {
      date: [dayjs(), dayjs()],
      period: 'ALL',
      status: 'ALL',
    }
  })

  const {
    control,
    handleSubmit,
  } = form

  const onSubmit = useCallback((data: FormSearchValues) => {
    console.log('submit', data)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Row gutter={[16, 16]} align={'bottom'}>
        <Col xs={24} sm={24} md={24} lg={24} xl={8} xxl={6} xxxl={6}>
          <Controller
            control={control}
            name='date'
            render={({ field }) => {
              return (
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
              )
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
          <Controller
            control={control}
            name='period'
            render={({ field }) => {
              return (
                <div>
                  <label className='block fs-12 text-(--yellow)'>ช่วงเวลา</label>
                  <div className='overflow-x-auto'>
                    <Segmented
                      block
                      {...field}
                      options={PERIOD_OPTIONS}
                      size='large'
                      classNames={{
                        root: 'min-w-max border! border-(--yellow)!',
                      }}
                    />
                  </div>
                </div>
              )
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
          <Controller
            control={control}
            name='status'
            render={({ field }) => {
              return (
                <div>
                  <label className='block fs-12 text-(--yellow)'>สถานะ</label>
                  <div className='overflow-x-auto'>
                    <Segmented
                      block
                      {...field}
                      options={STATUS_OPTIONS}
                      size='large'
                      classNames={{
                        root: 'min-w-max border! border-(--yellow)!',
                      }}
                    />
                  </div>
                </div>
              )
            }}
          />
        </Col>
      </Row>
    </form>
  )
}

export default React.memo<Props>(FormSearchViolation)
