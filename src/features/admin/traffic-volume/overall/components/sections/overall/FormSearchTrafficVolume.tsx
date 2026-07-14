"use client"
import { Input } from 'antd'
import React, { useCallback, useEffect, useRef } from 'react'
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

const DEBOUNCE_MS = 700

/** Search form for the Traffic Value overall page — plugs into the central
 *  `<SearchBar>` via the `formSearch` prop. Debounces every keystroke and
 *  fires `onSearchChange` once typing stops. */
const FormSearchTrafficVolume: React.FC<Props> = ({
  onSearchChange,
  placeholder = 'ค้นหาหน่วยงาน สายทาง หรือชื่อโครงการ...',
}) => {
  // Per-instance timer so multiple mounts of this form (e.g. tab switching)
  // never share or overwrite each other's pending callbacks. Cleared on
  // unmount so a debounce never fires after we're gone.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

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
              className='rounded-lg'
              suffix={<TbSearch className='text-(--yellow)' />}
              size='large'
              onChange={(e) => {
                field.onChange(e)
                const value = e.target.value
                if (timerRef.current) clearTimeout(timerRef.current)
                timerRef.current = setTimeout(() => {
                  onSearchChange?.(value)
                }, DEBOUNCE_MS)
              }}
            />
          </fieldset>
        )}
      />
    </form>
  )
}

export default React.memo<Props>(FormSearchTrafficVolume)
