"use client"
import React, { useMemo } from 'react'
import { Empty, Segmented, Table, type TableProps } from 'antd'
import { TbInfoSquareRoundedFilled, TbPlayerTrackNext, TbWifi, TbWifiOff } from 'react-icons/tb'
import AppPagination from '@/components/pagination/AppPagination'
import { fmtNumber } from '@/utils/formatNumber'
import useIsMobile from '@/utils/hooks/useIsMobile'
import type { DeviceTotals, ProjectDeviceStatusRow } from '@/types/manage/device-status-api'
import { WARRANTY_FILTER_OPTIONS, type WarrantyFilter } from '../data/deviceStatus'

interface Props {
  rows: ProjectDeviceStatusRow[]
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  isError: boolean
  warranty: WarrantyFilter
  onWarrantyChange: (value: WarrantyFilter) => void
  onPageChange: (page: number, pageSize: number) => void
  onOpenLive: (row: ProjectDeviceStatusRow) => void
  onOpenProjectInfo: (row: ProjectDeviceStatusRow) => void
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

/** ตารางสรุปโครงการและสถานะการทำงานของอุปกรณ์ทุกโครงการ — one page of the
 *  contractor's projects; the ▷▷ button opens the project's cameras. */
const ProjectStatusTable: React.FC<Props> = ({
  rows,
  total,
  page,
  pageSize,
  isLoading,
  isError,
  warranty,
  onWarrantyChange,
  onPageChange,
  onOpenLive,
  onOpenProjectInfo,
}) => {
  const isMobile = useIsMobile()
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
  const columns = useMemo<TableProps<ProjectDeviceStatusRow>['columns']>(() => [
    {
      title: <span className='fs-12'>ลำดับ</span>,
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => <span className='fs-12'>{(page - 1) * pageSize + index + 1}</span>,
    },
    {
      title: <span className='fs-12'>ชื่อโครงการ</span>,
      dataIndex: 'project_name',
      key: 'project_name',
      width: 420,
      render: (name: string) => <span className='fs-12'>{name || '-'}</span>,
    },
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
    {
      title: <span className='fs-12'>ข้อมูลโครงการ</span>,
      key: 'info',
      width: 130,
      align: 'center',
      render: (_, row) => (
        <TbInfoSquareRoundedFilled
          size={26}
          title='ดูข้อมูลโครงการ'
          className='text-white cursor-pointer hover:text-(--yellow) inline-block'
          onClick={() => onOpenProjectInfo(row)}
        />
      ),
    },
  ], [page, pageSize, onOpenLive, onOpenProjectInfo])

  return (
    <section>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
        <p className='fs-18'>ตารางสรุปโครงการและสถานะการทำงานของอุปกรณ์ทุกโครงการ</p>
        {/* The app's yellow-outlined Segmented, as the statistics and
            maintenance filters render it (user 2026-10-01: a roomier,
            Figma-measured version was too big). */}
        <Segmented
          value={warranty}
          options={warrantyOptions}
          onChange={(value) => onWarrantyChange(value as WarrantyFilter)}
          size={isMobile ? 'middle' : 'large'}
          classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
        />
      </div>
      <Table<ProjectDeviceStatusRow>
        rowKey='project_id'
        dataSource={rows}
        columns={columns}
        loading={isLoading}
        pagination={false}
        scroll={{ x: 1300 }}
        locale={{
          emptyText: <Empty description={<span className='fs-12'>{isError ? 'โหลดข้อมูลโครงการไม่สำเร็จ' : 'ไม่พบโครงการ'}</span>} />,
        }}
      />
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
