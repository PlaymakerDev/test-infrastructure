import React from 'react'
import { DataDisplaySection, LocationSection } from '../components'

interface Props {}

const OverallSection: React.FC<Props> = () => {
  return (
    <div>
      <section><LocationSection /></section>
      <section className='mt-5'><DataDisplaySection /></section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
