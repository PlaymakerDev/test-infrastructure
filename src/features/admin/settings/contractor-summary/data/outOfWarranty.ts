import dayjs, { type Dayjs } from 'dayjs'
import { isRealTimestamp } from '@/features/admin/maintenance/data/offlineDays'
import type {
  APIResponseOutOfWarrantyCandidates,
  OutOfWarrantyCandidate,
  OutOfWarrantyDeviceType,
  OutOfWarrantyRecord,
} from '@/types/manage/device-status-api'
import { SUMMARY_SYSTEMS } from './systems'

/** บันทึกเงื่อนไขนอกค้ำประกัน (Figma, user 2026-11-16): for each offline
 *  device whose failure the warranty does not cover — a car hit it, its cable
 *  was cut or stolen, some other accident — the officer records what the
 *  inspection found and up to two photos of the damage. One project at a
 *  time, from the ผู้รับจ้าง summary table. Saved through
 *  /manage/project/device-status/out-of-warranty (BE 2026-11-16). */

/** Damage photos per device (Figma: "จำกัดไม่เกิน 2 รูป"). */
export const OUT_OF_WARRANTY_MAX_PHOTOS = 2

/** Long edge a photo is shrunk to before it is sent — small enough for a
 *  slow line (a 3–5 MB phone photo comes down to ~200–300 KB) while the
 *  damage stays legible when zoomed. The user floated 480 px (2026-11-16);
 *  that is too small to read a cut wire or a serial plate. */
export const OUT_OF_WARRANTY_PHOTO_EDGE = 1280

/** Rows per page of the offline-device table (the Figma shows five). */
export const OUT_OF_WARRANTY_TABLE_PAGE_SIZE = 5

export interface OutOfWarrantyType {
  key: OutOfWarrantyDeviceType
  label: string
}

const RECORDABLE: readonly OutOfWarrantyDeviceType[] = ['cctv', 'vms', 'lighting', 'traffic', 'bridge_lighting']

/** What the device-type dropdown offers — the five the backend records:
 *  cameras one by one, VMS / Street Light / Traffic Signal / Bridge Lighting
 *  per solution. Traffic Volume, Incident Detection, LPR, Crosswalk and Tunnel
 *  count through their cameras. CCTV first, the default. */
export const OUT_OF_WARRANTY_TYPES: readonly OutOfWarrantyType[] = RECORDABLE.map((key) => ({
  key,
  label: SUMMARY_SYSTEMS.find((system) => system.key === key)?.label ?? key,
}))

export const DEFAULT_OUT_OF_WARRANTY_TYPE: OutOfWarrantyDeviceType = 'cctv'

/** One device the record can be about — a row of the table. */
export interface OutOfWarrantyDevice {
  /** camera_id for a camera, the solution_id for the rest — unique within its type. */
  id: string
  typeKey: OutOfWarrantyDeviceType
  hostname: string
  /** "" when it has none (a street-light cabinet). */
  ipAddress: string
  /** When it was last heard from (ISO); null when unknown. */
  offlineSince: string | null
  offlineDays: number | null
}

export type DevicesByType = Record<OutOfWarrantyDeviceType, OutOfWarrantyDevice[]>

const sinceOf = (since: string | null | undefined): string | null => (since && isRealTimestamp(since) && dayjs(since).isValid() ? since : null)

const toDevice = (
  typeKey: OutOfWarrantyDeviceType,
  id: string,
  name: string | null | undefined,
  { ip_address, offline_since }: Pick<OutOfWarrantyCandidate, 'ip_address' | 'offline_since'>,
  now: Dayjs,
): OutOfWarrantyDevice => {
  const since = sinceOf(offline_since)
  return {
    id,
    typeKey,
    hostname: name?.trim() || '-',
    ipAddress: ip_address?.trim() ?? '',
    offlineSince: since,
    offlineDays: since ? Math.max(0, now.diff(dayjs(since), 'day')) : null,
  }
}

/** The table's rows per type, from /candidates, in its order (chainage): the
 *  offline cameras — and one with a record still open, which closes by itself
 *  once the camera is back but not that instant — and the offline systems. */
export const candidateDevices = (candidates: APIResponseOutOfWarrantyCandidates, now: Dayjs = dayjs()): DevicesByType => {
  const systems = (typeKey: Exclude<OutOfWarrantyDeviceType, 'cctv'>) =>
    (candidates[typeKey] ?? []).map((item) => toDevice(typeKey, String(item.solution_id), item.solution_name, item, now))
  return {
    cctv: (candidates.cctv ?? [])
      .filter((camera) => !camera.is_online || camera.is_out_of_warranty)
      .map((camera) => toDevice('cctv', camera.camera_id, camera.camera_name, camera, now)),
    vms: systems('vms'),
    lighting: systems('lighting'),
    traffic: systems('traffic'),
    bridge_lighting: systems('bridge_lighting'),
  }
}

const recordDeviceId = (record: OutOfWarrantyRecord): string =>
  record.device_type === 'cctv' ? record.camera_id ?? '' : String(record.solution_id ?? '')

/** A role-user account may not list the candidates (403): its table is the
 *  recorded devices themselves. */
export const recordDevices = (records: readonly OutOfWarrantyRecord[], now: Dayjs = dayjs()): DevicesByType => {
  const devices: DevicesByType = { cctv: [], vms: [], lighting: [], traffic: [], bridge_lighting: [] }
  for (const record of records) {
    devices[record.device_type]?.push(toDevice(record.device_type, recordDeviceId(record), record.device_name, record, now))
  }
  return devices
}

export interface OutOfWarrantyPhoto {
  uid: string
  name: string
  /** What the thumbnail shows — the stored URL, or an object URL for a new
   *  photo; "" while it is still being shrunk. */
  url: string
  /** A new photo, shrunk, to upload on บันทึก. */
  file?: File
  /** Being shrunk — it already takes one of the photo slots. */
  processing?: boolean
}

/** One page of the form on the right: a device and what was found. */
export interface OutOfWarrantyEntry {
  key: string
  deviceId: string | null
  /** The device's name when it was picked — still shown if the device later
   *  drops off the table (back online). */
  deviceName: string
  cause: string
  photos: OutOfWarrantyPhoto[]
}

/** Every type's entries — the form keeps a set of pages per type, in that
 *  type's table order. */
export type OutOfWarrantyEntries = Partial<Record<OutOfWarrantyDeviceType, OutOfWarrantyEntry[]>>

const fileName = (url: string) => url.split(/[?#]/)[0].split('/').pop() || 'รูปภาพ'

/** The project's open records as the form's pages, per type. */
export const recordEntries = (records: readonly OutOfWarrantyRecord[]): OutOfWarrantyEntries => {
  const entries: OutOfWarrantyEntries = {}
  for (const record of records) {
    const list = (entries[record.device_type] ??= [])
    list.push({
      key: `record-${record.id}`,
      deviceId: recordDeviceId(record),
      deviceName: record.device_name?.trim() || '-',
      cause: record.inspection_result ?? '',
      photos: (record.images ?? []).filter(Boolean).map((url, index) => ({ uid: `record-${record.id}-${index}`, name: fileName(url), url })),
    })
  }
  return entries
}

/** The dropdown on open: the first type with something recorded, else CCTV. */
export const initialTypeKey = (saved: OutOfWarrantyEntries): OutOfWarrantyDeviceType =>
  OUT_OF_WARRANTY_TYPES.find((type) => saved[type.key]?.length)?.key ?? DEFAULT_OUT_OF_WARRANTY_TYPE

let entrySeq = 0

export const newEntry = (): OutOfWarrantyEntry => ({
  key: `entry-${++entrySeq}`,
  deviceId: null,
  deviceName: '',
  cause: '',
  photos: [],
})

/** Nothing filled in — dropped on บันทึก. */
export const isBlankEntry = (entry: OutOfWarrantyEntry): boolean =>
  !entry.deviceId && !entry.cause.trim() && entry.photos.length === 0

/** A device's ลำดับ in the table (1-based); null when it isn't there. */
export const deviceOrder = (devices: readonly OutOfWarrantyDevice[], deviceId: string | null): number | null => {
  if (!deviceId) return null
  const index = devices.findIndex((device) => device.id === deviceId)
  return index < 0 ? null : index + 1
}

/** Entries in table order, the not-yet-picked ones last in the order they
 *  were added — the right-hand pages run down the table. They are numbered
 *  1, 2, 3 like any pages (user 2026-11-16: the table's own ลำดับ, 1 and 4,
 *  read as pages missing); the table highlights the page's device. */
export const sortEntries = (
  entries: readonly OutOfWarrantyEntry[],
  devices: readonly OutOfWarrantyDevice[],
): OutOfWarrantyEntry[] =>
  entries
    .map((entry, index) => ({ entry, index, order: deviceOrder(devices, entry.deviceId) ?? Number.POSITIVE_INFINITY }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ entry }) => entry)

export interface EntriesState {
  entries: OutOfWarrantyEntry[]
  currentKey: string
}

/** A type's form when the modal opens: what was recorded, in table order, or
 *  one empty page. */
export const initialEntries = (
  saved: readonly OutOfWarrantyEntry[] | undefined,
  devices: readonly OutOfWarrantyDevice[] = [],
): EntriesState => {
  const entries = saved?.length
    ? sortEntries(saved.map((entry) => ({ ...entry, photos: [...entry.photos] })), devices)
    : [newEntry()]
  return { entries, currentKey: entries[0].key }
}

/** Something written on the page — a cause or a photo (a saved record
 *  always has both). */
const isWritten = (entry: OutOfWarrantyEntry): boolean => entry.cause.trim() !== '' || entry.photos.length > 0

/** The devices with something written for them — saved records and what
 *  was typed this time. Their ลำดับ in the table turns blue (user
 *  2026-11-16), and the dropdown counts them per type. */
export const filledDeviceIds = (entries: readonly OutOfWarrantyEntry[]): Set<string> =>
  new Set(entries.flatMap((entry) => (entry.deviceId && isWritten(entry) ? [entry.deviceId] : [])))

/** A table row was picked. What was written for one device never moves to
 *  another (user 2026-11-16: picking another row kept the cause and photos,
 *  and saving would have closed the first device's record and given its
 *  evidence to the second):
 *  - a device that has a page opens it — one page per device;
 *  - the page on screen takes the device while it has none (a cause typed
 *    first stays), or while nothing is written on it (a wrong pick swapped);
 *  - otherwise the device gets a page of its own, empty — the blank one
 *    waiting if there is one — and the page on screen keeps its device. */
export const pickDevice = (
  state: EntriesState,
  deviceId: string,
  devices: readonly OutOfWarrantyDevice[],
): EntriesState => {
  const owner = state.entries.find((entry) => entry.deviceId === deviceId)
  if (owner) return { entries: state.entries, currentKey: owner.key }
  const deviceName = devices.find((device) => device.id === deviceId)?.hostname ?? ''
  const current = state.entries.find((entry) => entry.key === state.currentKey)
  const target = current && (!current.deviceId || !isWritten(current))
    ? current
    : state.entries.find(isBlankEntry) ?? newEntry()
  const entries = state.entries.some((entry) => entry.key === target.key) ? state.entries : [...state.entries, target]
  return {
    entries: sortEntries(entries.map((entry) => (entry.key === target.key ? { ...entry, deviceId, deviceName } : entry)), devices),
    currentKey: target.key,
  }
}

/** + เพิ่มอุปกรณ์: a new page — or the empty one already waiting. */
export const addEntry = (state: EntriesState): EntriesState => {
  const blank = state.entries.find(isBlankEntry)
  if (blank) return { entries: state.entries, currentKey: blank.key }
  const entry = newEntry()
  return { entries: [...state.entries, entry], currentKey: entry.key }
}

/** ล้างข้อมูล: the page on screen goes back to empty. */
export const clearEntry = (state: EntriesState): EntriesState => ({
  entries: state.entries.map((entry) =>
    entry.key === state.currentKey ? { ...entry, deviceId: null, deviceName: '', cause: '', photos: [] } : entry,
  ),
  currentKey: state.currentKey,
})

/** A change to one entry, by key — a photo still shrinking when the user
 *  moves to another page must land on the page it was dropped on. */
export const updateEntry = (
  state: EntriesState,
  key: string,
  patch: (entry: OutOfWarrantyEntry) => Partial<Pick<OutOfWarrantyEntry, 'cause' | 'photos'>>,
): EntriesState => ({
  entries: state.entries.map((entry) => (entry.key === key ? { ...entry, ...patch(entry) } : entry)),
  currentKey: state.currentKey,
})

export interface EntryErrors {
  device?: boolean
  cause?: boolean
  photos?: boolean
}

/** What a filled-in entry still lacks — every field is required (the
 *  Figma's asterisks; a record saved without a photo elsewhere needs one
 *  before it is saved here again). */
export const entryErrors = (entry: OutOfWarrantyEntry): EntryErrors => {
  const errors: EntryErrors = {}
  if (!entry.deviceId) errors.device = true
  if (!entry.cause.trim()) errors.cause = true
  if (entry.photos.length === 0) errors.photos = true
  return errors
}

export const hasErrors = (errors: EntryErrors): boolean => !!(errors.device || errors.cause || errors.photos)

export type ValidationResult =
  | { ok: true; records: OutOfWarrantyEntries }
  | { ok: false; typeKey: OutOfWarrantyDeviceType; entryKey: string; errors: EntryErrors }

/** บันทึก: blank pages are dropped; the first incomplete one (in dropdown
 *  order) is where the form goes to show what is missing. Nothing filled in
 *  anywhere asks for a device on the page on screen — unless the project had
 *  records, which an empty save removes (`allowEmpty`). */
export const validateEntries = (
  all: OutOfWarrantyEntries,
  current: { typeKey: OutOfWarrantyDeviceType; entryKey: string },
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): ValidationResult => {
  const records: OutOfWarrantyEntries = {}
  for (const { key: typeKey } of OUT_OF_WARRANTY_TYPES) {
    const filled = (all[typeKey] ?? []).filter((entry) => !isBlankEntry(entry))
    for (const entry of filled) {
      const errors = entryErrors(entry)
      if (hasErrors(errors)) return { ok: false, typeKey, entryKey: entry.key, errors }
    }
    if (filled.length) records[typeKey] = filled
  }
  if (!allowEmpty && Object.keys(records).length === 0) {
    return { ok: false, typeKey: current.typeKey, entryKey: current.entryKey, errors: { device: true, cause: true, photos: true } }
  }
  return { ok: true, records }
}

/** How many devices recorded before this save leaves out — the PUT closes
 *  their records, so the user is asked first. */
export const droppedRecords = (saved: OutOfWarrantyEntries, records: OutOfWarrantyEntries): number => {
  const kept = new Set(OUT_OF_WARRANTY_TYPES.flatMap(({ key }) => (records[key] ?? []).map((entry) => `${key}:${entry.deviceId}`)))
  return OUT_OF_WARRANTY_TYPES.reduce(
    (sum, { key }) => sum + (saved[key] ?? []).filter((entry) => !kept.has(`${key}:${entry.deviceId}`)).length,
    0,
  )
}

/** One device of the save — what the PUT takes, its photos stored URLs or
 *  files still to upload. */
export interface RecordToSave {
  typeKey: OutOfWarrantyDeviceType
  entryKey: string
  cameraId?: string
  solutionId?: number
  inspectionResult: string
  photos: (string | File)[]
}

/** The PUT's list, in dropdown order then page order — so the item a 400
 *  names ("items[2]: …") leads back to its page. */
export const recordsToSave = (records: OutOfWarrantyEntries): RecordToSave[] =>
  OUT_OF_WARRANTY_TYPES.flatMap(({ key: typeKey }) =>
    (records[typeKey] ?? []).flatMap((entry): RecordToSave[] =>
      entry.deviceId
        ? [{
            typeKey,
            entryKey: entry.key,
            ...(typeKey === 'cctv' ? { cameraId: entry.deviceId } : { solutionId: Number(entry.deviceId) }),
            inspectionResult: entry.cause.trim(),
            photos: entry.photos.map((photo) => photo.file ?? photo.url),
          }]
        : [],
    ),
  )

/** The item a 400 is about — its message starts with it ("items[2]: …"). */
export const failedItem = (message: string | null | undefined, sent: readonly RecordToSave[]): RecordToSave | null => {
  const match = /items\[(\d+)\]/.exec(message ?? '')
  return match ? sent[Number(match[1])] ?? null : null
}
