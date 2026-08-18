"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props { }

type ConnectionStatus = 'Connect' | 'Disconnect'

export interface CameraRecord {
  key: string
  no: number
  name: string
  km: string
  ipAddress: string
  streamStatus: ConnectionStatus
  deviceStatus: ConnectionStatus
}

const STATUS_CLASS: Record<ConnectionStatus, string> = {
  Connect: 'border-blue-400 text-blue-400',
  Disconnect: 'border-red-500 text-red-500',
}

// Exported so the parent DataDisplaySection can feed the SAME rows the table
// renders into the นำออกเอกสาร (PDF/Excel) export — still mock data for now.
export const CAMERA_MOCK_ROWS: CameraRecord[] = [
  {
    key: '1',
    no: 1,
    name: 'CAM-F03B-VMS-กม.6+300-มุ่งหน้าบางบา-ตราด',
    km: '6+300',
    ipAddress: '10.101.27.1',
    streamStatus: 'Connect',
    deviceStatus: 'Connect',
  },
  {
    key: '2',
    no: 2,
    name: 'CAM-B01-VMS-กม.6+300-มุ่งหน้าลาดกระบัง',
    km: '6+300',
    ipAddress: '10.101.27.2',
    streamStatus: 'Connect',
    deviceStatus: 'Connect',
  },
  {
    key: '3',
    no: 3,
    name: '68SET-PKT3033-B001-VMS-กม.1+400-ป้าย1',
    km: '1+400',
    ipAddress: '10.101.27.3',
    streamStatus: 'Disconnect',
    deviceStatus: 'Disconnect',
  },
  {
    key: '4',
    no: 4,
    name: '68SET-PKT3033-B002-VMS-กม.1+400-ป้าย2',
    km: '1+400',
    ipAddress: '10.101.27.4',
    streamStatus: 'Connect',
    deviceStatus: 'Connect',
  },
]

const TableCameraData: React.FC<Props> = () => {
  const columns: ColumnsType<CameraRecord> = [
    {
      title: 'ลำดับที่',
      dataIndex: 'no',
      key: 'no',
      align: 'center',
      width: 80,
      // Indent first column 28px to match the overall-page list tables.
      onHeaderCell: () => ({ style: { paddingInlineStart: 28, paddingLeft: 28 } }),
      onCell: () => ({ style: { paddingInlineStart: 28, paddingLeft: 28 } }),
    },
    {
      title: 'ชื่อกล้อง/ป้าย',
      dataIndex: 'name',
      key: 'name',
      width: 480,
    },
    {
      title: 'กม.ที่',
      dataIndex: 'km',
      key: 'km',
      align: 'center',
      width: 100,
    },
    {
      title: 'Stream Status',
      dataIndex: 'streamStatus',
      key: 'streamStatus',
      align: 'center',
      width: 140,
      render: (s: ConnectionStatus) => (
        <span className={`inline-block py-0.5 px-3.5 rounded-full fs-12 border ${STATUS_CLASS[s]}`}>
          {s}
        </span>
      ),
    },
    {
      title: 'Device Status',
      dataIndex: 'deviceStatus',
      key: 'deviceStatus',
      align: 'center',
      width: 140,
      render: (s: ConnectionStatus) => (
        <span className={`inline-block py-0.5 px-3.5 rounded-full fs-12 border ${STATUS_CLASS[s]}`}>
          {s}
        </span>
      ),
    },
    // IP Address is the LAST column on every detail-page table (2026-08-17
    // request, applied app-wide); it inherits the fixed-right pin from the
    // previous last column.
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      align: 'center',
      width: 140,
      fixed: 'right',
    },
  ]

  return (
    <Table<CameraRecord>
      columns={columns}
      dataSource={CAMERA_MOCK_ROWS}
      pagination={false}
      size='middle'
      rowKey='key'
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(TableCameraData)
