import { Input } from 'antd'
import React, { useCallback, useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'

interface Props {

}

interface FormValues {
  search: ""
}

const FormSearchStatus: React.FC<Props> = (props) => {
  const { } = props
  const submitRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const form = useForm<FormValues>({
    defaultValues: {
      search: ""
    },
  })

  const {
    control,
    handleSubmit,
  } = form

  const onSubmit = useCallback((values: FormValues) => {
    console.log(values)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="search"
        render={({ field }) => {
          return (
            <fieldset>
              <Input
                {...field}
                name={field.name}
                placeholder="ค้นหาจุดติดตั้ง..."
                className='rounded-lg'
                suffix={<TbSearch />}
                size='large'
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
      <button ref={submitRef} type='submit' hidden />
    </form>
  )
}

export default React.memo<Props>(FormSearchStatus)
