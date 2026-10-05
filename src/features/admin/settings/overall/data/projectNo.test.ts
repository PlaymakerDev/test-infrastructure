import { describe, expect, it } from 'vitest'
import { NO_PROJECT_NO, projectNoForForm, projectNoForSave } from './projectNo'

describe('optional รหัสโครงการ', () => {
  it('saves what was typed, trimmed', () => {
    expect(projectNoForSave('MT26055')).toBe('MT26055')
    expect(projectNoForSave('  TS26068 ')).toBe('TS26068')
  })

  it('saves the stand-in when nothing was typed — the PUT refuses an empty one', () => {
    expect(projectNoForSave('')).toBe(NO_PROJECT_NO)
    expect(projectNoForSave('   ')).toBe(NO_PROJECT_NO)
    expect(projectNoForSave(null)).toBe(NO_PROJECT_NO)
    expect(projectNoForSave(undefined)).toBe(NO_PROJECT_NO)
  })

  it('shows the stand-in (and nothing at all) as an empty field', () => {
    expect(projectNoForForm('-')).toBe('')
    expect(projectNoForForm(' - ')).toBe('')
    expect(projectNoForForm('')).toBe('')
    expect(projectNoForForm(null)).toBe('')
    expect(projectNoForForm('MT26055')).toBe('MT26055')
  })

  it('round-trips: an empty field stays empty, a code stays the code', () => {
    expect(projectNoForForm(projectNoForSave(''))).toBe('')
    expect(projectNoForForm(projectNoForSave('fmi-0006'))).toBe('fmi-0006')
  })
})
