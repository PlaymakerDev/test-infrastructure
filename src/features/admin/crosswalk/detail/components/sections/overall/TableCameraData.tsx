"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { extractIpFromHlsUrl } from '@/utils/extractIpFromHlsUrl'
import { useDetailContext } from '../../../context'
import type { CrosswalkCameraItem } from '@/types/crosswalk/detail-api'

interface Props {}

type ConnectionStatus = 'Connect' | 'Disconnect'
type FunctionTag = 'CCTV' | 'Incident' | 'Volume' | 'Traffic'

interface CameraRow extends CrosswalkCameraItem {
  seq: number
  km: string
  functions: FunctionTag[]
  ip: string
  status: ConnectionStatus
}

const FUNCTION_TAG_CLASS: Record<FunctionTag, string> = {
  CCTV: 'border-yellow-500 text-yellow-500',
  Incident: 'border-green-500 text-green-500',
  Volume: 'border-emerald-400 text-emerald-400',
  Traffic: 'border-teal-400 text-teal-400',
}

const STATUS_CLASS: Record<ConnectionStatus, string> = {
  Connect: 'border-blue-400 text-blue-400',
  Disconnect: 'border-red-500 text-red-500',
}

/** Pull "กม.<n>+<m>" out of the camera name, which follows the
 *  "…-กม.0+700-…" convention. Returns "-" when no match. */
const extractKm = (name: string): string => {
  const m = name.match(/กม\.\s*(\d+\+\d+)/)
  return m ? m[1] : '-'
}

const TableCameraData: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { id } = useDetailContext()

  const { data, isLoading } = useCrosswalkCameras(deptId, {
    solution_id: id,
  })

  const rows = useMemo<CameraRow[]>(() => {
    const cameras = data?.cameras ?? []
    return cameras.map((c, i) => ({
      ...c,
      seq: i + 1,
      km: extractKm(c.camera_name),
      functions: ['CCTV'],
      ip: c.ip_address ?? extractIpFromHlsUrl(c.hls_url),
      // Endpoint doesn't expose is_online — treat presence of hls_url as online.
      status: c.hls_url ? 'Connect' : 'Disconnect',
    }))
  }, [data])

  const columns: ColumnsType<CameraRow> = useMemo(() => [
    {
      title: 'ลำดับที่',
      dataIndex: 'seq',
      key: 'seq',
      align: 'center',
      width: 80,
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
      align: 'center',
      width: 100,
    },
    {
      title: 'การทำงาน',
      dataIndex: 'functions',
      key: 'functions',
      align: 'center',
      width: 220,
      render: (tags: FunctionTag[]) => (
        <div className='flex flex-wrap justify-center gap-1'>
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-block py-0.5 px-2.5 rounded-full text-xs border ${FUNCTION_TAG_CLASS[tag]}`}
            >
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
      align: 'center',
      width: 140,
    },
    {
      title: 'Stream Status',
      dataIndex: 'status',
      key: 'streamStatus',
      align: 'center',
      width: 140,
      render: (status: ConnectionStatus) => (
        <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs border ${STATUS_CLASS[status]}`}>
          {status}
        </span>
      ),
    },
    {
      title: 'Device Status',
      dataIndex: 'status',
      key: 'deviceStatus',
      align: 'center',
      width: 140,
      fixed: 'right',
      render: (status: ConnectionStatus) => {
        const isOnline = status === 'Connect'
        return (
          <span
            className={`inline-block py-0.5 px-3.5 rounded-full text-xs border ${
              isOnline ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
            }`}
          >
            {isOnline ? 'Online' : 'Offline'}
          </span>
        )
      },
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
