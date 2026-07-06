"use client"
import { Button, Checkbox, ConfigProvider, Modal, Radio, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useEffect, useMemo, useState } from 'react'
import { TbPlayerPlay, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useProjectDetailContext } from '../../context'
import type { Equipment, TaskType } from '../../types'

interface Props {
  open: boolean
  task: TaskType | null
  projectName: string
  onClose: () => void
  onOpenLiveStream: (equipment: Equipment) => void
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

interface Row extends Equipment {
  selected: boolean
}

const EquipmentSelectModal: React.FC<Props> = ({ open, task, projectName, onClose, onOpenLiveStream }) => {
  const { project, activeRouteId, activePointId, updateEquipmentRefs } = useProjectDetailContext()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // The available equipment for selection is the CCTV task-type at the SAME
  // installation point — non-CCTV analytics run on top of an existing camera.
  const point = project.routes
    .find((r) => r.id === activeRouteId)
    ?.points.find((p) => p.id === activePointId)
  const cctvTask = point?.taskTypes.find((t) => t.kind === 'CCTV')
  const equipment = cctvTask?.equipment ?? []

  useEffect(() => {
    if (open && task) setSelectedIds(task.equipmentRefs ?? [])
  }, [open, task])

  const rows: Row[] = useMemo(
    () => equipment.map((e) => ({ ...e, selected: selectedIds.includes(e.id) })),
    [equipment, selectedIds],
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

  const handleConfirm = () => {
    if (!task || !activePointId) return
    updateEquipmentRefs(activeRouteId, activePointId, task.id, selectedIds)
    onClose()
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { contentBg: '#0e0e0e', headerBg: '#0e0e0e', footerBg: '#0e0e0e', colorIcon: '#FFF', titleColor: '#66AEFF' },
        },
      }}
    >
      <Modal open={open} onCancel={onClose} footer={null} destroyOnHidden width={1200} title={null}>
        <div className='mb-3'>
          <h2 className='text-(--default-blue) font-bold mb-1'>{task?.kind ?? '-'}</h2>
          <p className='text-white/70 text-sm break-words mb-0'>{projectName}</p>
        </div>

        <Table<Row>
          rowKey='id'
          columns={columns}
          dataSource={rows}
          pagination={false}
          size='middle'
        />

        <div className='flex justify-end gap-2 mt-4'>
          <Button size='large' shape='round' onClick={onClose}>ยกเลิก</Button>
          <Button
            size='large'
            shape='round'
            onClick={handleConfirm}
            style={{
              background: 'var(--yellow)', color: '#000',
              borderColor: 'var(--yellow)', fontWeight: 700,
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
