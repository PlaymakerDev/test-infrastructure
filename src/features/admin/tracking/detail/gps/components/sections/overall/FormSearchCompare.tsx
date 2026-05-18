import { Input } from 'antd'
import React, { useCallback, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'

interface Props {

}

interface FormSearchCompareValues {
  search: string
}

let timeout: NodeJS.Timeout

const FormSearchCompare: React.FC<Props> = (props) => {
  const { } = props
  const submitRef = useRef<HTMLButtonElement>(null)

  const form = useForm<FormSearchCompareValues>({
    defaultValues: {
      search: ''
    }
  })

  const {
    control,
    handleSubmit,
  } = form

  const onSubmit = useCallback((value: FormSearchCompareValues) => {
    console.log('submit', value)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='w-full lg:w-1/2 '>
      <Controller
        control={control}
        name="search"
        render={({ field }) => {
          return (
            <fieldset>
              <Input
                {...field}
                name={field.name}
                placeholder="ค้นหาจังหวัด..."
                className='rounded-lg'
                suffix={<TbSearch />}
                size='large'
                onChange={(e) => {
                  field.onChange(e)

                  if (timeout) clearTimeout(timeout)
                  timeout = setTimeout(() => {
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

export default React.memo<Props>(FormSearchCompare)
