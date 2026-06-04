import { Image } from 'antd'
import React from 'react'

interface Props {

}

const MobileDetailImage: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className="h-full rounded-lg p-5 bg-(--dark-black)">
      <div className='mb-1.5'>
        <figure className='h-52 overflow-hidden rounded-lg'>
          <Image
            src='https://files.catbox.moe/pne90v.png'
            alt='example-image'
            width={'100%'}
            height={'100%'}
            className='object-center object-cover'
          />
        </figure>
        <p className='text-(--yellow) mt-2.5'>กั้นการจราจร</p>
      </div>
      <div className='mt-1.5'>
        <figure className='h-52 overflow-hidden rounded-lg'>
          <Image
            src='https://files.catbox.moe/0mw93c.png'
            alt='example-image'
            width={'100%'}
            height={'100%'}
            className='object-center object-cover'
          />
        </figure>
        <p className='text-(--yellow) mt-2.5'>บุคคลผู้ร่วมบูรณาการ</p>
      </div>
    </div>
  )
}

export default React.memo<Props>(MobileDetailImage)
