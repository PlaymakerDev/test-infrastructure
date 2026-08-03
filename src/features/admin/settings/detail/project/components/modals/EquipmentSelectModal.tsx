"use client"
import { Button, Checkbox, ConfigProvider, message, Modal, Radio, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useEffect, useMemo, useState } from 'react'
import { TbPlayerPlay, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useProjectDetailContext } from '../../context'
import type { Equipment, TaskType } from '../../types'
import { SOLUTION_TYPE } from '@/types/manage/solution-api'

interface Props {
  open: boolean
  task: TaskType | null
  projectName: string
  onClose: () => void
  onOpenLiveStream: (equipment: Equipment) => void
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

interface Row extends Equipment {
  selected: boolean
}

/** Camera picker for non-CCTV task types. Backend contract:
 *  the corresponding /solution/camera/{counting|analytic|crosswalk|wim}
 *  endpoint DELETES existing rows then INSERTs the incoming set — so the
 *  UI treats this as "the full list going forward". */
const EquipmentSelectModal: React.FC<Props> = ({
  open,
  task,
  projectName,
  onClose,
  onOpenLiveStream,
}) => {
  const {
    activePointCameras,
    camerasLoading,
    attachCountingCameras,
    attachAnalyticCameras,
    attachCrosswalkCameras,
    attachWimCameras,
    isSubmitting,
  } = useProjectDetailContext()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Seed selection from the task's currently-attached cameras. The context
  // doesn't preload per-solution attach state; if we later add it we can
  // read from `task?.equipmentRefs`. For now the picker starts empty and
  // replaces on save.
  useEffect(() => {
    if (open) setSelectedIds(task?.equipmentRefs ?? [])
  }, [open, task])

  const rows: Row[] = useMemo(
    () => activePointCameras.map((e) => ({ ...e, selected: selectedIds.includes(e.id) })),
    [activePointCameras, selectedIds],
  )

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const columns: ColumnsType<Row> = useMemo(
    () => [
      {
        title: 'เลือก',
        key: 'select',
        width: 70,
        render: (_: unknown, row) => (
          <Checkbox
            checked={row.selected}
            disabled={!row.isOnline}
            onChange={() => toggle(row.id)}
          />
        ),
      },
      { title: 'ชื่ออุปกรณ์', dataIndex: 'name', key: 'name', ellipsis: true },
      {
        title: 'สถานะการเลือกใช้งาน',
        key: 'usage',
        width: 200,
        render: (_: unknown, row) => (
          <Radio
            checked={row.selected}
            disabled={!row.isOnline}
            onClick={() => row.isOnline && toggle(row.id)}
          >
            <span style={{ color: row.selected ? '#05F2DB' : row.isOnline ? '#FFF' : '#666' }}>
              เลือกใช้งาน
            </span>
          </Radio>
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
    try {
      if (task.kindId === SOLUTION_TYPE.Counting) {
        await attachCountingCameras(task.id, selectedIds)
      } else if (task.kindId === SOLUTION_TYPE.Analytic) {
        await attachAnalyticCameras(task.id, selectedIds)
      } else if (task.kindId === SOLUTION_TYPE.Crosswalk) {
        await attachCrosswalkCameras(task.id, selectedIds)
      } else if (task.kindId === SOLUTION_TYPE.WIM) {
        await attachWimCameras(task.id, selectedIds)
      } else {
        // Traffic Signal has its own phase-based picker
        // (TrafficSignalCameraModal); VMS uses VMSSolutionModal for
        // full provisioning. Lighting has no /manage/solution/camera/*
        // endpoint documented — falls through to a friendly warning.
        message.warning(
          `การผูกกล้องสำหรับประเภทงาน "${task.kind}" ยังไม่รองรับผ่านตัวเลือกนี้`,
        )
        return
      }
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
            {task?.kind ?? '-'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: "var(--fs-12)", wordBreak: 'break-word', margin: 0 }}>
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

export default React.memo<Props>(EquipmentSelectModal)
