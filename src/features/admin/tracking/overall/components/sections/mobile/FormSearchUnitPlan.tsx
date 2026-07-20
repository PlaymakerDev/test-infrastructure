import { useAllDepartment } from '@/features/admin/tracking/overall/hooks'
import { Col, ConfigProvider, Row, Select } from 'antd'
import thTH from 'antd/locale/th_TH'
import dayjs, { Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import React, { useCallback, useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useOverallContext } from '../../../context'
import BuddhistDatePicker from '@/components/date-picker/BuddhistDatePicker'

dayjs.extend(buddhistEra)

// antd's year-panel header/cells format with `locale.yearFormat` (raw dayjs
// `.format('YYYY')`), bypassing BuddhistDatePicker's `getYear`/`setYear`
// override — without this, the dropdown panel shows the Gregorian year even
// though the closed input (driven by the `format` prop) shows the correct BE year.
const yearPanelLocale = {
  ...thTH,
  DatePicker: {
    ...thTH.DatePicker!,
    lang: {
      ...thTH.DatePicker!.lang,
      yearFormat: 'BBBB',
      cellYearFormat: 'BBBB',
      fieldYearFormat: 'BBBB',
    },
  },
}

interface Props {

}

interface FormValues {
  year: Dayjs | null
  department_id: string | null
}

const FormSearchUnitPlan: React.FC<Props> = (props) => {
  const { } = props
  const { setSearchSumPlan } = useOverallContext()
  const submitRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const form = useForm<FormValues>({
    defaultValues: {
      year: dayjs(),
      department_id: null
    }
  })

  const { control, handleSubmit } = form

  const onSubmit = useCallback((data: FormValues) => {
    setSearchSumPlan({
      year: Number(data.year?.format('BBBB')),
      department_id: String(data.department_id)
    })
  }, [setSearchSumPlan])

  const { data, isLoading } = useAllDepartment({})

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
          <Controller
            control={control}
            name='year'
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='text-(--yellow)'>ปีงบประมาณ</label>
                  <ConfigProvider locale={yearPanelLocale}>
                    <BuddhistDatePicker
                      {...field}
                      placeholder='ปีงบประมาณ...'
                      className='w-full'
                      format='BBBB'
                      picker='year'
                      size='large'
                      onChange={(e) => {
                        field.onChange(e)
                        if (timeoutRef.current) clearTimeout(timeoutRef.current)
                        timeoutRef.current = setTimeout(() => {
                          submitRef.current?.click()
                        }, 700)
                      }}
                    />
                  </ConfigProvider>
                </fieldset>
              )
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
          <Controller
            control={control}
            name='department_id'
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='text-(--yellow)'>หน่วยงาน</label>
                  <Select
                    {...field}
                    placeholder='หน่วยงานทั้งหมด...'
                    size='large'
                    options={data?.data.data}
                    fieldNames={{ label: 'name', value: 'id' }}
                    className='w-full'
                    showSearch
                    allowClear
                    onChange={(e) => {
                      field.onChange(e)
                      if (timeoutRef.current) clearTimeout(timeoutRef.current)
                      timeoutRef.current = setTimeout(() => {
                        submitRef.current?.click()
                      }, 700)
                    }}
                    loading={isLoading}
                  />
                </fieldset>
              )
            }}
          />
        </Col>
      </Row>
      <button ref={submitRef} type='submit' hidden />
    </form>
  )
}

export default React.memo<Props>(FormSearchUnitPlan)
