import { Input } from 'antd'
import React, { useCallback, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'

interface Props {

}

interface FormSearchRouteValues {
  search: string
}

let timeout: NodeJS.Timeout

const FormSearchRoute: React.FC<Props> = (props) => {
  const { } = props
  const submitRef = useRef<HTMLButtonElement>(null)

  const form = useForm<FormSearchRouteValues>({
    defaultValues: {
      search: ''
    }
  })

  const {
    control,
    handleSubmit,
  } = form

  const onSubmit = useCallback((value: FormSearchRouteValues) => {
    console.log('submit', value)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      < Controller
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
    </form >
  )
}

export default React.memo<Props>(FormSearchRoute)
