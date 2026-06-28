"use client"
import React from 'react'
import { CCTVSection, MapSection } from '../../../components'

interface Props { }

const LocationSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:h-[75dvh]'>
      <CCTVSection />
      <MapSection />
    </div>
  )
}

export default React.memo(LocationSection)
