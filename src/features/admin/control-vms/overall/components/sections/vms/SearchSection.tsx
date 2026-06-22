import React, { useMemo } from 'react'
import {
  FormSearchSection
} from '@/features/admin/control-vms/overall/components'
import { useControlVMSContext } from '../../../context'
import { BureauList } from '@/components/list'
import BUREAU_LIST from '@/mock/controlcam.json'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getVMSDepartmentAPI } from '@/services/routes/ControlVMSService'
import { Empty, Skeleton } from 'antd'

interface Props {
  openFromDrawer?: boolean
}

const SearchSection: React.FC<Props> = (props) => {
  const { openFromDrawer } = props
  const { setBureau, setBureauState, setBureauRoute, setBureauSign, setVMSIdList } = useControlVMSContext()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vms_department'],
    queryFn: () => getVMSDepartmentAPI(),
    placeholderData: keepPreviousData
  })

  const renderBureauList = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <BureauList
        data={data?.data || []}
        onBureauClick={(item) => setBureau(item)}
        onStateClick={(item) => setBureauState(item)}
        onRouteClick={(item) => setBureauRoute(item)}
        onSignClick={(item) => setBureauSign(item)}
        onSelectionChange={(item) => {
          const selectedVMSIdList = item.signs.map(i => i.vms_id)
          setVMSIdList(selectedVMSIdList)
        }}
      />)
  }, [
    isLoading,
    isError,
    data,
    setBureau,
    setBureauState,
    setBureauRoute,
    setBureauSign,
    setVMSIdList
  ])


  return (
    <div
      className={`bg-(--dark-black) rounded-tr-lg ${openFromDrawer ? 'p-5' : 'py-10 px-12'} h-full`}
    >
      <section>
        <FormSearchSection />
      </section>
      <section className='mt-5'>
        <h3 className='text-(--yellow)'>เลือกป้ายที่ต้องการควบคุมการแสดงผล</h3>
        <p className='fs-12 text-gray-400'>เลือกควบคุมป้ายแสดงผลได้ทั้งแบบรายป้ายหรือทั้งหมดตามต้องการ</p>
      </section>
      <section className='mt-5'>
        {renderBureauList}
      </section>
    </div>
  )
}

export default React.memo<Props>(SearchSection)
