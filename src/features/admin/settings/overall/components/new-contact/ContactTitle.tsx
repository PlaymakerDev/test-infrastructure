import { useAppDispatch } from '@/stores/hooks'
import { setContactModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { ContractorData } from '@/types/manage/contractor-api'
import { fmtNumber } from '@/utils/formatNumber'
import React, { useCallback } from 'react'
import { TbInfoSquareRoundedFilled, TbPencilMinus, TbTrash } from 'react-icons/tb'
import { useOverallContext } from '../../context'

interface Props {
  item: ContractorData
}

const ContactTitle: React.FC<Props> = (props) => {
  const { item } = props
  const { setContactInfo } = useOverallContext()
  const dispatch = useAppDispatch()

  const onOpenContactModal = useCallback((type: 'UPDATE' | 'DELETE') => {
    dispatch(setContactModalOpen({ open: true, type, data: item }))
  }, [dispatch, item])

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <div className='flex items-center gap-2 shrink-0'>
        <h1 className='fs-20 mb-0 whitespace-nowrap'>{item.company_name || '-'}</h1>
        <TbInfoSquareRoundedFilled
          size={24}
          title='ดูข้อมูลโครงการ'
          className='text-white cursor-pointer hover:text-(--yellow) shrink-0'
          onClick={() => setContactInfo({ open: true, data: item })}
        />
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <div className='shrink-0 rounded-3xl border border-(--default-blue) text-(--default-blue) px-5 py-1'>
          <p className='fs-12 whitespace-nowrap'>{fmtNumber(Number(item.project_count)) || 0} โครงการ</p>
        </div>
        <div className='shrink-0 rounded-3xl border border-(--yellow) text-(--yellow) px-5 py-1'>
          <p className='fs-12 whitespace-nowrap'>{fmtNumber(Number(item.solution_type_count)) || 0} จุดติดตั้ง</p>
        </div>
        <div className='shrink-0 rounded-3xl border border-(--default-orange) text-(--default-orange) px-5 py-1'>
          <p className='fs-12 whitespace-nowrap'>{fmtNumber(Number(item.solution_count)) || 0} Solution</p>
        </div>
      </div>

      <div className='flex items-center gap-2 shrink-0'>
        <TbPencilMinus
          className='fs-22 text-orange-300 cursor-pointer'
          title='แก้ไขข้อมูลผู้รับจ้าง'
          onClick={() => onOpenContactModal('UPDATE')}
        />
        <TbTrash
          className='fs-22 text-red-500 cursor-pointer'
          title='ลบผู้รับจ้าง'
          onClick={() => onOpenContactModal('DELETE')}
        />
      </div>
    </div>
  )
}

export default React.memo<Props>(ContactTitle)
