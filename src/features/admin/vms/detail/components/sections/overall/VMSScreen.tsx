import { Image } from 'antd'
import React from 'react'

interface Props {

}

const VMSScreen: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='flex-1 min-h-0 flex flex-col bg-black/40 backdrop-blur-xs rounded-lg p-5'>
      <h3 className='text-(--yellow) mb-1.5'>หน้าจอโปรแกรมป้าย VMS</h3>
      <figure className='figure-large min-h-0 overflow-hidden rounded-lg lg:flex-1 lg:max-h-none'>
        <Image
          src={'https://files.catbox.moe/pne90v.png'}
          alt='example-image'
          width={'100%'}
          height={'100%'}
          className='object-center object-cover'
        />
      </figure>
    </div>
  )
}

export default React.memo<Props>(VMSScreen)
