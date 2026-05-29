import { Input } from 'antd'
import React, { useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'

interface Props {}
interface FormValues { search: string }

let timeout: NodeJS.Timeout

const FormSearchIncidentDetection: React.FC<Props> = () => {
  const submitRef = useRef<HTMLButtonElement>(null)
  const { control, handleSubmit } = useForm<FormValues>({ defaultValues: { search: '' } })

  return (
    <form onSubmit={handleSubmit((v) => console.log('submit', v))}>
      <Controller control={control} name='search' render={({ field }) => (
        <fieldset>
          <Input {...field} placeholder='ค้นหาหน่วยงาน สายทาง หรือชื่อโครงการ...' className='rounded-lg' suffix={<TbSearch />} size='large'
            onChange={(e) => { field.onChange(e); if (timeout) clearTimeout(timeout); timeout = setTimeout(() => submitRef.current?.click(), 700) }}
          />
        </fieldset>
      )} />
      <button ref={submitRef} type='submit' hidden />
    </form>
  )
}

export default React.memo<Props>(FormSearchIncidentDetection)
