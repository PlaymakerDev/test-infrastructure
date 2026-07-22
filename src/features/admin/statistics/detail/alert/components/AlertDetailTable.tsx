"use client"
import React, { useMemo, useState } from 'react'
import { Alert, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import SearchBar, { type FilterConfig } from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useAllLightingAlerts } from '@/hooks/queries/lighting'
import type { AlertItem } from '@/types/lighting'

dayjs.extend(buddhistEra)
dayjs.locale('th')

// ── Badges ─────────────────────────────────────────────────────────────────────

// Alert level is derived from the raw UP/DOWN status — UP = Warning, DOWN = Alert.
const levelOf = (status: string): 'Warning' | 'Alert' => (status === 'DOWN' ? 'Alert' : 'Warning')

const LevelBadge = ({ status }: { status: string }) => {
  const level = levelOf(status)
  const color = level === 'Warning' ? '#FF9D00' : '#E94C4C'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 12px', borderRadius: 9999,
      fontSize: 12, whiteSpace: 'nowrap',
      border: `1px solid ${color}`, color,
    }}>
      {level}
    </span>
  )
}

const LineStatusBadge = ({ status }: { status: string }) => {
  const color = status === 'UP' ? '#66AEFF' : '#E94C4C'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 12px', borderRadius: 9999,
      fontSize: 12, whiteSpace: 'nowrap',
      border: `1px solid ${color}`, color,
    }}>
      {status}
    </span>
  )
}

const alertKey = (r: AlertItem) => `${r.imei}-${r.timestamp}-${r.equipment_id}-${r.incident}-${r.status}`

// ── Filter config ──────────────────────────────────────────────────────────────

const FILTER_CONFIG: FilterConfig[] = [
  { key: 'ALL', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'UP', label: 'UP', colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'DOWN', label: 'DOWN', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
]

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table (วันที่และเวลา → อุปกรณ์ → เหตุการณ์ → สถานะ);
// อุปกรณ์ exports the same Warning/Alert level the on-screen badge shows.
// `width` = Excel chars, `widthPct` = PDF table percent (sums to 100).
const ALERT_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: AlertItem, index: number) => string | number
}[] = [
  { header: 'วันที่และเวลา', width: 26, widthPct: 25, value: (r) => (r.timestamp ? dayjs(r.timestamp).format('D MMM BBBB HH:mm:ss') : '-') },
  { header: 'อุปกรณ์', width: 14, widthPct: 25, value: (r) => levelOf(r.equipment_id) },
  { header: 'เหตุการณ์', width: 34, widthPct: 32, value: (r) => r.incident || '-' },
  { header: 'สถานะ', width: 10, widthPct: 18, value: (r) => r.status || '-' },
]

// ── Component ──────────────────────────────────────────────────────────────────

interface AlertDetailTableProps {
  /** Validated IMEI from the owning route/detail pair. */
  imei: string
}

const AlertDetailTable: React.FC<AlertDetailTableProps> = ({ imei }) => {
  const [activeTab, setActiveTab] = useState('ALL')
  const [exportOpen, setExportOpen] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Full alert history (fetches every page — the old raw fetch here was
  // silently capped at the backend's 100-row-per-request limit).
  const { alerts, isLoading, isError } = useAllLightingAlerts(imei)

  const columns: ColumnsType<AlertItem> = useMemo(() => [
    {
      title: 'วันที่และเวลา',
      dataIndex: 'timestamp',
      key: 'timestamp',
      align: 'center',
      width: 200,
      render: (t: string) => {
        if (!t) return <span style={{ color: '#FFFFFF' }}>-</span>
        const d = dayjs(t).locale('th')
        return (
          <div style={{ lineHeight: 1.35 }}>
            <div style={{ color: '#FFFFFF' }}>{d.format('D MMM BBBB')}</div>
            <div style={{ color: '#979797' }}>{d.format('HH:mm:ss')}</div>
          </div>
        )
      },
    },
    {
      title: 'อุปกรณ์',
      dataIndex: 'equipment_id',
      key: 'equipment_id',
      align: 'center',
      width: 260,
      render: (eid: string, record: AlertItem) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <LevelBadge status={record.status} />
          <span style={{ color: '#FFFFFF' }}>{eid}</span>
        </div>
      ),
    },
    {
      title: 'เหตุการณ์',
      dataIndex: 'incident',
      key: 'incident',
      align: 'center',
      width: 260,
      render: (v: string) => <span style={{ color: '#66AEFF' }}>{v}</span>,
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 120,
      fixed: 'right',
      render: (s: string) => <LineStatusBadge status={s} />,
    },
  ], [])

  const stats = useMemo(() => ({
    ALL: alerts.length,
    UP: alerts.filter((a) => a.status === 'UP').length,
    DOWN: alerts.filter((a) => a.status === 'DOWN').length,
  }), [alerts])

  const filteredData = useMemo(() => {
    if (activeTab === 'ALL') return alerts
    return alerts.filter((a) => a.status === activeTab)
  }, [activeTab, alerts])

  // Human-readable note of the active filter — printed in the PDF header so a
  // reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    if (activeTab === 'ALL') return undefined
    return `สถานะ ${FILTER_CONFIG.find((f) => f.key === activeTab)?.label ?? activeTab}`
  }, [activeTab])

  // Reset to page 1 whenever the filter (or underlying data) changes, so a
  // filter switch never strands the view on a now-out-of-range page.
  React.useEffect(() => { setPage(1) }, [activeTab, alerts])

  if (isError) {
    return <Alert type="error" showIcon message="ไม่สามารถโหลดประวัติการแจ้งเตือนได้" />
  }

  if (isLoading) {
    return <div className="min-h-48 flex items-center justify-center"><Spin /></div>
  }

  return (
    <div>
      <section className="mb-4">
        <SearchBar
          filters={FILTER_CONFIG}
          stats={stats}
          defaultFilter="ALL"
          onFilterChange={(key) => setActiveTab(key)}
          showViewToggle={false}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED alerts (what the table
          shows, all pages), through the shared pdf/excel utils. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={filteredData.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Lighting_Alert_History_Report',
            title: 'รายงานประวัติการแจ้งเตือนไฟฟ้าแสงสว่าง (Lighting Alert History)',
            filterNote: exportFilterNote,
            columns: ALERT_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: filteredData,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Lighting_Alert_History_Report',
            sheetName: 'Lighting Alerts',
            columns: ALERT_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: filteredData,
          })
        }}
      />
      <Table<AlertItem>
        columns={columns}
        dataSource={filteredData}
        loading={false}
        pagination={{
          current: page,
          pageSize,
          total: filteredData.length,
          onChange: setPage,
          showSizeChanger: false,
        }}
        size="middle"
        rowKey={alertKey}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default React.memo(AlertDetailTable)
