import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import type { DailyWeightLogRow } from '../hooks/useDailyWeightLogList'

dayjs.extend(buddhistEra)
dayjs.locale('th')

// Mirrors the tables' max page-size option; when the result set is larger the
// export refetches with the reported total so nothing is cut off.
const EXPORT_PAGE_SIZE = 100

/** Shared column config for both PDF and Excel exports of the daily weight-log
 *  tables — SAME columns, SAME order and cell text as getDailyWeightLogColumns
 *  (TableOverallDailyWeight, OVERALL tab + TableWeightLog, drill-down modal),
 *  minus the two image columns (ภาพป้ายทะเบียน/ภาพลักษณะรถ render as pictures
 *  on screen — skipped in a printed report), plus ลำดับ so a printed row can be
 *  referenced. `width` = Excel chars, `widthPct` = PDF table percent (sums to 100). */
export const DAILY_WEIGHT_LOG_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: DailyWeightLogRow, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  {
    header: 'วันที่และเวลา',
    width: 24,
    widthPct: 14,
    value: (r) => (r.time_stamp ? `${dayjs(r.time_stamp).format('DD MMM BBBB HH:mm:ss')} น.` : '-'),
  },
  {
    header: 'ทะเบียนรถ',
    width: 20,
    widthPct: 13,
    value: (r) => [r.lp_head_no, r.lp_head_province_name].filter(Boolean).join(' ') || '-',
  },
  { header: 'ประเภทรถ', width: 34, widthPct: 22, align: 'left', value: (r) => r.vehicle_class_desc || '-' },
  { header: 'น้ำหนักที่ชั่งได้', width: 15, widthPct: 10, value: (r) => `${Number(r.gross_weight ?? 0).toFixed(3)} ตัน` },
  { header: 'น้ำหนักตามกำหนด', width: 17, widthPct: 10, value: (r) => `${Number(r.legal_weight ?? 0).toFixed(3)} ตัน` },
  { header: 'น้ำหนักเกิน', width: 13, widthPct: 9, value: (r) => `${Number(r.gross_weight_over ?? 0).toFixed(3)} ตัน` },
  { header: 'ความเร็ว', width: 12, widthPct: 8, value: (r) => (r.speed ? `${Number(r.speed).toFixed(2)} กม./ชม.` : '-') },
  { header: 'สถานะ', width: 13, widthPct: 9, value: (r) => r.is_over_weight_desc || '-' },
]

/** Fetches the FULL weight-log result set for the current filter (the tables
 *  server-paginate internally) through the same endpoint pair the tables read
 *  (station vs wim log), then normalizes both shapes exactly like
 *  useDailyWeightLogList — including the gross_weight_over/grossweight_over
 *  field-name mismatch. `date` (single day, used as both start_date and
 *  end_date) defaults to today, matching the hook. */
export const fetchDailyWeightLogExportRows = async (args: {
  stationId: string | number | undefined
  stationType: string | null | undefined
  isOverWeight?: 'Y' | 'N'
  date?: string
}): Promise<DailyWeightLogRow[]> => {
  const { stationId, stationType, isOverWeight, date } = args
  if (!stationId) return []

  const { getTrackingWeightWIMLogAPI, getTrackingWeightStationLogAPI } = await import(
    '@/services/routes/TrackingDetailService'
  )
  const day = date ?? dayjs().format('YYYY-MM-DD')
  const fetchPage = async (pageSize: number) => {
    const params = {
      start_date: day,
      end_date: day,
      station: stationId as number,
      page: 1,
      page_size: pageSize,
      is_over_weight: isOverWeight,
    }
    const res = stationType === 'STATION'
      ? await getTrackingWeightStationLogAPI(params)
      : await getTrackingWeightWIMLogAPI(params)
    return res.data
  }

  const first = await fetchPage(EXPORT_PAGE_SIZE)
  const total = first.meta?.total ?? 0
  const payload = total > EXPORT_PAGE_SIZE ? await fetchPage(total) : first

  return payload.data.map((item) => ({
    key: item.td_id,
    time_stamp: item.time_stamp,
    lp_head_no: item.lp_head_no,
    lp_head_province_name: item.lp_head_province_name,
    vehicle_class_id: item.vehicle_class_id,
    vehicle_class_desc: item.vehicle_class_desc,
    gross_weight: item.gross_weight,
    legal_weight: item.legal_weight,
    gross_weight_over: 'gross_weight_over' in item ? item.gross_weight_over : item.grossweight_over,
    is_over_weight: item.is_over_weight,
    is_over_weight_desc: item.is_over_weight_desc,
  }))
}
