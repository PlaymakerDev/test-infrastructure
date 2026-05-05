"use client"
import { Input } from 'antd';
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form';
import { TbSearch } from 'react-icons/tb';

interface Props {
  data?: [];
}

export interface FormSearchValue {
  search?: string;
}

const SearchCard: React.FC<Props> = (props) => {
  const { data } = props

  const form = useForm<FormSearchValue>({
    defaultValues: {
      search: ''
    }
  })

  const {
    control,
    handleSubmit,
  } = form

  const onSubmit = useCallback((value: FormSearchValue) => {
    console.log(value)
  }, [])

  return (
    <div className='bg-(--dark-black-100) rounded-lg p-4 w-full h-full'>
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
                  placeholder='Search'
                  className='rounded-lg'
                  prefix={<TbSearch />}
                />
              </fieldset>
            )
          }}
        />
      </form>
    </div>
  )
}

export default React.memo<Props>(SearchCard)
