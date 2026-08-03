"use client"
import { Button, ConfigProvider, Input, Modal, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useCallback, useMemo, useState } from 'react'
import { TbPlayerPlay, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useVMSSolutionDetail } from '@/hooks/queries/manage'
import { useProjectDetailContext } from '../../context'
import type { Equipment, TaskType } from '../../types'

interface Props {
  open: boolean
  /** The VMS Solution row (tbl_solution.id) being provisioned. */
  task: TaskType | null
  projectName: string
  onClose: () => void
  onOpenLiveStream: (equipment: Equipment) => void
}

interface Row extends Equipment {
  selected: boolean
}

const StatusPill: React.FC<{ online: boolean }> = ({ online }) => (
  <span
    className='inline-flex items-center gap-1 px-3 py-1 rounded-full fs-12'
    style={{
      border: `1px solid ${online ? '#66AEFF' : '#FF6666'}`,
      color: online ? '#66AEFF' : '#FF6666',
    }}
  >
    {online ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
    {online ? 'ออนไลน์' : 'ออฟไลน์'}
  </span>
)

/** VMS provisioning modal. Backend contract
 *  (`POST /solution/vms/solution/existing_camera`): upsert on solution_id —
 *  the desktop-screen URL is overwritten and the camera links are DELETED then
 *  re-INSERTed from `camera_id`, so the picker is seeded with what the VMS
 *  currently carries and submits the full list going forward. Same
 *  replace-on-write picker shape as EquipmentSelectModal /
 *  TrafficSignalCameraModal. */
const VMSSolutionModal: React.FC<Props> = ({
  open,
  task,
  projectName,
  onClose,
  onOpenLiveStream,
}) => {
  const { activePointCameras, camerasLoading, createVMSSolution, isSubmitting } =
    useProjectDetailContext()
  // Both fields are `null` while untouched → show whatever the VMS currently
  // has. Only once the operator edits does a field hold its own value. Seeding
  // via an effect instead would fight a late refetch and cascade a render.
  const [typedUrl, setTypedUrl] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[] | null>(null)

  // The VMS's current desktop-screen URL + linked cameras. Prefilling matters:
  // the backend upserts, so a blank URL or an unticked camera is a deletion.
  const provisioned = useVMSSolutionDetail(open && task ? task.id : null)

  const linkedIds = useMemo(
    () => provisioned.data?.camera_id ?? [],
    [provisioned.data],
  )
  const selectedIds = picked ?? linkedIds
  const desktopUrl = typedUrl ?? provisioned.data?.desktop_screen_url ?? ''

  const toggle = useCallback(
    (id: string) => {
      setPicked((prev) => {
        const base = prev ?? linkedIds
        return base.includes(id) ? base.filter((x) => x !== id) : [...base, id]
      })
    },
    [linkedIds],
  )

  // State lives across open/close (the modal component itself never unmounts),
  // so clear it on the way out rather than on the way in.
  const handleClose = () => {
    setPicked(null)
    setTypedUrl(null)
    setUrlError(null)
    onClose()
  }

  const rows: Row[] = useMemo(
    () => activePointCameras.map((e) => ({ ...e, selected: selectedIds.includes(e.id) })),
    [activePointCameras, selectedIds],
  )

  const columns: ColumnsType<Row> = useMemo(
    () => [
      {
        title: 'เลือก',
        key: 'select',
        width: 70,
        render: (_: unknown, row) => (
          <input
            type='checkbox'
            checked={row.selected}
            onChange={() => toggle(row.id)}
            style={{ width: 18, height: 18, accentColor: '#FCD116', cursor: 'pointer' }}
          />
        ),
      },
      { title: 'ชื่ออุปกรณ์', dataIndex: 'name', key: 'name', ellipsis: true },
      {
        title: 'กม.ที่ / STA',
        dataIndex: 'sta',
        key: 'sta',
        width: 140,
        render: (v: string | null | undefined) => v || '-',
      },
      {
        title: 'IP Address',
        dataIndex: 'ipAddress',
        key: 'ipAddress',
        width: 160,
        render: (v: string | null | undefined) => v || '-',
      },
      {
        title: 'สถานะการเชื่อมต่อ',
        dataIndex: 'isOnline',
        key: 'isOnline',
        width: 160,
        render: (v: boolean) => <StatusPill online={v} />,
      },
      {
        title: 'Live Stream',
        key: 'live',
        width: 130,
        align: 'center',
        render: (_: unknown, row) => (
          <button
            type='button'
            onClick={() => onOpenLiveStream(row)}
            className='inline-flex items-center gap-1 text-(--yellow) hover:opacity-80 cursor-pointer'
            title='Live'
          >
            <TbPlayerPlay size={20} />
            <TbPlayerPlay size={20} style={{ marginLeft: -6 }} />
          </button>
        ),
      },
    ],
    [onOpenLiveStream, toggle],
  )

  const handleConfirm = async () => {
    if (!task) return
    const url = desktopUrl.trim()
    if (!url) {
      setUrlError('กรุณาระบุ Desktop Screen URL')
      return
    }
    try {
      new URL(url)
    } catch {
      setUrlError('URL ไม่ถูกต้อง')
      return
    }
    setUrlError(null)
    try {
      await createVMSSolution(task.id, url, selectedIds)
      handleClose()
    } catch {
      // toast handled inside the context wrapper
    }
  }

  const loading = camerasLoading || provisioned.isLoading

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            contentBg: '#1A1A1A',
            headerBg: '#1A1A1A',
            footerBg: '#1A1A1A',
            colorIcon: '#FFF',
            titleColor: '#66AEFF',
            borderRadiusLG: 16,
          },
          Table: {
            headerBg: '#66AEFF',
            headerColor: '#1A1A1A',
            headerSplitColor: 'transparent',
            colorBgContainer: 'transparent',
            colorText: '#FFFFFF',
            borderColor: 'rgba(252,209,22,0.25)',
            rowHoverBg: 'rgba(255,255,255,0.04)',
          },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={handleClose}
        footer={null}
        destroyOnHidden
        width={1200}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{
          container: { padding: '28px 32px', borderRadius: 16, background: '#1A1A1A' },
          mask: { background: 'rgba(0,0,0,0.55)' },
        }}
        title={null}
      >
        <div className='mb-4'>
          <h2 style={{ color: '#66AEFF', fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 6 }}>
            {task?.kind ?? 'VMS'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: "var(--fs-12)", wordBreak: 'break-word', margin: 0 }}>
            {projectName}
          </p>
        </div>

        <div className='mb-4'>
          <label
            className='block mb-2'
            style={{ color: '#FFFFFF', fontSize: "var(--fs-12)", fontWeight: 500 }}
          >
            Desktop Screen URL
            <span style={{ color: '#FF6666', marginLeft: 2 }}>*</span>
          </label>
          <Input
            value={desktopUrl}
            onChange={(e) => {
              setTypedUrl(e.target.value)
              if (urlError) setUrlError(null)
            }}
            placeholder='https://...'
            // Locked until the prefill lands, so an empty box is never mistaken
            // for "this VMS has no URL".
            disabled={isSubmitting || loading}
            status={urlError ? 'error' : undefined}
            style={{
              background: 'transparent',
              borderColor: urlError ? '#FF6666' : 'rgba(252,209,22,0.25)',
              color: '#FFFFFF',
              height: 44,
              borderRadius: 8,
            }}
          />
          {urlError && (
            <p style={{ color: '#FF6666', fontSize: "var(--fs-12)", margin: '6px 0 0' }}>{urlError}</p>
          )}
        </div>

        <p
          style={{
            color: selectedIds.length === 0 ? '#FF6666' : 'rgba(255,255,255,0.75)',
            fontSize: "var(--fs-12)",
            margin: '0 0 8px',
          }}
        >
          {selectedIds.length === 0
            ? 'ไม่ได้เลือกกล้องใดเลย — บันทึกแล้วกล้องทั้งหมดจะถูกถอดออกจากอุปกรณ์ VMS นี้'
            : 'เลือกกล้องที่ต้องการผูกกับอุปกรณ์ VMS นี้ (รายการที่เลือกจะแทนที่รายการเดิมทั้งหมด)'}
        </p>

        {loading ? (
          <div className='flex items-center justify-center py-10'>
            <Spin />
          </div>
        ) : (
          <Table<Row>
            rowKey='id'
            columns={columns}
            dataSource={rows}
            pagination={false}
            size='middle'
            locale={{ emptyText: 'ยังไม่มีกล้อง CCTV ที่จุดติดตั้งนี้ให้เลือก' }}
          />
        )}

        <div className='flex justify-end gap-3 mt-6'>
          <Button
            shape='round'
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              background: '#E5E5E5',
              color: '#4A4A4A',
              borderColor: '#E5E5E5',
              padding: '8px 28px',
              height: 'auto',
              fontWeight: 500,
            }}
          >
            ยกเลิก
          </Button>
          <Button
            shape='round'
            onClick={handleConfirm}
            loading={isSubmitting}
            // Saving with nothing ticked is allowed on purpose — it unlinks
            // every camera, which is the step before deleting the VMS.
            disabled={loading}
            style={{
              background: '#FCD116',
              color: '#1A1A1A',
              borderColor: '#FCD116',
              padding: '8px 32px',
              height: 'auto',
              fontWeight: 600,
            }}
          >
            ยืนยัน
          </Button>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(VMSSolutionModal)