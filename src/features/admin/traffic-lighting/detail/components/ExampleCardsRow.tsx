"use client"
import React from 'react'

/** Two-column example card images below the overview control row. */
const ExampleCardsRow: React.FC = () => {
  return (
    <div className='flex flex-col md:flex-row w-full gap-3 mt-4'>
      <div className='flex-1 min-w-0'>
        <img src='/images/Lighting/cardexample1.png' alt='' className='w-full h-auto' />
      </div>
      <div className='flex-1 min-w-0'>
        <img src='/images/Lighting/cardexample2.png' alt='' className='w-full h-auto' />
      </div>
    </div>
  )
}

export default React.memo(ExampleCardsRow)
