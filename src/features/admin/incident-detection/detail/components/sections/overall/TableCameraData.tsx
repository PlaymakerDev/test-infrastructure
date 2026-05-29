"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props {}

type ConnectionStatus = 'Connect' | 'Disconnect'
type FunctionTag = 'CCTV' | 'Incident' | 'Volume' | 'Traffic'

interface CameraRecord {
  key: string; no: number; name: string; km: string
  functions: FunctionTag[]; ipAddress: string
  streamStatus: ConnectionStatus; deviceStatus: ConnectionStatus
}

const FUNCTION_TAG_CLASS: Record<FunctionTag, string> = {
  CCTV: 'border-yellow-500 text-yellow-500', Incident: 'border-green-500 text-green-500',
  Volume: 'border-emerald-400 text-emerald-400', Traffic: 'border-teal-400 text-teal-400',
}

const STATUS_CLASS: Record<ConnectionStatus, string> = {
  Connect: 'border-blue-400 text-blue-400', Disconnect: 'border-red-500 text-red-500',
}

const mockData: CameraRecord[] = [
  { key: '1', no: 1, name: '68SET-CCO4050-FAI012-จุดที่8-กม.10+550-ปุ่งหน้าปากน้ำโสภาคดี', km: '10+550', functions: ['CCTV', 'Incident'], ipAddress: '10.12.7.3', streamStatus: 'Connect', deviceStatus: 'Connect' },
  { key: '2', no: 2, name: '68FTD-NPM3015-FAI052-จุดที่26-กม.13+850-ปุ่งหน้าโรงเรียนบ้านน้ำเพิ่ม', km: '13+850', functions: ['CCTV', 'Incident', 'Volume'], ipAddress: '10.12.2.1', streamStatus: 'Connect', deviceStatus: 'Connect' },
]

const TableCameraData: React.FC<Props> = () => {
  const columns: ColumnsType<CameraRecord> = [
    { title: 'ลำดับที่', dataIndex: 'no', key: 'no', align: 'center', width: 80 },
    { title: 'ชื่อกล้อง', dataIndex: 'name', key: 'name', width: 480 },
    { title: 'กม.ที่', dataIndex: 'km', key: 'km', align: 'center', width: 100 },
    { title: 'การทำงาน', dataIndex: 'functions', key: 'functions', align: 'center', width: 220, render: (tags: FunctionTag[]) => <div className='flex flex-wrap justify-center gap-1'>{tags.map((tag) => <span key={tag} className={`inline-block py-0.5 px-2.5 rounded-full text-xs border ${FUNCTION_TAG_CLASS[tag]}`}>{tag}</span>)}</div> },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', align: 'center', width: 140 },
    { title: 'Stream Status', dataIndex: 'streamStatus', key: 'streamStatus', align: 'center', width: 140, render: (s: ConnectionStatus) => <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs border ${STATUS_CLASS[s]}`}>{s}</span> },
    { title: 'Device Status', dataIndex: 'deviceStatus', key: 'deviceStatus', align: 'center', width: 140, fixed: 'right', render: (s: ConnectionStatus) => <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs border ${STATUS_CLASS[s]}`}>{s}</span> },
  ]

  return <Table<CameraRecord> columns={columns} dataSource={mockData} pagination={false} size='middle' rowKey='key' scroll={{ x: 'max-content' }} />
}

export default React.memo<Props>(TableCameraData)
