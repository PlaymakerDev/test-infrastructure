"use client"
import React from 'react'
import { ConfigProvider, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbPlayerPlay, TbWifi, TbWifiOff } from 'react-icons/tb'
import type { CaseDeviceRow } from './caseViewTypes'

interface Props {
  rows: CaseDeviceRow[]
  /** Contractor's modal adds สถานะปัจจุบัน + Live columns (mock 9);
   *  the officer's inline card shows the offline columns only (mock 3). */
  showStatusLive?: boolean
  onLive?: (cameraId: string) => void
}

/** ข้อมูลอุปกรณ์ table for the case page — blue header per the redesign. */
const CaseDeviceTable: React.FC<Props> = ({ rows, showStatusLive = false, onLive }) => {
  const columns: ColumnsType<CaseDeviceRow> = [
    {
      title: 'ลำดับ',
      key: 'no',
      width: 70,
      align: 'center',
      render: (_v, _r, i) => i + 1,
    },
    { title: 'ประเภท', dataIndex: 'type', key: 'type', width: 100, align: 'center' },
    { title: 'Hostname', dataIndex: 'hostname', key: 'hostname', width: 280 },
    { title: 'IP Address', dataIndex: 'ip', key: 'ip', width: 150 },
    {
      title: 'วันที่เริ่มออฟไลน์',
      dataIndex: 'offlineDate',
      key: 'offlineDate',
      width: 150,
      align: 'center',
      render: (v: string) => <span style={{ color: v && v !== '-' ? '#E94C4C' : '#FFFFFF' }}>{v || '-'}</span>,
    },
    {
      title: 'จำนวนวันออฟไลน์',
      dataIndex: 'offlineDays',
      key: 'offlineDays',
      width: 150,
      align: 'center',
      render: (v: number) => <span style={{ color: v >= 1 ? '#E94C4C' : '#FFFFFF' }}>{v >= 1 ? `${v} วัน` : '-'}</span>,
    },
    ...(showStatusLive
      ? ([
        {
          title: 'สถานะปัจจุบัน',
          dataIndex: 'isOnline',
          key: 'isOnline',
          width: 140,
          align: 'center' as const,
          render: (v: boolean) => (
            <span
              className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full fs-12 whitespace-nowrap'
              style={{ border: `1px solid ${v ? '#66AEFF' : '#E94C4C'}`, color: v ? '#66AEFF' : '#E94C4C' }}
            >
              {v ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
              {v ? 'ออนไลน์' : 'ออฟไลน์'}
            </span>
          ),
        },
        {
          title: 'Live',
          key: 'live',
          width: 90,
          align: 'center' as const,
          render: (_: unknown, r: CaseDeviceRow) =>
            r.hasLive ? (
              <button
                type='button'
                className='inline-flex items-center justify-center rounded-lg cursor-pointer hover:opacity-80'
                style={{ background: '#66AEFF', border: 'none', width: 44, height: 30 }}
                title='ดูภาพสด'
                onClick={() => onLive?.(r.cameraId)}
              >
                <TbPlayerPlay size={16} color='#0A0A0A' />
                <TbPlayerPlay size={16} color='#0A0A0A' style={{ marginLeft: -8 }} />
              </button>
            ) : (
              <span style={{ color: '#5B5B5B' }}>-</span>
            ),
        },
      ])
      : []),
  ]

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: '#66AEFF',
            headerColor: '#1A1A1A',
            headerSplitColor: 'transparent',
            colorBgContainer: 'transparent',
            colorText: '#FFFFFF',
            borderColor: 'rgba(102,174,255,0.35)',
            rowHoverBg: 'rgba(255,255,255,0.04)',
          },
        },
      }}
    >
      <Table<CaseDeviceRow>
        rowKey={(r) => r.cameraId}
        columns={columns}
        dataSource={rows}
        pagination={false}
        size='middle'
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'ไม่พบข้อมูลอุปกรณ์' }}
      />
    </ConfigProvider>
  )
}

export default React.memo<Props>(CaseDeviceTable)
