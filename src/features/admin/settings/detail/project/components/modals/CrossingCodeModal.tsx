"use client"
import { Button, ConfigProvider, Modal, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'
import { TbTrash } from 'react-icons/tb'
import { useProjectDetailContext } from '../../context'
import type { Equipment, TaskType } from '../../types'

interface Props {
  open: boolean
  task: TaskType | null
  onClose: () => void
}

const CrossingCodeModal: React.FC<Props> = ({ open, task, onClose }) => {
  const { project, activeRouteId, activePointId } = useProjectDetailContext()

  // Rows are the equipment currently referenced by this task-type via
  // equipmentRefs, resolved to the actual CCTV equipment rows at the same
  // installation point (so we can pull the pre-generated crossingCode).
  const rows = useMemo(() => {
    if (!task) return []
    const point = project.routes
      .find((r) => r.id === activeRouteId)
      ?.points.find((p) => p.id === activePointId)
    const cctv = point?.taskTypes.find((t) => t.kind === 'CCTV')
    if (!cctv) return []
    const refs = new Set(task.equipmentRefs ?? [])
    return cctv.equipment.filter((e) => refs.has(e.id))
  }, [task, project, activeRouteId, activePointId])

  const columns: ColumnsType<Equipment> = useMemo(
    () => [
      { title: 'ลำดับ', key: 'no', width: 60, render: (_: unknown, __: Equipment, i: number) => i + 1 },
      { title: 'ชื่ออุปกรณ์', dataIndex: 'name', key: 'name', ellipsis: true },
      { title: 'Crossingcode', dataIndex: 'crossingCode', key: 'crossingCode', width: 380 },
      {
        title: 'จัดการ',
        key: 'actions',
        width: 100,
        align: 'center',
        render: () => (
          <button className='text-(--red) cursor-pointer hover:opacity-80' title='ลบ'>
            <TbTrash size={18} />
          </button>
        ),
      },
    ],
    [],
  )

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { contentBg: '#0e0e0e', headerBg: '#0e0e0e', footerBg: '#0e0e0e', colorIcon: '#FFF', titleColor: '#66AEFF' },
        },
      }}
    >
      <Modal open={open} onCancel={onClose} footer={null} destroyOnHidden width={900} title={null}>
        <div className='mb-3'>
          <h2 className='text-(--default-blue) font-bold mb-1'>CrossingCode</h2>
          <p className='text-white/70 text-sm mb-0'>
            {task ? `จุดติดตั้ง : ${task.pointName} • ${task.kind}` : ''}
          </p>
        </div>

        <Table<Equipment>
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
            style={{
              background: 'var(--yellow)', color: '#000',
              borderColor: 'var(--yellow)', fontWeight: 700,
            }}
            onClick={onClose}
          >
            ยืนยัน
          </Button>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(CrossingCodeModal)
