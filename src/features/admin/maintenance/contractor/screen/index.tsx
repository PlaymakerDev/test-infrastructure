"use client"
import React, { useMemo, useState } from 'react'
import { Input, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { TbSearch, TbMail, TbPhone } from 'react-icons/tb'
import { getContractorSummaryAPI } from '@/services/routes/MaintenanceService'
import type { ContractorSummaryRow } from '@/types/maintenance'
import MaintenanceMinimumFontSize from '../../components/MaintenanceMinimumFontSize'

/** "หน้าสรุปผู้รับจ้าง" — one row per contractor with offline device totals
 *  per solution type + open case count. Sorted by total_offline (highest =
 *  worst) so operators see the vendors that need the most attention up top.
 *  No dept scope: contractors span the whole country. Client-side search
 *  filters short_name/company_name/email/phone. */
const ContractorSummaryScreen: React.FC = () => {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', 'contractor-summary'] as const,
    queryFn: () => getContractorSummaryAPI().then((r) => r.data),
    refetchInterval: 60_000,
  })

  const rows = useMemo(() => {
    const list = data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((r) =>
      [r.short_name, r.company_name, r.email, r.phone]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    )
  }, [data, search])

  const totals = useMemo(() => {
    const list = data ?? []
    return list.reduce(
      (acc, r) => ({
        contractors: acc.contractors + 1,
        offline: acc.offline + r.total_offline,
        openCases: acc.openCases + r.open_cases,
      }),
      { contractors: 0, offline: 0, openCases: 0 }
    )
  }, [data])

  const columns: ColumnsType<ContractorSummaryRow> = [
    {
      title: 'ผู้รับจ้าง',
      key: 'contractor',
      width: 260,
      fixed: 'left',
      render: (_: unknown, r) => (
        <div className='min-w-0'>
          <div className='text-white font-medium truncate'>{r.company_name || r.short_name}</div>
          <div className='text-white/50 fs-12 uppercase tracking-wide'>{r.short_name}</div>
        </div>
      ),
    },
    {
      title: 'ติดต่อ',
      key: 'contact',
      width: 260,
      render: (_: unknown, r) => (
        <div className='min-w-0 space-y-0.5 fs-12'>
          <div className='flex items-center gap-1.5 text-white/80'>
            <TbMail size={14} className='shrink-0' />
            <span className='truncate'>{r.email || <span className='text-white/40'>—</span>}</span>
          </div>
          <div className='flex items-center gap-1.5 text-white/60'>
            <TbPhone size={14} className='shrink-0' />
            <span className='truncate'>{r.phone || <span className='text-white/40'>—</span>}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'โครงการ',
      dataIndex: 'projects',
      key: 'projects',
      width: 90,
      align: 'right',
      sorter: (a, b) => a.projects - b.projects,
      render: (v: number) => <span className='text-white/90 tabular-nums'>{v.toLocaleString('th-TH')}</span>,
    },
    {
      title: 'สายทาง',
      dataIndex: 'roads',
      key: 'roads',
      width: 90,
      align: 'right',
      sorter: (a, b) => a.roads - b.roads,
      render: (v: number) => <span className='text-white/90 tabular-nums'>{v.toLocaleString('th-TH')}</span>,
    },
    // Per-type: show "<offline> / <total>" so operators can read both scale + trouble at a glance.
    ...(
      [
        ['CCTV', 'cctv_offline', 'cctv_total'],
        ['Traffic', 'traffic_offline', 'traffic_total'],
        ['VMS', 'vms_offline', 'vms_total'],
        ['Lighting', 'lighting_offline', 'lighting_total'],
        ['B.Light', 'bridge_lighting_offline', 'bridge_lighting_total'],
        ['WIM', 'wim_offline', 'wim_total'],
      ] as const
    ).map(([label, offlineKey, totalKey]) => ({
      title: label,
      key: label,
      width: 110,
      align: 'right' as const,
      render: (_: unknown, r: ContractorSummaryRow) => {
        const off = r[offlineKey] as number
        const total = r[totalKey] as number
        if (total === 0) return <span className='text-white/25'>—</span>
        return (
          <span className='tabular-nums'>
            <span className={off > 0 ? 'text-red-400 font-semibold' : 'text-white/80'}>
              {off}
            </span>
            <span className='text-white/40'> / {total}</span>
          </span>
        )
      },
    })),
    {
      title: 'ออฟไลน์รวม',
      dataIndex: 'total_offline',
      key: 'total_offline',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.total_offline - b.total_offline,
      defaultSortOrder: 'descend',
      render: (v: number) =>
        v > 0
          ? <Tag color='red' className='tabular-nums'>{v.toLocaleString('th-TH')}</Tag>
          : <span className='text-white/40 tabular-nums'>0</span>,
    },
    {
      title: 'เคสที่ยังไม่ปิด',
      dataIndex: 'open_cases',
      key: 'open_cases',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.open_cases - b.open_cases,
      render: (v: number) =>
        v > 0
          ? <Tag color='orange' className='tabular-nums'>{v.toLocaleString('th-TH')}</Tag>
          : <span className='text-white/40 tabular-nums'>0</span>,
    },
  ]

  return (
    <div className='main-screen px-10 pt-8 pb-8 maintenance-font-min-14'>
      <MaintenanceMinimumFontSize />
      <div className='mb-6'>
        <h1 className='text-white text-2xl font-semibold mb-1'>สรุปผู้รับจ้าง</h1>
        <p className='text-white/50 fs-12'>
          ภาพรวมความรับผิดชอบของแต่ละผู้รับจ้าง — จำนวนอุปกรณ์ทั้งหมด, จำนวนที่ออฟไลน์อยู่ปัจจุบัน,
          และเคสที่ยังไม่ปิด ค่าออฟไลน์ยึดจาก is_online เดียวกับที่แผนที่หน้า Dashboard ใช้.
        </p>
      </div>

      {/* KPI strip */}
      <div className='grid grid-cols-3 gap-4 mb-6 max-w-2xl'>
        <StatTile label='ผู้รับจ้างที่มีโครงการ' value={totals.contractors} />
        <StatTile label='อุปกรณ์ออฟไลน์รวม' value={totals.offline} accent='#ef4444' />
        <StatTile label='เคสที่ยังไม่ปิด' value={totals.openCases} accent='#f59e0b' />
      </div>

      <div className='mb-4'>
        <Input
          allowClear
          size='large'
          placeholder='ค้นหาผู้รับจ้าง / อีเมล / เบอร์...'
          prefix={<TbSearch size={16} className='text-white/60' />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-md'
          style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
        />
      </div>

      <Table<ContractorSummaryRow>
        rowKey='user_id'
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        scroll={{ x: 1400 }}
        size='middle'
        className='bridge-projects-table'
      />
    </div>
  )
}

const StatTile: React.FC<{ label: string; value: number; accent?: string }> = ({ label, value, accent = '#FCD116' }) => (
  <div
    className='px-4 py-3 rounded-lg'
    style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${accent}33` }}
  >
    <div className='text-white/60 fs-12 mb-1'>{label}</div>
    <div className='text-2xl font-bold tabular-nums' style={{ color: accent }}>
      {value.toLocaleString('th-TH')}
    </div>
  </div>
)

export default React.memo(ContractorSummaryScreen)
