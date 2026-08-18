import { describe, expect, it } from 'vitest'
import { SETTINGS_TAB_OPTIONS, allowedSettingsTabs } from './tabs'

describe('settings tab permissions', () => {
  it('gives admin every tab', () => {
    expect(allowedSettingsTabs('admin')).toEqual(['PROJECT', 'ROUTE', 'CONTACT', 'USER'])
  })

  it('gives a general user nothing — the menu entry is hidden for them', () => {
    expect(allowedSettingsTabs('user')).toEqual([])
  })

  it('gives a contractor only โครงการ', () => {
    expect(allowedSettingsTabs('contractor')).toEqual(['PROJECT'])
  })

  it('falls back to the general-user set for an unresolved role', () => {
    expect(allowedSettingsTabs(null)).toEqual(allowedSettingsTabs('user'))
  })

  it('keeps the fallback empty so callers must gate on isResolved', () => {
    // A non-empty fallback would render a real section (and fire its queries)
    // before the role lands; an empty one only renders the no-access state,
    // which the screen suppresses until `isResolved`.
    expect(allowedSettingsTabs(null)).toHaveLength(0)
  })

  it('never permits a tab that has no option to render it', () => {
    const known = SETTINGS_TAB_OPTIONS.map((option) => option.value)
    for (const role of ['admin', 'user', 'contractor'] as const) {
      for (const tab of allowedSettingsTabs(role)) {
        expect(known).toContain(tab)
      }
    }
  })
})