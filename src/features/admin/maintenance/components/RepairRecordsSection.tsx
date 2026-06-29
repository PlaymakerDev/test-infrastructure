"use client"
import React, { useEffect, useState } from 'react'
import { Table, Input, Button, ConfigProvider, Tag, Segmented, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbSearch, TbPrinter, TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbChevronDown } from 'react-icons/tb'
import SwapButton from '@/components/swap-button/SwapButton'
import { useRouter, useSearchParams } from 'next/navigation'

const SUB_TAB_OPTIONS = [
  { label: 'สรุป Solution', value: 'SOLUTION' },
  { label: 'งานซ่อมทั้งหมด', value: 'ALL_REPAIRS' },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

interface RepairRecord {
  key: string
  region: string
  agency: string
  route: string
  installPoint: string
  caseNo: string
  warranty: 'ในค้ำ' | 'หมดค้ำ'
  type: string
  problemCategory: string
  device: string
  repairDate: string
  offlineDays: number
  repairStatus: 'pending' | 'in_progress' | 'completed'
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'ยังไม่มีการตรวจเช็ค', color: '#E94C4C' },
  in_progress: { label: 'กำลังดำเนินการ', color: '#66AEFF' },
  completed: { label: 'ปิด Case', color: '#FCD116' },
}

const SOLUTION_TYPES = [
  { name: 'CCTV', installPoints: 194, devices: 1872 },
  { name: 'Traffic Volume', installPoints: 857, devices: 7251 },
  { name: 'Incident Detection', installPoints: 462, devices: 5283 },
  { name: 'Traffic Signal', installPoints: 82, devices: 1020 },
  { name: 'CrossWalk', installPoints: 9, devices: 160 },
  { name: 'Traffic Lighting', installPoints: 262, devices: 5465 },
  { name: 'VMS', installPoints: 39, devices: 459 },
  { name: 'BridgeLighting', installPoints: 194, devices: 1872 },
  { name: 'Tunnel', installPoints: 46, devices: 808 },
  { name: 'Weight in Motion (WIM)', installPoints: 5, devices: 46 },
]

const MOCK_DATA: RepairRecord[] = [
  { key: '1', region: 'ภาคกลาง', agency: 'ขทช.ปทุมธานี', route: 'ถนนวิภาวดีรังสิต', installPoint: 'จุดติดตั้งที่ 1', caseNo: 'C-20260301-001', warranty: 'ในค้ำ', type: 'CCTV', problemCategory: 'อุปกรณ์เสียหาย', device: 'DRR-TS-AICAM03', repairDate: '2025-05-01', offlineDays: 12, repairStatus: 'pending' },
  { key: '2', region: 'ภาคกลาง', agency: 'ขทช.นนทบุรี', route: 'ถนนงามวงศ์วาน', installPoint: 'จุดติดตั้งที่ 2', caseNo: 'C-20260302-002', warranty: 'หมดค้ำ', type: 'Traffic Volume', problemCategory: 'สายสัญญาณขาด', device: 'DRR-TS-NVR02', repairDate: '2025-05-02', offlineDays: 8, repairStatus: 'in_progress' },
  { key: '3', region: 'ภาคตะวันออก', agency: 'ขทช.สมุทรปราการ', route: 'ถนนสุขุมวิท', installPoint: 'จุดติดตั้งที่ 3', caseNo: 'C-20260303-003', warranty: 'ในค้ำ', type: 'VMS', problemCategory: 'ซอฟต์แวร์ขัดข้อง', device: 'DRR-TS-VMS01', repairDate: '2025-05-03', offlineDays: 3, repairStatus: 'completed' },
  { key: '4', region: 'ภาคตะวันตก', agency: 'ขทช.สมุทรสาคร', route: 'ถนนพระราม 2', installPoint: 'จุดติดตั้งที่ 4', caseNo: 'C-20260304-004', warranty: 'ในค้ำ', type: 'Incident Detection', problemCategory: 'อุปกรณ์เสียหาย', device: 'DRR-TS-ID01', repairDate: '2025-05-04', offlineDays: 15, repairStatus: 'pending' },
  { key: '5', region: 'ภาคตะวันตก', agency: 'ขทช.นครปฐม', route: 'ถนนเพชรเกษม', installPoint: 'จุดติดตั้งที่ 5', caseNo: 'C-20260305-005', warranty: 'หมดค้ำ', type: 'Traffic Signal', problemCategory: 'ไฟฟ้าขัดข้อง', device: 'DRR-TS-TS01', repairDate: '2025-05-05', offlineDays: 5, repairStatus: 'in_progress' },
  { key: '6', region: 'ภาคกลาง', agency: 'ขทช.ปทุมธานี', route: 'ถนนแจ้งวัฒนะ', installPoint: 'จุดติดตั้งที่ 6', caseNo: 'C-20260306-006', warranty: 'ในค้ำ', type: 'CCTV', problemCategory: 'เลนส์เสียหาย', device: 'DRR-TS-BulletCAM08', repairDate: '2025-05-06', offlineDays: 20, repairStatus: 'completed' },
  { key: '7', region: 'ภาคกลาง', agency: 'ขทช.อยุธยา', route: 'ทางหลวงหมายเลข 9', installPoint: 'จุดติดตั้งที่ 7', caseNo: 'C-20260307-007', warranty: 'หมดค้ำ', type: 'WIM', problemCategory: 'เซ็นเซอร์ขัดข้อง', device: 'DRR-TS-WIM01', repairDate: '2025-05-07', offlineDays: 7, repairStatus: 'pending' },
  { key: '8', region: 'ภาคกลาง', agency: 'ขทช.นนทบุรี', route: 'ถนนรัตนาธิเบศร์', installPoint: 'จุดติดตั้งที่ 8', caseNo: 'C-20260308-008', warranty: 'ในค้ำ', type: 'Traffic Lighting', problemCategory: 'หลอดไฟดับ', device: 'DRR-TS-TL01', repairDate: '2025-05-08', offlineDays: 4, repairStatus: 'in_progress' },
]

// Tree mock data interfaces
interface InstallPoint {
  id: string
  name: string
  subtitle: string
  blueCount: number
  redCount: number
}

interface SubAgency {
  id: string
  name: string
  projects: number
  installPoints: number
  devices: number
  blueCount: number
  redCount: number
  points: InstallPoint[]
}

interface Agency {
  id: string
  name: string
  projects: number
  installPoints: number
  devices: number
  blueCount: number
  redCount: number
  subAgencies: SubAgency[]
}

const AGENCIES_MOCK: Agency[] = [
  {
    id: 'agency-1',
    name: 'บทช.กัลปพฤกษ์',
    projects: 6,
    installPoints: 8,
    devices: 320,
    blueCount: 5,
    redCount: 2,
    subAgencies: [
      {
        id: 'sub-1001',
        name: 'สะพานตากสิน',
        projects: 3,
        installPoints: 4,
        devices: 120,
        blueCount: 2,
        redCount: 1,
        points: [
          { id: '1001-1', name: 'จุดติดตั้งที่ 1', subtitle: 'GS - CCTV ถนนกัลปพฤกษ์ เขตบางแค', blueCount: 0, redCount: 1 },
          { id: '1001-2', name: 'จุดติดตั้งที่ 2', subtitle: 'GS - CCTV+AI สะพานสมเด็จพระเจ้าตากสินมหาราช เขตคลองสาน, สาทร, บางรัก กทม.', blueCount: 49, redCount: 30 },
          { id: '1001-3', name: 'จุดติดตั้งที่ 3', subtitle: 'ไม่ระบุชื่อโครงการ', blueCount: 0, redCount: 5 },
        ],
      },
      {
        id: 'sub-1002',
        name: 'สะพานกรุงเทพ',
        projects: 2,
        installPoints: 3,
        devices: 85,
        blueCount: 3,
        redCount: 0,
        points: [
          { id: '1002-1', name: 'จุดติดตั้งที่ 1', subtitle: 'GS - Traffic Lighting ถนนราชพฤกษ์ เขตภาษีเจริญ', blueCount: 12, redCount: 0 },
          { id: '1002-2', name: 'จุดติดตั้งที่ 2', subtitle: 'ไม่ระบุชื่อโครงการ', blueCount: 0, redCount: 3 },
        ],
      },
    ],
  },
  {
    id: 'agency-2',
    name: 'สทช. 1 (ปทุมธานี)',
    projects: 21,
    installPoints: 28,
    devices: 245,
    blueCount: 22,
    redCount: 5,
    subAgencies: [
      {
        id: 'sub-2001',
        name: 'ติวานนท์',
        projects: 2,
        installPoints: 3,
        devices: 95,
        blueCount: 8,
        redCount: 2,
        points: [
          { id: '2001-1', name: 'จุดติดตั้งที่ 1', subtitle: 'GS - Traffic Signal ถนนติวานนท์ เขตเมืองปทุมธานี', blueCount: 0, redCount: 5 },
          { id: '2001-2', name: 'จุดติดตั้งที่ 2', subtitle: 'GS - VMS ทางหลวงหมายเลข 9 บางปะอิน', blueCount: 0, redCount: 3 },
          { id: '2001-3', name: 'จุดติดตั้งที่ 3', subtitle: 'ไม่ระบุชื่อโครงการ', blueCount: 0, redCount: 2 },
        ],
      },
      {
        id: 'sub-2002',
        name: 'รังสิต',
        projects: 3,
        installPoints: 4,
        devices: 80,
        blueCount: 6,
        redCount: 1,
        points: [
          { id: '2002-1', name: 'จุดติดตั้งที่ 1', subtitle: 'GS - CCTV ถนนรังสิต-นครนายก คลองหลวง', blueCount: 0, redCount: 4 },
          { id: '2002-2', name: 'จุดติดตั้งที่ 2', subtitle: 'ไม่ระบุชื่อโครงการ', blueCount: 0, redCount: 2 },
        ],
      },
      {
        id: 'sub-2003',
        name: 'บางนา',
        projects: 2,
        installPoints: 3,
        devices: 70,
        blueCount: 5,
        redCount: 2,
        points: [
          { id: '2003-1', name: 'จุดติดตั้งที่ 1', subtitle: 'GS - Incident Detection ทางด่วนบางนา-บางพลี', blueCount: 0, redCount: 3 },
          { id: '2003-2', name: 'จุดติดตั้งที่ 2', subtitle: 'GS - CrossWalk ถนนศรีนครินทร์ เขตบางนา', blueCount: 0, redCount: 2 },
          { id: '2003-3', name: 'จุดติดตั้งที่ 3', subtitle: 'ไม่ระบุชื่อโครงการ', blueCount: 0, redCount: 4 },
        ],
      },
    ],
  },
]

const STATUS_TABS = [
  { label: 'ทั้งหมด', count: 8, value: 'ALL', statusFilter: null },
  { label: 'ยังไม่มีการตรวจเช็ค', count: 3, value: 'UNCHECKED', statusFilter: 'pending' },
  { label: 'กำลังดำเนินการ', count: 3, value: 'IN_PROGRESS', statusFilter: 'in_progress' },
  { label: 'ปิด Case', count: 2, value: 'CLOSED', statusFilter: 'completed' },
]

const RepairRecordsSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [searchOpen, setSearchOpen] = useState(true)
  const [selectedSolution, setSelectedSolution] = useState(SOLUTION_TYPES[0])
  const [expandedAgency, setExpandedAgency] = useState<string | null>(null)
  const [expandedSub, setExpandedSub] = useState<string | null>(null)
  const [activeStatusTab, setActiveStatusTab] = useState('ALL')
  const activeSubTab = searchParams.has('all_repairs') ? 'ALL_REPAIRS' : 'SOLUTION'

  const filteredData = activeStatusTab === 'ALL'
    ? MOCK_DATA
    : MOCK_DATA.filter(item => item.repairStatus === STATUS_TABS.find(t => t.value === activeStatusTab)?.statusFilter)

  const handleSubTabChange = (value: string) => {
    if (value === 'ALL_REPAIRS') {
      router.push('/admin/maintenance?repair&all_repairs')
    } else {
      router.push('/admin/maintenance?repair')
    }
  }

  const columns: ColumnsType<RepairRecord> = [
    { title: 'ภูมิภาค', dataIndex: 'region', key: 'region', width: 120 },
    { title: 'หน่วยงาน', dataIndex: 'agency', key: 'agency', width: 160 },
    { title: 'สายทาง', dataIndex: 'route', key: 'route', width: 180 },
    { title: 'จุดติดตั้ง', dataIndex: 'installPoint', key: 'installPoint', width: 130 },
    { title: 'Case No.', dataIndex: 'caseNo', key: 'caseNo', width: 160 },
    {
      title: 'การค้ำประกัน', dataIndex: 'warranty', key: 'warranty', width: 140, align: 'center',
      render: (warranty: string) => (
        <span style={{
          color: warranty === 'ในค้ำ' ? '#05F2DB' : '#979797',
          border: `1px solid ${warranty === 'ในค้ำ' ? '#05F2DB' : '#979797'}`,
          borderRadius: 9999,
          padding: '2px 12px',
          fontSize: 14,
          fontWeight: 400,
        }}>
          {warranty}
        </span>
      ),
    },
    { title: 'ประเภท', dataIndex: 'type', key: 'type', width: 140 },
    { title: 'หมวดหมู่ปัญหา', dataIndex: 'problemCategory', key: 'problemCategory', width: 160 },
    { title: 'อุปกรณ์', dataIndex: 'device', key: 'device', width: 180 },
    { title: 'วันที่แจ้งซ่อม', dataIndex: 'repairDate', key: 'repairDate', width: 130 },
    {
      title: 'จำนวนวันออฟไลน์', dataIndex: 'offlineDays', key: 'offlineDays', width: 150, align: 'center',
      render: (days: number) => <span style={{ color: days > 10 ? '#E94C4C' : '#FFFFFF' }}>{days} วัน</span>,
    },
    {
      title: 'สถานะการซ่อม', dataIndex: 'repairStatus', key: 'repairStatus', width: 180, align: 'center',
      render: (status: string) => {
        const s = STATUS_MAP[status]
        return s ? (
          <span style={{
            color: s.color,
            border: `1px solid ${s.color}`,
            borderRadius: 9999,
            padding: '2px 12px',
            fontSize: 14,
            fontWeight: 400,
          }}>
            {s.label}
          </span>
        ) : null
      },
    },
  ]

  const renderBadge = (count: number, color: string) => (
    <span
      className="inline-flex items-center gap-1.5 text-[12px] font-normal whitespace-nowrap"
      style={{ padding: '2px 12px', borderRadius: 9999, border: `1px solid ${color}`, color, minWidth: 70, textAlign: 'center' }}
    >
      <img src={`/atlas/images/Maintenance/${color === '#66AEFF' ? 'icblue' : 'icred'}.png`} alt="" width={15} height={15} />
      <span style={{ marginTop: 2 }}>{count}</span>
    </span>
  )

  return (
    <div className="flex flex-col h-full">
      <section className="mt-5 px-3 sm:px-10 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SwapButton
          options={SUB_TAB_OPTIONS}
          defaultActive={activeSubTab}
          setLabelValue={handleSubTabChange}
          size={isMobile ? 'middle' : 'large'}
          key={activeSubTab}
        />
      </section>
      {activeSubTab === 'SOLUTION' && (
        <div className="mt-6 flex gap-4 flex-1 min-h-0">
          <div className="relative shrink-0 max-xl:hidden h-full">
            <div className={[
              'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) rounded-2xl h-full',
              searchOpen ? 'w-md' : 'w-0',
            ].join(' ')}>
              <div className="w-md h-full overflow-y-auto p-5">
                <p className="text-[16px] font-normal" style={{ color: '#66AEFF' }}>Solution Types</p>
                <p className="text-[12px] font-normal mt-1" style={{ color: '#979797' }}>เลือก Solution ที่ต้องการติดตามสถานะการทำงาน</p>
                <div className="mt-4 flex flex-col gap-2">
                  {SOLUTION_TYPES.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between px-3 py-2 rounded-[10px] cursor-pointer"
                      style={{
                        background: selectedSolution.name === item.name ? '#2A2A2A' : '#363636',
                        border: selectedSolution.name === item.name ? '1px solid #66AEFF' : '1px solid transparent',
                      }}
                      onClick={() => setSelectedSolution(item)}
                    >
                      <span className="text-[12px] font-normal shrink-0" style={{ color: '#66AEFF' }}>{item.name}</span>
                      <span className="text-[12px] font-normal whitespace-nowrap" style={{ color: '#979797' }}>
                        {item.installPoints} จุดติดตั้ง {item.devices.toLocaleString()} อุปกรณ์
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button
              type="primary"
              shape="circle"
              title={searchOpen ? 'ซ่อนรายการสายทาง' : 'แสดงรายการสายทาง'}
              icon={searchOpen
                ? <TbLayoutSidebarLeftCollapse className="fs-18" />
                : <TbLayoutSidebarLeftExpand className="fs-18" />
              }
              onClick={() => setSearchOpen((prev) => !prev)}
              className="absolute! top-10 -right-5 z-20 w-10! h-10! shadow-lg"
            />
          </div>
          <div className="flex-1 min-w-0 h-full pl-4 pr-4">
            <div className="flex items-center gap-4">
              <span className="text-[24px] font-bold" style={{ color: '#FCD116' }}>{selectedSolution.name}</span>
              <span
                className="inline-flex items-center gap-1.5 text-[12px] font-normal whitespace-nowrap"
                style={{ padding: '2px 12px', borderRadius: 9999, border: '1px solid #66AEFF', color: '#66AEFF', minWidth: 70, textAlign: 'center' }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#66AEFF' }} />
                <span style={{ marginTop: 2 }}>{selectedSolution.installPoints.toLocaleString()}</span>
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[12px] font-normal whitespace-nowrap"
                style={{ padding: '2px 12px', borderRadius: 9999, border: '1px solid #E94C4C', color: '#E94C4C', minWidth: 70, textAlign: 'center' }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#E94C4C' }} />
                <span style={{ marginTop: 2 }}>{selectedSolution.devices.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex items-center gap-6 mt-3">
              <span className="text-[12px] font-normal" style={{ color: '#E9D682' }}>25 หน่วยงาน</span>
              <span className="text-[12px] font-normal" style={{ color: '#E9D682' }}>123 โครงการ</span>
              <span className="text-[12px] font-normal" style={{ color: '#E9D682' }}>{selectedSolution.installPoints.toLocaleString()} จุดติดตั้ง</span>
              <span className="text-[12px] font-normal" style={{ color: '#E9D682' }}>{selectedSolution.devices.toLocaleString()} อุปกรณ์</span>
            </div>

            {/* Tree Structure */}
            {AGENCIES_MOCK.map((agency) => (
              <React.Fragment key={agency.id}>
                {/* Agency Level */}
                <div
                  className="flex items-center gap-4 mt-3 px-3 rounded-[10px] cursor-pointer"
                  style={{ background: '#292828', height: 40 }}
                  onClick={() => setExpandedAgency((prev) => (prev === agency.id ? null : agency.id))}
                >
                  <TbChevronDown
                    className="text-[16px] shrink-0 transition-transform duration-200"
                    style={{ color: '#FCD116', transform: expandedAgency === agency.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                  <span className="text-[16px] font-normal" style={{ color: '#FCD116' }}>{agency.name}</span>
                  <span className="text-[12px] font-normal" style={{ color: '#B4B4B4' }}>{agency.projects} โครงการ</span>
                  <span className="text-[12px] font-normal" style={{ color: '#B4B4B4' }}>{agency.installPoints} จุดติดตั้ง</span>
                  <span className="text-[12px] font-normal" style={{ color: '#B4B4B4' }}>{agency.devices} อุปกรณ์</span>
                  <div className="flex items-center gap-2" style={{ marginLeft: 'auto', width: 140, justifyContent: 'flex-start' }}>
                    {agency.blueCount > 0 && renderBadge(agency.blueCount, '#66AEFF')}
                    {agency.redCount > 0 && renderBadge(agency.redCount, '#E94C4C')}
                  </div>
                </div>

                {/* Sub Agency Level */}
                {expandedAgency === agency.id && agency.subAgencies.map((sub) => (
                  <React.Fragment key={sub.id}>
                    <div
                      className="flex items-center gap-4 mt-1 rounded-[10px] cursor-pointer"
                      style={{
                        background: '#151515',
                        height: 40,
                        paddingLeft: 36,
                        paddingRight: 12,
                        border: expandedSub === sub.id ? '1px solid #FCD116' : '1px solid transparent',
                      }}
                      onClick={() => setExpandedSub((prev) => (prev === sub.id ? null : sub.id))}
                    >
                      <TbChevronDown
                        className="text-[16px] shrink-0 transition-transform duration-200"
                        style={{ color: '#FCD116', transform: expandedSub === sub.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                      <span className="text-[14px] font-normal" style={{ color: '#FCD116' }}>{sub.name}</span>
                      <span className="text-[12px] font-normal" style={{ color: '#B4B4B4' }}>{sub.projects} โครงการ</span>
                      <span className="text-[12px] font-normal" style={{ color: '#B4B4B4' }}>{sub.installPoints} จุดติดตั้ง</span>
                      <span className="text-[12px] font-normal" style={{ color: '#B4B4B4' }}>{sub.devices} อุปกรณ์</span>
                      <div className="flex items-center gap-2" style={{ marginLeft: 'auto', width: 140, justifyContent: 'flex-start' }}>
                        {sub.blueCount > 0 && renderBadge(sub.blueCount, '#66AEFF')}
                        {sub.redCount > 0 && renderBadge(sub.redCount, '#E94C4C')}
                      </div>
                    </div>

                    {/* Install Points Level */}
                    {expandedSub === sub.id && sub.points.map((point) => (
                      <div
                        key={point.id}
                        className="flex items-center gap-4 mt-1 rounded-[10px] cursor-pointer"
                        style={{ background: '#151515', height: 40, paddingLeft: 60, paddingRight: 12 }}
                        onClick={() => router.push(`/admin/maintenance/detail/${point.id}?title=${sub.name}&subtitle=${point.subtitle}`)}
                      >
                        <span className="text-[14px] font-normal" style={{ color: '#FCD116' }}>{point.name}</span>
                        <span className="text-[12px] font-normal" style={{ color: '#B4B4B4' }}>{point.subtitle}</span>
                        <div className="flex items-center gap-2" style={{ marginLeft: 'auto', width: 140, justifyContent: 'flex-start' }}>
                          <span style={{ minWidth: 70 }} />
                          {point.blueCount > 0 && renderBadge(point.blueCount, '#66AEFF')}
                          {point.redCount > 0 && renderBadge(point.redCount, '#E94C4C')}
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      {activeSubTab === 'ALL_REPAIRS' && (
        <div className="mt-6 px-3 sm:px-10">
          {/* Status Tabs */}
          <div className="flex items-center gap-6 mb-5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STATUS_TABS.map((tab) => (
              <div
                key={tab.value}
                className="flex items-center gap-2 cursor-pointer shrink-0"
                style={{
                  padding: '8px 0',
                  borderBottom: activeStatusTab === tab.value ? '2px solid #FCD116' : '2px solid transparent',
                }}
                onClick={() => setActiveStatusTab(tab.value)}
              >
                <span style={{ fontSize: 14, fontWeight: activeStatusTab === tab.value ? 600 : 400, color: activeStatusTab === tab.value ? '#FCD116' : '#979797' }}>
                  {tab.label}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: activeStatusTab === tab.value ? '#FCD116' : '#979797',
                  border: `1px solid ${activeStatusTab === tab.value ? '#FCD116' : '#979797'}`,
                  borderRadius: 9999,
                  padding: '2px 10px',
                  minWidth: 36,
                  textAlign: 'center',
                }}>
                  {tab.count}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 ml-auto">
              <Input
                placeholder="ค้นหา Case No. หรือชื่ออุปกรณ์..."
                suffix={<TbSearch size={18} color='#FCD116' />}
                size="middle"
                style={{ width: isMobile ? '100%' : 320, height: 40, borderRadius: 10 }}
              />
              <Segmented
                options={PERIOD_OPTIONS}
                defaultValue="ALL"
                size={isMobile ? 'middle' : 'large'}
                classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
              />
            </div>
            <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
              <Button type="primary" size={isMobile ? 'middle' : 'large'} shape="round" icon={<TbPrinter />} style={{ height: 40 }}>
                <p>นำออกเอกสาร</p>
              </Button>
            </ConfigProvider>
          </div>
          {/* Filter Selects */}
          <div className="flex flex-wrap items-end gap-3 mb-4">
            {[
              { label: 'ภูมิภาค', placeholder: 'ภูมิภาคทั้งหมด...', width: 160 },
              { label: 'หน่วยงานรับผิดชอบ', placeholder: 'หน่วยงานทั้งหมด...', width: 200 },
              { label: 'สายทาง', placeholder: 'สายทางทั้งหมด...', width: 160 },
              { label: 'การค้ำประกัน', placeholder: 'สถานะการค้ำประกันทั้งหมด...', width: 240 },
              { label: 'หมวดหมู่ปัญหา', placeholder: 'หมวดหมู่ปัญหาทั้งหมด...', width: 200 },
            ].map((filter) => (
              <div key={filter.label} className="flex flex-col gap-1">
                <span style={{ fontSize: 16, fontWeight: 400, color: '#FCD116' }}>{filter.label}</span>
                <Select
                  placeholder={filter.placeholder}
                  style={{ width: filter.width, height: 40 }}
                  styles={{ selector: { borderRadius: 10, border: '1px solid #FCD116' } }}
                  suffixIcon={<TbChevronDown size={16} color='#FCD116' />}
                  options={[{ label: 'ตัวอย่าง', value: 'example' }]}
                />
              </div>
            ))}
          </div>
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={false}
            size="middle"
            rowKey="key"
            scroll={{ x: 'max-content' }}
          />
        </div>
      )}
    </div>
  )
}

export default React.memo(RepairRecordsSection)
