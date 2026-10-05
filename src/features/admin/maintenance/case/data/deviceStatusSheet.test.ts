import { describe, expect, it } from 'vitest'
import type { CaseDetail } from '@/types/maintenance'
import { sheetPending, waitForDeviceStatusImages } from './deviceStatusSheet'

const SHEET = 'https://its.drr.go.th/its-media/images/maintenance/2026/10/05/sheet.jpg'
const detail = (status: string | null, images: string[] = []) =>
  ({ device_status_image: images, device_status_image_job: status ? { status } : null }) as unknown as CaseDetail
const noSleep = () => Promise.resolve()

describe('sheetPending', () => {
  it('waits only while a job is running', () => {
    expect(sheetPending({ status: 'pending' })).toBe(true)
    expect(sheetPending({ status: 'processing' })).toBe(true)
    expect(sheetPending({})).toBe(true)
    expect(sheetPending({ status: 'done' })).toBe(false)
    expect(sheetPending({ status: 'failed' })).toBe(false)
    expect(sheetPending({ status: 'error' })).toBe(false)
    expect(sheetPending(null)).toBe(false)
    expect(sheetPending(undefined)).toBe(false)
  })
})

describe('waitForDeviceStatusImages', () => {
  it('polls until the sheet is done, then hands back its image', async () => {
    const answers = [detail('pending'), detail('processing'), detail('done', [SHEET])]
    let calls = 0
    const result = await waitForDeviceStatusImages(async () => answers[Math.min(calls++, 2)], { sleep: noSleep })
    expect(result).toEqual({ images: [SHEET], state: 'done' })
    expect(calls).toBe(3)
  })

  it('does not wait when there is no job (old case / officer images)', async () => {
    let calls = 0
    const result = await waitForDeviceStatusImages(async () => { calls++; return detail(null, ['own.jpg']) }, { sleep: noSleep })
    expect(result).toEqual({ images: ['own.jpg'], state: 'none' })
    expect(calls).toBe(1)
  })

  it('reports a job that failed', async () => {
    const result = await waitForDeviceStatusImages(async () => detail('failed'), { sleep: noSleep })
    expect(result).toEqual({ images: [], state: 'failed' })
  })

  it('gives up at the timeout, keeping what it has', async () => {
    let calls = 0
    const slept: number[] = []
    const result = await waitForDeviceStatusImages(async () => { calls++; return detail('pending') }, {
      timeoutMs: 6_000,
      intervalMs: 2_000,
      sleep: async (ms) => { slept.push(ms) },
    })
    expect(result).toEqual({ images: [], state: 'timeout' })
    expect(calls).toBe(4) // t = 0, 2, 4, 6 s
    expect(slept).toEqual([2_000, 2_000, 2_000])
  })

  it('announces the wait once, and only when there is one', async () => {
    let waits = 0
    const onWaiting = () => { waits++ }
    const answers = [detail('pending'), detail('pending'), detail('done', [SHEET])]
    let calls = 0
    await waitForDeviceStatusImages(async () => answers[Math.min(calls++, 2)], { sleep: noSleep, onWaiting })
    expect(waits).toBe(1)
    await waitForDeviceStatusImages(async () => detail('done', [SHEET]), { sleep: noSleep, onWaiting })
    expect(waits).toBe(1)
  })

  it('rides out a failed request', async () => {
    let calls = 0
    const result = await waitForDeviceStatusImages(async () => {
      calls++
      if (calls === 1) throw new Error('network')
      return detail('done', [SHEET])
    }, { sleep: noSleep })
    expect(result).toEqual({ images: [SHEET], state: 'done' })
    expect(calls).toBe(2)
  })

  it('keeps the last good images when the case stops answering', async () => {
    let calls = 0
    const result = await waitForDeviceStatusImages(async () => {
      calls++
      if (calls === 1) return detail('pending', ['old.jpg'])
      throw new Error('network')
    }, { timeoutMs: 4_000, intervalMs: 2_000, sleep: noSleep })
    expect(result).toEqual({ images: ['old.jpg'], state: 'timeout' })
  })
})
