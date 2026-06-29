import { Input } from 'antd'
import React, { useCallback, useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'
import { useControlVMSContext } from '../../../context'

interface Props {

}

interface FormValues {
  search: ""
}

const FormSearchDisplay: React.FC<Props> = (props) => {
  const { } = props
  const { setSearchText } = useControlVMSContext()
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
    setSearchText({
      road_code: values.search.trim() || undefined
    })
  }, [setSearchText])

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
                placeholder="ค้นหาสายทาง..."
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

export default React.memo<Props>(FormSearchDisplay)
