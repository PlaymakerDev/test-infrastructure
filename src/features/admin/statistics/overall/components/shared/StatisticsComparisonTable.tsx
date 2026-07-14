"use client"
import React, { useEffect, useState } from 'react'
import { Table, Input, Button, ConfigProvider, Segmented } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbSearch, TbPrinter, TbChevronRight } from 'react-icons/tb'

export interface ComparisonRecord {
  key: string
  agency: string
  installations: number
  online: number
  offline: number
  newCmdWeb: number
  newCmdApp: number
  lineCheck?: number
  circuit?: number
  voltAmp?: number
  isChild?: boolean
  children?: ComparisonRecord[]
}

const isParent = (r: ComparisonRecord) => !r.isChild

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

const COMPARISON_COLUMNS: ColumnsType<ComparisonRecord> = [
  {
    title: 'หน่วยงาน', dataIndex: 'agency', key: 'agency', width: 260,
    render: (v: string, r: ComparisonRecord) => (
      <span style={{ color: isParent(r) ? '#FCD116' : '#ffffff', fontWeight: isParent(r) ? 600 : 400, paddingLeft: 12, display: 'inline-block' }}>{v}</span>
    ),
  },
  {
    title: 'จุดติดตั้ง', dataIndex: 'installations', key: 'installations', align: 'center', width: 120,
    render: (v: number, r: ComparisonRecord) => (
      <span style={{ color: isParent(r) ? '#FCD116' : '#ffffff' }}>{v}</span>
    ),
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
    title: 'คำสั่งใหม่ผ่านหน้าเว็บ', dataIndex: 'newCmdWeb', key: 'newCmdWeb', align: 'center', width: 200,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#409994' } : {} }),
  },
  {
    title: 'คำสั่งใหม่ผ่านโปรแกรมติดตั้งป้าย', dataIndex: 'newCmdApp', key: 'newCmdApp', align: 'center', width: 240,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#6A9A2F' } : {} }),
  },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

export interface SummaryBadge {
  label: string
  color: string
  icon?: string
}

export interface StatisticsComparisonTableProps {
  data: ComparisonRecord[]
  summaryBadges?: SummaryBadge[]
  columns?: ColumnsType<ComparisonRecord>
  useArrowExpand?: boolean
}

const StatisticsComparisonTable: React.FC<StatisticsComparisonTableProps> = ({ data, summaryBadges, columns, useArrowExpand }) => {
  const [activePeriod, setActivePeriod] = React.useState('ALL')
  const isMobile = useIsMobile()

  return (
    <div className="mt-6 flex-1 p-3 sm:p-5 min-h-[400px] sm:min-h-[500px] lg:min-h-[580px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Input
            placeholder="ค้นหาหน่วยงาน..."
            className="rounded-lg"
            suffix={<TbSearch className='text-(--yellow)' />}
            size="middle"
            style={{ width: isMobile ? '100%' : 320, height: 40, minWidth: isMobile ? 200 : undefined, maxWidth: isMobile ? 320 : undefined }}
          />
          {(summaryBadges ?? [
            { label: '45 หน่วยงาน', color: '#B2FF00' },
            { label: '53 จุดติดตั้ง', color: '#66AEFF' },
            { label: '16 เหตุการณ์', color: '#05F2DB' },
          ]).map((b) => (
            <span key={b.label} style={{ height: 32, padding: '0 12px', borderRadius: 9999, border: `1px solid ${b.color}`, color: b.color, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: isMobile ? 11 : 13, whiteSpace: 'nowrap' }}>
              {b.icon && <img src={b.icon} alt="" width={16} height={16} />}
              {b.label}
            </span>
          ))}
          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button type="primary" size={isMobile ? 'middle' : 'large'} shape="round" icon={<TbPrinter />} style={{ height: 40 }}>
              <p>นำออกเอกสาร</p>
            </Button>
          </ConfigProvider>
        </div>
        <Segmented
          value={activePeriod}
          onChange={(value) => setActivePeriod(value as string)}
          options={PERIOD_OPTIONS}
          size={isMobile ? 'middle' : 'large'}
          classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
        />
      </div>
      <Table
        columns={columns ?? COMPARISON_COLUMNS}
        dataSource={data}
        pagination={false}
        size="middle"
        rowKey="key"
        scroll={{ x: 'max-content' }}
        expandable={useArrowExpand ? {
          expandIcon: ({ expanded, onExpand, record }) =>
            record.children?.length ? (
              <TbChevronRight
                onClick={(e) => onExpand(record, e as unknown as React.MouseEvent<HTMLElement>)}
                style={{
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  fontSize: 16,
                  transform: expanded ? 'rotate(270deg)' : 'rotate(90deg)',
                  transition: 'transform 0.2s',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: 4,
                }}
              />
            ) : <span style={{ display: 'inline-block', width: 20 }} />,
        } : undefined}
        summary={(rows) => {
          const activeCols = (columns ?? COMPARISON_COLUMNS)
          const txt: React.CSSProperties = { color: '#FCD116', fontWeight: 600 }
          return (
            <Table.Summary.Row style={{ background: '#191919' }}>
              {activeCols.map((col, i) => {
                const key = (col as { dataIndex?: string }).dataIndex
                if (i === 0) {
                  return <Table.Summary.Cell key={i} index={i}><span style={{ ...txt, paddingLeft: 12, display: 'inline-block' }}>รวมทุกหน่วยงาน</span></Table.Summary.Cell>
                }
                const sum = key
                  ? rows.reduce((acc, r) => {
                    const v = (r as unknown as Record<string, unknown>)[key]
                    return acc + (typeof v === 'number' && !isNaN(v) ? v : 0)
                  }, 0)
                  : ''
                return <Table.Summary.Cell key={i} index={i} align="center"><span style={txt}>{sum}</span></Table.Summary.Cell>
              })}
            </Table.Summary.Row>
          )
        }}
      />
    </div>
  )
}

export default StatisticsComparisonTable
