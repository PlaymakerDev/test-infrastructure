"use client"
import React from 'react'
import { Input, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbSearch } from 'react-icons/tb'

interface LineRecord {
  key: string
  line: string
  installPoints: number
  devices: number
  offline: number
}

const LINE_COLUMNS: ColumnsType<LineRecord> = [
  { title: 'สายทาง', dataIndex: 'line', key: 'line' },
  {
    title: 'จุดติดตั้ง', dataIndex: 'installPoints', key: 'installPoints', align: 'center',
    render: (val: number) => <span style={{ color: '#FCD116' }}>{val}</span>,
  },
  { title: 'อุปกรณ์', dataIndex: 'devices', key: 'devices', align: 'center' },
  {
    title: 'ออฟไลน์', dataIndex: 'offline', key: 'offline', align: 'center',
    render: (val: number) => (
      <span style={{ backgroundColor: '#E94C4C', color: '#FFFFFF', borderRadius: 88, width: 50, display: 'inline-block', textAlign: 'center' }}>
        {val}
      </span>
    ),
  },
]

const LINE_DATA: LineRecord[] = [
  { key: '1', line: 'ฉซ.3001', installPoints: 12, devices: 48, offline: 3 },
  { key: '2', line: 'ฉซ.3002', installPoints: 8, devices: 32, offline: 1 },
  { key: '3', line: 'ฉช.2001', installPoints: 15, devices: 60, offline: 5 },
  { key: '4', line: 'ฉช.2002', installPoints: 10, devices: 40, offline: 2 },
]

const DEVICES = [
  { label: 'CCTV', percent: 73, color: '#FF8566' },
  { label: 'Traffic', percent: 67, color: '#FFC766' },
  { label: 'Signal', percent: 63, color: '#D9FF66' },
  { label: 'Lighting', percent: 84, color: '#70FF66' },
  { label: 'VMS', percent: 64, color: '#66FFB5' },
  { label: 'WIM', percent: 58, color: '#66F0FF' },
  { label: 'CrossWalk', percent: 32, color: '#668CFF' },
  { label: 'Tunnel', percent: 73, color: '#FF8566' },
]

const MaintenanceOverviewSection: React.FC = () => {
  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4">
        <div className="rounded-[20px] bg-[#191919] p-5 self-start">
          <div className="flex items-center gap-2">
            <img src="/atlas/images/Maintenance/icsolu.png" alt="solution" width={30} height={30} />
            <h2 className="text-[32px] font-bold text-[#FCD116]">Solution Overview</h2>
          </div>
          <p className="text-xs font-normal text-[#979797] mt-1">ภาพรวมสถานะการทำงานของอุปกรณ์</p>
          <div className="mt-5 flex flex-wrap justify-between gap-4">
            {DEVICES.map(device => (
              <div key={device.label} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#333333" strokeWidth="10" />
                    <circle
                      cx="48" cy="48" r="40" fill="none"
                      stroke={device.color}
                      strokeWidth="10"
                      strokeDasharray={`${(device.percent / 100) * 251.33} 251.33`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold leading-none" style={{ color: device.color }}>{device.percent}%</span>
                    <span className="text-xs leading-none mt-0.5" style={{ color: device.color }}>Online</span>
                  </div>
                </div>
                <span className="text-2xl font-bold" style={{ color: device.color }}>{device.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[20px] bg-[#191919] p-5 lg:row-span-3">
          <div className="flex items-center gap-2">
            <img src="/atlas/images/Maintenance/ics1.png" alt="line-down" width={30} height={30} />
            <h2 className="text-[32px] font-bold text-[#E94C4C]">สายทางดับทุกจุดติดตั้ง</h2>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <Input
              placeholder="ค้นหาหน่วยงาน..."
              className="rounded-lg flex-1"
              prefix={<TbSearch style={{ color: '#FCD116' }} />}
              size="large"
              allowClear
              styles={{
                input: { fontSize: 14, fontWeight: 400, color: '#FFFFFF' },
              }}
            />
            <span
              className="shrink-0 flex items-center"
              style={{ height: 32, padding: '0 12px', borderRadius: 9999, border: '1px solid #E94C4C', color: '#E94C4C', fontSize: 13, whiteSpace: 'nowrap' }}
            >
              35 สายทาง
            </span>
            <style>{`
              .ant-input-wrapper .ant-input::placeholder,
              .ant-input::placeholder {
                color: #FCD116 !important;
                font-weight: 400;
                font-size: 14px;
              }
              .ant-input-wrapper,
              .ant-input-affix-wrapper {
                border-color: #FCD116 !important;
              }
              .ant-input-wrapper:hover,
              .ant-input-affix-wrapper:hover {
                border-color: #FCD116 !important;
              }
              .ant-input-wrapper:focus-within,
              .ant-input-affix-wrapper-focused {
                border-color: #FCD116 !important;
                box-shadow: 0 0 0 2px rgba(252, 209, 22, 0.1) !important;
              }
              .line-table .ant-table-tbody > tr > td {
                border-bottom: 1px solid #FCD116 !important;
              }
              .line-table .ant-table-tbody > tr:last-child > td {
                border-bottom: none !important;
              }
            `}</style>
          </div>
          <div className="mt-4">
            <Table
              columns={LINE_COLUMNS}
              dataSource={LINE_DATA}
              pagination={false}
              size="small"
              rowKey="key"
              className="line-table"
            />
          </div>
        </div>
      <div className="rounded-[20px] bg-[#191919] p-5 self-start">
        <div className="flex items-center gap-2">
          <img src="/atlas/images/Maintenance/ics2.png" alt="support" width={30} height={30} />
          <h2 className="text-[32px] font-bold text-[#05F2DB]">งานในค้ำ</h2>
        </div>
        <p className="text-xs font-normal text-[#9E9CA8] mt-0.5">16 มีนาคม 2569 14:13:26</p>
        <div className="mt-2 flex">
          {[
            { value: '173', label: 'โครงการ', icon: '/atlas/images/Maintenance/icc1.png' },
            { value: '1,093', label: 'จุดติดตั้ง', icon: '/atlas/images/Maintenance/icc2.png' },
            { value: '6,113', label: 'อุปกรณ์', icon: '/atlas/images/Maintenance/icc3.png' },
            { value: '4,191', label: 'ออนไลน์', icon: '/atlas/images/statistics/iconconnect.png', color: '#66AEFF' },
            { value: '1,922', label: 'ออฟไลน์', icon: '/atlas/images/statistics/iconnoconnect.png', color: '#E94C4C' },
            { value: '253', label: 'เปิด Case', icon: '/atlas/images/Maintenance/icc6.png', color: '#FF9D00' },
            { value: '126', label: 'กำลังดำเนินการ', icon: '/atlas/images/Maintenance/icc7.png', color: '#B2FF00' },
            { value: '26', label: 'ปิด Case', icon: '/atlas/images/Maintenance/icc8.png', color: '#05F2DB' },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className="flex-1 text-center py-1"
              style={{ borderRight: i < arr.length - 1 ? '1px solid #FFFFFF' : undefined }}
            >
              <div className="text-[24px] font-bold" style={{ color: item.color || '#FFFFFF' }}>{item.value}</div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <img src={item.icon} alt="" width={14} height={14} />
                <span className="text-sm font-normal text-[#979797]">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[20px] bg-[#191919] p-5 self-start">
        <div className="flex items-center gap-2">
          <img src="/atlas/images/Maintenance/ics2.png" alt="support" width={30} height={30} />
          <h2 className="text-[32px] font-bold text-[#05F2DB]">งานหมดค้ำ</h2>
        </div>
        <p className="text-xs font-normal text-[#9E9CA8] mt-0.5">16 มีนาคม 2569 14:13:26</p>
        <div className="mt-2 flex">
          {[
            { value: '173', label: 'โครงการ', icon: '/atlas/images/Maintenance/icc1.png' },
            { value: '1,093', label: 'จุดติดตั้ง', icon: '/atlas/images/Maintenance/icc2.png' },
            { value: '6,113', label: 'อุปกรณ์', icon: '/atlas/images/Maintenance/icc3.png' },
            { value: '4,191', label: 'ออนไลน์', icon: '/atlas/images/statistics/iconconnect.png', color: '#66AEFF' },
            { value: '1,922', label: 'ออฟไลน์', icon: '/atlas/images/statistics/iconnoconnect.png', color: '#E94C4C' },
            { value: '253', label: 'เปิด Case', icon: '/atlas/images/Maintenance/icc6.png', color: '#FF9D00' },
            { value: '126', label: 'กำลังดำเนินการ', icon: '/atlas/images/Maintenance/icc7.png', color: '#B2FF00' },
            { value: '26', label: 'ปิด Case', icon: '/atlas/images/Maintenance/icc8.png', color: '#05F2DB' },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className="flex-1 text-center py-1"
              style={{ borderRight: i < arr.length - 1 ? '1px solid #FFFFFF' : undefined }}
            >
              <div className="text-[24px] font-bold" style={{ color: item.color || '#FFFFFF' }}>{item.value}</div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <img src={item.icon} alt="" width={14} height={14} />
                <span className="text-sm font-normal text-[#979797]">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default React.memo(MaintenanceOverviewSection)
