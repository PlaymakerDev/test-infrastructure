"use client"
import { App, Popconfirm, Radio, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useCallback, useMemo, useState } from 'react'
import {
  useAttachAnalyticCameras,
  useAttachCountingCameras,
  useAttachCrosswalkCameras,
  useAttachWimCameras,
} from '@/hooks/queries/manage'
import { SOLUTION_TYPE, type APIResponseCamera } from '@/types/manage/solution-api'
import { errText } from '@/features/admin/settings/new-detail/project/context'
import { useEquipmentModal } from '../hooks/useEquipmentModal'
import { EquipmentLiveButton, EquipmentModalFooter, EquipmentModalShell, EquipmentStatusPill } from '../components'

interface Props {

}

/** Camera picker for Counting / Analytic / Crosswalk / WIM, opened from the
 *  "รายการอุปกรณ์" column of TableSolution (`equipment_modal`, type
 *  CAMERA_SELECT). Backend contract: the corresponding /solution/camera/
 *  {counting|analytic|crosswalk|wim} endpoint DELETES existing rows then
 *  INSERTs the incoming set — so the UI treats this as "the full list going
 *  forward". */
const EquipmentSelectModal: React.FC<Props> = (props) => {
  const { } = props
  const { open, item, record, solutions, cameras, camerasLoading, close, openLiveStream } =
    useEquipmentModal('CAMERA_SELECT')
  const { message } = App.useApp()

  const attachCounting = useAttachCountingCameras()
  const attachAnalytic = useAttachAnalyticCameras()
  const attachCrosswalk = useAttachCrosswalkCameras()
  const attachWim = useAttachWimCameras()
  const isSubmitting =
    attachCounting.isPending || attachAnalytic.isPending || attachCrosswalk.isPending || attachWim.isPending

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // User has toggled something this open - stop auto-reseeding over their edits.
  const [dirty, setDirty] = useState(false)

  const kindId = record?.solution_type.id

  /** Cameras already attached to THIS solution, per the link objects the
   *  camera-list endpoint nests on each row (2026-09-07 - fixes "ticks don't
   *  persist across reopens"). counting/analytic links carry solution_id, so
   *  a camera attached to a DIFFERENT solution of the same type does NOT
   *  pre-tick. counting/analytic carry solution_id directly; crosswalk via
   *  its embedded parent row (BE added 2026-09-07 on request). When a link
   *  exposes no solution id (old crosswalk payloads, wim - shape unverified),
   *  presence pre-ticks only when this task is the point's sole solution of
   *  that type; otherwise we can't attribute the link and leave it unticked
   *  rather than guess wrong. */
  const seed = useMemo(() => {
    if (!record) return [] as string[]
    const soleOfKind = solutions.filter((s) => s.solution_type.id === kindId).length <= 1
    return cameras
      .filter((c) => {
        if (kindId === SOLUTION_TYPE.Counting) return c.counting?.solution_id === record.id
        if (kindId === SOLUTION_TYPE.Analytic) return c.analytic?.solution_id === record.id
        if (kindId === SOLUTION_TYPE.Crosswalk) {
          const linkedTo = c.crosswalk?.crosswalk?.solution_id ?? null
          return linkedTo != null ? linkedTo === record.id : c.crosswalk != null && soleOfKind
        }
        if (kindId === SOLUTION_TYPE.WIM) {
          const linkedTo = c.wim?.solution_id ?? c.wim?.wim?.solution_id ?? null
          return linkedTo != null ? linkedTo === record.id : c.wim != null && soleOfKind
        }
        return false
      })
      .map((c) => c.id)
  }, [record, kindId, cameras, solutions])

  // Adjust-during-render (the React-endorsed pattern; setState-in-useEffect
  // trips the react-compiler lint): seed on open, re-apply when the camera
  // list settles AFTER the modal opened (the list query is often still in
  // flight on first open) - but never over edits the user already made.
  const seedKey = open ? `${record?.id ?? ''}:${seed.join(',')}` : ''
  const [prevSeedKey, setPrevSeedKey] = useState('')
  if (seedKey !== prevSeedKey) {
    setPrevSeedKey(seedKey)
    if (open) {
      if (!dirty) setSelectedIds(seed)
    } else if (dirty) {
      setDirty(false)
    }
  }

  // Offline cameras in the current selection — drives the single commit-time
  // warning on the ยืนยัน button (Popconfirm portals to body and inherits the
  // app root's dark Popover theme, no wrapper needed). Offline cameras stay
  // SELECTABLE (2026-09-07): a hard disable locked out ~208/660 install points
  // whose cameras are ALL offline, so the warning fires once at commit instead.
  const offlineSelectedCount = useMemo(
    () => cameras.filter((c) => selectedIds.includes(c.id) && !c.curl_status).length,
    [cameras, selectedIds],
  )

  const toggle = useCallback((id: string) => {
    setDirty(true)
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
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
        title: 'สถานะการเลือกใช้งาน',
        key: 'usage',
        width: 200,
        render: (_: unknown, row) => {
          const selected = selectedIds.includes(row.id)
          return (
            <Radio checked={selected} onClick={() => toggle(row.id)}>
              <span style={{ color: selected ? '#05F2DB' : '#FFF' }}>เลือกใช้งาน</span>
            </Radio>
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
    [selectedIds, toggle, openLiveStream],
  )

  const handleConfirm = useCallback(() => {
    if (!record) return
    // mutate + callbacks (not mutateAsync): the modal only closes on success
    // and stays open, retryable, on error.
    const attach =
      kindId === SOLUTION_TYPE.Counting ? attachCounting
        : kindId === SOLUTION_TYPE.Analytic ? attachAnalytic
          : kindId === SOLUTION_TYPE.Crosswalk ? attachCrosswalk
            : kindId === SOLUTION_TYPE.WIM ? attachWim
              : null
    if (!attach) {
      // getEquipmentModalType only routes the four kinds above here, so this
      // is a guard, not an expected path.
      message.warning(
        `การผูกกล้องสำหรับประเภทงาน "${record.solution_type.solution_name_atlas}" ยังไม่รองรับผ่านตัวเลือกนี้`,
      )
      return
    }
    attach.mutate(
      { solution_id: record.id, camera_id: selectedIds },
      {
        onSuccess: () => {
          message.success('บันทึกอุปกรณ์สำเร็จ')
          close()
        },
        onError: (err) => {
          message.error(errText(err, 'บันทึกอุปกรณ์ไม่สำเร็จ'))
        },
      },
    )
  }, [record, kindId, attachCounting, attachAnalytic, attachCrosswalk, attachWim, selectedIds, message, close])

  return (
    <EquipmentModalShell
      open={open}
      onClose={close}
      title={record?.solution_type.solution_name_atlas || record?.solution_type.solution_name || '-'}
      subtitle={item?.location_name || '-'}
    >
      <Table<APIResponseCamera>
        rowKey='id'
        columns={columns}
        dataSource={cameras}
        loading={camerasLoading}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => {
            setDirty(true)
            setSelectedIds(keys as string[])
          },
          columnTitle: 'เลือก',
          columnWidth: 70,
        }}
        pagination={false}
        size='middle'
        locale={{ emptyText: 'ยังไม่มีกล้อง CCTV ที่จุดติดตั้งนี้ให้เลือก' }}
      />

      <EquipmentModalFooter
        onCancel={close}
        onConfirm={handleConfirm}
        confirmLoading={isSubmitting}
        busy={isSubmitting}
        wrapConfirm={
          offlineSelectedCount === 0
            ? undefined
            : (button) => (
              <Popconfirm
                title={`มีอุปกรณ์ออฟไลน์ ${offlineSelectedCount} ตัวในรายการที่เลือก`}
                description='อุปกรณ์ที่ออฟไลน์จะยังไม่ทำงานจนกว่าจะกลับมาเชื่อมต่อ ยืนยันบันทึกหรือไม่?'
                okText='ยืนยันบันทึก'
                cancelText='กลับไปแก้ไข'
                onConfirm={handleConfirm}
                placement='topRight'
              >
                {button}
              </Popconfirm>
            )
        }
      />
    </EquipmentModalShell>
  )
}

export default React.memo<Props>(EquipmentSelectModal)
