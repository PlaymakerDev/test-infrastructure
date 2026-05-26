"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props { }

type ConnectionStatus = 'Connect' | 'Disconnect'
type FunctionTag = 'CCTV' | 'Incident' | 'Volume' | 'Traffic'

interface CameraRecord {
  key: string
  no: number
  name: string
  km: string
  functions: FunctionTag[]
  ipAddress: string
  streamStatus: ConnectionStatus
  deviceStatus: ConnectionStatus
}

const FUNCTION_TAG_CLASS: Record<FunctionTag, string> = {
  CCTV: 'border-yellow-500 text-yellow-500',
  Incident: 'border-green-500 text-green-500',
  Volume: 'border-emerald-400 text-emerald-400',
  Traffic: 'border-teal-400 text-teal-400',
}

const STATUS_CLASS: Record<ConnectionStatus, string> = {
  Connect: 'border-blue-400 text-blue-400',
  Disconnect: 'border-red-500 text-red-500',
}

const mockData: CameraRecord[] = [
  { key: '1', no: 1, name: '68MST-CCO3001-FAI001-จรารงสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าลาดกระบัง', km: '7+900', functions: ['CCTV', 'Incident'], ipAddress: '10.101.27.1', streamStatus: 'Connect', deviceStatus: 'Connect' },
  { key: '2', no: 2, name: '68MST-CCO3001-FAI002-จรารงสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าเข้าแยก', km: '7+900', functions: ['CCTV'], ipAddress: '10.101.27.2', streamStatus: 'Disconnect', deviceStatus: 'Disconnect' },
  { key: '3', no: 3, name: '68MST-CCO3001-FAI003-จรารงสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าบางบา-ตราด', km: '7+900', functions: ['CCTV', 'Volume', 'Traffic'], ipAddress: '10.101.27.3', streamStatus: 'Connect', deviceStatus: 'Connect' },
  { key: '4', no: 4, name: '68MST-CCO3001-FAI004-จรารงสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าเข้าแยก', km: '7+900', functions: ['CCTV'], ipAddress: '10.101.27.4', streamStatus: 'Connect', deviceStatus: 'Connect' },
  { key: '5', no: 5, name: '68MST-CCO3001-FAI005-จรารงสี่แยกเกาะไร่-กม.7+900 มุ่งหน้าเข้าแยก', km: '7+900', functions: ['CCTV', 'Volume', 'Traffic'], ipAddress: '10.101.27.5', streamStatus: 'Connect', deviceStatus: 'Connect' },
  { key: '6', no: 6, name: '68MST-CCO3001-FAI006-จรารงสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าฉะเชิงเทรา', km: '7+900', functions: ['CCTV', 'Incident'], ipAddress: '10.101.27.6', streamStatus: 'Connect', deviceStatus: 'Connect' },
  { key: '7', no: 7, name: '68MST-CCO3001-FAI007-จรารงสี่แยกเกาะไร่-กม.7+900-มุ่งหน้านิมบุรี', km: '7+900', functions: ['CCTV', 'Volume', 'Traffic'], ipAddress: '10.101.27.7', streamStatus: 'Connect', deviceStatus: 'Connect' },
  { key: '8', no: 8, name: '68MST-CCO3001-FAI008-จรารงสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าเข้าแยก', km: '7+900', functions: ['CCTV', 'Incident'], ipAddress: '10.101.27.8', streamStatus: 'Connect', deviceStatus: 'Connect' },
]

const TableCameraData: React.FC<Props> = () => {
  const columns: ColumnsType<CameraRecord> = [
    {
      title: 'ลำดับที่',
      dataIndex: 'no',
      key: 'no',
      align: 'center',
      width: 80,
    },
    {
      title: 'ชื่อกล้อง',
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
      title: 'การทำงาน',
      dataIndex: 'functions',
      key: 'functions',
      align: 'center',
      width: 220,
      render: (tags: FunctionTag[]) => (
        <div className='flex flex-wrap justify-center gap-1'>
          {tags.map((tag) => (
            <span key={tag} className={`inline-block py-0.5 px-2.5 rounded-full text-xs border ${FUNCTION_TAG_CLASS[tag]}`}>
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      align: 'center',
      width: 140,
    },
    {
      title: 'Stream Status',
      dataIndex: 'streamStatus',
      key: 'streamStatus',
      align: 'center',
      width: 140,
      render: (status: ConnectionStatus) => (
        <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs border ${STATUS_CLASS[status]}`}>
          {status}
        </span>
      ),
    },
    {
      title: 'Device Status',
      dataIndex: 'deviceStatus',
      key: 'deviceStatus',
      align: 'center',
      width: 140,
      fixed: 'right',
      render: (status: ConnectionStatus) => (
        <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs border ${STATUS_CLASS[status]}`}>
          {status}
        </span>
      ),
    },
  ]

  return (
    <Table<CameraRecord>
      columns={columns}
      dataSource={mockData}
      pagination={false}
      size="middle"
      rowKey="key"
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(TableCameraData)
