"use client"
import { Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'
import { TbPencil, TbPlus, TbShieldCheckFilled, TbTrash, TbVideo } from 'react-icons/tb'
import { useProjectDetailContext } from '../context'
import type { InstallPoint, TaskType } from '../types'
import { SOLUTION_TYPE } from '@/types/manage/solution-api'

interface Props {
  point: InstallPoint
  onEditPoint: () => void
  onDeletePoint: () => void
  onAddTaskType: () => void
  onEditTaskType: (task: TaskType) => void
  onDeleteTaskType: (task: TaskType) => void
  onOpenEquipment: (task: TaskType) => void
  onOpenCrossingCode: (task: TaskType) => void
}

const TaskTypeTable: React.FC<Props> = ({
  point,
  onEditPoint,
  onDeletePoint,
  onAddTaskType,
  onEditTaskType,
  onDeleteTaskType,
  onOpenEquipment,
  onOpenCrossingCode,
}) => {
  const { activeRoute, activePointTaskTypes, taskTypesLoading, activePointCameras } =
    useProjectDetailContext()

  const columns: ColumnsType<TaskType> = useMemo(
    () => [
      {
        title: 'ประเภทงาน',
        dataIndex: 'kind',
        key: 'kind',
        width: 200,
      },
      {
        title: 'CrossingCode',
        key: 'crossing',
        width: 160,
        align: 'center',
        render: (_: unknown, row) => {
          // CrossingCode endpoint is only implemented for Counting / Analytic
          // / Traffic / Crosswalk (backend returns 404 for others).
          const supportsCrossing =
            row.kindId === SOLUTION_TYPE.Counting ||
            row.kindId === SOLUTION_TYPE.Analytic ||
            row.kindId === SOLUTION_TYPE.Traffic ||
            row.kindId === SOLUTION_TYPE.Crosswalk
          if (!supportsCrossing) return null
          return (
            <button
              type='button'
              onClick={() => onOpenCrossingCode(row)}
              className='cursor-pointer hover:opacity-80'
              title='ดู CrossingCode'
            >
              <TbShieldCheckFilled size={22} className='text-(--default-blue)' />
            </button>
          )
        },
      },
      {
        title: 'รายการอุปกรณ์',
        key: 'equipment',
        width: 160,
        align: 'center',
        render: (_: unknown, row) => {
          // CCTV task rows draw from the point-level camera list; non-CCTV
          // rows carry their own attach state that we haven't preloaded on
          // the table, so lazily surface presence via the CCTV list only.
          const isCCTV = row.kindId === SOLUTION_TYPE.CCTV
          const hasCameras = isCCTV
            ? activePointCameras.length > 0
            : (row.equipment?.length ?? 0) > 0
          return (
            <button
              type='button'
              onClick={() => onOpenEquipment(row)}
              className='cursor-pointer hover:opacity-80'
              title='ดู/จัดการอุปกรณ์'
            >
              {isCCTV ? (
                <TbVideo
                  size={26}
                  className={hasCameras ? 'text-(--yellow)' : 'text-white/40'}
                />
              ) : (
                <div
                  className='inline-flex items-center justify-center w-8 h-8 rounded-full'
                  style={{
                    border: `1px solid ${hasCameras ? 'var(--yellow)' : 'var(--default-blue)'}`,
                    color: hasCameras ? 'var(--yellow)' : 'var(--default-blue)',
                  }}
                >
                  <TbPlus size={16} />
                </div>
              )}
            </button>
          )
        },
      },
      {
        title: 'ไปยังหน้าเว็บ',
        key: 'goto',
        width: 180,
        render: (_: unknown, row) => (
          <a
            href='#'
            onClick={(e) => e.preventDefault()}
            className='underline text-(--default-blue) hover:opacity-80'
            title='เปิดหน้าเว็บฟีเจอร์'
          >
            {activeRoute?.code} {point.name}
          </a>
        ),
      },
      {
        title: 'จัดการ',
        key: 'actions',
        width: 120,
        align: 'center',
        render: (_: unknown, row) => (
          <div className='flex items-center gap-3 justify-center'>
            <button
              type='button'
              onClick={() => onEditTaskType(row)}
              className='text-(--yellow) cursor-pointer hover:opacity-80'
              title='แก้ไข'
            >
              <TbPencil size={18} />
            </button>
            <button
              type='button'
              className='text-(--red) cursor-pointer hover:opacity-80'
              onClick={() => onDeleteTaskType(row)}
              title='ลบ'
            >
              <TbTrash size={18} />
            </button>
          </div>
        ),
      },
    ],
    [
      activeRoute,
      point.name,
      activePointCameras,
      onEditTaskType,
      onDeleteTaskType,
      onOpenEquipment,
      onOpenCrossingCode,
    ],
  )

  return (
    <div>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <span className='inline-flex items-center gap-1 text-(--default-blue)'>
            <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M9 4H4v5h5V4z' />
              <path d='M15 15h5v5h-5z' />
              <path d='M20 4l-4 4l-4-4' />
              <path d='M4 15l4 4l4-4' />
            </svg>
          </span>
          <span className='font-semibold text-white text-lg'>{point.name}</span>
          <button type='button' onClick={onEditPoint} className='text-(--yellow) cursor-pointer hover:opacity-80' title='แก้ไข'>
            <TbPencil size={18} />
          </button>
          <button type='button' onClick={onDeletePoint} className='text-(--red) cursor-pointer hover:opacity-80' title='ลบ'>
            <TbTrash size={18} />
          </button>
        </div>
        <Button
          size='middle'
          shape='round'
          icon={<TbPlus />}
          onClick={onAddTaskType}
          style={{
            background: 'var(--yellow)',
            color: '#000',
            borderColor: 'var(--yellow)',
            fontWeight: 700,
          }}
        >
          เพิ่มประเภทงาน
        </Button>
      </div>

      <Table<TaskType>
        rowKey='id'
        columns={columns}
        dataSource={activePointTaskTypes}
        loading={taskTypesLoading}
        pagination={false}
        size='middle'
        className='point-task-table'
      />
    </div>
  )
}

export default React.memo<Props>(TaskTypeTable)
