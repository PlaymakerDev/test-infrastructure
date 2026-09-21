"use client"
import { App, InputNumber, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useCallback, useMemo, useState } from 'react'
import { useAttachTrafficCameras } from '@/hooks/queries/manage'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import type { APIResponseCamera } from '@/types/manage/solution-api'
import { errText } from '@/features/admin/settings/new-detail/project/context'
import { useEquipmentModal } from '../hooks/useEquipmentModal'
import { EquipmentLiveButton, EquipmentModalFooter, EquipmentModalShell, EquipmentStatusPill } from '../components'

interface Props {

}

/** Traffic-signal `camera_type` literals — case-sensitive, must match the
 *  backend enum (see APIRequestSolutionAddCameraTraffic). */
const CAMERA_TYPES = ['Counting', 'StopLine'] as const
type CameraType = (typeof CAMERA_TYPES)[number]

interface Pick {
  phase: number
  cameraType: CameraType
}

const DEFAULT_PICK: Pick = { phase: 1, cameraType: 'Counting' }

/** Traffic-signal camera picker (`equipment_modal`, type TRAFFIC_SIGNAL). Each
 *  ticked row carries a phase number (1..8) and a camera_type. Submits via
 *  `useAttachTrafficCameras` — replace-on-write, like the other pickers.
 *
 *  Not seeded with the point's current attachments (unlike CAMERA_SELECT): the
 *  camera-list endpoint nests no traffic link, so the picker starts empty and
 *  saving replaces whatever was attached with exactly what is ticked here.
 *  Offline cameras stay un-tickable, as in settings/detail. */
const TrafficSignalCameraModal: React.FC<Props> = (props) => {
  const { } = props
  const { open, item, record, cameras, camerasLoading, close, openLiveStream } = useEquipmentModal('TRAFFIC_SIGNAL')
  const { message } = App.useApp()
  const { mutate: attachTraffic, isPending } = useAttachTrafficCameras()

  const [selected, setSelected] = useState<Record<string, Pick>>({})

  // The modal component stays mounted across open/close, so clear on the way out.
  const handleClose = useCallback(() => {
    setSelected({})
    close()
  }, [close])

  const updateRow = useCallback((id: string, patch: Partial<Pick>) => {
    setSelected((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev))
  }, [])

  const columns: ColumnsType<APIResponseCamera> = useMemo(
    () => [
      {
        title: 'ชื่ออุปกรณ์',
        dataIndex: 'camera_name',
        key: 'camera_name',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: 'Phase',
        key: 'phase',
        width: 130,
        render: (_: unknown, row) => {
          const pick = selected[row.id]
          return (
            <div className='flex items-center gap-2'>
              <span
                className='inline-block w-3 h-3 rounded-full'
                style={{ background: pick ? getPhaseColor(pick.phase) : 'transparent', border: '1px solid #666' }}
              />
              <InputNumber
                min={1}
                max={8}
                value={pick ? pick.phase : null}
                disabled={!pick}
                onChange={(v) => v != null && updateRow(row.id, { phase: Number(v) })}
                style={{ width: 80 }}
              />
            </div>
          )
        },
      },
      {
        title: 'ประเภทกล้อง',
        key: 'cameraType',
        width: 170,
        render: (_: unknown, row) => {
          const pick = selected[row.id]
          return (
            <Select
              value={pick?.cameraType}
              disabled={!pick}
              onChange={(v: CameraType) => updateRow(row.id, { cameraType: v })}
              options={CAMERA_TYPES.map((t) => ({ label: t, value: t }))}
              style={{ width: 160 }}
              placeholder='—'
            />
          )
        },
      },
      {
        title: 'สถานะการเชื่อมต่อ',
        dataIndex: 'curl_status',
        key: 'curl_status',
        width: 160,
        render: (v: boolean | undefined) => <EquipmentStatusPill online={Boolean(v)} />,
      },
      {
        title: 'Live Stream',
        key: 'live',
        width: 130,
        align: 'center',
        render: (_: unknown, row) => <EquipmentLiveButton onClick={() => openLiveStream(row)} />,
      },
    ],
    [selected, updateRow, openLiveStream],
  )

  const handleConfirm = useCallback(() => {
    if (!record) return
    attachTraffic(
      {
        solution_id: record.id,
        cameras: Object.entries(selected).map(([camera_id, v]) => ({
          camera_id,
          phase: v.phase,
          camera_type: v.cameraType,
        })),
      },
      {
        onSuccess: () => {
          message.success('บันทึกอุปกรณ์สำเร็จ')
          handleClose()
        },
        onError: (error) => {
          message.error(errText(error, 'บันทึกอุปกรณ์ไม่สำเร็จ'))
        },
      },
    )
  }, [record, selected, attachTraffic, message, handleClose])

  return (
    <EquipmentModalShell
      open={open}
      onClose={handleClose}
      title={record?.solution_type.solution_name_atlas || 'Traffic Signal'}
      subtitle={item?.location_name || '-'}
    >
      <Table<APIResponseCamera>
        rowKey='id'
        columns={columns}
        dataSource={cameras}
        loading={camerasLoading}
        rowSelection={{
          selectedRowKeys: Object.keys(selected),
          onChange: (keys) => {
            // Keep the phase / type of rows that stay ticked; new ticks get defaults.
            setSelected((prev) =>
              Object.fromEntries((keys as string[]).map((id) => [id, prev[id] ?? DEFAULT_PICK])),
            )
          },
          getCheckboxProps: (row) => ({ disabled: !row.curl_status }),
          columnTitle: 'เลือก',
          columnWidth: 70,
        }}
        pagination={false}
        size='middle'
        locale={{ emptyText: 'ยังไม่มีกล้อง CCTV ที่จุดติดตั้งนี้ให้เลือก' }}
      />

      <EquipmentModalFooter
        onCancel={handleClose}
        onConfirm={handleConfirm}
        confirmLoading={isPending}
        confirmDisabled={Object.keys(selected).length === 0}
        busy={isPending}
      />
    </EquipmentModalShell>
  )
}

export default React.memo<Props>(TrafficSignalCameraModal)
