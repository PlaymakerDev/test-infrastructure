"use client"
import { Button, ConfigProvider, InputNumber, Modal, Select, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useEffect, useMemo, useState } from 'react'
import { TbPlayerPlay, TbWifi, TbWifiOff } from 'react-icons/tb'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useProjectDetailContext } from '../../context'
import type { Equipment, TaskType } from '../../types'

interface Props {
  open: boolean
  task: TaskType | null
  projectName: string
  onClose: () => void
  onOpenLiveStream: (equipment: Equipment) => void
}

/** Traffic-signal `camera_type` literals — must match the backend enum
 *  (see APIRequestSolutionAddCameraTraffic + traffic-signal detail-api.ts). */
const CAMERA_TYPES = ['Counting', 'StopLine'] as const

interface Row extends Equipment {
  selected: boolean
  phase: number
  cameraType: (typeof CAMERA_TYPES)[number]
}

const StatusPill: React.FC<{ online: boolean }> = ({ online }) => (
  <span
    className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs'
    style={{
      border: `1px solid ${online ? '#66AEFF' : '#FF6666'}`,
      color: online ? '#66AEFF' : '#FF6666',
    }}
  >
    {online ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
    {online ? 'ออนไลน์' : 'ออฟไลน์'}
  </span>
)

/** Traffic-signal camera picker. Each row (when selected) carries a
 *  phase number (1..4 by default) and camera_type (`Counting` |
 *  `StopLine`). Submits via `useAttachTrafficCameras`. */
const TrafficSignalCameraModal: React.FC<Props> = ({
  open,
  task,
  projectName,
  onClose,
  onOpenLiveStream,
}) => {
  const {
    activePointCameras,
    camerasLoading,
    attachTrafficCameras,
    isSubmitting,
  } = useProjectDetailContext()
  const [selected, setSelected] = useState<Record<string, { phase: number; cameraType: string }>>({})

  useEffect(() => {
    if (open) setSelected({})
  }, [open])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = { phase: 1, cameraType: 'Counting' }
      return next
    })
  }

  const updateRow = (id: string, patch: Partial<{ phase: number; cameraType: string }>) => {
    setSelected((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev))
  }

  const rows: Row[] = useMemo(
    () =>
      activePointCameras.map((e) => ({
        ...e,
        selected: !!selected[e.id],
        phase: selected[e.id]?.phase ?? 1,
        cameraType: (selected[e.id]?.cameraType as Row['cameraType']) ?? 'Counting',
      })),
    [activePointCameras, selected],
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
            disabled={!row.isOnline}
            onChange={() => toggle(row.id)}
            style={{ width: 18, height: 18, accentColor: '#FCD116', cursor: row.isOnline ? 'pointer' : 'not-allowed' }}
          />
        ),
      },
      { title: 'ชื่ออุปกรณ์', dataIndex: 'name', key: 'name', ellipsis: true },
      {
        title: 'Phase',
        key: 'phase',
        width: 130,
        render: (_: unknown, row) => (
          <div className='flex items-center gap-2'>
            <span
              className='inline-block w-3 h-3 rounded-full'
              style={{ background: row.selected ? getPhaseColor(row.phase) : 'transparent', border: '1px solid #666' }}
            />
            <InputNumber
              min={1}
              max={8}
              value={row.selected ? row.phase : null}
              disabled={!row.selected}
              onChange={(v) => v != null && updateRow(row.id, { phase: Number(v) })}
              style={{ width: 80 }}
            />
          </div>
        ),
      },
      {
        title: 'ประเภทกล้อง',
        key: 'cameraType',
        width: 170,
        render: (_: unknown, row) => (
          <Select
            value={row.selected ? row.cameraType : undefined}
            disabled={!row.selected}
            onChange={(v) => updateRow(row.id, { cameraType: v })}
            options={CAMERA_TYPES.map((t) => ({ label: t, value: t }))}
            style={{ width: 160 }}
            placeholder='—'
          />
        ),
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
    [onOpenLiveStream],
  )

  const handleConfirm = async () => {
    if (!task) return
    const cameras = Object.entries(selected).map(([camera_id, v]) => ({
      camera_id,
      phase: v.phase,
      camera_type: v.cameraType,
    }))
    try {
      await attachTrafficCameras(task.id, cameras)
      onClose()
    } catch {
      // toast handled inside the context wrapper
    }
  }

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
        onCancel={onClose}
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
            Traffic Signal
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, wordBreak: 'break-word', margin: 0 }}>
            {projectName}
          </p>
        </div>

        {camerasLoading ? (
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
            onClick={onClose}
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
            disabled={Object.keys(selected).length === 0}
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

export default React.memo<Props>(TrafficSignalCameraModal)
