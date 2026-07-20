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

// Module-level debounce timer (matches the convention used by
// `FormSearchCrosswalk`). One bridge-lighting page renders one instance,
// so a shared timer is fine here.
let timeout: NodeJS.Timeout

/**
 * Search form for the BridgeLighting overall page — plugs into the central
 * `<SearchBar>` via the `formSearch` prop. Uses `react-hook-form` +
 * `<Controller>` like the rest of the project's search forms, with a 700ms
 * debounce before notifying the parent so we don't filter on every keystroke.
 */
const FormSearchBridgeLighting: React.FC<Props> = ({
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

export default React.memo<Props>(FormSearchBridgeLighting)
