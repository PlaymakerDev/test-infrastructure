import { describe, expect, it } from 'vitest'
import { toHttpUrl } from './httpUrl'

describe('toHttpUrl', () => {
  it('keeps absolute http(s) URLs as entered, trimmed', () => {
    expect(toHttpUrl('https://cam.example.com/view?id=22')).toBe('https://cam.example.com/view?id=22')
    expect(toHttpUrl('  http://10.52.7.5:8080/  ')).toBe('http://10.52.7.5:8080/')
  })

  it('rejects empty values', () => {
    expect(toHttpUrl(undefined)).toBeNull()
    expect(toHttpUrl(null)).toBeNull()
    expect(toHttpUrl('')).toBeNull()
    expect(toHttpUrl('   ')).toBeNull()
  })

  it('rejects anything that is not an absolute http(s) URL', () => {
    expect(toHttpUrl('javascript:alert(1)')).toBeNull()
    expect(toHttpUrl('ftp://cam.example.com')).toBeNull()
    expect(toHttpUrl('cam.example.com/view')).toBeNull()
    expect(toHttpUrl('/atlas/admin/cctv')).toBeNull()
    expect(toHttpUrl('https://')).toBeNull()
  })
})
