"use client"
import React, { useState, useCallback } from 'react'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { Segmented } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import SwapButton from '@/components/swap-button/SwapButton'
import { useStatisticsContext } from '../context'
import { StatisticsMapPanel, StatisticsComparisonTable } from './shared'
import type { ComparisonRecord, StatCard, SummaryBadge } from './shared'
import type { ColumnsType } from 'antd/es/table'

const SUB_TAB_OPTIONS = [
  { label: 'ภาพรวมเหตุการณ์', value: 'OVERVIEW' },
  { label: 'ตารางเปรียบเทียบเหตุการณ์', value: 'COMPARISON' },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const isParent = (r: ComparisonRecord) => !r.isChild

const ALERT_COMPARISON_COLUMNS: ColumnsType<ComparisonRecord> = [
  {
    title: 'หน่วยงาน', dataIndex: 'agency', key: 'agency', width: 260,
    render: (v: string, r: ComparisonRecord) => (
      <span style={{ color: isParent(r) ? '#FCD116' : '#ffffff', fontWeight: isParent(r) ? 600 : 400, paddingLeft: 12, display: 'inline-block' }}>{v}</span>
    ),
  },
  {
    title: 'จุดติดตั้ง', dataIndex: 'installations', key: 'installations', align: 'center', width: 120,
    render: (v: number, r: ComparisonRecord) => <span style={{ color: isParent(r) ? '#FCD116' : '#ffffff' }}>{v}</span>,
  },
  {
    title: 'ออนไลน์', dataIndex: 'online', key: 'online', align: 'center', width: 100,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#3A5692' } : {} }),
  },
  {
    title: 'ออฟไลน์', dataIndex: 'offline', key: 'offline', align: 'center', width: 100,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#853434' } : {} }),
  },
  {
    title: 'Line Check', dataIndex: 'lineCheck', key: 'lineCheck', align: 'center', width: 130,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v ?? '-'}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#5C4A0A' } : {} }),
  },
  {
    title: 'Circuit', dataIndex: 'circuit', key: 'circuit', align: 'center', width: 120,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v ?? '-'}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#5C4A0A' } : {} }),
  },
  {
    title: 'Volt / Amp', dataIndex: 'voltAmp', key: 'voltAmp', align: 'center', width: 120,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v ?? '-'}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#2E4A1A' } : {} }),
  },
]

const COMPARISON_MOCK_DATA: ComparisonRecord[] = [
  { key: '1', agency: 'สทช. 1 (กรุงเทพ)', installations: 5, online: 4, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 2, circuit: 1, voltAmp: 1 },
  {
    key: '1-1', agency: 'สทช. 1 (กรุงเทพ)', installations: 3, online: 3, offline: 0, newCmdWeb: 0, newCmdApp: 0, lineCheck: 1, circuit: 1, voltAmp: 0, isChild: true,
    children: [
      { key: '1-1-1', agency: 'ขทช.กรุงเทพ เหนือ', installations: 2, online: 2, offline: 0, newCmdWeb: 0, newCmdApp: 0, lineCheck: 1, circuit: 0, voltAmp: 0, isChild: true },
      { key: '1-1-2', agency: 'ขทช.กรุงเทพ ใต้', installations: 1, online: 1, offline: 0, newCmdWeb: 0, newCmdApp: 0, lineCheck: 0, circuit: 1, voltAmp: 0, isChild: true },
    ],
  },
  {
    key: '1-2', agency: 'ขทช.สมุทรปราการ', installations: 2, online: 1, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 1, circuit: 0, voltAmp: 1, isChild: true,
    children: [
      { key: '1-2-1', agency: 'ขทช.สมุทรปราการ สาขา 1', installations: 2, online: 1, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 1, circuit: 0, voltAmp: 1, isChild: true },
    ],
  },
  { key: '2', agency: 'สทช. 2 (สระบุรี)', installations: 8, online: 7, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 5, circuit: 3, voltAmp: 2 },
  {
    key: '2-1', agency: 'สทช. 2 (สระบุรี)', installations: 5, online: 5, offline: 0, newCmdWeb: 0, newCmdApp: 0, lineCheck: 3, circuit: 2, voltAmp: 1, isChild: true,
    children: [
      { key: '2-1-1', agency: 'ขทช.สระบุรี สาขา 1', installations: 3, online: 3, offline: 0, newCmdWeb: 0, newCmdApp: 0, lineCheck: 2, circuit: 1, voltAmp: 1, isChild: true },
      { key: '2-1-2', agency: 'ขทช.สระบุรี สาขา 2', installations: 2, online: 2, offline: 0, newCmdWeb: 0, newCmdApp: 0, lineCheck: 1, circuit: 1, voltAmp: 0, isChild: true },
    ],
  },
  {
    key: '2-2', agency: 'ขทช.นครราชสีมา', installations: 3, online: 2, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 2, circuit: 1, voltAmp: 1, isChild: true,
    children: [
      { key: '2-2-1', agency: 'ขทช.นครราชสีมา สาขา 1', installations: 3, online: 2, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 2, circuit: 1, voltAmp: 1, isChild: true },
    ],
  },
  { key: '3', agency: 'สทช. 10 (เชียงใหม่)', installations: 15, online: 12, offline: 3, newCmdWeb: 0, newCmdApp: 0, lineCheck: 8, circuit: 5, voltAmp: 4 },
  {
    key: '3-1', agency: 'สทช. 10 (เชียงใหม่)', installations: 8, online: 7, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 5, circuit: 3, voltAmp: 2, isChild: true,
    children: [
      { key: '3-1-1', agency: 'ขทช.เชียงใหม่ สาขา 1', installations: 5, online: 5, offline: 0, newCmdWeb: 0, newCmdApp: 0, lineCheck: 3, circuit: 2, voltAmp: 1, isChild: true },
      { key: '3-1-2', agency: 'ขทช.เชียงใหม่ สาขา 2', installations: 3, online: 2, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 2, circuit: 1, voltAmp: 1, isChild: true },
    ],
  },
  {
    key: '3-2', agency: 'ขทช.ลำปาง', installations: 4, online: 3, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 2, circuit: 1, voltAmp: 1, isChild: true,
    children: [
      { key: '3-2-1', agency: 'ขทช.ลำปาง สาขา 1', installations: 4, online: 3, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 2, circuit: 1, voltAmp: 1, isChild: true },
    ],
  },
  {
    key: '3-3', agency: 'ขทช.เชียงราย', installations: 3, online: 2, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 1, circuit: 1, voltAmp: 1, isChild: true,
    children: [
      { key: '3-3-1', agency: 'ขทช.เชียงราย สาขา 1', installations: 3, online: 2, offline: 1, newCmdWeb: 0, newCmdApp: 0, lineCheck: 1, circuit: 1, voltAmp: 1, isChild: true },
    ],
  },
]

const ALERT_SUMMARY_BADGES: SummaryBadge[] = [
  { label: '599 จุดติดตั้ง', color: '#66AEFF' },
  { label: '98 ออฟไลน์', color: '#E94C4C', icon: '/images/statistics/iconnoconnect.png.png' },
  { label: '243 Line Check', color: '#F29F05' },
  { label: '72 Circuit', color: '#FCD116' },
  { label: '72 Volt / Amp', color: '#83F205' },
]

const ALERT_CARDS: StatCard[] = [
  { borderColor: '#66AEFF', icon: '/images/statistics/c1.png', label: 'จุดติดตั้งทั้งหมด', labelColor: '#66AEFF', value: '53', unit: 'จุดติดตั้ง', sub: 'ภาคกลาง (75.6%)' },
  { borderColor: '#E94C4C', icon: '/images/statistics/ce2.png', label: 'สถานะสายผิดปกติ', labelColor: '#E94C4C', value: '244', unit: 'เหตุการณ์', sub: 'สทช. 6 (ขอนแก่น) (37.2%)' },
  { borderColor: '#E99A4C', icon: '/images/statistics/ce3.png', label: 'สถานะวงจรผิดปกติ', labelColor: '#E99A4C', value: '70', unit: 'เหตุการณ์', sub: 'สทช. 3 (ชลบุรี) (57.9%)' },
  { borderColor: '#FCD116', icon: '/images/statistics/ce4.png', label: 'การทำงานปกติรวม', labelColor: '#FCD116', value: '81.6%', sub: 'แจ้งเตือน 544 เหตุการณ์' },
]

const AlertSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setCurrentTab } = useStatisticsContext()
  const activeSubTab = (searchParams.get('subtab') || 'OVERVIEW').toUpperCase()
  const [activePeriod, setActivePeriod] = useState('ALL')
  const [searchText, setSearchText] = useState('')

  const handleBack = useCallback(() => router.push('/admin/statistics'), [router])

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 80px)', paddingBottom: 40 }}>
      <section className="flex items-start gap-3">
        <TbArrowBigLeftFilled className="fs-24 text-(--yellow) cursor-pointer" onClick={handleBack} style={{ marginTop: 10 }} />
        <div>
          <h1 className="text-(--yellow)">ไฟฟ้าแจ้งเตือน</h1>
          <p className="text-(--yellow)">สถิติและรายงานการแจ้งเตือนเหตุการณ์</p>
        </div>
      </section>
      <section className="mt-5">
        <SwapButton
          options={SUB_TAB_OPTIONS}
          defaultActive={activeSubTab}
          setLabelValue={(value) => router.push(`/admin/statistics?alert&subtab=${value.toLowerCase()}`)}
        />
      </section>
      {activeSubTab === 'OVERVIEW' && (
        <section className="mt-4">
          <Segmented
            value={activePeriod}
            onChange={(value) => setActivePeriod(value as string)}
            options={PERIOD_OPTIONS}
            size="large"
            classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
          />
        </section>
      )}
      {activeSubTab === 'OVERVIEW' && (
        <StatisticsMapPanel
          markerColorFn={(_item, index) => index % 2 === 0 ? '#FCD116' : '#E94C4C'}
          markerLabelFn={(_item, index) => index + 1}
          detailUrl="/admin/statistics/detail/alert"
          hideIndexBadge
          searchText={searchText}
          onSearchChange={setSearchText}
          statsCards={ALERT_CARDS}
        />
      )}
      {activeSubTab === 'COMPARISON' && (
        <StatisticsComparisonTable data={COMPARISON_MOCK_DATA} summaryBadges={ALERT_SUMMARY_BADGES} columns={ALERT_COMPARISON_COLUMNS} useArrowExpand />
      )}
    </div>
  )
}

export default React.memo(AlertSection)
