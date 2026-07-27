import { AutoComplete } from 'antd'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbSearch } from 'react-icons/tb'
import { useRoadsInfinite } from '@/hooks/queries/shared/useRoadsInfinite'

interface Props {
  /** Fired when the user picks a suggestion — feeds SidebarRoute's
   *  DataDisplaySection, which calls getSideMenuRoadAPI with this road's id.
   *  `departmentId` (the road's own department_id) is carried along so the
   *  solution-list redirect can attach `?dept_id=` like SidebarContent does,
   *  instead of `?road_id=`. Fired with `null` when the field is cleared, so
   *  the parent resets back to the "กรุณากรอกสายที่ต้องการค้นหา" empty state. */
  onSelectRoad?: (road: { id: number; code: string; departmentId: number } | null) => void
}

interface FormSearchRouteProps {
  search?: string | null
}

let timeout: NodeJS.Timeout

const FormSearchRoute: React.FC<Props> = (props) => {
  const { onSelectRoad } = props
  const submitRef = useRef<HTMLButtonElement>(null)
  // Debounced text actually sent to getRoadAPI's `search` param — updated once
  // per submit (the existing 700ms-after-typing debounce below), not on every
  // keystroke.
  const [search, setSearch] = useState('')

  const form = useForm<FormSearchRouteProps>({
    defaultValues: {
      search: ''
    }
  })

  const {
    control,
    handleSubmit
  } = form

  const onSubmit = useCallback((data: FormSearchRouteProps) => {
    setSearch(data.search?.trim() ?? '')
  }, [])

  // Only hit the server once the user has typed 2+ chars — one-letter queries
  // return effectively everything and waste bandwidth (mirrors MapSearchBox).
  const enabled = search.length >= 2
  const {
    data: roadPages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useRoadsInfinite(search, { enabled })

  const options = useMemo(
    () => enabled
      ? roadPages?.pages.flatMap((p) => p.data.res_data ?? []).map((road) => ({
        // AutoComplete runs rc-select in combobox mode internally, which
        // warns/requires option `value` to be a string, not a number.
        value: String(road.id),
        label: `${road.road_code}${road.road_name ? ' - ' + road.road_name : ''}`,
        roadCode: road.road_code,
        roadName: road.road_name,
        departmentId: road.department_id,
      })) ?? []
      : [],
    [enabled, roadPages],
  )

  // Loads the next page as the dropdown nears its bottom (mirrors
  // FormUpdateSchedule's handleSettingPopupScroll for the control-vms Select).
  const handlePopupScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name='search'
        render={({ field }) => {
          return (
            <AutoComplete
              {...field}
              options={options}
              optionRender={(option) => (
                <div className='min-w-0'>
                  <div className='truncate'>{option.data.roadCode}</div>
                  <div className='truncate text-white/50 fs-12'>{option.data.roadName}</div>
                </div>
              )}
              notFoundContent={
                enabled
                  ? (isLoading ? 'กำลังค้นหา…' : 'ไม่พบสายทาง')
                  : 'พิมพ์อย่างน้อย 2 ตัวอักษร'
              }
              placeholder='ค้นหาสายทาง'
              suffixIcon={<TbSearch className='text-(--yellow)' />}
              size='large'
              className='w-full!'
              allowClear
              onPopupScroll={handlePopupScroll}
              onSelect={(value, option) => {
                // Reset the box to the readable road code (not the raw id
                // used as `value`) and hand the id up to DataDisplaySection.
                field.onChange(option.roadCode)
                onSelectRoad?.({ id: Number(value), code: option.roadCode, departmentId: option.departmentId })
              }}
              onClear={() => {
                if (timeout) clearTimeout(timeout)
                setSearch('')
                onSelectRoad?.(null)
              }}
              onChange={(e) => {
                field.onChange(e)

                if (timeout) clearTimeout(timeout)

                // Cleared by backspacing to empty (not the × button) — reset
                // immediately instead of waiting out the debounce.
                if (!e) {
                  setSearch('')
                  onSelectRoad?.(null)
                  return
                }

                timeout = setTimeout(() => {
                  submitRef.current?.click()
                }, 700)
              }}
            />
          )
        }}
      />
      <button ref={submitRef} type='submit' hidden />
    </form>
  )
}

export default React.memo<Props>(FormSearchRoute)
