"use client"
import { Button, Checkbox, ConfigProvider, message, Modal, Popconfirm, Radio, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useMemo, useState } from 'react'
import { TbPlayerPlay, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useProjectDetailContext } from '../../context'
import type { Equipment, TaskType } from '../../types'
import { SOLUTION_TYPE } from '@/types/manage/solution-api'

interface Props {
  open: boolean
  task: TaskType | null
  projectName: string
  onClose: () => void
  onOpenLiveStream: (equipment: Equipment) => void
}

const StatusPill: React.FC<{ online: boolean }> = ({ online }) => (
  <span
    className='inline-flex items-center gap-1 px-3 py-1 rounded-full fs-12'
    style={{
      border: `1px solid ${online ? '#66AEFF' : '#FF6666'}`,
      color: online ? '#66AEFF' : '#FF6666',
    }}
  >
    {online ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
    {online ? 'ออนไลน์' : 'ออฟไลน์'}
  </span>
)

interface Row extends Equipment {
  selected: boolean
}

/** Camera picker for non-CCTV task types. Backend contract:
 *  the corresponding /solution/camera/{counting|analytic|crosswalk|wim}
 *  endpoint DELETES existing rows then INSERTs the incoming set — so the
 *  UI treats this as "the full list going forward". */
const EquipmentSelectModal: React.FC<Props> = ({
  open,
  task,
  projectName,
  onClose,
  onOpenLiveStream,
}) => {
  const {
    activePointCameras,
    activePointTaskTypes,
    camerasLoading,
    attachCountingCameras,
    attachAnalyticCameras,
    attachCrosswalkCameras,
    attachWimCameras,
    isSubmitting,
  } = useProjectDetailContext()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // User has toggled something this open - stop auto-reseeding over their edits.
  const [dirty, setDirty] = useState(false)

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
    if (!task) return [] as string[]
    const soleOfKind =
      activePointTaskTypes.filter((t) => t.kindId === task.kindId).length <= 1
    return activePointCameras
      .filter((c) => {
        if (task.kindId === SOLUTION_TYPE.Counting) return c.links.countingSolutionId === task.id
        if (task.kindId === SOLUTION_TYPE.Analytic) return c.links.analyticSolutionId === task.id
        if (task.kindId === SOLUTION_TYPE.Crosswalk) {
          return c.links.crosswalkSolutionId != null
            ? c.links.crosswalkSolutionId === task.id
            : c.links.crosswalkLinked && soleOfKind
        }
        if (task.kindId === SOLUTION_TYPE.WIM) {
          return c.links.wimSolutionId != null
            ? c.links.wimSolutionId === task.id
            : c.links.wimLinked && soleOfKind
        }
        return false
      })
      .map((c) => c.id)
  }, [task, activePointCameras, activePointTaskTypes])

  // Adjust-during-render (the React-endorsed pattern; setState-in-useEffect
  // trips the react-compiler lint): seed on open, re-apply when the camera
  // list settles AFTER the modal opened (the list query is often still in
  // flight on first open) - but never over edits the user already made.
  const seedKey = open ? `${task?.id ?? ''}:${seed.join(',')}` : ''
  const [prevSeedKey, setPrevSeedKey] = useState('')
  if (seedKey !== prevSeedKey) {
    setPrevSeedKey(seedKey)
    if (open) {
      if (!dirty) setSelectedIds(seed)
    } else if (dirty) {
      setDirty(false)
    }
  }

  const rows: Row[] = useMemo(
    () => activePointCameras.map((e) => ({ ...e, selected: selectedIds.includes(e.id) })),
    [activePointCameras, selectedIds],
  )

  // Offline cameras in the current selection — drives the single commit-time
  // warning on the ยืนยัน button (Popconfirm portals to body and inherits the
  // app root's dark Popover theme, no wrapper needed).
  const offlineSelected = useMemo(() => rows.filter((r) => r.selected && !r.isOnline), [rows])

  const toggle = (id: string) => {
    setDirty(true)
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const columns: ColumnsType<Row> = useMemo(
    () => [
      {
        title: 'เลือก',
        key: 'select',
        width: 70,
        // Offline cameras are SELECTABLE since 2026-09-07: the original hard
        // `disabled={!row.isOnline}` (Keng, e82627c7) locked out ~208/660
        // install points whose cameras are ALL offline. Ticking is free —
        // the offline warning fires ONCE on the ยืนยัน button instead of per
        // tick (2026-09-07 UX decision: single interruption at commit time).
        render: (_: unknown, row) => (
          <Checkbox checked={row.selected} onChange={() => toggle(row.id)} />
        ),
      },
      { title: 'ชื่ออุปกรณ์', dataIndex: 'name', key: 'name', ellipsis: true },
      {
        title: 'สถานะการเลือกใช้งาน',
        key: 'usage',
        width: 200,
        render: (_: unknown, row) => (
          <Radio checked={row.selected} onClick={() => toggle(row.id)}>
            <span style={{ color: row.selected ? '#05F2DB' : '#FFF' }}>
              เลือกใช้งาน
            </span>
          </Radio>
        ),
      },
      {
        title: 'สถานะการเชื่อมต่อ',
        dataIndex: 'isOnline',
        key: 'isOnline',
        width: 160,
        render: (v: boolean) => <StatusPill online={v} />,
      },
      {
        title: 'Live Stream',
        key: 'live',
        width: 130,
        align: 'center',
        render: (_: unknown, row) => (
          <button
            type='button'
            onClick={() => onOpenLiveStream(row)}
            className='inline-flex items-center gap-1 text-(--yellow) hover:opacity-80 cursor-pointer'
            title='Live'
          >
            <TbPlayerPlay size={20} />
            <TbPlayerPlay size={20} style={{ marginLeft: -6 }} />
          </button>
        ),
      },
    ],
    [onOpenLiveStream],
  )

  const handleConfirm = async () => {
    if (!task) return
    try {
      if (task.kindId === SOLUTION_TYPE.Counting) {
        await attachCountingCameras(task.id, selectedIds)
      } else if (task.kindId === SOLUTION_TYPE.Analytic) {
        await attachAnalyticCameras(task.id, selectedIds)
      } else if (task.kindId === SOLUTION_TYPE.Crosswalk) {
        await attachCrosswalkCameras(task.id, selectedIds)
      } else if (task.kindId === SOLUTION_TYPE.WIM) {
        await attachWimCameras(task.id, selectedIds)
      } else {
        // Traffic Signal has its own phase-based picker
        // (TrafficSignalCameraModal); VMS uses VMSSolutionModal for
        // full provisioning. Lighting has no /manage/solution/camera/*
        // endpoint documented — falls through to a friendly warning.
        message.warning(
          `การผูกกล้องสำหรับประเภทงาน "${task.kind}" ยังไม่รองรับผ่านตัวเลือกนี้`,
        )
        return
      }
      onClose()
    } catch {
      // toast handled inside the context wrapper
    }
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            contentBg: '#1A1A1A',
            headerBg: '#1A1A1A',
            footerBg: '#1A1A1A',
            colorIcon: '#FFF',
            titleColor: '#66AEFF',
            borderRadiusLG: 16,
          },
          Table: {
            headerBg: '#66AEFF',
            headerColor: '#1A1A1A',
            headerSplitColor: 'transparent',
            colorBgContainer: 'transparent',
            colorText: '#FFFFFF',
            borderColor: 'rgba(252,209,22,0.25)',
            rowHoverBg: 'rgba(255,255,255,0.04)',
          },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={1200}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{
          container: { padding: '28px 32px', borderRadius: 16, background: '#1A1A1A' },
          mask: { background: 'rgba(0,0,0,0.55)' },
        }}
        title={null}
      >
        <div className='mb-4'>
          <h2 style={{ color: '#66AEFF', fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 6 }}>
            {task?.kind ?? '-'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: "var(--fs-12)", wordBreak: 'break-word', margin: 0 }}>
            {projectName}
          </p>
        </div>

        {camerasLoading ? (
          <div className='flex items-center justify-center py-10'>
            <Spin />
          </div>
        ) : (
          <Table<Row>
            rowKey='id'
            columns={columns}
            dataSource={rows}
            pagination={false}
            size='middle'
            locale={{ emptyText: 'ยังไม่มีกล้อง CCTV ที่จุดติดตั้งนี้ให้เลือก' }}
          />
        )}

        <div className='flex justify-end gap-3 mt-6'>
          <Button
            shape='round'
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: '#E5E5E5',
              color: '#4A4A4A',
              borderColor: '#E5E5E5',
              padding: '8px 28px',
              height: 'auto',
              fontWeight: 500,
            }}
          >
            ยกเลิก
          </Button>
          {(() => {
            const confirmBtn = (
              <Button
                shape='round'
                onClick={offlineSelected.length === 0 ? handleConfirm : undefined}
                loading={isSubmitting}
                style={{
                  background: '#FCD116',
                  color: '#1A1A1A',
                  borderColor: '#FCD116',
                  padding: '8px 32px',
                  height: 'auto',
                  fontWeight: 600,
                }}
              >
                ยืนยัน
              </Button>
            )
            if (offlineSelected.length === 0) return confirmBtn
            return (
              <Popconfirm
                title={`มีอุปกรณ์ออฟไลน์ ${offlineSelected.length} ตัวในรายการที่เลือก`}
                description='อุปกรณ์ที่ออฟไลน์จะยังไม่ทำงานจนกว่าจะกลับมาเชื่อมต่อ ยืนยันบันทึกหรือไม่?'
                okText='ยืนยันบันทึก'
                cancelText='กลับไปแก้ไข'
                onConfirm={handleConfirm}
                placement='topRight'
              >
                {confirmBtn}
              </Popconfirm>
            )
          })()}
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(EquipmentSelectModal)
