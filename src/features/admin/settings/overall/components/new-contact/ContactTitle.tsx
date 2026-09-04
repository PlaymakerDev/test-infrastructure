import { ContractorData } from '@/types/manage/contractor-api'
import { fmtNumber } from '@/utils/formatNumber'
import React from 'react'
import { TbInfoSquareRoundedFilled, TbPencilMinus, TbTrash } from 'react-icons/tb'

interface Props {
  item: ContractorData
  onEdit: (item: ContractorData) => void
  onDelete: (item: ContractorData) => void
}

const ContactTitle: React.FC<Props> = (props) => {
  const { item, onEdit, onDelete } = props

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <div className='flex items-center gap-2 shrink-0'>
        <h1 className='fs-20 mb-0 whitespace-nowrap'>{item.company_name || '-'}</h1>
        <TbInfoSquareRoundedFilled
          size={24}
          title='ดูข้อมูลโครงการ'
          className='text-white cursor-pointer hover:text-(--yellow) shrink-0'
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
          onClick={() => onEdit(item)}
        />
        <TbTrash
          className='fs-22 text-red-500 cursor-pointer'
          title='ลบผู้รับจ้าง'
          onClick={() => onDelete(item)}
        />
      </div>
    </div>
  )
}

export default React.memo<Props>(ContactTitle)
