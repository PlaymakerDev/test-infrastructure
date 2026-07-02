import { Badge } from 'antd'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import React from 'react'

dayjs.extend(buddhistEra)
import { TbHourglassHigh, TbPencilMinus, TbTrash, TbWifi, TbWifiOff } from 'react-icons/tb'
import { VMSScheduleByDate } from '@/types/control-vms/display-api'

dayjs.locale('th')

export interface ScheduleItem {
  id: string
  display_range: string
  on_date: string
  route: string
  installation_point: string
  anydesk: string
  is_online: boolean
  day_remaining: number
}

export interface ScheduleUpdateClick {
  onEdit?: (item: VMSScheduleByDate) => void
  onDelete?: (item: VMSScheduleByDate) => void
}

type ColCount = 1 | 2 | 3 | 4

export interface ScheduleListCols {
  default?: ColCount
  sm?: ColCount
  md?: ColCount
  lg?: ColCount
  xl?: ColCount
  xxl?: ColCount
}

export interface ScheduleListProps {
  data: VMSScheduleByDate[]
  onUpdateClick?: ScheduleUpdateClick
  cols?: ScheduleListCols
}

const colsMap: Record<ColCount, Record<string, string>> = {
  1: { default: 'grid-cols-1', sm: 'sm:grid-cols-1', md: 'md:grid-cols-1', lg: 'lg:grid-cols-1', xl: 'xl:grid-cols-1', xxl: '2xl:grid-cols-1' },
  2: { default: 'grid-cols-2', sm: 'sm:grid-cols-2', md: 'md:grid-cols-2', lg: 'lg:grid-cols-2', xl: 'xl:grid-cols-2', xxl: '2xl:grid-cols-2' },
  3: { default: 'grid-cols-3', sm: 'sm:grid-cols-3', md: 'md:grid-cols-3', lg: 'lg:grid-cols-3', xl: 'xl:grid-cols-3', xxl: '2xl:grid-cols-3' },
  4: { default: 'grid-cols-4', sm: 'sm:grid-cols-4', md: 'md:grid-cols-4', lg: 'lg:grid-cols-4', xl: 'xl:grid-cols-4', xxl: '2xl:grid-cols-4' },
}

const buildGridClass = (cols?: ScheduleListCols): string => {
  const c = cols ?? { default: 1 }
  return [
    colsMap[c.default ?? 1].default,
    c.sm && colsMap[c.sm].sm,
    c.md && colsMap[c.md].md,
    c.lg && colsMap[c.lg].lg,
    c.xl && colsMap[c.xl].xl,
    c.xxl && colsMap[c.xxl].xxl,
  ].filter(Boolean).join(' ')
}

// const formatThaiDate = (isoDate: string) =>
//   dayjs(isoDate).format('DD MMM BBBB')

const ScheduleList: React.FC<ScheduleListProps> = (props) => {
  const { data, onUpdateClick, cols } = props
  return (
    <div className={`grid gap-3 ${buildGridClass(cols)}`}>
      {(data ?? []).map((item) => (
        <div key={item.setting_id} className='relative bg-background py-6.5 px-5 rounded-lg'>
          <div className='absolute top-3 right-3 flex items-center gap-2'>
            <TbPencilMinus
              className='fs-22 text-orange-300 cursor-pointer'
              onClick={() => onUpdateClick?.onEdit?.(item)}
            />
            <TbTrash
              className='fs-22 text-red-500 cursor-pointer'
              onClick={() => onUpdateClick?.onDelete?.(item)}
            />
          </div>
          <div className='text-center'>
            <h3 className='text-(--yellow)'>{item.time_since} - {item.time_to}</h3>
            <p className='text-gray-400'>{dayjs(item.date).format('DD MMM BBBB')}</p>
          </div>
          <hr className='my-3 border-gray-500/20' />
          <div className='text-center'>
            <div className='mb-2'>
              <p className='fs-12'>สายทาง : {item.road_code || '-'}</p>
              <p className='fs-12'>จุดติดตั้ง : {item.solution_name || '-'}</p>
              {item.anydesk && (
                <p className='fs-12 text-gray-400'>
                  Anydesk : {item.anydesk || '-'} <Badge color={item.is_online ? 'blue' : 'red'} />
                </p>
              )}
            </div>
            <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-center gap-2'>
              <span className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${item.is_online ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}>
                {item.is_online ? <TbWifi /> : <TbWifiOff />}
                {item.is_online ? 'ออนไลน์' : 'ออฟไลน์'}
                <Badge color={item.is_online ? 'green' : 'red'} />
              </span>
              <span className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border border-yellow-500 text-yellow-500'>
                <TbHourglassHigh />
                {item.date_count || '0 วัน'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default React.memo<ScheduleListProps>(ScheduleList)
