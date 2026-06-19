"use client"
import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff, TbX } from 'react-icons/tb'
import { TitleSection } from '../components'

interface Props {
  id: string
}

interface DeviceRecord {
  key: string
  status: string
  caseNo: string
  type: string
  brand: string
  model: string
  hostname: string
  ipAddress: string
  anydesk: string
  zerotier: string
  username: string
  password: string
  warranty: 'ในค้ำ' | 'หมดค้ำ'
}

const MOCK_DATA: DeviceRecord[] = [
  {
    key: '1',
    status: 'online',
    caseNo: 'C-20260331-0050',
    type: 'CCTV',
    brand: 'Hikvision',
    model: 'DS-2CD2T47G2-L',
    hostname: 'CCTV-TAKSIN-01',
    ipAddress: '192.168.1.101',
    anydesk: '123456789',
    zerotier: 'zt-001',
    username: 'admin',
    password: '********',
    warranty: 'ในค้ำ',
  },
  {
    key: '2',
    status: 'online',
    caseNo: '',
    type: 'CCTV',
    brand: 'Hikvision',
    model: 'DS-2CD2T47G2-L',
    hostname: 'CCTV-TAKSIN-02',
    ipAddress: '192.168.1.102',
    anydesk: '123456790',
    zerotier: 'zt-002',
    username: 'admin',
    password: '********',
    warranty: 'หมดค้ำ',
  },
  {
    key: '3',
    status: 'offline',
    caseNo: 'C-20260330-0012',
    type: 'AI Camera',
    brand: 'Dahua',
    model: 'IPC-HFW5442T-ASE',
    hostname: 'AI-TAKSIN-01',
    ipAddress: '192.168.1.103',
    anydesk: '123456791',
    zerotier: 'zt-003',
    username: 'admin',
    password: '********',
    warranty: 'ในค้ำ',
  },
  {
    key: '4',
    status: 'online',
    caseNo: '',
    type: 'Switch',
    brand: 'Cisco',
    model: 'C9200L-24P-4G',
    hostname: 'SW-TAKSIN-01',
    ipAddress: '192.168.1.1',
    anydesk: '123456792',
    zerotier: 'zt-004',
    username: 'admin',
    password: '********',
    warranty: 'หมดค้ำ',
  },
  {
    key: '5',
    status: 'online',
    caseNo: 'C-20260329-0088',
    type: 'NVR',
    brand: 'Hikvision',
    model: 'DS-7616NI-K2',
    hostname: 'NVR-TAKSIN-01',
    ipAddress: '192.168.1.200',
    anydesk: '123456793',
    zerotier: 'zt-005',
    username: 'admin',
    password: '********',
    warranty: 'ในค้ำ',
  },
  {
    key: '6',
    status: 'offline',
    caseNo: '',
    type: 'CCTV',
    brand: 'Hikvision',
    model: 'DS-2CD2T47G2-L',
    hostname: 'CCTV-TAKSIN-03',
    ipAddress: '192.168.1.104',
    anydesk: '123456794',
    zerotier: 'zt-006',
    username: 'admin',
    password: '********',
    warranty: 'หมดค้ำ',
  },
  {
    key: '7',
    status: 'online',
    caseNo: 'C-20260328-0015',
    type: 'AI Camera',
    brand: 'Dahua',
    model: 'IPC-HFW5442T-ASE',
    hostname: 'AI-TAKSIN-02',
    ipAddress: '192.168.1.105',
    anydesk: '123456795',
    zerotier: 'zt-007',
    username: 'admin',
    password: '********',
    warranty: 'ในค้ำ',
  },
  {
    key: '8',
    status: 'online',
    caseNo: '',
    type: 'Switch',
    brand: 'Cisco',
    model: 'C9200L-48P-4G',
    hostname: 'SW-TAKSIN-02',
    ipAddress: '192.168.1.2',
    anydesk: '123456796',
    zerotier: 'zt-008',
    username: 'admin',
    password: '********',
    warranty: 'หมดค้ำ',
  },
  {
    key: '9',
    status: 'offline',
    caseNo: 'C-20260327-0042',
    type: 'NVR',
    brand: 'Dahua',
    model: 'NVR5216-16P-I',
    hostname: 'NVR-TAKSIN-02',
    ipAddress: '192.168.1.201',
    anydesk: '123456797',
    zerotier: 'zt-009',
    username: 'admin',
    password: '********',
    warranty: 'ในค้ำ',
  },
  {
    key: '10',
    status: 'online',
    caseNo: '',
    type: 'CCTV',
    brand: 'Dahua',
    model: 'IPC-HDW5442TM-ASE',
    hostname: 'CCTV-TAKSIN-04',
    ipAddress: '192.168.1.106',
    anydesk: '123456798',
    zerotier: 'zt-010',
    username: 'admin',
    password: '********',
    warranty: 'ในค้ำ',
  },
]

const DetailContent: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const title = searchParams.get('title') || id
  const subtitle = searchParams.get('subtitle') || ''
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<DeviceRecord | null>(null)

  const columns: ColumnsType<DeviceRecord> = [
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const isOnline = status === 'online'
        return (
          <span
            className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-normal whitespace-nowrap'
            style={{ border: `1px solid ${isOnline ? '#66AEFF' : '#E94C4C'}`, color: isOnline ? '#66AEFF' : '#E94C4C' }}
          >
            {isOnline ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
            {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        )
      },
    },
    {
      title: 'Case No.',
      dataIndex: 'caseNo',
      key: 'caseNo',
      width: 180,
      align: 'center',
      render: (text: string, record: DeviceRecord) =>
        text ? (
          <span
            style={{ color: '#FCD116', cursor: 'pointer' }}
            onClick={() => router.push(`/admin/maintenance/case/${text}`)}
          >
            {text}
          </span>
        ) : (
          <button
            type='button'
            className='px-3 py-1 rounded-full text-[12px] font-normal whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity'
            style={{ background: '#FCD116', color: '#212121' }}
            onClick={() => {
              setSelectedDevice(record)
              setIsModalOpen(true)
            }}
          >
            เปิด Case
          </button>
        ),
    },
    { title: 'ประเภท', dataIndex: 'type', key: 'type', width: 120 },
    { title: 'ยี่ห้อ', dataIndex: 'brand', key: 'brand', width: 120 },
    { title: 'รุ่น', dataIndex: 'model', key: 'model', width: 180 },
    { title: 'Hostname', dataIndex: 'hostname', key: 'hostname', width: 160 },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 140 },
    { title: 'Anydesk', dataIndex: 'anydesk', key: 'anydesk', width: 120 },
    { title: 'ZeroTier', dataIndex: 'zerotier', key: 'zerotier', width: 120 },
    { title: 'Username', dataIndex: 'username', key: 'username', width: 120 },
    { title: 'Password', dataIndex: 'password', key: 'password', width: 120 },
  ]

  return (
    <div className='main-screen'>
      <TitleSection id={id} title={title} subtitle={subtitle} />
      <section className='mt-5 px-10'>
        <Table
          columns={columns}
          dataSource={MOCK_DATA}
          pagination={false}
          scroll={{ x: 'max-content' }}
          size='middle'
        />
      </section>

      {/* Custom White Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          {/* Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              zIndex: 1,
            }}
          />

          {/* Modal Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: 800,
              minHeight: 560,
              borderRadius: 20,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              padding: '24px 32px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ปิด */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <TbX size={20} color='#999' />
              </button>
            </div>

            {/* รูป */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <img
                src={selectedDevice?.warranty === 'ในค้ำ' ? '/atlas/images/Maintenance/icmd2.png' : '/atlas/images/Maintenance/icmd1.png'}
                alt='maintenance'
                style={{ width: 100, height: 100, objectFit: 'contain' }}
              />
            </div>

            {/* หัวข้อ */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: '#525252', margin: '0 0 8px 0', textAlign: 'center' }}>
              ยืนยันเปิด Case อุปกรณ์นี้หรือไม่?
            </h3>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#525252', margin: '0 0 24px 0', textAlign: 'center' }}>
              ระบบจะออก Case No. ให้อัตโนมัติ
            </p>

            {/* เนื้อหา */}
            <div
              style={{
                fontSize: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: 16,
                borderRadius: 12,
                backgroundColor: selectedDevice?.warranty === 'ในค้ำ' ? '#66AEFF33' : '#E94C4C33',
                border: `2px solid ${selectedDevice?.warranty === 'ในค้ำ' ? '#66AEFF' : '#E94C4C'}`,
              }}
            >
              <div><span style={{ color: '#979797' }}>ชื่อโครงการ : </span><span style={{ color: '#212121' }}>GS - CCTV+AI สะพานสมเด็จพระเจ้าตากสินมหาราช เขตคลองสาน, สาทร, บางรัก กทม.</span></div>
              <div><span style={{ color: '#979797' }}>ผู้รับจ้าง : </span><span style={{ color: '#212121' }}>Firsttech Design Co., Ltd.</span></div>
              <div><span style={{ color: '#979797' }}>หน่วยงานรับผิดชอบ : </span><span style={{ color: '#212121' }}>หมวดบำรุงทางหลวงชนบทกัลปพฤกษ์</span></div>
              <div><span style={{ color: '#979797' }}>เลขที่สัญญา : </span><span style={{ color: '#212121' }}>สบธ.88/2566</span></div>
              <div><span style={{ color: '#979797' }}>สถานะการค้ำประกัน : </span><span style={{ color: selectedDevice?.warranty === 'ในค้ำ' ? '#66AEFF' : '#E94C4C', fontWeight: 700, fontSize: 14 }}>{selectedDevice?.warranty || 'ในค้ำ'}</span></div>
              <div><span style={{ color: '#979797' }}>วันที่เริ่มต้น - สิ้นสุดการค้ำประกัน : </span><span style={{ color: '#212121' }}>22 ก.พ. 2566 - 22 มิ.ย. 2568 (2 ปี)</span></div>
            </div>

            {/* ปุ่ม */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 'auto',
                paddingTop: 32,
              }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 88,
                  fontSize: 14,
                  fontWeight: 500,
                  border: '1px solid #C4C4C4',
                  backgroundColor: '#FFFFFF',
                  color: '#212121',
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: 88,
                  fontSize: 14,
                  fontWeight: 500,
                  border: 'none',
                  backgroundColor: '#FCD116',
                  color: '#212121',
                  cursor: 'pointer',
                }}
              >
                เปิด Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MaintenanceDetailScreen: React.FC<Props> = ({ id }) => {
  return (
    <Suspense>
      <DetailContent id={id} />
    </Suspense>
  )
}

export default React.memo<Props>(MaintenanceDetailScreen)
