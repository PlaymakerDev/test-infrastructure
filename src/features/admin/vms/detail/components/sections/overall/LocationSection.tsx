"use client"
import React from 'react'
import { InfoCardSection, MapSection } from '../../../components'

interface Props {}

const LocationSection: React.FC<Props> = () => {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 lg:h-[75dvh]'>
      <div className='relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'><MapSection /></div>
      <div className='lg:overflow-y-auto lg:h-full flex flex-col gap-4'><InfoCardSection /></div>
    </div>
  )
}

export default React.memo<Props>(LocationSection)
