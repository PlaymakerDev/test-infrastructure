import SwapButton from '@/components/swap-button/SwapButton'
import { useRouter } from 'next/navigation'
import React from 'react'
import { TbArrowBigLeftFilled } from 'react-icons/tb'

interface Props {
  setCurrentTab: (value: string) => void;
}


const OPTIONS = [
  {
    label: 'ภาพรวม',
    value: 'OVERALL'
  },
  {
    label: 'รายงานสรุปผลการค้นหา',
    value: 'SUMMARY'
  },
]

const TitleSection: React.FC<Props> = (props) => {
  const { setCurrentTab } = props
  const router = useRouter()

  return (
    <div className='px-3'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer'
          onClick={() => router.back()}
        />
        <div>
          <h1 className='text-(--yellow)'>ค้นหาป้ายทะเบียน</h1>
          <p className='text-(--yellow)'>ระบบจดจำป้ายทะเบียนยานพาหนะ (ANPR)</p>
        </div>
      </section>
      <section className='mt-5 px-10'>
        <SwapButton
          options={OPTIONS}
          defaultActive="OVERALL"
          setLabelValue={(value) => setCurrentTab(value)}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
