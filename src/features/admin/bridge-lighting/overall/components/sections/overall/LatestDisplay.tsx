import React from 'react'
import { TbSparkles } from 'react-icons/tb'

interface Props {

}

const LatestDisplay: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='h-full bg-white/10 border-2 rounded-lg p-5 border-white'>
      <div>
        <TbSparkles className='fs-24 mb-1' />
        <h4>ไฟประดับสะพานแสดงผลล่าสุด</h4>
      </div>
      <div>
        <h3 className='fs-24'>สะพานกรุงเทพ</h3>
        <p className='fs-12 text-gray-400'>ไฟประดับ : สะพานกรุงเทพ ฝั่งพระนคร (5 ชั่วโมง)</p>
      </div>
    </div>
  )
}

export default React.memo<Props>(LatestDisplay)
