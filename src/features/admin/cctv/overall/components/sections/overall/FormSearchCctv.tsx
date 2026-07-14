import { Input } from 'antd'
import React, { useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'

interface Props {
  /** Fires (debounced) with the current search term so the parent can filter. */
  onSearchChange?: (value: string) => void
}
interface FormValues { search: string }

const FormSearchCctv: React.FC<Props> = ({ onSearchChange }) => {
  const submitRef = useRef<HTMLButtonElement>(null)
  // Per-instance debounce timer (avoids the module-level `let timeout` footgun).
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { control, handleSubmit } = useForm<FormValues>({ defaultValues: { search: '' } })

  return (
    <form onSubmit={handleSubmit((v) => onSearchChange?.(v.search))}>
      <Controller control={control} name='search' render={({ field }) => (
        <fieldset>
          <Input {...field} placeholder='ค้นหาหน่วยงาน สายทาง หรือชื่อโครงการ...' className='rounded-lg' suffix={<TbSearch className='text-(--yellow)' />} size='large'
            onChange={(e) => { field.onChange(e); if (timeoutRef.current) clearTimeout(timeoutRef.current); timeoutRef.current = setTimeout(() => submitRef.current?.click(), 700) }}
          />
        </fieldset>
      )} />
      <button ref={submitRef} type='submit' hidden />
    </form>
  )
}

export default React.memo<Props>(FormSearchCctv)
