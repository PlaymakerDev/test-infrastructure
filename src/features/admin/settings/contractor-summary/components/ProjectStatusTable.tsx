"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Empty, Input, Segmented, Table, type TableProps } from 'antd'
import { TbCopyPlusFilled, TbInfoSquareRoundedFilled, TbPlayerTrackNext, TbSearch, TbTool, TbWifi, TbWifiOff } from 'react-icons/tb'
import AppPagination from '@/components/pagination/AppPagination'
import { fmtNumber } from '@/utils/formatNumber'
import useIsMobile from '@/utils/hooks/useIsMobile'
import type {
  DeviceTotals,
  OutOfWarrantyProjectRow,
  ProjectDeviceStatusBase,
  ProjectDeviceStatusRow,
} from '@/types/manage/device-status-api'
import { WARRANTY_FILTER_OPTIONS, type WarrantyFilter } from '../data/deviceStatus'
import type { OutOfWarrantyType } from '../data/outOfWarranty'

interface Props {
  /** ทั้งหมด / ในค้ำ / หมดค้ำ's page of projects. */
  rows: ProjectDeviceStatusRow[]
  /** นอกเหนือการประกัน's page — the projects with records, each with its
   *  recorded devices. */
  excludedRows: OutOfWarrantyProjectRow[]
  /** นอกเหนือการประกัน's columns, one per recordable type the contractor has. */
  excludedTypes: readonly OutOfWarrantyType[]
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

const OnlineCount: React.FC<{ value: number }> = ({ value }) => (
  <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
    <TbWifi className='fs-18 text-(--default-blue) shrink-0' />
    <span className='text-(--light-gray-3)'>ออนไลน์</span>
    <span className={value > 0 ? 'text-(--default-blue)' : 'text-(--light-gray-3)'}>{fmtNumber(value)}</span>
  </span>
)

const OfflineCount: React.FC<{ value: number }> = ({ value }) => (
  <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
    <TbWifiOff className='fs-18 text-(--red) shrink-0' />
    <span className='text-(--light-gray-3)'>ออฟไลน์</span>
    <span className={value > 0 ? 'text-(--red)' : 'text-(--light-gray-3)'}>{fmtNumber(value)}</span>
  </span>
)

const DeviceCounts: React.FC<{ totals: DeviceTotals | null | undefined }> = ({ totals }) => (
  <div className='flex items-center gap-6 fs-12'>
    <OnlineCount value={totals?.online ?? 0} />
    <OfflineCount value={totals?.offline ?? 0} />
  </div>
)

/** นอกเหนือการประกัน's cell: how many of the type the project has recorded. */
const RecordedCount: React.FC<{ value: number }> = ({ value }) => (
  <span className='inline-flex items-center gap-1.5 whitespace-nowrap fs-12'>
    <TbTool className={`fs-18 shrink-0 ${value > 0 ? 'text-(--yellow)' : 'text-(--light-gray-3)'}`} />
    <span className='text-(--light-gray-3)'>นอกเหนือการประกัน</span>
    <span className={value > 0 ? 'text-(--yellow)' : 'text-(--light-gray-3)'}>{fmtNumber(value)}</span>
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
 *  นอกเหนือการประกัน: the projects with records, how many of each type. */
const ProjectStatusTable: React.FC<Props> = ({
  rows,
  excludedRows,
  excludedTypes,
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
          // นอกเหนือการประกัน lists recorded projects only.
          recorded={excluded || recordedIds.has(row.project_id)}
          canRecord={canRecord}
          onClick={() => onOpenOutOfWarranty(row)}
        />
      ),
    },
  ], [excluded, recordedIds, canRecord, onOpenProjectInfo, onOpenOutOfWarranty])

  const statusColumns = useMemo<TableProps<ProjectDeviceStatusRow>['columns']>(() => [
    indexColumn,
    nameColumn,
    {
      title: <span className='fs-12'>CCTV</span>,
      key: 'cctv',
      width: 340,
      render: (_, row) => {
        const hasCameras = (row.cameras?.total ?? 0) > 0
        return (
          <div className='flex items-center gap-6'>
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
    },
    {
      title: <span className='fs-12'>VMS</span>,
      key: 'vms',
      width: 260,
      render: (_, row) => <DeviceCounts totals={row.vms} />,
    },
    {
      title: <span className='fs-12'>Street Light</span>,
      key: 'lighting',
      width: 260,
      render: (_, row) => <DeviceCounts totals={row.lighting} />,
    },
    ...tailColumns,
  ], [indexColumn, nameColumn, tailColumns, onOpenLive])

  const excludedColumns = useMemo<TableProps<OutOfWarrantyProjectRow>['columns']>(() => [
    indexColumn,
    nameColumn,
    // 220 each: four of them still fit a 1920 screen without scrolling.
    ...excludedTypes.map((type) => ({
      title: <span className='fs-12'>{type.label}</span>,
      key: type.key,
      width: 220,
      render: (_: unknown, row: OutOfWarrantyProjectRow) => <RecordedCount value={row[type.key]?.length ?? 0} />,
    })),
    ...tailColumns,
  ], [indexColumn, nameColumn, excludedTypes, tailColumns])

  const emptyText = (
    <Empty
      description={
        <span className='fs-12'>
          {isError
            ? 'โหลดข้อมูลโครงการไม่สำเร็จ'
            : search
              ? 'ไม่พบโครงการที่ค้นหา'
              : excluded
                ? 'ยังไม่มีโครงการที่บันทึกอุปกรณ์นอกเหนือการประกัน'
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
          scroll={{ x: 850 + excludedTypes.length * 220 }}
          locale={{ emptyText }}
        />
      ) : (
        <Table<ProjectDeviceStatusRow>
          rowKey='project_id'
          dataSource={rows}
          columns={statusColumns}
          loading={isLoading}
          pagination={false}
          scroll={{ x: 1520 }}
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
