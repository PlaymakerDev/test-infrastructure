"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Empty, Input, Segmented, Table, Tooltip, type TableProps } from 'antd'
import { TbCopyPlusFilled, TbInfoCircle, TbInfoSquareRoundedFilled, TbPlayerTrackNext, TbSearch, TbTool, TbWifi, TbWifiOff } from 'react-icons/tb'
import AppPagination from '@/components/pagination/AppPagination'
import { fmtNumber } from '@/utils/formatNumber'
import useIsMobile from '@/utils/hooks/useIsMobile'
import type {
  DeviceTotals,
  OutOfWarrantyDeviceType,
  OutOfWarrantyProjectRow,
  ProjectDeviceStatusBase,
  ProjectDeviceStatusRow,
} from '@/types/manage/device-status-api'
import { WARRANTY_FILTER_OPTIONS, type WarrantyFilter } from '../data/deviceStatus'
import type { OutOfWarrantyType } from '../data/outOfWarranty'
import type { ProjectStatusTableRow } from '../data/statusTable'

interface Props {
  /** ทั้งหมด / ในค้ำ / หมดค้ำ's page of projects. */
  rows: ProjectStatusTableRow[]
  /** นอกเหนือการรับประกัน's page — the projects with records, each with its
   *  recorded devices. */
  excludedRows: OutOfWarrantyProjectRow[]
  /** Both tables' columns: CCTV, VMS and Street Light, then Traffic Signal,
   *  Bridge Lighting, Crosswalk and Tunnel when the contractor has them. */
  types: readonly OutOfWarrantyType[]
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  isError: boolean
  warranty: WarrantyFilter
  onWarrantyChange: (value: WarrantyFilter) => void
  /** The search the table was read with (trimmed). */
  search: string
  onSearchChange: (value: string) => void
  onPageChange: (page: number, pageSize: number) => void
  onOpenLive: (row: ProjectDeviceStatusRow) => void
  onOpenProjectInfo: (project: ProjectDeviceStatusBase) => void
  /** Projects with บันทึกเงื่อนไขนอกค้ำประกัน — their button is blue. */
  recordedIds: ReadonlySet<number>
  /** Admin and contractor record; a role-user account only reads. */
  canRecord: boolean
  onOpenOutOfWarranty: (project: ProjectDeviceStatusBase) => void
}

/** A count by its icon; what it counts in the tooltip (and for a screen
 *  reader) — the same words in every cell only made the table long (user
 *  2026-11-17). */
const IconCount: React.FC<{ label: string; icon: React.ReactNode; value: number; color: string }> = ({ label, icon, value, color }) => (
  <Tooltip title={label}>
    <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
      {icon}
      <span className='sr-only'>{label}</span>
      <span className={value > 0 ? color : 'text-(--light-gray-3)'}>{fmtNumber(value)}</span>
    </span>
  </Tooltip>
)

/** A column header that explains itself on hover, its ⓘ saying there is
 *  something to read: what the column counts (`lead`), then what else it
 *  holds (`detail`). 300 wide (antd's 250 broke CCTV's lead before its last
 *  word) — still inside a 390 phone. */
const HintedHeader: React.FC<{ label: string; lead: string; detail: string }> = ({ label, lead, detail }) => (
  <Tooltip
    styles={{ root: { maxWidth: 300 } }}
    title={
      <span className='fs-12'>
        <span className='block font-semibold'>{lead}</span>
        <span className='block'>{detail}</span>
      </span>
    }
  >
    <span className='inline-flex items-center gap-1.5 fs-12 cursor-help'>
      {label}
      <TbInfoCircle className='fs-14 shrink-0 opacity-70' aria-hidden />
    </span>
  </Tooltip>
)

// CCTV's header (user 2026-11-17): Traffic Volume, Incident Detection and LPR
// are cameras with no column of their own — counted here. The column is
// /device-status's cameras: those of the project's CCTV install points, each
// once — summed, the CCTV ring (checked 2026-11-17, all three filters).
const CCTV_DETAIL = 'รวมกล้องที่ใช้กับ Traffic Volume, Incident Detection และ LPR'
const CCTV_HINT = { lead: 'กล้องทุกตัวในจุดติดตั้ง CCTV ของโครงการ', detail: `${CCTV_DETAIL} — กล้องที่ใช้หลายระบบนับครั้งเดียว` }
const CCTV_RECORDED_HINT = { lead: 'กล้องที่บันทึกนอกเหนือการรับประกัน', detail: CCTV_DETAIL }

const OnlineCount: React.FC<{ value: number }> = ({ value }) => (
  <IconCount label='ออนไลน์' icon={<TbWifi className='fs-18 text-(--default-blue) shrink-0' />} value={value} color='text-(--default-blue)' />
)

const OfflineCount: React.FC<{ value: number }> = ({ value }) => (
  <IconCount label='ออฟไลน์' icon={<TbWifiOff className='fs-18 text-(--red) shrink-0' />} value={value} color='text-(--red)' />
)

/** What each column of ทั้งหมด / ในค้ำ / หมดค้ำ counts — each type's units,
 *  CCTV every camera of the project. */
const STATUS_TOTALS: Record<OutOfWarrantyDeviceType, (row: ProjectStatusTableRow) => DeviceTotals> = {
  cctv: (row) => row.cameras,
  vms: (row) => row.vms,
  lighting: (row) => row.lighting,
  traffic: (row) => row.traffic,
  bridge_lighting: (row) => row.bridge_lighting,
  crosswalk: (row) => row.crosswalk,
  tunnel: (row) => row.tunnel,
}

const DeviceCounts: React.FC<{ totals: DeviceTotals | null | undefined }> = ({ totals }) => (
  <div className='flex flex-wrap items-center gap-x-4 gap-y-1 fs-12'>
    <OnlineCount value={totals?.online ?? 0} />
    <OfflineCount value={totals?.offline ?? 0} />
  </div>
)

// ทั้งหมด / ในค้ำ / หมดค้ำ: CCTV (two counts and its ▷▷) 210, the other types
// 140 each, the name 290 — with all seven, 80 + 290 + 210 + 6 × 140 + 130 +
// 220 = 1770, as นอกเหนือการรับประกัน's: no scrolling on a 1920 screen.
const STATUS_NAME_WIDTH = 290
const STATUS_CCTV_WIDTH = 210
const STATUS_COUNT_WIDTH = 140
const STATUS_FIXED_WIDTH = 80 + STATUS_NAME_WIDTH + 130 + 220

// นอกเหนือการรับประกัน's table: a narrow column per type (an icon and a count,
// "Bridge Lighting" its widest header) and a narrower name, so all seven
// types fit a 1920 screen without scrolling — 80 + 360 + 7 × 140 + 130 + 220.
const RECORDED_COUNT_WIDTH = 140
const EXCLUDED_NAME_WIDTH = 360
const EXCLUDED_FIXED_WIDTH = 80 + EXCLUDED_NAME_WIDTH + 130 + 220

/** นอกเหนือการรับประกัน's cell: how many of the type the project has recorded. */
const RecordedCount: React.FC<{ value: number }> = ({ value }) => (
  <span className='fs-12'>
    <IconCount
      label='นอกเหนือการรับประกัน'
      icon={<TbTool className={`fs-18 shrink-0 ${value > 0 ? 'text-(--yellow)' : 'text-(--light-gray-3)'}`} />}
      value={value}
      color='text-(--yellow)'
    />
  </span>
)

/** Yellow to record; blue once something is recorded — the same button then
 *  opens it to see, add to or change (user 2026-11-16). A role-user account
 *  only sees: nothing to open until something is recorded. */
const OutOfWarrantyButton: React.FC<{ recorded: boolean; canRecord: boolean; onClick: () => void }> = ({ recorded, canRecord, onClick }) => {
  const disabled = !recorded && !canRecord
  const label = disabled
    ? 'ยังไม่มีบันทึกเงื่อนไขนอกค้ำประกัน'
    : recorded
      ? canRecord ? 'แก้ไขบันทึกเงื่อนไขนอกค้ำประกัน' : 'ดูบันทึกเงื่อนไขนอกค้ำประกัน'
      : 'บันทึกเงื่อนไขนอกค้ำประกัน'
  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className='inline-flex items-center justify-center p-1 border-none bg-transparent cursor-pointer hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40'
    >
      <TbCopyPlusFilled size={30} style={{ color: recorded ? 'var(--default-blue)' : 'var(--yellow)' }} />
    </button>
  )
}

const SEARCH_DELAY_MS = 700

/** ค้นหาโครงการ — the box the settings tabs search with (user 2026-11-04):
 *  applied 700 ms after the last keystroke, or at once on Enter. The backend
 *  matches the text in project_name or contract_no. No fs class on purpose:
 *  antd's 16px, as there — iOS zooms into an input under 16px. */
const ProjectSearchInput: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  const [text, setText] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // What was last sent up: a space typed at either end changes nothing, so
  // it must not send the table back to page 1.
  const applied = useRef(value)
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current)
  }
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const commit = (next: string) => {
    cancel()
    const search = next.trim()
    if (search === applied.current) return
    applied.current = search
    onChange(search)
  }

  return (
    <Input
      size='large'
      value={text}
      placeholder='ค้นหาชื่อโครงการ / เลขที่สัญญา...'
      aria-label='ค้นหาโครงการ'
      suffix={<TbSearch className='text-(--yellow)' />}
      onChange={(e) => {
        const next = e.target.value
        setText(next)
        cancel()
        timer.current = setTimeout(() => commit(next), SEARCH_DELAY_MS)
      }}
      onPressEnter={() => commit(text)}
    />
  )
}

/** ตารางสรุปโครงการและสถานะการทำงานของอุปกรณ์ทุกโครงการ — one page of the
 *  contractor's projects; the ▷▷ button opens the project's cameras. Under
 *  นอกเหนือการรับประกัน: the projects with records, how many of each type. */
const ProjectStatusTable: React.FC<Props> = ({
  rows,
  excludedRows,
  types,
  total,
  page,
  pageSize,
  isLoading,
  isError,
  warranty,
  onWarrantyChange,
  search,
  onSearchChange,
  onPageChange,
  onOpenLive,
  onOpenProjectInfo,
  recordedIds,
  canRecord,
  onOpenOutOfWarranty,
}) => {
  const isMobile = useIsMobile()
  const excluded = warranty === 'excluded'
  // Every text here is set with an fs class, at the size antd gave it:
  // table + Empty 14px = fs-12; the Segmented's labels 16px when large
  // (fs-14 is 16px from 429px up) and 14px at the phone's middle size.
  const warrantyOptions = useMemo(
    () => WARRANTY_FILTER_OPTIONS.map((option) => ({
      value: option.value,
      label: <span className={isMobile ? 'fs-12' : 'fs-14'}>{option.label}</span>,
    })),
    [isMobile],
  )

  // The columns both tables open and close with.
  const indexColumn = useMemo(() => ({
    title: <span className='fs-12'>ลำดับ</span>,
    key: 'index',
    width: 80,
    align: 'center' as const,
    render: (_: unknown, __: unknown, index: number) => <span className='fs-12'>{(page - 1) * pageSize + index + 1}</span>,
  }), [page, pageSize])
  const nameColumn = useMemo(() => ({
    title: <span className='fs-12'>ชื่อโครงการ</span>,
    dataIndex: 'project_name',
    key: 'project_name',
    width: 420,
    render: (name: string) => <span className='fs-12'>{name || '-'}</span>,
  }), [])
  const tailColumns = useMemo(() => [
    {
      title: <span className='fs-12'>ข้อมูลโครงการ</span>,
      key: 'info',
      width: 130,
      align: 'center' as const,
      render: (_: unknown, row: ProjectDeviceStatusBase) => (
        <TbInfoSquareRoundedFilled
          size={26}
          title='ดูข้อมูลโครงการ'
          className='text-white cursor-pointer hover:text-(--yellow) inline-block'
          onClick={() => onOpenProjectInfo(row)}
        />
      ),
    },
    {
      title: <span className='fs-12'>บันทึกเงื่อนไขนอกค้ำประกัน</span>,
      key: 'out_of_warranty',
      width: 220,
      align: 'center' as const,
      render: (_: unknown, row: ProjectDeviceStatusBase) => (
        <OutOfWarrantyButton
          // นอกเหนือการรับประกัน lists recorded projects only.
          recorded={excluded || recordedIds.has(row.project_id)}
          canRecord={canRecord}
          onClick={() => onOpenOutOfWarranty(row)}
        />
      ),
    },
  ], [excluded, recordedIds, canRecord, onOpenProjectInfo, onOpenOutOfWarranty])

  const statusColumns = useMemo<TableProps<ProjectStatusTableRow>['columns']>(() => [
    indexColumn,
    { ...nameColumn, width: STATUS_NAME_WIDTH },
    ...types.map((type) => type.key === 'cctv'
      ? {
          title: <HintedHeader label={type.label} {...CCTV_HINT} />,
          key: type.key,
          width: STATUS_CCTV_WIDTH,
          render: (_: unknown, row: ProjectStatusTableRow) => {
            const hasCameras = (row.cameras?.total ?? 0) > 0
            return (
              <div className='flex items-center gap-4'>
                <DeviceCounts totals={row.cameras} />
                <button
                  type='button'
                  aria-label='ดูกล้องของโครงการ'
                  title={hasCameras ? 'ดูกล้องของโครงการ' : 'โครงการนี้ไม่มีกล้อง'}
                  disabled={!hasCameras}
                  onClick={() => onOpenLive(row)}
                  className='inline-flex items-center justify-center w-9 h-9 rounded-lg border-none shrink-0 cursor-pointer hover:opacity-85 disabled:cursor-not-allowed disabled:hover:opacity-100'
                  style={{ background: hasCameras ? 'var(--yellow)' : 'var(--light-gray-3)', color: 'var(--dark-black)' }}
                >
                  <TbPlayerTrackNext size={22} />
                </button>
              </div>
            )
          },
        }
      : {
          title: <span className='fs-12'>{type.label}</span>,
          key: type.key,
          width: STATUS_COUNT_WIDTH,
          render: (_: unknown, row: ProjectStatusTableRow) => (
            <DeviceCounts totals={STATUS_TOTALS[type.key](row)} />
          ),
        }),
    ...tailColumns,
  ], [indexColumn, nameColumn, types, tailColumns, onOpenLive])

  const excludedColumns = useMemo<TableProps<OutOfWarrantyProjectRow>['columns']>(() => [
    indexColumn,
    { ...nameColumn, width: EXCLUDED_NAME_WIDTH },
    ...types.map((type) => ({
      title: type.key === 'cctv' ? <HintedHeader label={type.label} {...CCTV_RECORDED_HINT} /> : <span className='fs-12'>{type.label}</span>,
      key: type.key,
      width: RECORDED_COUNT_WIDTH,
      align: 'center' as const,
      render: (_: unknown, row: OutOfWarrantyProjectRow) => <RecordedCount value={row[type.key]?.length ?? 0} />,
    })),
    ...tailColumns,
  ], [indexColumn, nameColumn, types, tailColumns])

  const emptyText = (
    <Empty
      description={
        <span className='fs-12'>
          {isError
            ? 'โหลดข้อมูลโครงการไม่สำเร็จ'
            : search
              ? 'ไม่พบโครงการที่ค้นหา'
              : excluded
                ? 'ยังไม่มีโครงการที่บันทึกอุปกรณ์นอกเหนือการรับประกัน'
                : 'ไม่พบโครงการ'}
        </span>
      }
    />
  )

  return (
    <section>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
        <p className='fs-18'>ตารางสรุปโครงการและสถานะการทำงานของอุปกรณ์ทุกโครงการ</p>
        <div className='flex flex-wrap items-center gap-3 w-full md:w-auto'>
          <div className='w-full md:w-80 lg:w-100'>
            <ProjectSearchInput value={search} onChange={onSearchChange} />
          </div>
          {/* The app's yellow-outlined Segmented, as the statistics and
              maintenance filters render it (user 2026-10-01: a roomier,
              Figma-measured version was too big). Four options outgrow a
              phone: it scrolls sideways there rather than squeeze. */}
          <div className='max-w-full overflow-x-auto'>
            <Segmented
              value={warranty}
              options={warrantyOptions}
              onChange={(value) => onWarrantyChange(value as WarrantyFilter)}
              size={isMobile ? 'middle' : 'large'}
              classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
            />
          </div>
        </div>
      </div>
      {excluded ? (
        <Table<OutOfWarrantyProjectRow>
          rowKey='project_id'
          dataSource={excludedRows}
          columns={excludedColumns}
          loading={isLoading}
          pagination={false}
          scroll={{ x: EXCLUDED_FIXED_WIDTH + types.length * RECORDED_COUNT_WIDTH }}
          locale={{ emptyText }}
        />
      ) : (
        <Table<ProjectStatusTableRow>
          rowKey='project_id'
          dataSource={rows}
          columns={statusColumns}
          loading={isLoading}
          pagination={false}
          scroll={{ x: STATUS_FIXED_WIDTH + STATUS_CCTV_WIDTH + Math.max(0, types.length - 1) * STATUS_COUNT_WIDTH }}
          locale={{ emptyText }}
        />
      )}
      {/* Phone: antd's pagination row never wraps, so "10 จาก 82" gets squeezed
          until "82" drops out of its fixed-height box — give the total a row of
          its own above the page numbers instead. */}
      {total > 0 && (
        <div className='mt-4 max-sm:[&_.ant-pagination]:flex-wrap! max-sm:[&_.ant-pagination]:gap-y-2! max-sm:[&_.ant-pagination-total-text]:basis-full! max-sm:[&_.ant-pagination-total-text]:text-end! max-sm:[&_.ant-pagination-total-text]:me-0!'>
          <AppPagination current={page} pageSize={pageSize} total={total} onChange={onPageChange} />
        </div>
      )}
    </section>
  )
}

export default React.memo<Props>(ProjectStatusTable)
