"use client"
import React from 'react'

interface Props { }

const MadrixControlPanel: React.FC<Props> = (props) => {
  const { } = props
  return (
    <div className='flex flex-col bg-(--dark-black)/80 backdrop-blur-xs rounded-lg p-5'>
      <h3 className='text-(--yellow) mb-1.5'>หน้าจอโปรแกรมควบคุมไฟประดับ</h3>
      <figure className='figure-normal min-h-0 rounded-lg overflow-hidden'>
        <div className='flex items-center justify-center h-full bg-black'>
          <p className='fs-12 text-gray-500'>ยังไม่มีข้อมูล</p>
        </div>
      </figure>
    </div>
  )
}

export default React.memo<Props>(MadrixControlPanel)
