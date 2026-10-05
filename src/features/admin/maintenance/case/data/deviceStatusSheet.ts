import type { CaseDetail } from '@/types/maintenance'
import { parseImageUrls } from '../../data/parseImageUrls'

type SheetJob = CaseDetail['device_status_image_job']

/** Whether the backend is still building a case's camera-status sheet — the
 *  last page of its หนังสือแจ้งซ่อม. The job is created with the case (same
 *  request) and takes 4–11 s (C-20261005-0001..0003; 0003: 11:58:03 →
 *  11:58:13). No job at all — an old case, or the officer attached their own
 *  images — means nothing to wait for. */
export const sheetPending = (job: SheetJob): boolean =>
  !!job && job.status !== 'done' && job.status !== 'failed' && job.status !== 'error'

/** none = the case has no job · done / failed = how the job ended ·
 *  timeout = still building when the wait gave up. */
export type SheetState = 'none' | 'done' | 'failed' | 'timeout'

export interface SheetResult {
  /** The case's device-status images as they stood at the end of the wait. */
  images: string[]
  state: SheetState
}

/** How long the "letter went out without its sheet" warning stays up (s). It
 *  asks the officer to act, and after a save it shares the screen with the
 *  signing reminder — antd's 3 s default is gone before it can be read. */
export const SHEET_WARNING_SECONDS = 8

const settledState = (job: SheetJob): SheetState =>
  !job ? 'none' : job.status === 'done' ? 'done' : 'failed'

interface WaitOptions {
  timeoutMs?: number
  intervalMs?: number
  /** Called once, the first time the wait has to pause (the sheet is still
   *  being built, or the case couldn't be read) — so a "please wait" shows
   *  only when there is something to wait for. */
  onWaiting?: () => void
  /** Injected so tests needn't wait in real time. */
  sleep?: (ms: number) => Promise<void>
}

/** A case's camera-status images, once the sheet has settled. A letter made
 *  before the sheet exists goes out without its last page, and the officer
 *  prints and signs exactly that file — which is how the signed copies lost
 *  the page (user 2026-10-05: downloaded at 11:58:03, sheet done 11:58:13). */
export const waitForDeviceStatusImages = async (
  fetchCase: () => Promise<CaseDetail | null | undefined>,
  {
    timeoutMs = 40_000,
    intervalMs = 2_000,
    onWaiting,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }: WaitOptions = {},
): Promise<SheetResult> => {
  let waited = 0
  let images: string[] = []
  for (;;) {
    let detail: CaseDetail | null | undefined
    try {
      detail = await fetchCase()
    } catch {
      detail = null
    }
    if (detail) {
      images = parseImageUrls(detail.device_status_image)
      const job = detail.device_status_image_job
      if (!sheetPending(job)) return { images, state: settledState(job) }
    }
    if (waited + intervalMs > timeoutMs) return { images, state: 'timeout' }
    if (waited === 0) onWaiting?.()
    await sleep(intervalMs)
    waited += intervalMs
  }
}
