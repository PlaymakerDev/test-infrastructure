import { describe, expect, it } from 'vitest'
import { apiResponseFeatureUpdatesSchema } from './manage-feature-updates'

// The real production payload for /manage/feature-updates/lpr, captured
// 2026-09-24. Note the content's "\\n": a literal backslash + n, not a newline.
const LPR_ROW = {
  id: 2,
  feature: 'lpr',
  title: 'กำลังปรับปรุง',
  content: 'ขณะนี้ระบบอยู่ระหว่างการปรับปรุง\\nเพื่อเพิ่มประสิทธิภาพการให้บริการให้สะดวกและรวดเร็วยิ่งขึ้น',
  is_active: true,
  created_at: '2026-09-24T15:44:39.686869+07:00',
}

describe('apiResponseFeatureUpdatesSchema', () => {
  it('accepts the production LPR row', () => {
    expect(apiResponseFeatureUpdatesSchema.parse([LPR_ROW])).toEqual([LPR_ROW])
  })

  it('accepts the empty list returned for a key with nothing active', () => {
    expect(apiResponseFeatureUpdatesSchema.parse([])).toEqual([])
  })

  it('rejects a row missing its content', () => {
    const withoutContent: Partial<typeof LPR_ROW> = { ...LPR_ROW }
    delete withoutContent.content
    expect(apiResponseFeatureUpdatesSchema.safeParse([withoutContent]).success).toBe(false)
  })
})
