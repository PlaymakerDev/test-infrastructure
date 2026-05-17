"use client"
import React, { useState } from 'react'
import { Table, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import styles from './alertHistory.module.css'

interface SignItem {
  id: string
  name: string
  category: string
  contentType: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  duration: string
  online: boolean
}

interface RouteData {
  id: string
  name: string
  description: string
  region: string
  period: string
  signs: SignItem[]
}

const ROUTES: RouteData[] = [
  {
    id: 'ch4050',
    name: 'ฉช.4050',
    description: 'แขวงถนนหลวงชนบทฉะเชิงเทรา',
    region: 'ภาคตะวันออก',
    period: '1 เม.ย. 2569 - 30 เม.ย. 2569',
    signs: [
      { id: 's1', name: 'จุดติดตั้ง : VMS >> ฉช.4050 จุดที่ 1', category: 'การท่องเที่ยว', contentType: 'รูปภาพ', startDate: '23 เม.ย. 2569', startTime: '16:00 น.', endDate: '23 เม.ย. 2569', endTime: '24:00 น.', duration: '8 ชั่วโมง', online: true },
      { id: 's2', name: 'จุดติดตั้ง : VMS >> ฉช.4050 จุดที่ 2', category: 'การท่องเที่ยว', contentType: 'รูปภาพ', startDate: '23 เม.ย. 2569', startTime: '16:00 น.', endDate: '23 เม.ย. 2569', endTime: '24:00 น.', duration: '8 ชั่วโมง', online: true },
      { id: 's3', name: 'จุดติดตั้ง : ฉช.4050 - VMS จุดที่ 3', category: 'การท่องเที่ยว', contentType: 'รูปภาพ', startDate: '23 เม.ย. 2569', startTime: '16:00 น.', endDate: '23 เม.ย. 2569', endTime: '24:00 น.', duration: '8 ชั่วโมง', online: true },
    ],
  },
  {
    id: 'kb3059',
    name: 'ขบ.3059',
    description: 'แนวถนนหลวงชนบทกาญจนบุรี',
    region: 'ภาคตะวันตก',
    period: '1 พ.ค. 2569 - 31 พ.ค. 2569',
    signs: [
      { id: 'k1', name: 'จุดติดตั้ง : VMS >> ขบ.3059 จุด 1', category: 'ซ่อมแซมถนน', contentType: 'รูปภาพ', startDate: '12 พ.ค. 2569', startTime: '00:00 น.', endDate: '22 พ.ค. 2569', endTime: '00:00 น.', duration: '10 วัน', online: true },
      { id: 'k2', name: 'จุดติดตั้ง : VMS >> ขบ.3059 จุด 2', category: 'ซ่อมแซมถนน', contentType: 'รูปภาพ', startDate: '12 พ.ค. 2569', startTime: '00:00 น.', endDate: '22 พ.ค. 2569', endTime: '00:00 น.', duration: '10 วัน', online: true },
    ],
  },
]

const WifiIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" fill="currentColor" />
  </svg>
)

const columns: ColumnsType<SignItem> = [
  {
    title: 'จุดติดตั้ง',
    dataIndex: 'name',
    key: 'name',
    width: 280,
    render: (value: string) => <span style={{ color: '#fff', fontWeight: 500 }}>{value}</span>,
  },
  {
    title: 'หมวดหมู่',
    dataIndex: 'category',
    key: 'category',
    align: 'center',
    width: 140,
  },
  {
    title: 'ประเภทเนื้อหา',
    dataIndex: 'contentType',
    key: 'contentType',
    align: 'center',
    width: 130,
  },
  {
    title: 'วันที่และเวลาเริ่มต้น',
    key: 'startDateTime',
    align: 'center',
    width: 180,
    render: (_: unknown, record: SignItem) => (
      <span style={{ fontSize: 12, lineHeight: 1.6 }}>
        {record.startDate}<br />{record.startTime}
      </span>
    ),
  },
  {
    title: 'วันที่และเวลาสิ้นสุด',
    key: 'endDateTime',
    align: 'center',
    width: 180,
    render: (_: unknown, record: SignItem) => (
      <span style={{ fontSize: 12, lineHeight: 1.6 }}>
        {record.endDate}<br />{record.endTime}
      </span>
    ),
  },
  {
    title: 'แสดงผล',
    dataIndex: 'duration',
    key: 'duration',
    align: 'center',
    width: 120,
    render: (value: string) => <span style={{ color: '#00e27a', fontWeight: 600 }}>{value}</span>,
  },
  {
    title: 'สถานะ',
    key: 'status',
    align: 'center',
    width: 120,
    render: (_: unknown, record: SignItem) =>
      record.online ? (
        <Button
          size="small"
          type="primary"
          ghost
          className='min-w-20! rounded-3xl!'
          icon={<WifiIcon />}
        >
          ออนไลน์
        </Button>
      ) : null,
  },
]

const TableAlertHistory: React.FC = () => {
  const [search, setSearch] = useState('')

  const filtered = ROUTES.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.routeListWrap}>
      <div className={styles.routeListToolbar}>
        <span className={styles.routeListTitle}>สายทางที่มีตารางเวลา</span>
        <div className={styles.routeListRight}>
          <div className={styles.searchWrap}>
            <input
              className={styles.searchInput}
              placeholder="ค้นหาสายทาง..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className={styles.searchIcon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>
          <button className={styles.btnReport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            นำออกเอกสาร
          </button>
        </div>
      </div>

      {filtered.map(route => (
        <div key={route.id} className={styles.routeCard}>
          <div className={styles.routeCardHeader}>
            <div>
              <div className={styles.routeNameRow}>
                <span className={styles.routeActiveDot} />
                <span className={styles.routeName}>{route.name}</span>
                
              </div>
              <div className={styles.routeMeta}>
                {route.description} &bull; {route.region} 
            <span className={styles.routeDate}> {route.period}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 30px 30px' }}>
            <Table<SignItem>
              columns={columns}
              dataSource={route.signs}
              pagination={false}
              size="middle"
              rowKey="id"
              scroll={{ x: 'max-content' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default React.memo(TableAlertHistory)

