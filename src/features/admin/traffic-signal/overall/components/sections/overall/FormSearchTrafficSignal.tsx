"use client"
import { Input } from 'antd'
import React, { useCallback, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'

interface Props {
  /** Called with the latest search string (debounced 700ms). */
  onSearchChange?: (value: string) => void
  placeholder?: string
}

interface FormValues {
  search: string
}

let timeout: NodeJS.Timeout

/** Search form for the Traffic Signal overall page — plugs into the central
 *  `<SearchBar>` via the `formSearch` prop. Mirrors the convention used by
 *  `FormSearchCrosswalk` and `FormSearchBridgeLighting`. */
const FormSearchTrafficSignal: React.FC<Props> = ({
  onSearchChange,
  placeholder = 'ค้นหาหน่วยงาน สายทาง หรือชื่อโครงการ...',
}) => {
  const submitRef = useRef<HTMLButtonElement>(null)

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { search: '' },
  })

  const onSubmit = useCallback(
    (values: FormValues) => {
      onSearchChange?.(values.search)
    },
    [onSearchChange]
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name='search'
        render={({ field }) => (
          <fieldset>
            <Input
              {...field}
              name={field.name}
              placeholder={placeholder}
              className='rounded-lg app-search-input'
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
        )}
      />
      <button ref={submitRef} type='submit' hidden />
    </form>
  )
}

export default React.memo<Props>(FormSearchTrafficSignal)
