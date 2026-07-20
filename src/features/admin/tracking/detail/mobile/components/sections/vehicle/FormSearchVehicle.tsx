import React, { useCallback, useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import dayjs, { Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { Button, Col, ConfigProvider, DatePicker, Row, Segmented } from 'antd'
import thTH from 'antd/locale/th_TH'
import { TbPrinter } from "react-icons/tb";

dayjs.extend(buddhistEra)
dayjs.locale('th')

const { RangePicker } = DatePicker

export interface MobileVehicleSearchParams {
  start_date?: string
  end_date?: string
  is_open?: number
}

interface Props {
  onSearch?: (params: MobileVehicleSearchParams) => void
  onExport?: () => void
}

interface FormSearchValues {
  date: [Dayjs | null, Dayjs | null] | null
  period: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH'
  status: 'ACTIVE' | 'INACTIVE' | 'ALL'
}

const STATUS_TO_IS_OPEN: Record<FormSearchValues['status'], number | undefined> = {
  ACTIVE: 1,
  INACTIVE: 0,
  ALL: undefined,
}

const PERIOD_OPTIONS: Array<{ label: string; value: FormSearchValues['period'] }> = [
  { label: "วันนี้", value: "TODAY" },
  { label: "เมื่อวานนี้", value: "YESTERDAY" },
  { label: "7 วันที่ผ่านมา", value: "LAST_7_DAYS" },
  { label: "เดือนนี้", value: "THIS_MONTH" },
]

const STATUS_OPTIONS: Array<{ label: string; value: FormSearchValues['status'] }> = [
  { label: "เปิดด่าน", value: "ACTIVE" },
  { label: "ปิดด่าน", value: "INACTIVE" },
  { label: "ทั้งหมด", value: "ALL" },
]

const getDateRangeByPeriod = (period: FormSearchValues['period']): FormSearchValues['date'] => {
  switch (period) {
    case 'TODAY':
      return [dayjs(), dayjs()]
    case 'YESTERDAY': {
      const yesterday = dayjs().subtract(1, 'day')
      return [yesterday, yesterday]
    }
    case 'LAST_7_DAYS':
      return [dayjs().subtract(6, 'day'), dayjs()]
    case 'THIS_MONTH':
      return [dayjs().startOf('month'), dayjs().endOf('month')]
    default:
      return null
  }
}

const FormSearchVehicle: React.FC<Props> = (props) => {
  const { onSearch, onExport } = props
  const submitRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const form = useForm<FormSearchValues>({
    defaultValues: {
      date: getDateRangeByPeriod('TODAY'),
      period: 'TODAY',
      status: 'ALL',
    }
  })

  const {
    control,
    handleSubmit,
    setValue,
  } = form

  const onSubmit = useCallback((data: FormSearchValues) => {
    const [start, end] = data.date ?? [null, null]
    onSearch?.({
      start_date: start ? start.format('YYYY-MM-DD') : undefined,
      end_date: end ? end.format('YYYY-MM-DD') : undefined,
      is_open: STATUS_TO_IS_OPEN[data.status],
    })
  }, [onSearch])

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
                  <ConfigProvider locale={thTH}>
                    <RangePicker
                      value={field.value}
                      onChange={(dates) => {
                        field.onChange(dates)
                        if (timeoutRef.current) clearTimeout(timeoutRef.current)
                        timeoutRef.current = setTimeout(() => {
                          submitRef.current?.click()
                        }, 700)
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      placeholder={['เลือกวันที่เริ่มต้น', 'เลือกวันที่สิ้นสุด']}
                      format='DD MMM BBBB'
                      size='large'
                      className='w-full!'
                    />
                  </ConfigProvider>
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
              const handlePeriodChange = (value: FormSearchValues['period']) => {
                field.onChange(value)
                setValue('date', getDateRangeByPeriod(value))
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                timeoutRef.current = setTimeout(() => {
                  submitRef.current?.click()
                }, 700)
              }
              return (
                <div>
                  <label className='block fs-12 text-(--yellow)'>ช่วงเวลา</label>
                  <div className='overflow-x-auto'>
                    <Segmented
                      block
                      {...field}
                      onChange={handlePeriodChange}
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
              const handleStatusChange = (value: FormSearchValues['status']) => {
                field.onChange(value)
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                timeoutRef.current = setTimeout(() => {
                  submitRef.current?.click()
                }, 700)
              }
              return (
                <div>
                  <label className='block fs-12 text-(--yellow)'>สถานะ</label>
                  <div className='overflow-x-auto'>
                    <Segmented
                      block
                      {...field}
                      onChange={handleStatusChange}
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
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={6}>
          <div className='flex gap-3'>
            <ConfigProvider theme={{ token: { colorPrimary: '#1B3F8B', colorTextLightSolid: '#FFFFFF' } }}>
              <Button type="primary" size="large" shape="round">
                <p>Google Map</p>
              </Button>
            </ConfigProvider>
            <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
              <Button type="primary" size="large" shape="round" icon={<TbPrinter />} onClick={() => onExport?.()}>
                <p>นำออกเอกสาร</p>
              </Button>
            </ConfigProvider>
          </div>
        </Col>
      </Row>
      <button ref={submitRef} type='submit' hidden />
    </form>
  )
}

export default React.memo<Props>(FormSearchVehicle)
