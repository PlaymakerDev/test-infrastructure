"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props {}

type ConnectionStatus = 'Connect' | 'Disconnect'

interface CameraRecord {
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

const mockData: CameraRecord[] = [
  { key: '1', no: 1, name: 'CAM-F03B-VMS-กม.6+300-มุ่งหน้าบางบา-ตราด', km: '6+300', ipAddress: '10.101.27.1', streamStatus: 'Connect', deviceStatus: 'Connect' },
  { key: '2', no: 2, name: 'CAM-B01-VMS-กม.6+300-มุ่งหน้าลาดกระบัง', km: '6+300', ipAddress: '10.101.27.2', streamStatus: 'Connect', deviceStatus: 'Connect' },
  { key: '3', no: 3, name: '68SET-PKT3033-B001-VMS-กม.1+400-ป้าย1', km: '1+400', ipAddress: '10.101.27.3', streamStatus: 'Disconnect', deviceStatus: 'Disconnect' },
  { key: '4', no: 4, name: '68SET-PKT3033-B002-VMS-กม.1+400-ป้าย2', km: '1+400', ipAddress: '10.101.27.4', streamStatus: 'Connect', deviceStatus: 'Connect' },
]

const TableCameraData: React.FC<Props> = () => {
  const columns: ColumnsType<CameraRecord> = [
    { title: 'ลำดับที่', dataIndex: 'no', key: 'no', align: 'center', width: 80 },
    { title: 'ชื่อกล้อง/ป้าย', dataIndex: 'name', key: 'name', width: 480 },
    { title: 'กม.ที่', dataIndex: 'km', key: 'km', align: 'center', width: 100 },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', align: 'center', width: 140 },
    { title: 'Stream Status', dataIndex: 'streamStatus', key: 'streamStatus', align: 'center', width: 140, render: (s: ConnectionStatus) => <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs border ${STATUS_CLASS[s]}`}>{s}</span> },
    { title: 'Device Status', dataIndex: 'deviceStatus', key: 'deviceStatus', align: 'center', width: 140, fixed: 'right', render: (s: ConnectionStatus) => <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs border ${STATUS_CLASS[s]}`}>{s}</span> },
  ]

  return <Table<CameraRecord> columns={columns} dataSource={mockData} pagination={false} size='middle' rowKey='key' scroll={{ x: 'max-content' }} />
}

export default React.memo<Props>(TableCameraData)
