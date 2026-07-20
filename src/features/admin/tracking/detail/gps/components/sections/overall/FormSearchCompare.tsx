import { Input } from 'antd'
import React, { useCallback, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'

interface Props {
  onSearch?: (search: string) => void
}

interface FormSearchCompareValues {
  search: string
}

let timeout: NodeJS.Timeout

const FormSearchCompare: React.FC<Props> = (props) => {
  const { onSearch } = props
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
    onSearch?.(value.search)
  }, [onSearch])

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
                suffix={<TbSearch className='text-(--yellow)' />}
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
