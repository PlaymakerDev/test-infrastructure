"use client"
import React, { useMemo, useState } from 'react'
import { Checkbox, ConfigProvider, Input, Modal } from 'antd'
import { TbAlertCircle, TbEraser, TbSearch, TbTool } from 'react-icons/tb'

/** One pickable device row — projected from the detail table's rows
 *  (offline AND without an open case only). */
export interface OpenCaseDevice {
  cameraId: string
  name: string
  ip: string
  types: { label: string; color: string }[]
}

export interface OpenCaseProjectInfo {
  projectName: string
  contractor: string
  department: string
  contractNo: string
  warranty: 'ในค้ำ' | 'หมดค้ำ'
  warrantyRange: string
}

interface Props {
  open: boolean
  /** Row-level "+ เปิด Case" pre-ticks its device; the header button sends null. */
  preselectId: string | null
  devices: OpenCaseDevice[]
  project: OpenCaseProjectInfo
  submitting: boolean
  onClose: () => void
  onSubmit: (cameraIds: string[]) => void
}

/** Device-picker "เปิด Case" modal (2026-09-11 redesign) — replaces the old
 *  one-device white confirm dialog. Both the header "+ เปิด Case" and the
 *  per-row buttons open this; only the pre-selection differs.
 *
 *  ⚠ PENDING BE: the submit contract is `camera_ids[]` → ONE shared case_no.
 *  Until that endpoint lands, the screen's onSubmit loops the current
 *  per-camera POST (one case per device) — see handleOpenCaseSubmit there. */
const OpenCaseModal: React.FC<Props> = ({
  open,
  preselectId,
  devices,
  project,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')

  // Seed on every open (adjust-during-render — setState-in-effect trips the
  // react-compiler lint): row-button opens arrive with that row pre-ticked.
  const openKey = open ? `${preselectId ?? ''}` : ''
  const [prevOpenKey, setPrevOpenKey] = useState<string | null>(null)
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey)
    if (open) {
      setSelected(preselectId ? [preselectId] : [])
      setSearch('')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return devices
    return devices.filter(
      (d) => d.name.toLowerCase().includes(q) || d.ip.toLowerCase().includes(q),
    )
  }, [devices, search])

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const inWarranty = project.warranty === 'ในค้ำ'
  const accent = inWarranty ? '#66AEFF' : '#E94C4C'

  const infoRow = (label: string, value: React.ReactNode) => (
    <div className='fs-12'>
      <span style={{ color: '#979797' }}>{label} : </span>
      <span style={{ color: '#FFFFFF' }}>{value}</span>
    </div>
  )

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#FCD116' },
        components: {
          Modal: { contentBg: '#212121', headerBg: '#212121', colorIcon: '#FFFFFF', borderRadiusLG: 20 },
          Checkbox: { colorPrimary: '#FCD116', colorPrimaryHover: '#FCD116', colorText: '#FFFFFF' },
          Input: {
            colorBgContainer: 'transparent',
            colorText: '#FFFFFF',
            colorTextPlaceholder: '#8A8A8A',
            colorBorder: '#FCD116',
            activeBorderColor: '#FCD116',
            hoverBorderColor: '#FCD116',
          },
        },
      }}
    >
      <Modal
        open={open}
        onCancel={submitting ? undefined : onClose}
        footer={null}
        destroyOnHidden
        centered
        width={1320}
        title={null}
        styles={{ mask: { background: 'rgba(0,0,0,0.6)' } }}
      >
        {/* Header */}
        <div className='flex flex-col items-center pt-2 pb-4'>
          <TbAlertCircle size={64} color='#E94C4C' />
          <h2 className='mt-2' style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 700, margin: '8px 0 0' }}>
            ยืนยันเปิด Case อุปกรณ์นี้หรือไม่?
          </h2>
          <p className='fs-12' style={{ color: '#979797', margin: '4px 0 0' }}>
            ระบบจะออก Case No. ให้อัตโนมัติ
          </p>
        </div>

        {/* Project info — accent follows warranty state like the old dialog */}
        <div
          className='flex flex-col gap-1.5 px-5 py-4'
          style={{ borderRadius: 14, border: `2px solid ${accent}`, background: `${accent}1A` }}
        >
          {infoRow('ชื่อโครงการ', project.projectName)}
          {infoRow('ผู้รับจ้าง', project.contractor)}
          {infoRow('หน่วยงานรับผิดชอบ', project.department)}
          {infoRow('เลขที่สัญญา', project.contractNo)}
          {infoRow(
            'สถานะการค้ำประกัน',
            <span style={{ color: accent, fontWeight: 700 }}>{project.warranty}</span>,
          )}
          {infoRow('วันที่เริ่มต้น - สิ้นสุดการค้ำประกัน', project.warrantyRange)}
        </div>

        {/* Device picker */}
        <div className='mt-4 rounded-2xl p-4 md:p-5' style={{ background: '#191919' }}>
          <p style={{ color: '#FCD116', fontSize: 16, margin: 0 }}>เลือกอุปกรณ์ที่ต้องการเปิด case</p>

          <Input
            className='mt-3'
            placeholder='ค้นหาชื่ออุปกรณ์ หรือ IP Address...'
            style={{ borderRadius: 10, height: 40, maxWidth: 560 }}
            suffix={<TbSearch size={18} color='#FCD116' />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />

          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <button
              type='button'
              className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full fs-12 cursor-pointer hover:opacity-80'
              style={{ border: '1px solid #FCD116', color: '#FCD116', background: 'transparent' }}
              onClick={() => setSelected(devices.map((d) => d.cameraId))}
            >
              ✓ เลือกทั้งหมด
            </button>
            <span
              className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full fs-12'
              style={{ border: '1px solid #E94C4C', color: '#E94C4C' }}
            >
              <TbTool size={14} />
              {selected.length}
            </span>
            <button
              type='button'
              className='ml-auto inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full fs-12 cursor-pointer hover:opacity-80'
              style={{ border: '1px solid #C4C4C4', color: '#C4C4C4', background: 'transparent' }}
              onClick={() => setSelected([])}
            >
              <TbEraser size={14} />
              ล้างที่เลือก
            </button>
          </div>

          <div
            className='mt-3 grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-2 overflow-y-auto pr-1'
            style={{ maxHeight: 340 }}
          >
            {filtered.map((d) => {
              const checked = selected.includes(d.cameraId)
              return (
                <div
                  key={d.cameraId}
                  className='flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer'
                  style={{ background: '#2A2A2A', border: `1px solid ${checked ? '#FCD11655' : 'transparent'}` }}
                  onClick={() => toggle(d.cameraId)}
                >
                  <Checkbox checked={checked} onChange={() => toggle(d.cameraId)} onClick={(e) => e.stopPropagation()} />
                  <span className='fs-12 min-w-0 truncate' style={{ color: '#FFFFFF' }} title={d.name}>
                    {d.name}
                  </span>
                  <span className='fs-12 whitespace-nowrap' style={{ color: '#979797' }}>:</span>
                  <span className='fs-12 whitespace-nowrap' style={{ color: '#66AEFF' }}>{d.ip || '-'}</span>
                  <span className='ml-auto flex items-center gap-1.5 shrink-0'>
                    {d.types.map((t) => (
                      <span
                        key={t.label}
                        className='inline-flex items-center px-2 py-0.5 rounded-full whitespace-nowrap'
                        style={{ border: `1px solid ${t.color}`, color: t.color, fontSize: 12 }}
                      >
                        {t.label}
                      </span>
                    ))}
                  </span>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className='fs-12 col-span-full text-center py-6' style={{ color: '#979797', margin: 0 }}>
                {devices.length === 0 ? 'ไม่มีอุปกรณ์ออฟไลน์ที่ยังไม่มีเคส' : 'ไม่พบอุปกรณ์ที่ค้นหา'}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 mt-5'>
          <button
            type='button'
            className='px-6 py-2 rounded-full fs-12 cursor-pointer hover:opacity-90'
            style={{ background: '#C4C4C4', color: '#212121', border: 'none' }}
            disabled={submitting}
            onClick={onClose}
          >
            ยกเลิก
          </button>
          <button
            type='button'
            className='px-6 py-2 rounded-full fs-12 font-medium'
            style={{
              background: selected.length && !submitting ? '#FCD116' : '#5B5B5B',
              color: selected.length && !submitting ? '#212121' : '#B0B0B0',
              border: 'none',
              cursor: selected.length && !submitting ? 'pointer' : 'not-allowed',
            }}
            disabled={!selected.length || submitting}
            onClick={() => onSubmit(selected)}
          >
            {submitting ? 'กำลังเปิด Case...' : 'เปิด Case'}
          </button>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(OpenCaseModal)
