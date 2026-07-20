"use client"
import React from 'react'
import { Alert, Table, Input, Segmented } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbSearch, TbChevronRight } from 'react-icons/tb'
import useIsMobile from '@/utils/hooks/useIsMobile'

export interface ComparisonRecord {
  key: string
  agency: string
  installations: number
  online: number
  offline: number
  newCmdWeb?: number
  newCmdApp?: number
  lineCheck?: number
  circuit?: number
  voltAmp?: number
  isChild?: boolean
  /** Marks a leaf device row (the deepest level — no further children,
   *  no aggregate counts). Always renders with a solid black row background,
   *  regardless of expand state. */
  isDevice?: boolean
  /** Marks a road row. Always renders with the same (unstyled/transparent)
   *  background as a top-level row — never gets the expanded-row highlight,
   *  regardless of collapsed/expanded state. */
  isRoad?: boolean
  children?: ComparisonRecord[]
}

const isParent = (r: ComparisonRecord) => !r.isChild

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
  /** Auto-expand every top-level (non-`isChild`) row as soon as its data
   *  arrives, so the first nested level renders with no click required —
   *  only deeper levels stay collapsed until the user opens them. Leaves
   *  antd's own (fully click-driven) expand state untouched when omitted. */
  defaultExpandTopLevel?: boolean
  activePeriod?: string
  onPeriodChange?: (value: string) => void
  showPeriodSelector?: boolean
  /** Shows an Antd spinner overlay over the table while the data refetches
   *  (e.g. when switching the period). */
  loading?: boolean
  error?: boolean
  /** Keep summary badge placeholders visible on errors. The caller should
   * provide labels such as "— หน่วยงาน" instead of stale/zero values. */
  showSummaryBadgesOnError?: boolean
}

const StatisticsComparisonTable: React.FC<StatisticsComparisonTableProps> = ({ data, summaryBadges, columns, useArrowExpand, defaultExpandTopLevel, activePeriod: activePeriodProp, onPeriodChange, showPeriodSelector = true, loading, error, showSummaryBadgesOnError = false }) => {
  const [internalPeriod, setInternalPeriod] = React.useState('TODAY')
  const activePeriod = activePeriodProp ?? internalPeriod
  const handlePeriodChange = (value: string) => {
    setInternalPeriod(value)
    onPeriodChange?.(value)
  }
  const [searchText, setSearchText] = React.useState('')
  const isMobile = useIsMobile()

  // Tracks every currently-expanded row key (controlled, so a row's
  // background can react to its own expanded state — see onRow below). When
  // defaultExpandTopLevel is set, top-level keys are also auto-merged in as
  // soon as they appear, without clobbering keys the user has since
  // collapsed or expanded deeper down.
  const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>([])
  React.useEffect(() => {
    if (!defaultExpandTopLevel) return
    const topLevelKeys = data.filter((r) => !r.isChild).map((r) => r.key)
    setExpandedKeys((prev) => {
      const merged = new Set(prev)
      let changed = false
      for (const k of topLevelKeys) {
        if (!merged.has(k)) { merged.add(k); changed = true }
      }
      return changed ? Array.from(merged) : prev
    })
  }, [data, defaultExpandTopLevel])

  // Client-side filter on the agency name. Matches parent rows directly OR
  // child rows by their own name — a parent with no matching children but a
  // matching name still shows, and a parent whose children match keeps the
  // whole group (parent + its children) so the tree stays intact.
  const filteredData = React.useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    if (!keyword) return data
    return data.filter((row) => {
      const agency = (row.agency ?? '').toLowerCase()
      if (agency.includes(keyword)) return true
      // Keep the parent if any of its children match, plus those children.
      const matchingChildren = (row.children ?? []).filter((c) =>
        (c.agency ?? '').toLowerCase().includes(keyword)
      )
      return matchingChildren.length > 0
    })
  }, [data, searchText])

  return (
    <div className="mt-6 flex-1 p-3 sm:p-5 min-h-[400px] sm:min-h-[500px] lg:min-h-[580px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Input
            placeholder="ค้นหาหน่วยงาน..."
            className="rounded-lg"
            suffix={<TbSearch className='text-(--yellow)' />}
            size="middle"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: isMobile ? '100%' : 320, height: 40, minWidth: isMobile ? 200 : undefined, maxWidth: isMobile ? 320 : undefined }}
          />
          {(!error || showSummaryBadgesOnError) && !loading && (summaryBadges ?? []).map((b) => (
            <span key={b.label} style={{ height: 32, padding: '0 12px', borderRadius: 9999, border: `1px solid ${b.color}`, color: b.color, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: isMobile ? 11 : 13, whiteSpace: 'nowrap' }}>
              {b.icon && <img src={b.icon} alt="" width={16} height={16} />}
              {b.label}
            </span>
          ))}
        </div>
        {showPeriodSelector && (
          <Segmented
            value={activePeriod}
            onChange={(value) => handlePeriodChange(value as string)}
            options={PERIOD_OPTIONS}
            size={isMobile ? 'middle' : 'large'}
            classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
          />
        )}
      </div>
      {error ? (
        <Alert type="error" showIcon message="ไม่สามารถโหลดข้อมูลตารางเปรียบเทียบได้" />
      ) : (
        <Table
          columns={columns ?? COMPARISON_COLUMNS}
          dataSource={filteredData}
          loading={loading}
          locale={{ emptyText: 'ไม่พบข้อมูล' }}
          pagination={false}
          size="middle"
          rowKey="key"
          scroll={{ x: 'max-content' }}
          onRow={useArrowExpand ? (record) => {
            if (record.isDevice) return { style: { background: '#000000' } }
            // Road rows always match the top-level row's (unstyled) look,
            // collapsed or expanded — never get the highlight below.
            if (record.isRoad) return { style: undefined }
            // Top-level rows are force-expanded (see defaultExpandTopLevel)
            // and never actually "opened" by the user — only highlight rows
            // the user genuinely toggled open.
            const isForcedTopLevel = defaultExpandTopLevel && !record.isChild
            return {
              style: !isForcedTopLevel && expandedKeys.includes(record.key)
                ? { background: '#363636' }
                : undefined,
            }
          } : undefined}
          expandable={useArrowExpand ? {
            // 32 = the icon column's own reserved width (16px glyph + 4px
            // margin + 12px text padding, see expandIcon/COMPARISON_COLUMNS
            // below) — matching it here makes each level's expand icon land
            // exactly under its parent row's text start, like a normal tree.
            indentSize: 32,
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) => setExpandedKeys(keys as React.Key[]),
            expandIcon: ({ expanded, onExpand, record }) => {
              // Top-level rows are force-expanded via expandedKeys and
              // never meant to be collapsed — hide their chevron (keep the
              // reserved width so alignment doesn't shift) so only the
              // actually-toggleable levels show an arrow.
              const isForcedTopLevel = defaultExpandTopLevel && !record.isChild
              return record.children?.length && !isForcedTopLevel ? (
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
              ) : <span style={{ display: 'inline-block', width: 20 }} />
            },
          } : undefined}
          summary={(rows) => {
            const activeCols = (columns ?? COMPARISON_COLUMNS)
            const txt: React.CSSProperties = { color: '#FCD116', fontWeight: 600 }
            // Alert/Incident comparisons provide aggregate bureau rows and
            // their child departments as a flat list. Summing every visible
            // row would count the same installations/events twice. When at
            // least one aggregate row is present, total only those parents;
            // a child-only filtered result still totals the visible children.
            const rowsToTotal = rows.some((row) => !row.isChild)
              ? rows.filter((row) => !row.isChild)
              : rows
            return (
              <Table.Summary.Row style={{ background: '#191919' }}>
                {activeCols.map((col, i) => {
                  const key = (col as { dataIndex?: string }).dataIndex
                  if (i === 0) {
                    return <Table.Summary.Cell key={i} index={i}><span style={{ ...txt, paddingLeft: 12, display: 'inline-block' }}>รวมทุกหน่วยงาน</span></Table.Summary.Cell>
                  }
                  const sum = key
                    ? rowsToTotal.reduce((acc, r) => {
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
      )}
    </div>
  )
}

export default StatisticsComparisonTable
