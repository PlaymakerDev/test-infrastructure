"use client"
import React, { useEffect, useState } from 'react'
import { Avatar } from 'antd'
import dayjs from 'dayjs'
import { useAppSelector } from '@/stores/hooks'
import { useRouter } from 'next/navigation'

interface Props {

}

// basePath ('/atlas' in prod, '' in dev) — public assets are NOT prefixed
// automatically like next/link, so prepend it manually (same as the login page).
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? ''
const LOGO_SRC = `${BASE_PATH}/images/login/drr-logo.png`

const SidebarHeader: React.FC<Props> = (props) => {
  const { } = props
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'))
  const { info } = useAppSelector((state) => state.auth)
  const router = useRouter()

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
        src={LOGO_SRC}
        alt='กรมทางหลวงชนบท'
        style={{ backgroundColor: 'transparent', cursor: 'pointer' }}
        onClick={() => router.push('/admin/dashboard?dept_id=0&scope=all')}
      />
      <section className='text-center'>
        <p className='fs-14'>{info?.username || '-'}</p>
        <p className='fs-14'>{dayjs().format('DD MMMM BBBB')} {currentTime}</p>
      </section>
    </header>
  )
}

export default React.memo<Props>(SidebarHeader)
