"use client"
import { Button, ConfigProvider, Empty, Timeline } from 'antd'
import React, { useState } from 'react'
import TimelineCard from './TimelineCard'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useLicenseContext } from '../../../context'
import { TbPrinter } from 'react-icons/tb'
import type { PdfReportBlock } from '@/utils/export/pdf'

const STAT_ITEMS = [
  { label: 'ประเภทป้ายทะเบียน', value: 'รถยนต์ส่วนบุคคล' },
  { label: 'ประเภทยานพาหนะ', value: 'รถยนต์' },
  { label: 'ยี่ห้อ', value: 'Toyota (Vios)' },
  { label: 'สียานพาหนะ', value: 'ขาว' },
]

const TimelineSection: React.FC = () => {
  const { license } = useLicenseContext()
  const timeline = license.timeline ?? []

  // ── Export (PDF only — timeline report, no Excel per spec) ────────────────
  const [exportOpen, setExportOpen] = useState(false)

  // Exports the timeline the screen shows as photo cards mirroring
  // TimelineCard (same field strings). Images are pre-fetched and re-encoded
  // (utils/export/image.ts); any image that fails renders its card photo-less.
  // Mirrors lpr/overall/sections/license/TimelineSection.tsx.
  const handleExportPdf = async () => {
    const [{ exportReportPdf }, { fetchImageAsDataUrl }] = await Promise.all([
      import('@/utils/export/pdf'),
      import('@/utils/export/image'),
    ])
    const images = await Promise.all(timeline.map((it) => fetchImageAsDataUrl(it.image)))

    const blocks: PdfReportBlock[] = [
      {
        type: 'kv',
        title: 'ข้อมูลทะเบียน',
        items: [
          { label: 'เลขทะเบียน', value: license.license_no || '-' },
          { label: 'จังหวัด', value: license.license_province || '-' },
          { label: 'ประเภทป้ายทะเบียน', value: license.license_type || '-' },
          {
            label: 'ตรวจพบครั้งแรก',
            value: license.road_description
              ? `${license.road_description} เมื่อวันที่ ${license.timestamp}`
              : '-',
          },
        ],
      },
      {
        type: 'entries',
        title: 'Vehicle Detection Timeline',
        items: timeline.map((it, i) => ({
          image: images[i],
          heading: it.title,
          subheading: it.timestamp,
          badge: it.status,
          badgeColor: it.status ? (it.status === 'เกินพิกัด' ? '#b91c1c' : '#1d4ed8') : undefined,
          fields: [
            { label: 'ชื่อกล้อง', value: it.camera_name || '-' },
            { label: 'ความเร็ว', value: `${it.speed} กม./ชม.` },
            { label: 'หมายเลขเลน', value: it.lane },
            ...(it.weight ? [{ label: 'น้ำหนักที่ชั่งได้', value: `${it.weight} ตัน` }] : []),
            ...(it.legal_weight ? [{ label: 'น้ำหนักตามมาตรฐาน', value: `${it.legal_weight} ตัน` }] : []),
          ],
        })),
      },
    ]

    await exportReportPdf({
      filenameBase: `Tracking_Timeline_${license.license_no || 'report'}`,
      title: 'รายงานการตรวจจับยานพาหนะ (Vehicle Detection Timeline)',
      subtitleNote:
        [license.license_no, license.license_province].filter(Boolean).join(' · ') || undefined,
      blocks,
    })
  }

  return (
    <div className='lg:px-8'>
      {/* นำออกเอกสาร — timeline report: PDF only, exports the shown events. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={timeline.length}
        onExportPdf={handleExportPdf}
      />

      {/* Header */}
      <section className='flex flex-wrap items-start justify-between gap-4'>
        {/* License info */}
        <div className='flex flex-col gap-0.5'>
          <h1>{license.license_no}</h1>
          <p>{license.license_province}</p>
          <p className='text-gray-400'>ตรวจพบครั้งแรก {license.road_description} เมื่อวันที่ {license.timestamp}</p>
        </div>

        {/* Action buttons */}
        <div className='flex items-center gap-2 shrink-0'>
          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button
              type='primary'
              size='medium'
              shape='round'
              icon={<TbPrinter />}
              disabled={!timeline.length}
              onClick={() => setExportOpen(true)}
            >
              นำออกเอกสาร
            </Button>
          </ConfigProvider>
          <ConfigProvider theme={{ token: { colorPrimary: '#979797', colorTextLightSolid: '#0A0A0A' } }}>
            <Button type='primary' size='medium' shape='round'>
              ดูเพิ่มเติม
            </Button>
          </ConfigProvider>
        </div>
      </section>

      {/* Stats grid */}
      <section className='mt-10 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4'>
        {STAT_ITEMS.map(({ label, value }) => (
          <div key={label} className='bg-(--yellow)/10 border-2 border-(--yellow) rounded-lg p-5'>
            <p className='text-(--yellow)'>{label}</p>
            <p className='font-bold'>{value}</p>
          </div>
        ))}
      </section>

      {/* Timeline */}
      <section className='mt-5'>
        <div className='bg-(--gray) py-8 px-10 rounded-lg'>
          <h1 className='text-(--yellow) mb-5'>Vehicle Detection Timeline</h1>
          {license.timeline?.length ? (
            <Timeline
              variant='filled'
              mode='start'
              items={license.timeline.map((item, index) => ({
                content: <TimelineCard key={item.id} item={item} isFirst={index === 0} />,
              }))}
            />
          ) : (
            <Empty description='ไม่พบข้อมูลการตรวจจับยานพาหนะ' />
          )}
        </div>
      </section>
    </div>
  )
}

export default React.memo(TimelineSection)
