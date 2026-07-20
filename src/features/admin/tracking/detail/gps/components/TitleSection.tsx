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
    label: 'ข้อมูลรถรายสายทาง',
    value: 'VEHICLE'
  },
  // {
  //   label: 'รายงานสรุปผล',
  //   value: 'SUMMARY'
  // },
]

const TitleSection: React.FC<Props> = (props) => {
  const { setCurrentTab } = props
  const router = useRouter()

  return (
    <div className='px-8'>
      <p
        className='block mb-3 lg:hidden text-(--yellow) cursor-pointer'
        onClick={() => router.back()}
      >
        &lt; ย้อนกลับ
      </p>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2 hidden lg:block'
          onClick={() => router.back()}
        />
        <div>
          <h1 className='text-(--yellow)'>ติดตาม GPS</h1>
          <p className='text-(--yellow)'>ระบบติดตามตำแหน่งรถบรรทุกบนสายทางกรมทางหลวงชนบท</p>
        </div>
      </section>
      <section className='mt-5 px-0 lg:px-10'>
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
