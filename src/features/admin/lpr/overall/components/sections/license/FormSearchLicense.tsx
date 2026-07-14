import { Input } from 'antd'
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'

interface Props {

}

interface FormValues {
  search: ""
}

const FormSearchLicense: React.FC<Props> = (props) => {
  const { } = props

  const form = useForm<FormValues>({
    defaultValues: {},
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
                placeholder="ค้นหาป้ายทะเบียน..."
                className='rounded-lg'
                suffix={<TbSearch />}
                size='large'
              />
            </fieldset>
          )
        }}
      />
    </form>
  )
}

export default React.memo<Props>(FormSearchLicense)
