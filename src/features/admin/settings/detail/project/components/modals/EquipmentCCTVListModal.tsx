"use client"
import { Button, ConfigProvider, Modal, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useMemo, useState } from 'react'
import { TbPencil, TbPlayerPlay, TbPlus, TbTrash, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useProjectDetailContext } from '../../context'
import type { Equipment, TaskType } from '../../types'

interface Props {
  open: boolean
  task: TaskType | null
  projectName: string
  onClose: () => void
  onAdd: () => void
  onOpenLiveStream: (equipment: Equipment) => void
  onDelete: (equipment: Equipment) => void
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

const EquipmentCCTVListModal: React.FC<Props> = ({ open, task, projectName, onClose, onAdd, onOpenLiveStream, onDelete }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const columns: ColumnsType<Equipment> = useMemo(
    () => [
      { title: 'ลำดับ', key: 'no', width: 60, render: (_: unknown, __: Equipment, i: number) => i + 1 },
      { title: 'ชื่ออุปกรณ์', dataIndex: 'name', key: 'name', ellipsis: true },
      {
        title: 'อัพเดตล่าสุด',
        dataIndex: 'lastUpdated',
        key: 'lastUpdated',
        width: 200,
        render: (v: string) => (dayjs(v).isValid() ? dayjs(v).format('DD MMM YYYY HH:mm:ss') : v),
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
      {
        title: 'จัดการ',
        key: 'actions',
        width: 110,
        align: 'center',
        render: (_: unknown, row) => (
          <div className='flex items-center gap-3 justify-center'>
            <button className='text-(--yellow) cursor-pointer hover:opacity-80' title='แก้ไข'>
              <TbPencil size={18} />
            </button>
            <button
              className='text-(--red) cursor-pointer hover:opacity-80'
              onClick={() => onDelete(row)}
              title='ลบ'
            >
              <TbTrash size={18} />
            </button>
          </div>
        ),
      },
    ],
    [onOpenLiveStream, onDelete],
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
        width={1100}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{ container: { padding: '28px 32px', borderRadius: 16, background: '#1A1A1A' }, mask: { background: 'rgba(0,0,0,0.55)' } }}
        title={null}
      >
        <div className='flex items-start justify-between gap-4 mb-4'>
          <div className='flex-1 min-w-0'>
            <h2 style={{ color: '#66AEFF', fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 6 }}>{task?.kind ?? '-'}</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, wordBreak: 'break-word', margin: 0 }}>{projectName}</p>
          </div>
          <Button
            shape='round'
            icon={<TbPlus size={16} />}
            onClick={onAdd}
            style={{ background: '#FCD116', color: '#1A1A1A', borderColor: '#FCD116', fontWeight: 600, padding: '6px 18px', height: 'auto' }}
          >
            เพิ่มอุปกรณ์
          </Button>
        </div>

        <Table<Equipment>
          rowKey='id'
          columns={columns}
          dataSource={task?.equipment ?? []}
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

export default React.memo<Props>(EquipmentCCTVListModal)
