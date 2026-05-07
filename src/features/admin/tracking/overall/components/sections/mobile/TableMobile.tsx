"use client"
import React from 'react'
import { Table, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'

interface Props { }

interface WIMProjectRecord {
  key: string
  no: number
  routeCode: string
  province: string
  unit: string
  integration: string | null
  startTime: string
  endTime: string | null
  totalVehicles: number
  normalWeight: number
  overweight: number
  overweight10: number
}

const TableMobileData: React.FC<Props> = (props) => {
  const { } = props;
  const router = useRouter()

  const mockData: WIMProjectRecord[] = [
    {
      key: '1',
      no: 1,
      routeCode: 'ชย.3002',
      province: 'ชัยภูมิ',
      unit: 'ขทช.ชัยภูมิ',
      integration: 'อส.ทช',
      startTime: '16:02',
      endTime: null,
      totalVehicles: 8,
      normalWeight: 5,
      overweight: 3,
      overweight10: 1,
    },
    {
      key: '2',
      no: 2,
      routeCode: 'อบ.4041',
      province: 'อุบลราชธานี',
      unit: 'สทช.7 (อุบลราชธานี)',
      integration: 'กช.',
      startTime: '14:48',
      endTime: '16:03',
      totalVehicles: 12,
      normalWeight: 12,
      overweight: 0,
      overweight10: 0,
    },
    {
      key: '3',
      no: 3,
      routeCode: 'มห.4012',
      province: 'มุกดาหาร',
      unit: 'ขทช.มุกดาหาร',
      integration: null,
      startTime: '12:25',
      endTime: '14:30',
      totalVehicles: 4,
      normalWeight: 4,
      overweight: 0,
      overweight10: 0,
    },
    {
      key: '4',
      no: 4,
      routeCode: 'กพ.4020',
      province: 'กำแพงเพชร',
      unit: 'ขทช.กำแพงเพชร',
      integration: 'ตำรวจ',
      startTime: '10:25',
      endTime: '14:30',
      totalVehicles: 25,
      normalWeight: 22,
      overweight: 3,
      overweight10: 1,
    },
    {
      key: '5',
      no: 5,
      routeCode: 'ปก.3020',
      province: 'ปทุมธานี',
      unit: 'สทช.1 (ปทุมธานี)',
      integration: null,
      startTime: '09:15',
      endTime: '12:06',
      totalVehicles: 9,
      normalWeight: 9,
      overweight: 0,
      overweight10: 0,
    },
  ]

  const columns: ColumnsType<WIMProjectRecord> = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      align: 'center',
      width: 70,
      fixed: 'left',
    },
    {
      title: 'รหัสสายทาง',
      dataIndex: 'routeCode',
      key: 'routeCode',
      align: 'center',
      width: 120,
    },
    {
      title: 'จังหวัด',
      dataIndex: 'province',
      key: 'province',
      align: 'center',
      width: 140,
    },
    {
      title: 'หน่วยที่จัดตั้ง',
      dataIndex: 'unit',
      key: 'unit',
      align: 'center',
      width: 200,
    },
    {
      title: 'บูรณาการ',
      dataIndex: 'integration',
      key: 'integration',
      align: 'center',
      width: 160,
      render: (value: string | null) =>
        value ? (
          <span>{value}</span>
        ) : (
          <span style={{ color: '#FFFFFF50' }}>ไม่ร่วมบูรณาการ</span>
        ),
    },
    {
      title: 'เวลาตั้งด่าน',
      dataIndex: 'startTime',
      key: 'startTime',
      align: 'center',
      width: 120,
    },
    {
      title: 'เวลาสิ้นสุด',
      dataIndex: 'endTime',
      key: 'endTime',
      align: 'center',
      width: 140,
      render: (value: string | null) =>
        value ? (
          <span>{value}</span>
        ) : (
          <span style={{ color: '#FFA940' }}>ยังไม่สิ้นสุด</span>
        ),
    },
    {
      title: 'จำนวนรถเข้าชั่ง',
      dataIndex: 'totalVehicles',
      key: 'totalVehicles',
      align: 'center',
      width: 150,
    },
    {
      title: 'จำนวนรถน้ำหนักปกติ',
      dataIndex: 'normalWeight',
      key: 'normalWeight',
      align: 'center',
      width: 170,
      render: (value: number) => <span style={{ color: '#66AEFF' }}>{value}</span>,
    },
    {
      title: 'จำนวนรถน้ำหนักเกิน',
      dataIndex: 'overweight',
      key: 'overweight',
      align: 'center',
      width: 170,
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#FF7A45' : '#FFFFFF50' }}>{value}</span>
      ),
    },
    {
      title: 'จำนวนรถน้ำหนักเกิน 10%',
      dataIndex: 'overweight10',
      key: 'overweight10',
      align: 'center',
      width: 190,
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#FF7A45' : '#FFFFFF50' }}>{value}</span>
      ),
    },
    {
      title: 'สถานะ',
      key: 'status',
      align: 'center',
      width: 120,
      fixed: 'right',
      render: () => (
        <Button
          size="small"
          type="primary"
          ghost
          // style={{ minWidth: 80, borderRadius: 20 }}
          className='min-w-20! rounded-3xl!'
        >
          เปิดด่าน
        </Button>
      ),
    },
  ]

  return (
    <Table<WIMProjectRecord>
      columns={columns}
      dataSource={mockData}
      pagination={false}
      size="middle"
      rowKey="key"
      scroll={{ x: 'max-content' }}
      onRow={() => {
        return {
          onClick: () => router.push(`/admin/tracking/detail/mobile/EXAMPLE_MOBILE_ID`),
          className: 'cursor-pointer',
        }
      }}
    />
  )
}

export default React.memo<Props>(TableMobileData)
