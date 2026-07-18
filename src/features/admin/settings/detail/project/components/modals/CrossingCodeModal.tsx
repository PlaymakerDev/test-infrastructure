"use client"
import { Button, ConfigProvider, Modal, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'
import { useCrossingCodes } from '@/hooks/queries/manage'
import { useProjectDetailContext } from '../../context'
import type { TaskType } from '../../types'

interface Props {
  open: boolean
  task: TaskType | null
  onClose: () => void
}

interface Row {
  camera_id: string
  camera_name: string
  crossing_index_code: string
}

/** Read-only view of the crossing index codes generated for the given
 *  Counting / Analytic / Traffic / Crosswalk solution. Backend endpoint
 *  is available only for those 4 types; the parent table hides the icon
 *  for other kinds. */
const CrossingCodeModal: React.FC<Props> = ({ open, task, onClose }) => {
  const { activePoint } = useProjectDetailContext()
  const codesQuery = useCrossingCodes(open ? task?.id ?? null : null)

  const rows: Row[] = useMemo(
    () => codesQuery.data?.camera_crossing_index_code ?? [],
    [codesQuery.data],
  )

  const columns: ColumnsType<Row> = useMemo(
    () => [
      {
        title: 'ลำดับ',
        key: 'no',
        width: 60,
        render: (_: unknown, __: Row, i: number) => i + 1,
      },
      { title: 'ชื่ออุปกรณ์', dataIndex: 'camera_name', key: 'camera_name', ellipsis: true },
      {
        title: 'CrossingCode',
        dataIndex: 'crossing_index_code',
        key: 'crossing_index_code',
        width: 380,
        render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
      },
    ],
    [],
  )

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
        styles={{
          container: { padding: '28px 32px', borderRadius: 16, background: '#1A1A1A' },
          mask: { background: 'rgba(0,0,0,0.55)' },
        }}
        title={null}
      >
        <div className='mb-4'>
          <h2 style={{ color: '#66AEFF', fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 6 }}>
            CrossingCode
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0 }}>
            {task && activePoint ? `จุดติดตั้ง : ${activePoint.name} • ${task.kind}` : ''}
          </p>
          {codesQuery.data?.master_index_code && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '8px 0 0', fontFamily: 'monospace' }}>
              Master : {codesQuery.data.master_index_code}
            </p>
          )}
        </div>

        {codesQuery.isLoading ? (
          <div className='flex items-center justify-center py-10'>
            <Spin />
          </div>
        ) : codesQuery.isError ? (
          <div style={{ color: '#FF6666', textAlign: 'center', padding: '40px 0' }}>
            ไม่สามารถโหลด CrossingCode ได้ (บาง Solution type ไม่รองรับ)
          </div>
        ) : (
          <Table<Row>
            rowKey='camera_id'
            columns={columns}
            dataSource={rows}
            pagination={false}
            size='middle'
            locale={{ emptyText: 'ยังไม่มี CrossingCode' }}
          />
        )}

        <div className='flex justify-end gap-3 mt-6'>
          <Button
            shape='round'
            style={{
              background: '#FCD116',
              color: '#1A1A1A',
              borderColor: '#FCD116',
              padding: '8px 32px',
              height: 'auto',
              fontWeight: 600,
            }}
            onClick={onClose}
          >
            ปิด
          </Button>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(CrossingCodeModal)
