import Link from 'next/link'
import { useAppDispatch } from '@/stores/hooks'
import { setContactModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { ContractorData } from '@/types/manage/contractor-api'
import React, { useCallback } from 'react'
import { TbInfoSquareRoundedFilled, TbPencilMinus, TbTrash } from 'react-icons/tb'
import { useOverallContext } from '../../context'
import ContractorCountPills from './ContractorCountPills'

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
        <ContractorCountPills item={item} />
        {/* สรุปข้อมูลผู้รับจ้าง (user 2026-09-30) — a link, so it opens in a new
            tab too; keyed by the contractor's user_id, which is what every
            device-status / uptime filter takes. #FF9D00 is the Figma fill
            (user 2026-10-01). The `!`s are needed: antd's global link style
            (`a { color: colorLink; background-color: transparent }`) sits
            outside Tailwind's layers, so it beats plain utilities — without
            them this rendered as blue text on no fill. */}
        <Link
          href={`/admin/settings/detail/contractor/${item.user_id}`}
          className='shrink-0 rounded-3xl border border-[#FF9D00] bg-[#FF9D00]! text-(--light-black)! hover:text-(--light-black)! px-5 py-1 hover:opacity-85'
        >
          <p className='fs-12 whitespace-nowrap'>สรุปข้อมูลผู้รับจ้าง</p>
        </Link>
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
