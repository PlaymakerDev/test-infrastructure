import type { LightingSolutionDevice, LightingSolutionLora } from '@/types/lighting'
import { thaiDateBE } from '@/utils/thaiDate'

/** One row of ตารางข้อมูลอุปกรณ์ — a lamp. `null` = the API has no such
 *  figure for it (a column the table then leaves out). */
export interface LampRow {
  key: string
  order: number
  code: string
  isWorking: boolean | null
  isConnected: boolean | null
  current: number | null
  updatedAt: string
}

/** สถานะโคมไฟ — the gateway's working / not-working split. */
export interface LampSummary {
  total: number
  working: number
  notWorking: number
}

const STAMP = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/

/** "15/09/2569 07:36:28" — the lighting service's Buddhist-year stamp — as a
 *  Date; null when empty or not that shape. */
export const parseLightingStamp = (value: string | null | undefined): Date | null => {
  const m = STAMP.exec((value ?? '').trim())
  if (!m) return null
  const [, d, mo, y, h, mi, s] = m.map(Number)
  const date = new Date(y - 543, mo - 1, d, h, mi, s)
  return Number.isNaN(date.getTime()) ? null : date
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** "15 ก.ย. 2569 07:36:28" — the table cell's format. */
export const formatLampStamp = (date: Date): string =>
  `${thaiDateBE(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`

/** The lamps in pole order. The lighting service sends no per-lamp status or
 *  current yet, so those stay null rather than borrowing the gateway's tally;
 *  อัพเดตล่าสุด is when the lamp last reported. */
export const lampRowsFromDevices = (devices: LightingSolutionDevice[] | null | undefined): LampRow[] =>
  [...(devices ?? [])]
    .sort((a, b) => (a.pole_number ?? Infinity) - (b.pole_number ?? Infinity) || a.id - b.id)
    .map((device, i) => {
      const reported = parseLightingStamp(device.last_connectd)
      return {
        key: String(device.id),
        order: device.pole_number ?? i + 1,
        code: device.device_id?.trim() || '-',
        isWorking: null,
        isConnected: null,
        current: null,
        updatedAt: reported ? formatLampStamp(reported) : '-',
      }
    })

/** The gateway's own tally — the last it sent, which stays put while the
 *  gateway is silent (see `latestLampReport`). Null without a gateway. */
export const lampSummaryFromGateway = (lora: LightingSolutionLora | null | undefined): LampSummary | null =>
  lora
    ? { total: lora.online_count + lora.offline_count, working: lora.online_count, notWorking: lora.offline_count }
    : null

/** When the newest lamp report came in — how old the gateway's tally can be
 *  (ทล.107's lamps last reported in 2565 while it still counts them). */
export const latestLampReport = (devices: LightingSolutionDevice[] | null | undefined): Date | null =>
  (devices ?? []).reduce<Date | null>((latest, device) => {
    const at = parseLightingStamp(device.last_connectd)
    return at && (!latest || at > latest) ? at : latest
  }, null)
