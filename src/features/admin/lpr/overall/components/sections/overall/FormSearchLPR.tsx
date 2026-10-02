import { Input } from 'antd'
import React, { useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'

interface Props {
  onSearch: (data: FormValues) => void
}

export interface FormValues {
  search: string
}

const FormSearchLPR: React.FC<Props> = (props) => {
  const { onSearch } = props
  const submitRef = useRef<HTMLButtonElement>(null)
  // Per-instance debounce timer (a module-level `let` would be shared across
  // mounted instances — same fix as control-vms's search forms).
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const form = useForm<FormValues>({
    defaultValues: {
      search: ''
    },
  })

  const { control, handleSubmit } = form

  return (
    <form onSubmit={handleSubmit(onSearch)}>
      <Controller
        control={control}
        name='search'
        render={({ field }) => (
          <fieldset>
            <Input
              {...field}
              placeholder='ค้นหาหน่วยงาน สายทาง หรือชื่อโครงการ...'
              className='rounded-lg app-search-input'
              suffix={<TbSearch className='text-(--yellow)' />}
              size='large'
              onChange={(e) => {
                field.onChange(e)
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                timeoutRef.current = setTimeout(() => submitRef.current?.click(), 700)
              }}
            />
          </fieldset>
        )}
      />
      <button
        ref={submitRef}
        type='submit'
        hidden
      />
    </form>
  )
}

export default React.memo<Props>(FormSearchLPR)
