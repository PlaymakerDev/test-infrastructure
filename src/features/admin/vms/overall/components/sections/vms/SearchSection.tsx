import React from 'react'
import {
  FormSearchSection
} from '@/features/admin/vms/overall/components'
import { useVMSContext } from '../../../context'
import { BureauList } from '@/components/list'
import BUREAU_LIST from '@/mock/controlcam.json'

interface Props {
  openFromDrawer?: boolean
}

const SearchSection: React.FC<Props> = (props) => {
  const { openFromDrawer } = props
  const { setBureau, setBureauState, setBureauRoute, setBureauSign } = useVMSContext()

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
        <BureauList
          data={BUREAU_LIST}
          onBureauClick={(item) => setBureau(item)}
          onStateClick={(item) => setBureauState(item)}
          onRouteClick={(item) => setBureauRoute(item)}
          onSignClick={(item) => setBureauSign(item)}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(SearchSection)
