"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { extractIpFromHlsUrl } from '@/utils/extractIpFromHlsUrl'
import { CameraFunctionTag } from '@/features/admin/cctv/components/cameraFunctions'
import type { DeviceBadgeKey } from '@/constants/cctv'
import { useDetailContext } from '../../../context'
import type { CrosswalkCameraItem } from '@/types/crosswalk/detail-api'

interface Props {
  /** 'all' | 'online' | 'offline' — filter rows by camera connection status.
   *  Defaults to 'all' when omitted. */
  activeFilter?: string
}

type ConnectionStatus = 'Connect' | 'Disconnect'

interface CameraRow extends CrosswalkCameraItem {
  seq: number
  km: string
  functions: DeviceBadgeKey[]
  ip: string
  status: ConnectionStatus
}

// Thai status pills matching the other menus' overall tables (blue #66AEFF
// online/connected, red #E94C4C offline/disconnected).
const OnlinePill: React.FC<{ online: boolean }> = ({ online }) => {
  const color = online ? '#66AEFF' : '#E94C4C'
  return (
    <span
      className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {online ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
      {online ? 'ออนไลน์' : 'ออฟไลน์'}
    </span>
  )
}

const StreamPill: React.FC<{ online: boolean }> = ({ online }) => {
  const color = online ? '#66AEFF' : '#E94C4C'
  return (
    <span
      className='inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {online ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ'}
    </span>
  )
}

/** Pull "กม.<n>+<m>" out of the camera name, which follows the
 *  "…-กม.0+700-…" convention. Returns "-" when no match.
 *  Exported so DataDisplaySection's export uses the exact same expression. */
export const extractKm = (name: string): string => {
  const m = name.match(/กม\.\s*(\d+\+\d+)/)
  return m ? m[1] : '-'
}

/** "cctv" is the base type; append every solution the camera participates in
 *  (non-null flag). Returns DEVICE_BADGE keys — same source & colors as every
 *  other menu's การทำงาน column.
 *  Exported so DataDisplaySection's export uses the exact same expression. */
export const deriveFunctions = (c: CrosswalkCameraItem): DeviceBadgeKey[] => {
  const fns: DeviceBadgeKey[] = ['cctv']
  if (c.counting) fns.push('counting')
  if (c.analytic) fns.push('analytic')
  if (c.traffic) fns.push('traffic')
  if (c.crosswalk) fns.push('crosswalk')
  if (c.wim_camera) fns.push('wim_camera')
  if (c.vms) fns.push('vms')
  return fns
}

const TableCameraData: React.FC<Props> = ({ activeFilter = 'all' }) => {
  const deptId = useDeptId()
  const { id } = useDetailContext()

  const { data, isLoading } = useCrosswalkCameras(deptId, {
    solution_id: id,
  })

  // BE now returns `is_online` + the solution flags on this single endpoint,
  // so the การทำงาน badges + status derive from the camera row directly — no
  // more per-camera /cctv/cameras/{id} lookups.
  const rows = useMemo<CameraRow[]>(() => {
    const cameras = data?.cameras ?? []
    const filtered = cameras.filter((c) => {
      if (activeFilter === 'online') return c.is_online
      if (activeFilter === 'offline') return !c.is_online
      return true
    })
    return filtered.map((c, i) => ({
      ...c,
      seq: i + 1,
      km: extractKm(c.camera_name),
      functions: deriveFunctions(c),
      ip: c.ip_address ?? extractIpFromHlsUrl(c.hls_url),
      status: c.is_online ? 'Connect' : 'Disconnect',
    }))
  }, [data, activeFilter])

  const columns: ColumnsType<CameraRow> = useMemo(() => [
    {
      title: 'ลำดับที่',
      dataIndex: 'seq',
      key: 'seq',
      width: 80,
      // Indent first column 28px to match the overall-page list tables.
      onHeaderCell: () => ({ style: { paddingInlineStart: 28, paddingLeft: 28 } }),
      onCell: () => ({ style: { paddingInlineStart: 28, paddingLeft: 28 } }),
    },
    {
      title: 'ชื่อกล้อง',
      dataIndex: 'camera_name',
      key: 'name',
      width: 480,
    },
    {
      title: 'กม.ที่',
      dataIndex: 'km',
      key: 'km',
      width: 100,
    },
    {
      title: 'การทำงาน',
      dataIndex: 'functions',
      key: 'functions',
      width: 220,
      render: (tags: DeviceBadgeKey[]) => (
        <div className='flex flex-wrap gap-1'>
          {tags.map((tag) => (
            <CameraFunctionTag key={tag} tag={tag} />
          ))}
        </div>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
    },
    {
      title: 'Stream Status',
      dataIndex: 'status',
      key: 'streamStatus',
      width: 140,
      render: (status: ConnectionStatus) => <StreamPill online={status === 'Connect'} />,
    },
    {
      title: 'Device Status',
      dataIndex: 'status',
      key: 'deviceStatus',
      width: 140,
      fixed: 'right',
      render: (status: ConnectionStatus) => <OnlinePill online={status === 'Connect'} />,
    },
  ], [])

  return (
    <Table<CameraRow>
      columns={columns}
      dataSource={rows}
      pagination={false}
      size='middle'
      rowKey='id'
      loading={isLoading}
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(TableCameraData)
