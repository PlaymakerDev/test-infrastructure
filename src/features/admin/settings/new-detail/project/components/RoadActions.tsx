"use client"
import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React, { useState } from 'react'
import { TbTrash } from 'react-icons/tb'
import type { RoadSolutionList } from '@/types/manage/project-detail-api'
import { roadLabel } from '../data/projectRoads'
import ModalAddRoad from './ModalAddRoad'
import ModalDeleteRoad from './ModalDeleteRoad'

interface Props {
  /** The selected road tab — what ลบสายทาง removes. */
  activeRoad?: RoadSolutionList
  onAdded: (roadId: number) => void
  onDeleted: (road: RoadSolutionList) => Promise<void> | void
}

/** เพิ่มสายทาง / ลบสายทาง beside the road tabs (user 2026-09-29). Shown to
 *  every role but 'user' — see useCanEditProjectRoads. */
const RoadActions: React.FC<Props> = (props) => {
  const { activeRoad, onAdded, onDeleted } = props
  const [isAddOpen, setAddOpen] = useState(false)
  // A snapshot, so the dialog keeps naming the road it was opened for.
  const [deleteTarget, setDeleteTarget] = useState<RoadSolutionList | null>(null)

  return (
    <div className='flex items-center gap-2 shrink-0'>
      <Button
        type='primary'
        shape='round'
        size='large'
        icon={<PlusOutlined />}
        onClick={() => setAddOpen(true)}
      >
        <p className='fs-12'>เพิ่มสายทาง</p>
      </Button>
      <Button
        shape='round'
        size='large'
        icon={<TbTrash className='fs-18' />}
        disabled={!activeRoad}
        title={activeRoad ? `ลบสายทาง ${roadLabel(activeRoad.road)} ออกจากโครงการ` : undefined}
        className='bg-transparent! border! border-(--default-red)! text-(--default-red)! hover:bg-(--default-red)/10! disabled:opacity-40!'
        onClick={() => activeRoad && setDeleteTarget(activeRoad)}
      >
        <p className='fs-12'>ลบสายทาง</p>
      </Button>
      <ModalAddRoad open={isAddOpen} onClose={() => setAddOpen(false)} onAdded={onAdded} />
      <ModalDeleteRoad
        open={deleteTarget !== null}
        road={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={onDeleted}
      />
    </div>
  )
}

export default React.memo<Props>(RoadActions)
