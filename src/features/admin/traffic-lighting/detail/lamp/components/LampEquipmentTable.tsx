"use client"
import React, { useMemo, useState } from 'react'
import { Button, ConfigProvider, Input, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbBulb, TbBulbOff, TbLink, TbPrinter, TbSearch, TbUnlink } from 'react-icons/tb'
import ExportFileModal from '@/components/export/ExportFileModal'
import StatusFilterChips, { type StatusFilterChip } from '../../components/StatusFilterChips'
import { useLampContext } from '../context'
import { LAMP_FAULT_COLOR, LAMP_WORKING_COLOR } from '../data/mockLampData'
import {
  LAMP_EXPORT_COLUMNS,
  currentLabel,
  filterLamps,
  hasLampStatus,
  lampExportNote,
  searchLamps,
  type LampFilter,
  type LampRow,
} from '../data/lampRows'

interface Props {
  rows: LampRow[]
  loading?: boolean
  isError?: boolean
}

/** A lamp point runs to 414 lamps — page them like the IoT Monitor table. */
const PAGE_SIZE = 50

const TITLE = 'ตารางข้อมูลอุปกรณ์แต่ละจุดติดตั้ง'
const EXPORT_FILENAME = 'Traffic_Lighting_Lamp_Equipment'
const NO_STATUS_YET = 'รอข้อมูลสถานะรายโคมจาก API'

/** Outlined pill used by both status columns — icon + label in the state
 *  colour, matching the 27px-high rounded tags in the design. */
const StatusPill: React.FC<{ ok: boolean; label: string; icon: React.ReactNode }> = ({ ok, label, icon }) => {
  const color = ok ? LAMP_WORKING_COLOR : LAMP_FAULT_COLOR
  return (
    <span
      className='inline-flex items-center justify-center gap-[3px] whitespace-nowrap'
      style={{
        height: 27,
        padding: '4px 10px',
        border: `1px solid ${color}`,
        borderRadius: 88,
        color,
      }}
    >
      {icon}
      {label}
    </span>
  )
}

const columns: ColumnsType<LampRow> = [
  {
    title: 'ลำดับโคม',
    dataIndex: 'order',
    key: 'order',
    // Keep the heading and row values aligned, but inset them a little more
    // from the left edge of this narrow column.
    onHeaderCell: () => ({ style: { paddingLeft: 28 } }),
    onCell: () => ({ style: { paddingLeft: 28 } }),
  },
  // A lamp's own node id (a LoRa DevEUI) — not an IMEI, which only a cabinet
  // has, so not the design's "IMEI".
  { title: 'รหัสอุปกรณ์', dataIndex: 'code', key: 'code' },
  {
    title: 'สถานะโคมไฟ', dataIndex: 'isWorking', key: 'isWorking',
    render: (isWorking: boolean | null) => isWorking == null ? '-' : (
      <StatusPill
        ok={isWorking}
        label={isWorking ? 'ทำงาน' : 'ไม่ทำงาน'}
        icon={isWorking ? <TbBulb size={20} /> : <TbBulbOff size={20} />}
      />
    ),
  },
  {
    title: 'การเชื่อมต่อ', dataIndex: 'isConnected', key: 'isConnected',
    render: (isConnected: boolean | null) => isConnected == null ? '-' : (
      <StatusPill
        ok={isConnected}
        label={isConnected ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ'}
        icon={isConnected ? <TbLink size={20} /> : <TbUnlink size={20} />}
      />
    ),
  },
  { title: 'กระแสไฟฟ้า (A)', dataIndex: 'current', key: 'current', render: currentLabel },
  { title: 'อัพเดตล่าสุด', dataIndex: 'updatedAt', key: 'updatedAt' },
]

/** ตารางข้อมูลอุปกรณ์แต่ละจุดติดตั้ง — one row per lamp, from
 *  `/lighting/solutions/{solution_id}/lamps` (`lampRowsFromLamps`), laid out
 *  as the Figma (user 2026-11-05): ทั้งหมด / UP / DOWN, นำออกเอกสาร, then six
 *  equal columns; a figure a lamp lacks reads "-". The search box (on the
 *  right, as SearchBar places it) narrows the rows the chips count, as the
 *  menu's overall page does. */
const LampEquipmentTable: React.FC<Props> = ({ rows, loading = false, isError = false }) => {
  const { project } = useLampContext()
  const [filter, setFilter] = useState<LampFilter>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [exportOpen, setExportOpen] = useState(false)

  const withStatus = hasLampStatus(rows)
  const searchedRows = useMemo(() => searchLamps(rows, search), [rows, search])
  const shownRows = useMemo(() => filterLamps(searchedRows, filter), [searchedRows, filter])
  const chips = useMemo<StatusFilterChip<LampFilter>[]>(() => {
    const ready = !loading || rows.length > 0
    const statusChip = (key: 'UP' | 'DOWN', color: string): StatusFilterChip<LampFilter> => ({
      key,
      label: key,
      color,
      count: ready && withStatus ? filterLamps(searchedRows, key).length : null,
      disabled: !withStatus,
      title: withStatus ? undefined : NO_STATUS_YET,
    })
    return [
      { key: 'ALL', label: 'ทั้งหมด', color: '#FCD116', count: ready ? searchedRows.length : null },
      statusChip('UP', LAMP_WORKING_COLOR),
      statusChip('DOWN', LAMP_FAULT_COLOR),
    ]
  }, [rows.length, searchedRows, loading, withStatus])

  const onFilterChange = (next: LampFilter) => {
    setFilter(next)
    setPage(1)
  }

  const exportTitle = `${TITLE} — สายทาง ${project.roadCode.trim()} ${project.installPoint}`.trim()
  const filterNote = lampExportNote(filter, search)

  return (
    <section className='mt-4 pb-5 flex flex-col gap-3'>
      {/* Regular weight, as the design and the OVERVIEW tab's
          ตารางข้อมูลรายเหตุการณ์ — `!` because the global h3 rule is
          unlayered and outranks a plain utility. */}
      <h3 className='fs-18 font-normal! text-(--yellow) m-0'>{TITLE}</h3>

      <div className='flex flex-row flex-wrap items-center gap-2'>
        <StatusFilterChips chips={chips} active={filter} onChange={onFilterChange} />
        <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
          <Button
            type='primary'
            shape='round'
            size='middle'
            icon={<TbPrinter />}
            disabled={shownRows.length === 0}
            className='sm:ml-3'
            onClick={() => setExportOpen(true)}
          >
            <p className='fs-12'>นำออกเอกสาร</p>
          </Button>
        </ConfigProvider>
        {/* The overall page's search box (same menu): filters as you type —
            every lamp is already here. Its own row below lg. */}
        <div className='w-full lg:w-80 lg:ml-auto'>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder='ค้นหาลำดับโคม / รหัสอุปกรณ์...'
            aria-label='ค้นหาโคมไฟ'
            className='rounded-lg app-search-input'
            suffix={<TbSearch className='text-(--yellow)' />}
            size='large'
            allowClear
          />
        </div>
      </div>

      <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
        <Table<LampRow>
          rowKey='key'
          columns={columns}
          dataSource={shownRows}
          loading={loading}
          pagination={shownRows.length > PAGE_SIZE
            ? { current: page, pageSize: PAGE_SIZE, showSizeChanger: false, onChange: setPage }
            : false}
          size='middle'
          tableLayout='fixed'
          scroll={{ x: 900 }}
          className='bridge-projects-table event-log-table incident-event-log-table'
          locale={{
            emptyText: isError
              ? 'โหลดข้อมูลรายโคมไม่สำเร็จ'
              : loading
                ? 'กำลังโหลด...'
                : rows.length === 0
                  ? 'ไม่มีข้อมูลโคมไฟ'
                  : searchedRows.length === 0 ? 'ไม่พบโคมไฟที่ค้นหา' : 'ไม่พบโคมไฟในสถานะนี้',
          }}
        />
      </div>

      {/* นำออกเอกสาร — the lamps the table shows (search + status), its columns. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={shownRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: EXPORT_FILENAME,
            title: exportTitle,
            filterNote,
            columns: LAMP_EXPORT_COLUMNS.map(({ header, widthPct, align, pdf }) => ({ header, widthPct, align, value: pdf })),
            rows: shownRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: EXPORT_FILENAME,
            sheetName: 'Lamp Equipment',
            title: exportTitle,
            filterNote,
            columns: LAMP_EXPORT_COLUMNS.map(({ header, width, excel }) => ({ header, width, value: excel })),
            rows: shownRows,
          })
        }}
      />
    </section>
  )
}

export default React.memo(LampEquipmentTable)
