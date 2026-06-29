"use client"
import React, { useCallback, useRef } from 'react'
import { Input } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'
import { RoadList } from '@/components/list'
import type { RoadItem } from '@/components/list/RoadList'

interface FormValues {
  search: string
}

let timeout: NodeJS.Timeout

const MOCK_DATA: RoadItem[] = [
  { id: 1, road_code: 'ฉซ.3001', road_name: 'แขวงทางหลวงชนบทฉะเชิงเทรา', vehicle_count: 12 },
  { id: 2, road_code: 'ฉซ.3002', road_name: 'แขวงทางหลวงชนบทฉะเชิงเทรา', vehicle_count: 8 },
  { id: 3, road_code: 'ฉช.2001', road_name: 'แขวงทางหลวงชนบทชลบุรี', vehicle_count: 15 },
  { id: 4, road_code: 'ฉช.2002', road_name: 'แขวงทางหลวงชนบทชลบุรี', vehicle_count: 10 },
  { id: 5, road_code: 'ปท.3004', road_name: 'แขวงทางหลวงชนบทปทุมธานี', vehicle_count: 22 },
  { id: 6, road_code: 'สป.2001', road_name: 'แขวงทางหลวงชนบทสมุทรปราการ', vehicle_count: 9 },
]

const MaintenanceSearchSection: React.FC = () => {
  const submitRef = useRef<HTMLButtonElement>(null)

  const form = useForm<FormValues>({
    defaultValues: { search: '' }
  })

  const { control, handleSubmit } = form

  const onSubmit = useCallback((value: FormValues) => {
    console.log('search', value.search)
  }, [])

  const handleSelect = useCallback((item: RoadItem) => {
    console.log('selected', item)
  }, [])

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="search"
          render={({ field }) => (
            <fieldset>
              <Input
                {...field}
                placeholder="ค้นหาสายทาง..."
                className="rounded-lg"
                suffix={<TbSearch style={{ color: '#FCD116' }} />}
                size="large"
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
        <button ref={submitRef} type="submit" hidden />
      </form>
      <section className="mt-4">
        <RoadList data={MOCK_DATA} onSelect={handleSelect} />
      </section>
    </div>
  )
}

export default React.memo(MaintenanceSearchSection)
