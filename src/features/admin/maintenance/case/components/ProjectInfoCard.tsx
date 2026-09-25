"use client"
import React from 'react'
import type { CaseProjectInfo } from './caseViewTypes'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

interface Props {
  project: CaseProjectInfo
  /** Optional control pinned top-right (contractor view's ข้อมูลอุปกรณ์ button). */
  headerExtra?: React.ReactNode
}

const Item: React.FC<{ icon: string; label: string; value: React.ReactNode; valueColor?: string }> = ({
  icon,
  label,
  value,
  valueColor = '#FFFFFF',
}) => (
  <div className='flex flex-col items-center min-w-0'>
    <img src={`${BASE_PATH}/images/Maintenance/${icon}`} alt='' width={28} height={28} style={{ marginBottom: 8 }} />
    <p className='text-center' style={{ color: '#979797', fontSize: 'var(--fs-12)', margin: 0 }}>{label}</p>
    <p className='text-center wrap-break-word' style={{ color: valueColor, fontSize: 'var(--fs-12)', margin: '4px 0 0' }}>{value}</p>
  </div>
)

/** ข้อมูลโครงการ card (2026-09-11 redesign) — horizontal icon layout shared by
 *  both role views of the case page. */
const ProjectInfoCard: React.FC<Props> = ({ project, headerExtra }) => (
  // @container, not viewport breakpoints: the same card is ~950px wide in the
  // officer layout but only ~420px in the contractor one, where six columns
  // squeezed "หน่วยงานรับผิดชอบ" into three wrapped lines.
  <div className='@container rounded-2xl p-4 md:p-6' style={{ background: '#191919' }}>
    <div className='flex items-start gap-2'>
      <img src={`${BASE_PATH}/images/Maintenance/icf1.png`} alt='' width={28} height={28} />
      <p style={{ color: '#66AEFF', fontSize: 16, margin: 0, marginTop: 2 }}>ข้อมูลโครงการ</p>
      {headerExtra && <div className='ml-auto'>{headerExtra}</div>}
    </div>
    <p style={{ color: '#B2D6F0', fontSize: 'var(--fs-12)', margin: '10px 0 0' }}>{project.projectName}</p>
    <div className='mt-4 grid grid-cols-2 @xs:grid-cols-3 @3xl:grid-cols-6 gap-4'>
      <Item icon='icsc1.png' label='ผู้รับจ้าง' value={project.contractor} />
      <Item icon='icsc2.png' label='หน่วยงานรับผิดชอบ' value={project.agency} />
      <Item icon='icsc3.png' label='เลขที่สัญญา' value={project.contractNo} />
      <Item icon='icsc1.png' label='เริ่มต้นการรับประกัน' value={project.warrantyStart} />
      <Item icon='icsc2.png' label='สิ้นสุดการรับประกัน' value={project.warrantyEnd} />
      <Item
        icon='icsc3.png'
        label='สถานะค้ำประกัน'
        value={project.warrantyStatus === 'expired' ? 'หมดค้ำ' : 'ในค้ำ'}
        valueColor={project.warrantyStatus === 'expired' ? '#E94C4C' : '#66AEFF'}
      />
    </div>
  </div>
)

export default React.memo<Props>(ProjectInfoCard)
