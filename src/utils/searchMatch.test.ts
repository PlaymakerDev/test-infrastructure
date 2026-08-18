import { describe, expect, it } from 'vitest'
import { isRoadCodeTerm, matchesSearchTerm } from './searchMatch'

// The reported case: ขทช.ลพบุรี's roads are ลบ.xxxx, ขทช.ลำพูน's are ลพ.xxxx.
const LOPBURI = {
  codes: ['ลบ.015', 'ลบ.015 กม.0+050 - กม.3+350'],
  text: ['ขทช.ลพบุรี', 'โครงการติดตั้งกล้อง CCTV', 'ขทช.ลบ./60/2568'],
}
const LAMPHUN = {
  codes: ['ลพ.3083', 'ลพ.3083 กม.0+600 - กม.10+550'],
  text: ['ขทช.ลำพูน', 'โครงการติดตั้งกล้อง CCTV', 'ขทช.ลพ./25/2569'],
}

describe('isRoadCodeTerm', () => {
  it('accepts road-code shaped terms', () => {
    expect(isRoadCodeTerm('ลพ')).toBe(true)
    expect(isRoadCodeTerm('ลพ.')).toBe(true)
    expect(isRoadCodeTerm('ลพ.30')).toBe(true)
    expect(isRoadCodeTerm(' ลพ.3083 ')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isRoadCodeTerm('ลพบุรี')).toBe(false) // has vowels → a bureau name
    expect(isRoadCodeTerm('ลำพูน')).toBe(false)
    expect(isRoadCodeTerm('ล')).toBe(false) // single letter stays a broad search
    expect(isRoadCodeTerm('ขทช.ลพบุรี')).toBe(false)
    expect(isRoadCodeTerm('3083')).toBe(false)
    expect(isRoadCodeTerm('cctv')).toBe(false)
    expect(isRoadCodeTerm('')).toBe(false)
  })
})

describe('matchesSearchTerm', () => {
  it('matches a road-code term against the road code only', () => {
    expect(matchesSearchTerm('ลพ', LAMPHUN)).toBe(true)
    expect(matchesSearchTerm('ลพ', LOPBURI)).toBe(false) // the reported bug
    expect(matchesSearchTerm('ลบ', LOPBURI)).toBe(true)
    expect(matchesSearchTerm('ลบ', LAMPHUN)).toBe(false)
  })

  it('narrows a road-code term by its digits', () => {
    expect(matchesSearchTerm('ลพ.30', LAMPHUN)).toBe(true)
    expect(matchesSearchTerm('ลพ.20', LAMPHUN)).toBe(false)
  })

  it('still finds the bureau by its full name', () => {
    expect(matchesSearchTerm('ลพบุรี', LOPBURI)).toBe(true)
    expect(matchesSearchTerm('ลพบุรี', LAMPHUN)).toBe(false)
    expect(matchesSearchTerm('ลำพูน', LAMPHUN)).toBe(true)
  })

  it('still matches project name, contract no and bare digits as substrings', () => {
    expect(matchesSearchTerm('cctv', LAMPHUN)).toBe(true)
    expect(matchesSearchTerm('25/2569', LAMPHUN)).toBe(true)
    expect(matchesSearchTerm('3083', LAMPHUN)).toBe(true)
    expect(matchesSearchTerm('กม.0+600', LAMPHUN)).toBe(true)
  })

  it('matches everything on an empty term and tolerates null fields', () => {
    expect(matchesSearchTerm('', LOPBURI)).toBe(true)
    expect(matchesSearchTerm('   ', LOPBURI)).toBe(true)
    expect(matchesSearchTerm('ลพ', { codes: [null, undefined], text: [null] })).toBe(false)
    expect(matchesSearchTerm('ลพบุรี', { codes: [null], text: [undefined, 'ขทช.ลพบุรี'] })).toBe(true)
  })
})
