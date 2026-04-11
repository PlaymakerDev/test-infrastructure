"use client"
import React, { useEffect, useState } from 'react'
import { Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

interface Props {

}

const SidebarHeader: React.FC<Props> = (props) => {
  const { } = props
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'))

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm:ss'))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className='flex flex-col flex-wrap items-center justify-center gap-3'>
      <Avatar
        size={64}
        icon={<UserOutlined />}
      />
      <section className='text-center'>
        <p className='fs-14'>{currentTime}</p>
        <p className='fs-14'>{dayjs().format('DD MMMM BBBB')}</p>
      </section>
    </header>
  )
}

export default React.memo<Props>(SidebarHeader)
