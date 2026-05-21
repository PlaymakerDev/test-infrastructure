import { Button, Calendar, ConfigProvider } from 'antd'
import thTH from 'antd/locale/th_TH'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/th'
import React, { useCallback, useRef } from 'react'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'
import { Controller, useForm } from 'react-hook-form'

dayjs.locale('th')

interface Props {

}

interface FormValues {
  date: Dayjs | null;
}

const FormSearchCalendar: React.FC<Props> = (props) => {
  const { } = props;
  const submitRef = useRef<HTMLButtonElement>(null)

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
    const body = {
      date: value.date?.format('YYYY-MM-DD') ?? null,
    }
    console.log(body)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="date"
        render={({ field }) => {
          return (
            <ConfigProvider locale={thTH}>
              <Calendar
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
                        {dayjs(value).format('MMMM')} {value.year() + 543}
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
                onSelect={() => submitRef.current?.click()}
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
