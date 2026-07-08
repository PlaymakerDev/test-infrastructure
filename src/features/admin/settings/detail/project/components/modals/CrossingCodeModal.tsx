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
          Modal: { contentBg: '#1A1A1A', headerBg: '#1A1A1A', footerBg: '#1A1A1A', colorIcon: '#FFF', titleColor: '#66AEFF', borderRadiusLG: 16 },
          Table: {
            headerBg: '#66AEFF',
            headerColor: '#1A1A1A',
            headerSplitColor: 'transparent',
            colorBgContainer: 'transparent',
            colorText: '#FFFFFF',
            borderColor: 'rgba(102,174,255,0.25)',
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
        width={900}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{ container: { padding: '28px 32px', borderRadius: 16, background: '#1A1A1A' }, mask: { background: 'rgba(0,0,0,0.55)' } }}
        title={null}
      >
        <div className='mb-4'>
          <h2 style={{ color: '#66AEFF', fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 6 }}>CrossingCode</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0 }}>
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

        <div className='flex justify-end gap-3 mt-6'>
          <Button
            shape='round'
            onClick={onClose}
            style={{ background: '#E5E5E5', color: '#4A4A4A', borderColor: '#E5E5E5', padding: '8px 28px', height: 'auto', fontWeight: 500 }}
          >
            ยกเลิก
          </Button>
          <Button
            shape='round'
            style={{ background: '#FCD116', color: '#1A1A1A', borderColor: '#FCD116', padding: '8px 32px', height: 'auto', fontWeight: 600 }}
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
