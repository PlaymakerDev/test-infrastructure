import { describe, expect, it } from 'vitest'
import { PROJECT_DELETE_BLOCKED, projectErrorMessage } from './projectErrors'

// Shapes as the backend answers them (captured live 2026-10-02 / 09-26).
const axiosError = (status: number, data: unknown) => ({
  message: `Request failed with status code ${status}`,
  response: { status, data },
})

describe('projectErrorMessage', () => {
  it('a delete blocked by จุดติดตั้ง says to clear roads and points first', () => {
    const err = axiosError(400, {
      res_code: 40098,
      res_data: { message: 'ไม่สามารถลบโครงการได้ เนื่องจากยังมีจุดติดตั้งที่เชื่อมโยงอยู่ กรุณาลบจุดติดตั้งทั้งหมดก่อน แล้วจึงลบโครงการ' },
    })
    expect(projectErrorMessage(err, 'ลบโครงการไม่สำเร็จ')).toBe(PROJECT_DELETE_BLOCKED)
  })

  it('names the fields a validation error lists, not just "required"', () => {
    const err = axiosError(400, { res_code: 40010, res_data: { keys: ['project_no'], details: 'required' } })
    expect(projectErrorMessage(err, 'แก้ไขโครงการไม่สำเร็จ')).toBe('แก้ไขโครงการไม่สำเร็จ — ยังไม่ได้ระบุรหัสโครงการ')
    const two = axiosError(400, { res_code: 40010, res_data: { keys: ['project_no', 'contract_document'], details: 'required' } })
    expect(projectErrorMessage(two, 'แก้ไขโครงการไม่สำเร็จ')).toBe('แก้ไขโครงการไม่สำเร็จ — ยังไม่ได้ระบุรหัสโครงการ, เอกสารเชื่อมต่อระบบ')
    const unknownKey = axiosError(400, { res_code: 40010, res_data: { keys: ['foo'] } })
    expect(projectErrorMessage(unknownKey, 'x')).toBe('x — ยังไม่ได้ระบุfoo')
  })

  it("prefers the backend's message, then details, then axios's", () => {
    expect(projectErrorMessage(axiosError(400, { res_data: { message: 'ข้อความจาก BE' } }), 'f')).toBe('ข้อความจาก BE')
    expect(projectErrorMessage(axiosError(400, { res_data: { details: 'project_id params is required' } }), 'f')).toBe('project_id params is required')
    expect(projectErrorMessage(axiosError(500, {}), 'f')).toBe('Request failed with status code 500')
  })

  it('falls back when there is nothing to read', () => {
    expect(projectErrorMessage(null, 'ลบโครงการไม่สำเร็จ')).toBe('ลบโครงการไม่สำเร็จ')
    expect(projectErrorMessage({}, 'ลบโครงการไม่สำเร็จ')).toBe('ลบโครงการไม่สำเร็จ')
  })
})
