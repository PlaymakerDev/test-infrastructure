"use client"
import React, { useMemo, useState } from 'react'
import { App, Button, ConfigProvider, Empty, Modal, Skeleton } from 'antd'
import { TbMapPin, TbPlayerTrackNext, TbPrinter, TbVideo, TbWifi, TbWifiOff } from 'react-icons/tb'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import ExportFileModal from '@/components/export/ExportFileModal'
import { CameraFunctionTag } from '@/features/admin/cctv/components/cameraFunctions'
import { useProjectDeviceStatus } from '@/hooks/queries/manage'
import { getProjectDeviceStatusExportAPI } from '@/services/routes/ManageService'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { fmtNumber } from '@/utils/formatNumber'
import type { DeviceTotals, ProjectCameraItem, ProjectDeviceStatusRow } from '@/types/manage/device-status-api'
import { cameraBadges, staLabel } from '../data/deviceStatus'
import { useCameraStreams } from '../hooks/useCameraStreams'

interface Props {
  /** The table row whose ▷▷ was pressed; null = closed. */
  project: ProjectDeviceStatusRow | null
  onClose: () => void
}

/** Figma values (user 2026-10-01): the label stays gray while the border,
 *  icon and number take the status colour; offline is the CCTV pages' red,
 *  the same as an offline camera's name below. */
const PILL_LABEL_COLOR = '#979797'
const OFFLINE_COLOR = '#E94C4C'

const CountPill: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
  // font-normal: the header's pills sit in the modal title, which antd bolds.
  <span
    className='inline-flex items-center rounded-full border px-3 py-0.5 fs-12 font-normal whitespace-nowrap'
    style={{ borderColor: color }}
  >
    <span className='inline-flex shrink-0' style={{ color }}>{icon}</span>
    <span className='ml-2' style={{ color: PILL_LABEL_COLOR }}>{label}</span>
    <span className='ml-4' style={{ color }}>{fmtNumber(value)}</span>
  </span>
)

const CountPills: React.FC<{ totals: DeviceTotals }> = ({ totals }) => (
  <div className='flex flex-wrap items-center gap-2.5'>
    <CountPill icon={<TbVideo size={20} />} label='กล้องทั้งหมด' value={totals.total} color='var(--yellow)' />
    <CountPill icon={<TbWifi size={20} />} label='ออนไลน์' value={totals.online} color='var(--default-blue)' />
    <CountPill icon={<TbWifiOff size={20} />} label='ออฟไลน์' value={totals.offline} color={OFFLINE_COLOR} />
  </div>
)

/** Same card as the CCTV detail page's camera grid (CameraGridView): live
 *  picture, name in blue or red by status, IP, and the camera's function tags.
 *  An offline camera gets no stream — its tile keeps the player's Loading. */
const CameraCard: React.FC<{ camera: ProjectCameraItem; hlsUrl?: string; onOpen: () => void }> = ({ camera, hlsUrl, onOpen }) => (
  <div className='flex flex-col gap-3 rounded-2xl p-3' style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
    <div className='rounded-2xl overflow-hidden cursor-pointer' onClick={onOpen}>
      <HLSLivePlayer
        figureClassName='aspect-video rounded-2xl'
        cameraId={camera.id}
        hlsUrl={camera.is_online ? hlsUrl : undefined}
        showLiveBadge={camera.is_online}
        enableViewportPause
        style={{ pointerEvents: 'none' }}
      />
    </div>
    <p
      className='fs-12 leading-snug line-clamp-2 cursor-pointer hover:underline'
      style={{ color: camera.is_online ? '#66AEFF' : OFFLINE_COLOR }}
      title={camera.camera_name}
      onClick={onOpen}
    >
      {camera.camera_name || '-'}
    </p>
    <div className='flex items-center justify-between gap-2 min-w-0'>
      <span className='fs-12 min-w-0 truncate text-(--light-gray-3)'>IP Address : {camera.ip_address || '-'}</span>
      <div className='flex items-center gap-1 flex-wrap justify-end shrink-0'>
        {cameraBadges(camera.solution_types).map((tag) => <CameraFunctionTag key={tag} tag={tag} />)}
      </div>
    </div>
  </div>
)

/** Live Stream — every CCTV camera of one project, grouped by road + chainage
 *  (GET /manage/project/device-status/{id}). A camera opens in the CCTV modal;
 *  นำออกเอกสาร prints the backend's report of the same cameras. */
const ProjectLiveModal: React.FC<Props> = ({ project, onClose }) => {
  const dispatch = useAppDispatch()
  const { message } = App.useApp()
  const [isExportOpen, setExportOpen] = useState(false)
  const { data, isLoading, isError } = useProjectDeviceStatus(project?.project_id)

  const roadIds = useMemo(
    () => Array.from(new Set((data?.groups ?? []).map((group) => group.road_id))),
    [data],
  )
  const { streams } = useCameraStreams(roadIds)

  const openCamera = (cameraId: string) => dispatch(setCCTVModalOpen({ open: true, camera_id: cameraId }))

  // The backend's HTML report, in a tab of its own with ดาวน์โหลด PDF on top
  // (see withSavePdfBar), like the ผู้รับจ้าง tab's report. The tab is opened up
  // front, inside the click: the report is built on demand (a few seconds per
  // 8 online cameras), and a tab opened after that wait would be blocked as a
  // pop-up.
  const exportPdf = async () => {
    if (!project) return
    const win = window.open('', '_blank')
    if (!win) {
      message.error('เบราว์เซอร์บล็อกการเปิดแท็บใหม่ กรุณาอนุญาต pop-up สำหรับเว็บไซต์นี้')
      throw new Error('pop-up blocked')
    }
    win.document.title = 'กำลังสร้างรายงาน...'
    win.document.body.innerHTML = '<p style="font-family:sans-serif;padding:24px">กำลังสร้างรายงานสถานะกล้อง กรุณารอสักครู่...</p>'
    try {
      const [response, { withSavePdfBar }] = await Promise.all([
        getProjectDeviceStatusExportAPI(project.project_id),
        import('@/utils/export/reportHtml'),
      ])
      const report = withSavePdfBar(
        await response.data.text(),
        `รายงานสถานะกล้อง_${project.contract_no?.trim() || project.project_id}`,
      )
      win.location.href = URL.createObjectURL(new Blob([report], { type: 'text/html;charset=utf-8' }))
    } catch (error) {
      win.close()
      message.error('สร้างรายงานไม่สำเร็จ กรุณาลองอีกครั้ง')
      throw error
    }
  }

  // The details claim a 420px basis, so on a phone นำออกเอกสาร drops to a
  // row of its own instead of squeezing the title and name into a sliver.
  const header = project && (
    <div className='flex flex-wrap items-start justify-between gap-3 pr-10'>
      <div className='min-w-0 grow basis-105'>
        <div className='flex items-center gap-2'>
          <TbPlayerTrackNext className='fs-24 shrink-0' />
          <span className='fs-22 font-bold'>Live Stream</span>
        </div>
        <div className='flex flex-wrap items-center gap-2 mt-2'>
          <span className='fs-14 font-normal'>{project.project_name}</span>
          {/* Same pill as the project detail page's title. */}
          <span
            className='inline-flex items-center rounded-full border px-3.5 py-0.5 fs-12 whitespace-nowrap font-normal'
            style={{
              borderColor: project.is_warranty ? '#05F2DB' : '#979797',
              color: project.is_warranty ? '#05F2DB' : '#979797',
            }}
          >
            {project.is_warranty ? 'ในค้ำ' : 'หมดค้ำ'}
          </span>
        </div>
        <div className='mt-2'>
          <CountPills totals={data ?? project.cameras} />
        </div>
      </div>
      <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
        <Button type='primary' shape='round' icon={<TbPrinter />} disabled={!data} onClick={() => setExportOpen(true)}>
          <span className='fs-12'>นำออกเอกสาร</span>
        </Button>
      </ConfigProvider>
    </div>
  )

  const renderBody = () => {
    if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />
    if (isError) return <Empty description={<span className='fs-12'>โหลดข้อมูลกล้องไม่สำเร็จ</span>} />
    if (!data?.groups?.length) return <Empty description={<span className='fs-12'>โครงการนี้ไม่มีกล้อง</span>} />
    return data.groups.map((group) => {
      const roadCode = (group.road_code ?? '').trim()
      const sta = staLabel(group.sta)
      return (
        <section key={`${group.road_id}-${group.sta ?? ''}`} className='mb-6 last:mb-0'>
          <div className='flex flex-wrap items-center gap-x-5 gap-y-2 mb-3'>
            {/* Road code and chainage set apart, as in the Figma. */}
            <div className='flex items-center gap-3 fs-16 text-(--yellow)'>
              <TbMapPin className='fs-22 shrink-0' />
              {roadCode && <span>{roadCode}</span>}
              {sta && <span>{sta}</span>}
            </div>
            <CountPills totals={group} />
          </div>
          <div className='grid gap-4' style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {group.cameras.map((camera) => (
              <CameraCard key={camera.id} camera={camera} hlsUrl={streams.get(camera.id)} onOpen={() => openCamera(camera.id)} />
            ))}
          </div>
        </section>
      )
    })
  }

  return (
    <ConfigProvider theme={{ components: { Modal: { colorIcon: '#FFFFFF' } } }}>
      <Modal
        title={header}
        open={project !== null}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        centered
        width={{ xs: '96vw', xl: 1400 }}
        closable={{ 'aria-label': 'ปิด' }}
        classNames={{ container: 'border-2! border-(--default-blue)!' }}
        styles={{ body: { maxHeight: '68vh', overflowY: 'auto', paddingRight: 4 } }}
      >
        {renderBody()}
      </Modal>
      {/* The backend only renders this report as HTML (no Excel), so PDF only. */}
      <ExportFileModal open={isExportOpen} onClose={() => setExportOpen(false)} onExportPdf={exportPdf} />
    </ConfigProvider>
  )
}

export default React.memo<Props>(ProjectLiveModal)
