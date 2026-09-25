import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NOTICE_LINES,
  DEFAULT_NOTICE_TITLE,
  SYSTEM_FEATURE_KEY,
  groupNoticeMessages,
  parsePreviewTypes,
  systemOfPath,
  toNoticeLines,
} from './noticeRules'

describe('SYSTEM_FEATURE_KEY', () => {
  it('uses the menu URL segment — lpr is the key the backend set up first', () => {
    expect(SYSTEM_FEATURE_KEY.LPR).toBe('lpr')
    expect(SYSTEM_FEATURE_KEY.Counting).toBe('traffic-volume')
    expect(SYSTEM_FEATURE_KEY.WIM).toBe('tracking')
    expect(SYSTEM_FEATURE_KEY.Lighting).toBe('traffic-lighting')
  })
})

describe('systemOfPath', () => {
  it('matches a menu root and every page under it', () => {
    expect(systemOfPath('/admin/lpr')).toBe('LPR')
    expect(systemOfPath('/admin/lpr/detail/12')).toBe('LPR')
    expect(systemOfPath('/admin/cctv/search')).toBe('CCTV')
  })
  it('does not let a prefix claim a sibling menu', () => {
    expect(systemOfPath('/admin/vms-command-center')).toBeNull()
    expect(systemOfPath('/admin/control-vms')).toBeNull()
  })
  it('returns null outside the system menus', () => {
    expect(systemOfPath('/admin/dashboard')).toBeNull()
    expect(systemOfPath('/admin/maintenance')).toBeNull()
  })
})

describe('parsePreviewTypes', () => {
  it('accepts system or feature keys in any case, returns navbar order', () => {
    expect(parsePreviewTypes('lpr, VMS,tunnel')).toEqual(['VMS', 'Tunnel', 'LPR'])
    expect(parsePreviewTypes('traffic-volume')).toEqual(['Counting'])
  })
  it('ignores unknown keys and empty input', () => {
    expect(parsePreviewTypes('nope,,')).toEqual([])
    expect(parsePreviewTypes(null)).toEqual([])
  })
})

describe('toNoticeLines', () => {
  it('splits the literal "\\n" the production row carries', () => {
    // The real payload: "…ปรับปรุง\\nเพื่อ…" in JSON = a backslash + n in the string.
    expect(toNoticeLines('ขณะนี้ระบบอยู่ระหว่างการปรับปรุง\\nเพื่อเพิ่มประสิทธิภาพ')).toEqual([
      'ขณะนี้ระบบอยู่ระหว่างการปรับปรุง',
      'เพื่อเพิ่มประสิทธิภาพ',
    ])
  })
  it('splits real newlines and drops blank lines', () => {
    expect(toNoticeLines('a\r\n\nb\n')).toEqual(['a', 'b'])
    expect(toNoticeLines(undefined)).toEqual([])
  })
})

describe('groupNoticeMessages', () => {
  it('uses the backend title, and shows a title + text shared by several systems once', () => {
    const same = { title: 'กำลังปรับปรุง', content: 'ปิดปรับปรุง\\nชั่วคราว' }
    expect(groupNoticeMessages(['VMS', 'LPR'], { VMS: same, LPR: same })).toEqual([
      { systems: ['VMS', 'LPR'], title: 'กำลังปรับปรุง', lines: ['ปิดปรับปรุง', 'ชั่วคราว'] },
    ])
  })
  it('keeps different titles/texts apart and falls back to the defaults', () => {
    expect(groupNoticeMessages(['VMS', 'LPR'], { LPR: { title: ' ', content: 'เฉพาะ LPR' } })).toEqual([
      { systems: ['VMS'], title: DEFAULT_NOTICE_TITLE, lines: DEFAULT_NOTICE_LINES },
      { systems: ['LPR'], title: DEFAULT_NOTICE_TITLE, lines: ['เฉพาะ LPR'] },
    ])
  })
})
