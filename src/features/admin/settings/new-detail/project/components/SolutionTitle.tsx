import { SolutionList, SolutionLocation } from '@/types/manage/project-detail-api'
import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React, { useCallback } from 'react'
import { TbMapSearch, TbPencilMinus, TbTrash } from 'react-icons/tb'
import { useProjectContext } from '../context'
import { useAppDispatch } from '@/stores/hooks'
import { setConfirmDeleteSolutionModalOpen, setCreateDeviceModalOpen } from '@/stores/reducers/modal/customModalSlice'

interface Props {
  item: SolutionLocation
  hasSolution: boolean
  data?: SolutionList[]
}

const SolutionTitle: React.FC<Props> = (props) => {
  const { item, hasSolution, data } = props
  const { isDeleting } = useProjectContext()
  const dispatch = useAppDispatch()

  // The modal owns the actual delete (it reads `item` from the store and
  // calls the context's `onDelete`) — no callback travels through Redux.
  const onConfirmDelete = useCallback(() => {
    dispatch(setConfirmDeleteSolutionModalOpen({
      open: true,
      type: 'DELETE_SOLUTION',
      data: data,
      item: item,
    }))
  }, [dispatch, data, item])

  return (
    <div className='flex justify-between items-center gap-5 flex-wrap'>
      <div className='flex items-center gap-5 shrink-0'>
        <div className='flex items-center gap-2 shrink-0'>
          <TbMapSearch className='fs-28 text-(--default-blue)' />
          <h2 className='text-(--default-blue)'>{item.location_name || '-'}</h2>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <TbPencilMinus
            className='fs-24 text-(--default-orange) cursor-pointer'
            title='แก้ไขข้อมูลโครงการ'
            onClick={() => dispatch(setCreateDeviceModalOpen({ open: true, item, type: 'EDIT_SOLUTION_NAME' }))}
          />
          <TbTrash
            className={`fs-24 text-(--default-red) cursor-pointer ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
            title='ลบโครงการ'
            onClick={() => !isDeleting && onConfirmDelete()}
          />
        </div>
      </div>
      {hasSolution && (
        <Button
          type='primary'
          icon={<PlusOutlined />}
          shape='round'
          onClick={() => dispatch(setCreateDeviceModalOpen({ open: true, item, type: 'CREATE' }))}
        >
          <p className='fs-12'>เพิ่มประเภทงาน</p>
        </Button>
      )}
    </div>
  )
}

export default React.memo<Props>(SolutionTitle)
