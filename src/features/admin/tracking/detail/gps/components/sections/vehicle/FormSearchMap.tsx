import { DatePicker, Input } from 'antd'
import React, { useCallback, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'

interface Props {

}

interface FormSearchLicenseValues {
  search: string
}

let timeout: NodeJS.Timeout

const FormSearchMap: React.FC<Props> = (props) => {
  const { } = props
  const submitRef = useRef<HTMLButtonElement>(null)

  const form = useForm<FormSearchLicenseValues>({
    defaultValues: {
      search: ''
    }
  })

  const {
    control,
    handleSubmit,
  } = form

  const onSubmit = useCallback((value: FormSearchLicenseValues) => {
    console.log('submit', value)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="search"
        render={({ field }) => {
          return (
            <fieldset>
              <label className='block fs-12 text-(--yellow)'>วันที่แสดงข้อมูล</label>
              <DatePicker
                {...field}
                name={field.name}
                placeholder={'เลือกวันที่...'}
                size='large'
                format='DD/MM/YYYY'
                onChange={(e) => {
                  field.onChange(e)

                  if (timeout) clearTimeout(timeout)
                  timeout = setTimeout(() => {
                    submitRef.current?.click()
                  }, 700)
                }}
                onBlur={field.onBlur}
              />
            </fieldset>
          )
        }}
      />
      <button ref={submitRef} type='submit' hidden />
    </form>
  )
}

export default React.memo<Props>(FormSearchMap)
