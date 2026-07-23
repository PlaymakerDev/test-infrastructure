import { Image } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { DailyWeightLogRow } from '../hooks/useDailyWeightLogList'
import { FALLBACK, ITS_WEIGHT_STATUS } from '@/constants'
import { fmtNumber } from '@/utils/formatNumber'

export interface DailyWeightLogColumnsOptions {
  /** TableWeightLog (modal drill-down) omits the plate/vehicle image columns — defaults to true for TableOverallDailyWeight. */
  showImages?: boolean
  /** STATION is a static weighbridge with no speed sensor (unlike WIM) — pass
   *  true (station_type === 'STATION') to hide the ความเร็ว column entirely. */
  hideSpeed?: boolean
}

/** Shared column set for `DailyWeightLogRow` — used by both TableOverallDailyWeight
 *  (today's log, OVERALL tab) and TableWeightLog (single-day drill-down modal),
 *  since both render the same normalized row shape from useDailyWeightLogList. */
export const getDailyWeightLogColumns = (
  options?: DailyWeightLogColumnsOptions
): ColumnsType<DailyWeightLogRow> => {
  const { showImages = true, hideSpeed = false } = options ?? {}

  const columns: ColumnsType<DailyWeightLogRow> = [
    {
      title: 'วันที่และเวลา',
      key: 'datetime',
      align: 'left',
      width: 140,
      className: 'col-road-code',
      render: (_, record) => (
        <div>
          <p className='fs-12 mb-0'>{dayjs(record.time_stamp, "DD/MM/BBBB  HH:mm:ss").format('DD MMM BBBB')}</p>
          <p className='fs-12 mb-0 text-white/60'>{dayjs(record.time_stamp, "DD/MM/BBBB  HH:mm:ss").format('HH:mm:ss')} น.</p>
        </div>
      ),
    },
    {
      title: 'ทะเบียนรถ',
      key: 'plate',
      align: 'left',
      width: 160,
      render: (_, record) => [record.lp_head_no, record.lp_head_province_name].filter(Boolean).join(' ') || '-',
    },
    {
      title: 'ประเภทรถ',
      dataIndex: 'vehicle_class_desc',
      key: 'vehicle_class_desc',
      align: 'left',
      width: 220,
      render: (value?: string) => value || '-',
    },
    {
      title: 'น้ำหนักที่ชั่งได้',
      dataIndex: 'gross_weight',
      key: 'gross_weight',
      align: 'left',
      width: 140,
      render: (value?: string) => {
        const numeric = Number(value ?? 0)
        return <span className={numeric > 0 ? '' : 'text-white/25'}>{fmtNumber(numeric, 2)} ตัน</span>
      },
    },
    {
      title: 'น้ำหนักตามกำหนด',
      dataIndex: 'legal_weight',
      key: 'legal_weight',
      align: 'left',
      width: 160,
      render: (value?: string) => {
        const numeric = Number(value ?? 0)
        return <span className={numeric > 0 ? 'text-(--yellow)' : 'text-white/25'}>{fmtNumber(numeric, 2)} ตัน</span>
      },
    },
    {
      title: 'น้ำหนักเกิน',
      dataIndex: 'gross_weight_over',
      key: 'gross_weight_over',
      align: 'left',
      width: 130,
      render: (value?: string) => {
        const numeric = Number(value ?? 0)
        return <span className={numeric > 0 ? 'text-red-500' : 'text-white/25'}>{fmtNumber(numeric, 2)} ตัน</span>
      },
    },
    {
      // WIM's log list includes a speed reading; STATION's does not (it's a
      // static weighbridge, not a speed-sensing WIM sensor) — same gap as
      // CardCurrentWeightVehicle.
      title: 'ความเร็ว',
      dataIndex: 'speed',
      key: 'speed',
      align: 'left',
      width: 120,
      render: (value?: string) => value ? `${fmtNumber(Number(value), 2)} กม./ชม.` : '-',
    },
    {
      title: 'ภาพป้ายทะเบียน',
      dataIndex: 'plate_image',
      key: 'plate_image',
      align: 'center',
      width: 130,
      render: (src?: string) => (
        src ? <Image src={src} width={100} height={60} className='rounded object-cover' alt='plate' fallback={FALLBACK} /> : '-'
      ),
    },
    {
      title: 'ภาพลักษณะรถ',
      dataIndex: 'vehicle_image',
      key: 'vehicle_image',
      align: 'center',
      width: 130,
      render: (src?: string) => (
        src ? <Image src={src} width={100} height={60} className='rounded object-cover' alt='vehicle' fallback={FALLBACK} /> : '-'
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'is_over_weight',
      key: 'is_over_weight',
      align: 'center',
      width: 130,
      fixed: 'right',
      render: (value: string) => {
        const status = ITS_WEIGHT_STATUS[value as keyof typeof ITS_WEIGHT_STATUS]
        return (
          <span
            className='inline-block py-0.5 px-3.5 rounded-full text-xs whitespace-nowrap border'
            style={{ borderColor: status?.color, color: status?.color }}
          >
            {status?.text || '-'}
          </span>
        )
      },
    },
  ]

  return columns.filter((column) => {
    if (!showImages && (column.key === 'plate_image' || column.key === 'vehicle_image')) return false
    if (hideSpeed && column.key === 'speed') return false
    return true
  })
}
