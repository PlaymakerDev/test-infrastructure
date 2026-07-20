import SwapButton from '@/components/swap-button/SwapButton'
import { useRouter } from 'next/navigation'
import React, { useMemo } from 'react'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { Skeleton } from 'antd'
import { useMobileMasterDepartmentByTID } from '../hooks'
import { useMobileContext } from '../context'

interface Props {

}

const OPTIONS = [
  {
    label: 'ภาพรวม',
    value: 'OVERALL'
  },
  {
    label: 'ข้อมูลรถเข้าชั่งน้ำหนัก',
    value: 'VEHICLE'
  },
]

const TitleSection: React.FC<Props> = () => {
  const { id, setCurrentTab } = useMobileContext()
  const router = useRouter()

  const { data, isLoading, isError } = useMobileMasterDepartmentByTID(id as string | number | undefined)

  const renderTitle = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 1 }} />
    if (isError) return '-'
    return `ตรวจสอบน้ำหนักเคลื่อนที่ : ${data?.data.data.way_id || '-'}`
  }, [isLoading, isError, data])

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
          <h1 className='text-(--yellow)'>{renderTitle}</h1>
          <p className='text-(--yellow)'>ระบบตรวจสอบน้ำหนักเคลื่อนที่ด้วยเจ้าหน้าที่ภาคสนาม</p>
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
