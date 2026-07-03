import { MediaScheduleByID } from '@/types/control-vms/display-api'
import { Checkbox, ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import React, { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface Props {
  data?: MediaScheduleByID[]
}

interface FormUpdateBatchProps {
  schedule_ids: number[]
}

const DATE_LIST = [
  {
    id: 1,
    full_date: 'จันทร์',
    short_date: 'จ.',
  },
  {
    id: 2,
    full_date: 'อังคาร',
    short_date: 'อ.',
  },
  {
    id: 3,
    full_date: 'พุธ',
    short_date: 'พ.',
  },
  {
    id: 4,
    full_date: 'พฤหัสบดี',
    short_date: 'พฤ.',
  },
  {
    id: 5,
    full_date: 'ศุกร์',
    short_date: 'ศ.',
  },
  {
    id: 6,
    full_date: 'เสาร์',
    short_date: 'ส.',
  },
  {
    id: 7,
    full_date: 'อาทิตย์',
    short_date: 'อา.',
  }
]

const FormUpdateBatch: React.FC<Props> = (props) => {
  const { data } = props

  const renderMapDate = useCallback((dateList: number[]) => {
    const shortDates = DATE_LIST.filter((d) => dateList.includes(d.id))
    return (
      <div className='flex flex-wrap gap-1'>
        {shortDates.map((d) => (
          <span key={d.id} className='py-1.5 px-3 text-black bg-red-500/80 rounded-lg'>{d.short_date}</span>
        ))}
      </div>
    )
  }, [])

  const OPTIONS = useMemo(() => {
    if (!data) return []
    return data.map((item) => {
      const hours = Math.round(dayjs(item.time_to, 'HH:mm').diff(dayjs(item.time_since, 'HH:mm'), 'hour', true) * 100) / 100
      return {
        label: (
          <span className='inline-flex items-center gap-1.5'>
            {renderMapDate(item.days_of_week)}
            {`${item.schedule_name} ${item.time_since} - ${item.time_to} (${hours} ชั่วโมง)`}
          </span>
        ),
        value: item.id,
      }
    })
  }, [data, renderMapDate])

  const form = useForm<FormUpdateBatchProps>({
    defaultValues: {
      schedule_ids: []
    }
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form

  const onSubmit = useCallback((data: FormUpdateBatchProps) => {
    console.log("data", data)
  }, [])

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: 'transparent',
          colorBorder: '#00000050',
          colorPrimary: 'transparent',
          colorText: 'black',
        }
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="schedule_ids"
          rules={{ required: 'กรุณาเลือกตารางเวลา' }}
          render={({ field }) => (
            <fieldset>
              <Checkbox.Group
                {...field}
                name={field.name}
                options={[...OPTIONS]}
                className='flex flex-col'
              />
              {!!errors.schedule_ids && <p className='text-red-500'>{errors.schedule_ids.message}</p>}
            </fieldset>
          )}
        />
      </form>
    </ConfigProvider>
  )
}

export default React.memo<Props>(FormUpdateBatch)
