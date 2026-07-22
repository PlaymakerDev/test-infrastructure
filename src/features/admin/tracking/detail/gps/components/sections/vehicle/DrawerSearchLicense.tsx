"use client"
import { Drawer } from 'antd'
import React, { useEffect, useState } from 'react'
import SearchLicenseSection from './SearchLicenseSection'
import { useGPSContext } from '../../../context'
import { VehicleLocationData } from '@/types/tracking/detail-gps-api'

interface Props {
  data?: VehicleLocationData
}

const DrawerSearchLicense: React.FC<Props> = (props) => {
  const { data } = props
  const { licenseOpen, setLicenseOpen } = useGPSContext()
  const [isXl, setIsXl] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)').matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const handler = (e: MediaQueryListEvent) => setIsXl(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <Drawer
      open={!isXl && licenseOpen}
      onClose={() => setLicenseOpen(false)}
      placement='bottom'
      styles={{
        wrapper: { width: '100%' },
        body: { padding: 0, background: 'var(--dark-black)' },
        header: {
          background: 'var(--dark-black)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        },
        close: { color: 'white' },
      }}
      title='รายการทะเบียน'
      size={600}
    >
      <SearchLicenseSection
        openFromDrawer={true}
        data={data}
      />
    </Drawer>
  )
}

export default React.memo(DrawerSearchLicense)
