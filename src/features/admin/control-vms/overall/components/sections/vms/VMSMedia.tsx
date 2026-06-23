import { Image } from 'antd'
import React from 'react'
import { isVideoUrl } from '../../../data/media'

interface Props {
  url: string
  alt?: string
  variant: 'thumbnail' | 'player'
}

const VMSMedia: React.FC<Props> = ({ url, alt = '', variant }) => {
  if (isVideoUrl(url)) {
    if (variant === 'player') {
      return (
        <video
          src={url}
          controls
          autoPlay
          playsInline
          className='w-full max-h-[70vh] object-contain'
        />
      )
    }
    return (
      <video
        src={`${url}#t=0.1`}
        preload='metadata'
        muted
        playsInline
        className='w-full h-full object-cover'
      />
    )
  }

  return (
    <Image
      src={url}
      alt={alt}
      preview={false}
      width='100%'
      className={variant === 'player' ? 'object-contain max-h-[70vh]' : 'object-cover h-full'}
    />
  )
}

export default React.memo(VMSMedia)
