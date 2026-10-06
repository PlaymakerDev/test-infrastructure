import React, { useCallback, useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import dayjs, { Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { Button, Col, ConfigProvider, DatePicker, Input, Row, Segmented, Select } from 'antd'
import thTH from 'antd/locale/th_TH'
import { TbPrinter, TbSearch } from "react-icons/tb";
import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons'
import { APIRequestLPRPlateList } from '@/types/lpr/new-lpr-api'

dayjs.extend(buddhistEra)
dayjs.locale('th')

const { RangePicker } = DatePicker

export interface MobileVehicleSearchParams {
  start_date?: string
  end_date?: string
  is_open?: number
}

export type DetectionSearchParams = Pick<APIRequestLPRPlateList, 'search' | 'vehicle_type' | 'start_date' | 'end_date'>

interface Props {
  viewMode: 'TABLE' | 'GRID'
  setViewMode: (viewMode: 'TABLE' | 'GRID') => void
  onSearch: (params: DetectionSearchParams) => void
  onExport: () => void
}

interface FormSearchValues {
  date: [Dayjs | null, Dayjs | null] | null
  period: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH'
  // 'ALL' = omit vehicle_type; 'ไม่ระบุ' is a real backend value (reads with no vehicle type)
  type: 'ALL' | 'รถจักรยานยนต์' | 'รถยนต์' | 'รถกระบะ' | 'แท็กซี่' | 'รถบัส' | 'รถบรรทุก' | 'รถพ่วง' | 'ไม่ระบุ'
  license_plate: string
}

const PERIOD_OPTIONS: Array<{ label: string; value: FormSearchValues['period'] }> = [
  { label: "วันนี้", value: "TODAY" },
  { label: "เมื่อวาน", value: "YESTERDAY" },
  { label: "7 วัน", value: "LAST_7_DAYS" },
  { label: "เดือนนี้", value: "THIS_MONTH" },
]

const TYPE_OPTIONS: Array<{ label: string; value: FormSearchValues['type'] }> = [
  { label: "ทั้งหมด", value: "ALL" },
  { label: "รถจักรยานยนต์", value: "รถจักรยานยนต์" },
  { label: "รถยนต์", value: "รถยนต์" },
  { label: "รถกระบะ", value: "รถกระบะ" },
  { label: "แท็กซี่", value: "แท็กซี่" },
  { label: "รถบัส", value: "รถบัส" },
  { label: "รถบรรทุก", value: "รถบรรทุก" },
  { label: "รถพ่วง", value: "รถพ่วง" },
  { label: "ไม่ระบุประเภท", value: "ไม่ระบุ" },
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

const FormSearchDetection: React.FC<Props> = (props) => {
  const { viewMode, setViewMode, onSearch, onExport } = props
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
      type: 'ALL',
      license_plate: '',
    }
  })

  const {
    control,
    handleSubmit,
    setValue,
  } = form

  const onSubmit = useCallback((data: FormSearchValues) => {
    const [start, end] = data.date ?? []
    const search = data.license_plate.trim()
    onSearch({
      search: search || undefined,
      // allowClear on the Select yields undefined → also means "all"
      vehicle_type: !data.type || data.type === 'ALL' ? undefined : data.type,
      start_date: start?.format('YYYY-MM-DD'),
      end_date: end?.format('YYYY-MM-DD'),
    })
  }, [onSearch])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Row gutter={[16, 16]} align={'bottom'}>
        <Col xs={24} sm={24} md={12} lg={12} xl={6} xxl={6} xxxl={5}>
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
        <Col xs={24} sm={24} md={12} lg={12} xl={6} xxl={6} xxxl={5}>
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
                <fieldset>
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
                </fieldset>
              )
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={6} xxl={6} xxxl={5}>
          <Controller
            control={control}
            name='type'
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='block fs-12 text-(--yellow)'>ประเภทรถ</label>
                  <Select
                    {...field}
                    placeholder='ประเภทรถทั้งหมด...'
                    size="large"
                    className='w-full'
                    allowClear
                    showSearch
                    options={TYPE_OPTIONS}
                    onChange={(value: FormSearchValues['type']) => {
                      field.onChange(value)
                      if (timeoutRef.current) clearTimeout(timeoutRef.current)
                      timeoutRef.current = setTimeout(() => {
                        submitRef.current?.click()
                      }, 700)
                    }}
                  />
                </fieldset>
              )
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={6} xxl={6} xxxl={5}>
          <Controller
            control={control}
            name='license_plate'
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='block fs-12 text-(--yellow)'>ป้ายทะเบียน</label>
                  <Input
                    {...field}
                    name={field.name}
                    placeholder='ค้นหาป้ายทะเบียน...'
                    size="large"
                    className='w-full'
                    suffix={<TbSearch className='text-(--yellow)' />}
                    onChange={(e) => {
                      field.onChange(e)
                      if (timeoutRef.current) clearTimeout(timeoutRef.current)
                      timeoutRef.current = setTimeout(() => {
                        submitRef.current?.click()
                      }, 700)
                    }}
                  />
                </fieldset>
              )
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={4}>
          <div className='flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto lg:shrink-0'>
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as 'TABLE' | 'GRID')}
              options={[
                { value: 'TABLE', icon: <BarsOutlined /> },
                { value: 'GRID', icon: <AppstoreOutlined /> },
              ]}
              size='large'
              block
            />
            <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
              <Button
                type="primary"
                size="large"
                shape="round"
                icon={<TbPrinter />}
                onClick={onExport}
              >
                <p className='fs-12'>นำออกเอกสาร</p>
              </Button>
            </ConfigProvider>
          </div>
        </Col>
      </Row>
      <button ref={submitRef} type='submit' hidden />
    </form>
  )
}

export default React.memo<Props>(FormSearchDetection)
