import { describe, expect, it } from 'vitest'
import {
  TRACKING_TAB_OPTIONS,
  allowedTrackingContentTabs,
  allowedTrackingTabs,
} from './tabs'

describe('tracking tab permissions', () => {
  it('gives admin every tab', () => {
    expect(allowedTrackingTabs('admin')).toEqual([
      'OVERALL',
      'STATION',
      'WIM',
      'MOBILE',
      'TRACK_GPS',
    ])
  })

  it('hides ติดตาม GPS from a general user', () => {
    expect(allowedTrackingTabs('user')).toEqual(['OVERALL', 'STATION', 'WIM', 'MOBILE'])
  })

  it('gives a contractor only WIM', () => {
    expect(allowedTrackingTabs('contractor')).toEqual(['WIM'])
  })

  it('falls back to the general-user set for an unresolved role', () => {
    expect(allowedTrackingTabs(null)).toEqual(allowedTrackingTabs('user'))
  })

  it('drops TRACK_GPS from the content tabs — it navigates away instead', () => {
    expect(allowedTrackingContentTabs('admin')).toEqual(['OVERALL', 'STATION', 'WIM', 'MOBILE'])
    expect(allowedTrackingContentTabs('contractor')).toEqual(['WIM'])
  })

  it('never permits a tab that has no option to render it', () => {
    const known = TRACKING_TAB_OPTIONS.map((option) => option.value)
    for (const role of ['admin', 'user', 'contractor'] as const) {
      for (const tab of allowedTrackingTabs(role)) {
        expect(known).toContain(tab)
      }
    }
  })
})