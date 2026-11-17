import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import type { APIResponseOutOfWarrantyCandidates, OutOfWarrantyRecord } from '@/types/manage/device-status-api'
import {
  addEntry,
  candidateDevices,
  clearEntry,
  deviceOrder,
  droppedRecords,
  failedItem,
  filledDeviceIds,
  initialEntries,
  initialTypeKey,
  newEntry,
  OUT_OF_WARRANTY_TYPES,
  pickDevice,
  recordDevices,
  recordEntries,
  recordsToSave,
  sortEntries,
  updateEntry,
  validateEntries,
  type OutOfWarrantyDevice,
  type OutOfWarrantyEntry,
} from './outOfWarranty'

const device = (n: number): OutOfWarrantyDevice => ({
  id: `cam-${n}`,
  typeKey: 'cctv',
  hostname: `CAM-${n}`,
  ipAddress: `10.0.0.${n}`,
  offlineSince: '2026-11-01',
  offlineDays: 15,
})
const DEVICES = [1, 2, 3, 4, 5, 6, 7].map(device)
const photo = { uid: 'p1', name: 'a.jpg', url: 'https://its.drr.go.th/its-media/images/out_of_warranty/a.jpg' }
const filled = (deviceId: string, extra: Partial<OutOfWarrantyEntry> = {}): OutOfWarrantyEntry => ({
  ...newEntry(),
  deviceId,
  deviceName: deviceId,
  cause: 'รถชนเสา',
  photos: [photo],
  ...extra,
})

describe('the form pages — one per device, in table order', () => {
  it('a picked row fills the page on screen with its hostname', () => {
    const state = pickDevice(initialEntries(undefined), 'cam-3', DEVICES)
    expect(state.entries).toHaveLength(1)
    expect(state.entries[0]).toMatchObject({ deviceId: 'cam-3', deviceName: 'CAM-3' })
    expect(deviceOrder(DEVICES, 'cam-3')).toBe(3)
    expect(deviceOrder(DEVICES, null)).toBeNull()
  })

  it('a row already on another page opens that page instead of taking it twice', () => {
    let state = pickDevice(initialEntries(undefined), 'cam-2', DEVICES)
    const first = state.currentKey
    state = addEntry(state)
    state = pickDevice(state, 'cam-2', DEVICES)
    expect(state.currentKey).toBe(first)
    expect(state.entries.filter((entry) => entry.deviceId === 'cam-2')).toHaveLength(1)
  })

  it('another row after writing: a fresh page for it — the cause and photos stay with their own device', () => {
    let state = pickDevice(initialEntries(undefined), 'cam-1', DEVICES)
    const first = state.currentKey
    state = updateEntry(state, first, () => ({ cause: 'รถชนเสา', photos: [photo] }))
    state = pickDevice(state, 'cam-4', DEVICES)
    expect(state.entries.map((entry) => [entry.deviceId, entry.cause, entry.photos.length])).toEqual([
      ['cam-1', 'รถชนเสา', 1],
      ['cam-4', '', 0],
    ])
    expect(state.currentKey).not.toBe(first)
    expect(state.entries.find((entry) => entry.key === state.currentKey)?.deviceId).toBe('cam-4')
  })

  it('a saved record never moves to another device', () => {
    const saved = filled('cam-2')
    const state = pickDevice(initialEntries([saved], DEVICES), 'cam-5', DEVICES)
    expect(state.entries.map((entry) => entry.deviceId)).toEqual(['cam-2', 'cam-5'])
    expect(state.entries[0]).toEqual(saved)
    expect(state.entries[1]).toMatchObject({ cause: '', photos: [] })
  })

  it('a wrong pick with nothing written yet is swapped — no stray page', () => {
    let state = pickDevice(initialEntries(undefined), 'cam-1', DEVICES)
    state = pickDevice(state, 'cam-3', DEVICES)
    expect(state.entries.map((entry) => entry.deviceId)).toEqual(['cam-3'])
  })

  it('typed first, then picked: the device joins what was typed', () => {
    let state = initialEntries(undefined)
    state = updateEntry(state, state.currentKey, () => ({ cause: 'สายไฟขาด' }))
    state = pickDevice(state, 'cam-2', DEVICES)
    expect(state.entries).toHaveLength(1)
    expect(state.entries[0]).toMatchObject({ deviceId: 'cam-2', cause: 'สายไฟขาด' })
  })

  it('the empty page already waiting takes the new device rather than another page', () => {
    let state = pickDevice(initialEntries(undefined), 'cam-1', DEVICES)
    const first = state.currentKey
    state = updateEntry(state, first, () => ({ cause: 'รถชนเสา' }))
    state = addEntry(state)
    state = { ...state, currentKey: first }
    state = pickDevice(state, 'cam-3', DEVICES)
    expect(state.entries.map((entry) => entry.deviceId)).toEqual(['cam-1', 'cam-3'])
  })

  it('the devices with something written — saved or typed now — for the blue ลำดับ and the dropdown count', () => {
    let state = initialEntries([filled('cam-2')], DEVICES)
    state = pickDevice(state, 'cam-5', DEVICES)
    // picked, nothing written yet: not filled
    expect([...filledDeviceIds(state.entries)]).toEqual(['cam-2'])
    state = updateEntry(state, state.currentKey, () => ({ cause: 'สายไฟขาด' }))
    expect([...filledDeviceIds(state.entries)].sort()).toEqual(['cam-2', 'cam-5'])
    // a cause typed before any device is picked counts for no row
    expect(filledDeviceIds([{ ...newEntry(), cause: 'x' }]).size).toBe(0)
    // ล้างข้อมูล takes it off again
    expect([...filledDeviceIds(clearEntry(state).entries)]).toEqual(['cam-2'])
  })

  it('pages run in table order, the unpicked one last', () => {
    let state = pickDevice(initialEntries(undefined), 'cam-6', DEVICES)
    state = addEntry(state)
    state = pickDevice(state, 'cam-2', DEVICES)
    state = addEntry(state)
    // Pages 1, 2, 3 hold table rows 2, 6 and the one not yet picked.
    expect(state.entries.map((entry) => entry.deviceId)).toEqual(['cam-2', 'cam-6', null])
    expect(sortEntries([...state.entries].reverse(), DEVICES).map((entry) => entry.deviceId)).toEqual(['cam-2', 'cam-6', null])
  })

  it('+ เพิ่มอุปกรณ์ reuses the empty page instead of stacking blanks', () => {
    const state = addEntry(initialEntries(undefined))
    expect(state.entries).toHaveLength(1)
    const next = addEntry(pickDevice(state, 'cam-1', DEVICES))
    expect(next.entries).toHaveLength(2)
    expect(next.currentKey).toBe(next.entries[1].key)
  })

  it('ล้างข้อมูล empties the page on screen only', () => {
    let state = pickDevice(initialEntries(undefined), 'cam-1', DEVICES)
    state = updateEntry(state, state.currentKey, () => ({ cause: 'สายไฟขาด', photos: [photo] }))
    state = addEntry(state)
    state = pickDevice(state, 'cam-4', DEVICES)
    state = clearEntry(state)
    expect(state.entries[0]).toMatchObject({ deviceId: 'cam-1', cause: 'สายไฟขาด' })
    expect(state.entries[1]).toMatchObject({ deviceId: null, deviceName: '', cause: '', photos: [] })
  })

  it('a change lands on the page it was made on, whichever page is on screen by then', () => {
    let state = pickDevice(initialEntries(undefined), 'cam-1', DEVICES)
    const dropped = state.currentKey
    state = addEntry(state)
    state = updateEntry(state, dropped, (entry) => ({ photos: [...entry.photos, photo] }))
    expect(state.entries.find((entry) => entry.key === dropped)?.photos).toEqual([photo])
    expect(state.entries.find((entry) => entry.key === state.currentKey)?.photos).toEqual([])
  })

  it('reopening starts from what was recorded, in table order', () => {
    const saved = [filled('cam-5'), filled('cam-1')]
    const state = initialEntries(saved, DEVICES)
    expect(state.entries.map((entry) => entry.deviceId)).toEqual(['cam-1', 'cam-5'])
    expect(state.currentKey).toBe(saved[1].key)
  })
})

describe('บันทึก — every field required, blank pages dropped', () => {
  const current = { typeKey: 'cctv' as const, entryKey: 'x' }

  it('keeps the filled pages per type and drops the blank ones', () => {
    const result = validateEntries({ cctv: [filled('cam-1'), newEntry()], vms: [newEntry()], lighting: [filled('4891')] }, current)
    expect(result.ok).toBe(true)
    if (result.ok) expect(Object.keys(result.records)).toEqual(['cctv', 'lighting'])
  })

  it('points at the first incomplete page, in dropdown order, with what it lacks', () => {
    const noPhoto = filled('2881', { photos: [] })
    const noCause = filled('cam-2', { cause: '  ' })
    const result = validateEntries({ vms: [noPhoto], cctv: [filled('cam-1'), noCause] }, current)
    expect(result).toEqual({ ok: false, typeKey: 'cctv', entryKey: noCause.key, errors: { cause: true } })
    const vmsOnly = validateEntries({ vms: [noPhoto] }, current)
    expect(vmsOnly).toMatchObject({ ok: false, typeKey: 'vms', errors: { photos: true } })
  })

  it('nothing filled in anywhere asks for everything on the page on screen — unless that removes what was recorded', () => {
    expect(validateEntries({ cctv: [newEntry()] }, current)).toEqual({
      ok: false,
      typeKey: 'cctv',
      entryKey: 'x',
      errors: { device: true, cause: true, photos: true },
    })
    expect(validateEntries({ cctv: [newEntry()] }, current, { allowEmpty: true })).toEqual({ ok: true, records: {} })
  })

  it('counts the recorded devices a save leaves out — their records would close', () => {
    const saved = { cctv: [filled('cam-1'), filled('cam-2')], vms: [filled('2881')] }
    expect(droppedRecords(saved, { cctv: [filled('cam-2'), filled('cam-3')], vms: [filled('2881')] })).toBe(1)
    expect(droppedRecords(saved, {})).toBe(3)
    expect(droppedRecords({}, { cctv: [filled('cam-1')] })).toBe(0)
  })
})

describe('the API', () => {
  const now = dayjs('2026-11-16T12:00:00+07:00')
  const base = {
    solution_id: 462,
    solution_name: 'กส.4036 จุดที่ 1',
    sta: '19+400',
    ip_address: '11.0.14.176',
    is_online: false,
    offline_since: '2026-09-18T15:01:03.45814+07:00',
    is_out_of_warranty: false,
    record_id: null,
  }
  const candidates = {
    cctv: [
      { ...base, camera_id: 'c-off', camera_name: 'จุดติดตั้งที่ 7 CAM-F13 RT <ขาออก>' },
      { ...base, camera_id: 'c-on', camera_name: 'กล้องออนไลน์', is_online: true, offline_since: null },
      // Back online, its record not yet closed: still listed.
      { ...base, camera_id: 'c-rec', camera_name: 'กล้องที่บันทึกไว้', is_online: true, offline_since: null, is_out_of_warranty: true, record_id: 9 },
    ],
    vms: [{ ...base, solution_id: 2881, solution_name: 'VMS >> ฉช.4050 จุดที่ 1', offline_since: '0001-01-01T00:00:00Z' }],
    lighting: [{ ...base, solution_id: 4891, solution_name: 'ฉช.4050 ตู้ที่ 1 กม.0+600', ip_address: '' }],
    traffic: null,
    bridge_lighting: [],
    // Since BE 2026-11-17; a backend from before sends no tunnel at all.
    crosswalk: [{ ...base, solution_id: 7012, solution_name: 'Crosswalk >> ฉช.4050 หน้าโรงเรียน', ip_address: '10.1.2.3' }],
  } as unknown as APIResponseOutOfWarrantyCandidates

  it('offers the seven types the backend records, CCTV first, in the rings’ order (Crosswalk and Tunnel since 2026-11-17)', () => {
    expect(OUT_OF_WARRANTY_TYPES.map((type) => [type.key, type.label])).toEqual([
      ['cctv', 'CCTV'],
      ['vms', 'VMS'],
      ['lighting', 'Street Light'],
      ['traffic', 'Traffic Signal'],
      ['bridge_lighting', 'Bridge Lighting'],
      ['crosswalk', 'Crosswalk'],
      ['tunnel', 'Tunnel'],
    ])
  })

  it('the table: offline cameras (and a recorded one), the systems by solution — days counted from offline_since', () => {
    const devices = candidateDevices(candidates, now)
    expect(devices.cctv.map((item) => item.id)).toEqual(['c-off', 'c-rec'])
    expect(devices.cctv[0]).toEqual({
      id: 'c-off',
      typeKey: 'cctv',
      hostname: 'จุดติดตั้งที่ 7 CAM-F13 RT <ขาออก>',
      ipAddress: '11.0.14.176',
      offlineSince: '2026-09-18T15:01:03.45814+07:00',
      offlineDays: 58,
    })
    // Go's zero time is no date.
    expect(devices.vms[0]).toMatchObject({ id: '2881', offlineSince: null, offlineDays: null })
    expect(devices.lighting[0]).toMatchObject({ id: '4891', ipAddress: '' })
    expect(devices.traffic).toEqual([])
    expect(devices.bridge_lighting).toEqual([])
    expect(devices.crosswalk).toEqual([expect.objectContaining({ id: '7012', typeKey: 'crosswalk', hostname: 'Crosswalk >> ฉช.4050 หน้าโรงเรียน', ipAddress: '10.1.2.3' })])
    expect(devices.tunnel).toEqual([])
  })

  const record = (over: Partial<OutOfWarrantyRecord>): OutOfWarrantyRecord => ({
    id: 1,
    project_id: 420,
    device_type: 'cctv',
    camera_id: 'c-off',
    solution_id: null,
    device_name: 'จุดติดตั้งที่ 7 CAM-F13 RT <ขาออก>',
    ip_address: '11.0.14.176',
    sta: '19+400',
    is_online: false,
    inspection_result: 'รถชนเสากล้อง',
    images: ['https://its.drr.go.th/its-media/images/out_of_warranty/2026/11/16/a.jpg'],
    offline_since: '2026-09-18T15:01:03+07:00',
    created_at: '2026-11-16T10:00:00+07:00',
    created_by: 'u',
    created_by_name: 'กรมทางหลวงชนบท',
    updated_at: null,
    updated_by: null,
    ...over,
  })
  const records = [
    record({}),
    record({ id: 2, device_type: 'vms', camera_id: null, solution_id: 2881, device_name: 'VMS >> ฉช.4050 จุดที่ 1', images: [] }),
    record({ id: 3, device_type: 'tunnel', camera_id: null, solution_id: 5120, device_name: 'อุโมงค์ทางลอด นม.1001', images: [] }),
  ]

  it('the records become the form’s pages, per type, photos by their URLs', () => {
    const entries = recordEntries(records)
    expect(entries.cctv).toEqual([{
      key: 'record-1',
      deviceId: 'c-off',
      deviceName: 'จุดติดตั้งที่ 7 CAM-F13 RT <ขาออก>',
      cause: 'รถชนเสากล้อง',
      photos: [{ uid: 'record-1-0', name: 'a.jpg', url: 'https://its.drr.go.th/its-media/images/out_of_warranty/2026/11/16/a.jpg' }],
    }])
    expect(entries.vms?.[0]).toMatchObject({ deviceId: '2881', photos: [] })
    // Opens on the first type with a record.
    expect(initialTypeKey(entries)).toBe('cctv')
    expect(initialTypeKey({ vms: entries.vms })).toBe('vms')
    expect(initialTypeKey({})).toBe('cctv')
  })

  it('a role-user account’s table: the recorded devices themselves', () => {
    const devices = recordDevices(records, now)
    expect(devices.cctv.map((item) => [item.id, item.hostname, item.offlineDays])).toEqual([['c-off', 'จุดติดตั้งที่ 7 CAM-F13 RT <ขาออก>', 58]])
    expect(devices.vms.map((item) => item.id)).toEqual(['2881'])
    expect(devices.tunnel.map((item) => [item.id, item.typeKey, item.hostname])).toEqual([['5120', 'tunnel', 'อุโมงค์ทางลอด นม.1001']])
    expect(devices.lighting).toEqual([])
    expect(devices.crosswalk).toEqual([])
  })

  it('the PUT’s list: camera_id for a camera, solution_id for the rest, in dropdown then page order; a 400 leads back to its page', () => {
    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' })
    const newPhoto = { uid: 'n', name: 'b.jpg', url: 'blob:x', file }
    const sent = recordsToSave({
      tunnel: [filled('5120', { cause: 'น้ำท่วมตู้ควบคุม' })],
      lighting: [filled('4891', { cause: ' สายไฟถูกขโมย ' })],
      cctv: [filled('c-off', { photos: [photo, newPhoto] })],
    })
    expect(sent.map(({ typeKey, cameraId, solutionId, inspectionResult }) => ({ typeKey, cameraId, solutionId, inspectionResult }))).toEqual([
      { typeKey: 'cctv', cameraId: 'c-off', solutionId: undefined, inspectionResult: 'รถชนเสา' },
      { typeKey: 'lighting', cameraId: undefined, solutionId: 4891, inspectionResult: 'สายไฟถูกขโมย' },
      { typeKey: 'tunnel', cameraId: undefined, solutionId: 5120, inspectionResult: 'น้ำท่วมตู้ควบคุม' },
    ])
    expect(sent[0].photos).toEqual([photo.url, file])
    expect(failedItem('items[1]: device 4891 is online', sent)).toBe(sent[1])
    expect(failedItem('bad request', sent)).toBeNull()
    expect(failedItem('items[7]: …', sent)).toBeNull()
  })
})
