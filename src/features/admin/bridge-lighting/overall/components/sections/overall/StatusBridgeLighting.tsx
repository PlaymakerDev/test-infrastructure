import BLStarIcon from '@/components/icon/BLStarIcon'
import React from 'react'

interface Props {

}

const StatusBridgeLighting: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className={`bg-[#FFFFFF10] border-2 rounded-2xl p-5 border-white`}>
      <BLStarIcon className='fs-24 mb-3' />
      <p className='fs-14 font-bold'>ไฟประดับสะพานแสดงผลล่าสุด</p>
      <h1>สะพานกรุงเทพ</h1>
      <p className='fs-12 text-white/50'>ไฟประดับ : สะพานกรุงเทพ ฝั่งพระนคร</p>
    </div>
  )
}

export default React.memo<Props>(StatusBridgeLighting)
