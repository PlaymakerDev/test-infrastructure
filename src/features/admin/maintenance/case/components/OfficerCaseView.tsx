"use client"
import React from 'react'
import { Empty, Image } from 'antd'
import dayjs from 'dayjs'
import { TbDownload, TbExternalLink, TbFileText, TbPrinter, TbTool } from 'react-icons/tb'
import styles from '../screen/maintenance-case.module.css'
import TitleSection from './TitleSection'
import ProjectInfoCard from './ProjectInfoCard'
import CaseDeviceTable from './CaseDeviceTable'
import { deviceSummary, type CaseDeviceRow, type CaseProjectInfo } from './caseViewTypes'
import type { CaseDetail } from '@/types/maintenance'
import { parseImageUrls } from '../../data/parseImageUrls'
import { caseStatusMeta } from '../../data/caseStatus'
import { contractorProblem, isContractorFilled } from '../../data/contractorProblem'
import { downloadRemoteFile } from '@/utils/export/image'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export interface OfficerCaseViewProps {
  caseId: string
  caseData: CaseDetail
  project: CaseProjectInfo
  devices: CaseDeviceRow[]
  solutionId?: number
  detailQuery: string
  returnToAllRepairs: boolean
  returnToRepairHistory?: boolean
  /** Link target for ไปยังหน้าเว็บ (the owning detail page). */
  onGoToDetail: () => void
  onExportLetter: () => void | Promise<void>
}

/** มุมมองเจ้าหน้าที่สำหรับเคสที่มีอยู่แล้ว (mock 4/5, 2026-09-11 redesign) —
 *  READ-ONLY per the user: the letter was issued when the case was created
 *  (the editable form lives on the /case/new creation page), so this page
 *  only TRACKS: status pill, the two dates, the letter download (orange), and
 *  the contractor's repair data once it lands.
 *
 *  What it deliberately does NOT show (user 2026-09-21): the letter's own text
 *  and its device-status sheet — those belong to the PDF, not this page. */
const OfficerCaseView: React.FC<OfficerCaseViewProps> = ({
  caseId,
  caseData,
  project,
  devices,
  solutionId,
  detailQuery,
  returnToAllRepairs,
  returnToRepairHistory,
  onGoToDetail,
  onExportLetter,
}) => {
  const contractorFilled = isContractorFilled(caseData)
  const statusMeta = caseStatusMeta(caseData.status, caseData.closed_at)

  const beforeImages = parseImageUrls(caseData.before_image)
  const afterImages = parseImageUrls(caseData.after_image)

  const labelStyle: React.CSSProperties = { color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }

  const readonlyDate = (value: string) => (
    <div
      className='flex items-center px-3'
      style={{ height: 40, borderRadius: 10, background: '#2A2A2A', color: '#C9C9C9', fontSize: 'var(--fs-12)' }}
    >
      {value || '-'}
    </div>
  )

  /** ก่อน/หลังซ่อม thumbnails. Clicking opens AntD's lightbox — the officer
   *  needs to actually inspect the evidence, and from there keep a copy, so a
   *  ดาวน์โหลด action is added to the toolbar (AntD ships none). Videos/PDFs
   *  can't preview, so those tiles stay plain links. */
  const photoGrid = (urls: string[]) => (
    <Image.PreviewGroup
      preview={{
        actionsRender: (originalNode, info) => {
          // Append to AntD's own actions bar (rather than sitting beside it)
          // so the download reads as one more toolbar button; borrowing the
          // action class keeps it styled by AntD's own rules.
          const bar = originalNode as React.ReactElement<{ children?: React.ReactNode }>
          return React.cloneElement(bar, undefined, (
            <>
              {bar.props.children}
              <button
                type='button'
                className='ant-image-preview-actions-action'
                title='ดาวน์โหลด'
                aria-label='ดาวน์โหลด'
                onClick={() => void downloadRemoteFile(info.image.url)}
              >
                <TbDownload size={18} />
              </button>
            </>
          ))
        },
      }}
    >
      <div className='mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2'>
        {urls.map((url, i) =>
          /\.(jpe?g|png|gif)$/i.test(url) ? (
            <Image
              key={i}
              src={url}
              alt=''
              // `preview.cover`, not the old `preview.mask`: AntD 6 only reads
              // mask as an element/object, so a plain string was dropped
              // silently and the tile gave no hint it could be opened.
              preview={{ cover: 'ดูภาพ' }}
              classNames={{ root: 'w-full block rounded-lg overflow-hidden' }}
              className='w-full'
              style={{ aspectRatio: '4/3', objectFit: 'cover' }}
            />
          ) : (
            <a
              key={i}
              href={url}
              target='_blank'
              rel='noreferrer'
              className='w-full rounded-lg flex items-center justify-center'
              style={{ aspectRatio: '4/3', background: '#2A2A2A' }}
            >
              <TbFileText size={32} color='#FCD116' />
            </a>
          ),
        )}
      </div>
    </Image.PreviewGroup>
  )

  return (
    <>
      <TitleSection
        caseId={caseId}
        solutionId={solutionId}
        detailQuery={detailQuery}
        returnToAllRepairs={returnToAllRepairs}
        returnToRepairHistory={returnToRepairHistory}
        subtitle={deviceSummary(devices)}
        warranty={project.warrantyStatus === 'expired' ? 'หมดค้ำ' : 'ในค้ำ'}
        isOnline={devices.length > 0 && devices.every(d => d.isOnline)}
        rightContent={
          <>
            <span
              className='inline-flex items-center px-4 py-1 rounded-full fs-12 whitespace-nowrap'
              style={{ border: `1px solid ${statusMeta.color}`, color: statusMeta.color }}
            >
              {statusMeta.label}
            </span>
            <button
              type='button'
              className={styles.btnSecondary}
              style={{ background: '#FF8A00', color: '#212121', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={onExportLetter}
            >
              <TbPrinter size={16} />
              หนังสือแจ้งซ่อม
            </button>
          </>
        }
      />

      {/* No items-start: the two columns must end on the same line (user
          2026-09-21). Stretch gives both the row height, then the device
          table on the left and the repair report on the right each grow to
          fill their own column, whichever side happens to be taller. */}
      <section className='mt-4 px-4 md:px-10 flex flex-col xl:flex-row gap-4'>
        {/* Left: project + device table */}
        <div className='w-full xl:flex-[0_0_46%] flex flex-col gap-4'>
          <ProjectInfoCard project={project} />
          <div className='rounded-2xl p-4 md:p-6 grow' style={{ background: '#191919' }}>
            <div className='flex items-center gap-2'>
              <TbTool size={22} color='#66AEFF' />
              <p style={{ color: '#66AEFF', fontSize: 16, margin: 0 }}>ข้อมูลอุปกรณ์</p>
              <span
                className='ml-auto inline-flex items-center gap-1 px-3 py-0.5 rounded-full'
                style={{ border: '1px solid #E94C4C', color: '#E94C4C', fontSize: 12 }}
              >
                <TbTool size={12} />
                {devices.length}
              </span>
              <button
                type='button'
                className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full fs-12 cursor-pointer hover:opacity-85'
                style={{ background: '#66AEFF', color: '#0A0A0A', border: 'none' }}
                onClick={onGoToDetail}
              >
                <TbExternalLink size={14} />
                ไปยังหน้าเว็บ
              </button>
            </div>
            <div className='mt-4'>
              <CaseDeviceTable rows={devices} />
            </div>
          </div>
        </div>

        {/* Right: tracking (read-only) */}
        <div className='w-full xl:flex-1 rounded-2xl p-4 md:p-6 flex flex-col' style={{ background: '#191919' }}>
          <div className='flex items-start gap-2'>
            <img src={`${BASE_PATH}/images/Maintenance/iccf.png`} alt='' width={30} height={30} />
            <div>
              <p style={{ color: '#FCD116', fontSize: 16, margin: 0 }}>ติดตามสถานะการแจ้งซ่อม</p>
              <p style={{ color: '#979797', fontSize: 'var(--fs-12)', margin: 0, marginTop: -4 }}>
                เพิ่มข้อมูลที่ใช้ในการออกหนังสือแจ้งซ่อมไปยังผู้รับจ้าง
              </p>
            </div>
          </div>

          {/* Section headings carry their gap inline: the `mt-*` class they
              used to rely on was cancelled by this same `margin: 0`, so both
              headings sat flush against the block above them. */}
          <p style={{ color: '#FFFFFF', fontSize: 16, margin: '24px 0 0 0' }}>ระยะเวลาในการซ่อมแซมอุปกรณ์</p>
          <div className='mt-4 flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              {/* The date the officer put ON the letter (`document_date`), which
                  can be back-dated; created_at is only the fallback for cases
                  opened before that field existed. */}
              <p style={labelStyle}>ลงวันที่แจ้งซ่อม</p>
              {readonlyDate(dayjs(caseData.document_date || caseData.created_at).format('DD MMM BBBB'))}
            </div>
            <div className='flex-1'>
              {/* กำหนดแล้วเสร็จ = the due date the officer set on the letter
                * (backend `due_date`, live since 2026-09-16; it defaults to
                * created_at + 7 days when the letter left it empty). */}
              <p style={labelStyle}>ลงวันที่ดำเนินการแล้วเสร็จ</p>
              {readonlyDate(caseData.due_date ? dayjs(caseData.due_date).format('DD MMM BBBB') : '-')}
            </div>
          </div>

          <p style={{ color: '#FFFFFF', fontSize: 16, margin: '24px 0 0 0' }}>ข้อมูลการแจ้งซ่อม</p>
          {/* Everything under here is the CONTRACTOR's report, so the whole
              block waits for them — an officer tracking a case they just
              opened sees the empty state, per the Figma (user 2026-09-21).
              Their own เหตุผลการแจ้งซ่อม lives in the letter, not on this page. */}
          <div className='mt-4 flex flex-col gap-4 grow'>
            {contractorFilled && (
              <div>
                <p style={labelStyle}>ปัญหาที่พบ</p>
                {/* The contractor's own field, NOT the officer's เหตุผลการแจ้งซ่อม
                    (`problem`) — those two shared one column until 2026-09-21. */}
                <div className='rounded-xl px-4 py-3 fs-12' style={{ background: '#2A2A2A', color: '#E6E6E6', whiteSpace: 'pre-wrap' }}>
                  {contractorProblem(caseData) || '-'}
                </div>
              </div>
            )}
            {beforeImages.length > 0 && (
              <div>
                <p style={labelStyle}>รูปภาพวิดีโอก่อนซ่อม</p>
                {photoGrid(beforeImages)}
              </div>
            )}
            {!contractorFilled ? (
              <div className='rounded-xl py-14 flex items-center justify-center grow' style={{ background: '#212121' }}>
                <Empty description={<span style={{ color: '#979797' }}>ผู้รับจ้างยังไม่บันทึกผลการซ่อม</span>} />
              </div>
            ) : (
              <>
                <div>
                  <p style={labelStyle}>การดำเนินการหรือวิธีการแก้ไข</p>
                  <div className='rounded-xl px-4 py-3 fs-12' style={{ background: '#2A2A2A', color: '#E6E6E6', whiteSpace: 'pre-wrap' }}>
                    {caseData.solution_method || '-'}
                  </div>
                </div>
                {afterImages.length > 0 && (
                  <div>
                    <p style={labelStyle}>รูปภาพวิดีโอหลังซ่อม</p>
                    {photoGrid(afterImages)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default React.memo<OfficerCaseViewProps>(OfficerCaseView)
