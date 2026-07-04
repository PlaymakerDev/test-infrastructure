import { Badge, Button, Calendar, ConfigProvider } from 'antd'
import thTH from 'antd/locale/th_TH'
import dayjs, { Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'

dayjs.extend(buddhistEra)
import React, { useCallback, useRef } from 'react'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'
import { Controller, useForm } from 'react-hook-form'
import { APIResponseVMSScheduleByDate } from '@/types/control-vms/display-api'
import { useControlVMSContext } from '../../../context'


interface Props {
  scheduleData?: APIResponseVMSScheduleByDate
}

interface FormValues {
  date: Dayjs | null;
}

const FormSearchCalendar: React.FC<Props> = (props) => {
  const { scheduleData } = props;
  const submitRef = useRef<HTMLButtonElement>(null)
  const { setSearchDate, setScheduleDay } = useControlVMSContext()

  const form = useForm<FormValues>({
    defaultValues: {
      date: null,
    }
  })

  const {
    control,
    handleSubmit,
  } = form

  const onSubmit = useCallback((value: FormValues) => {
    setSearchDate({
      month: value.date != null ? value.date.month() + 1 : undefined,
      year: value.date != null ? value.date.year() : undefined,
    })
    setScheduleDay(value.date != null ? value.date.format('DD') : null)
  }, [setSearchDate, setScheduleDay])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="date"
        render={({ field }) => {
          return (
            <ConfigProvider locale={thTH}>
              <Calendar
                className="[&_.ant-picker-cell-inner]:h-10! [&_.ant-picker-calendar-date-value]:leading-6! [&_.ant-picker-calendar-date-content]:h-4! [&_.ant-picker-calendar-date-content]:flex! [&_.ant-picker-calendar-date-content]:items-center! [&_.ant-picker-calendar-date-content]:justify-center!"
                value={field.value ?? dayjs()}
                onChange={(date) => field.onChange(date)}
                fullscreen={false}
                headerRender={({ value, onChange }) => {
                  const prev = () => onChange(value.subtract(1, 'month'))
                  const next = () => onChange(value.add(1, 'month'))

                  return (
                    <div className='flex items-center justify-between px-2 py-3'>
                      <Button
                        type='text'
                        shape='circle'
                        icon={<TbChevronLeft className='fs-18' />}
                        onClick={prev}
                      />
                      <span className='text-(--yellow) font-semibold'>
                        {dayjs(value).format('MMMM BBBB')}
                      </span>
                      <Button
                        type='text'
                        shape='circle'
                        icon={<TbChevronRight className='fs-18' />}
                        onClick={next}
                      />
                    </div>
                  )
                }}
                onSelect={(date) => {
                  field.onChange(date)
                  submitRef.current?.click()
                }}
                cellRender={(current, info) => {
                  if (info.type !== 'date') return null
                  const dateKey = current.format('YYYY-MM-DD')
                  const hasSchedule = (scheduleData?.[dateKey]?.length ?? 0) > 0
                  if (!hasSchedule) return null
                  const isSelected = current.isSame(field.value ?? dayjs(), 'day')
                  return <Badge color={isSelected ? 'blue' : 'gold'} />
                }}
              />
            </ConfigProvider>
          )
        }}
      />
      <button ref={submitRef} type='submit' hidden />
    </form>
  )
}

export default React.memo<Props>(FormSearchCalendar)
