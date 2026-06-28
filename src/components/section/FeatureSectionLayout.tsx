"use client"
import React from 'react'

interface Props {
  top: React.ReactNode
  middle?: React.ReactNode
  bottom?: React.ReactNode
}

const FeatureSectionLayout: React.FC<Props> = ({ top, middle, bottom }) => (
  <div>
    <section>{top}</section>
    {middle !== undefined && <section className='mt-5'>{middle}</section>}
    {bottom !== undefined && <section className='mt-5'>{bottom}</section>}
  </div>
)

export default React.memo(FeatureSectionLayout)
