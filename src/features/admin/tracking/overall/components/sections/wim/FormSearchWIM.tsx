import { Input } from 'antd';
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb';

interface Props {

}

interface FormValues {
  search: string;
}

const FormSearchWIM: React.FC<Props> = (props) => {
  const { } = props

  const form = useForm<FormValues>({
    defaultValues: {
      search: ""
    }
  })

  const {
    control,
    handleSubmit,
  } = form

  const onSubmit = useCallback((value: FormValues) => {
    console.log(value)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name='search'
        render={({ field }) => {
          return (
            <fieldset>
              <Input
                {...field}
                name={field.name}
                placeholder="ค้นหาสถานี WIM (Weigh-In-Motion)..."
                className='rounded-lg'
                suffix={<TbSearch />}
                size='medium'
              />
            </fieldset>
          )
        }}
      />
    </form>
  )
}

export default React.memo<Props>(FormSearchWIM)
