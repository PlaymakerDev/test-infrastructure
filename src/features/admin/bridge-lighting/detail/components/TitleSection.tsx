"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import { useDetailContext } from '../context'

interface Props {
}

const TitleSection: React.FC<Props> = () => {
  const router = useRouter()
  const { bridge } = useDetailContext()

  const isInWarranty = bridge.warranty === 'in-warranty'
  const isOnline = bridge.connection === 'online'

  return (
    <DetailTitleSection
      feature='BridgeLighting'
      roadCode={bridge.roadCode}
      installPoint={bridge.installPoint}
      onBack={() => router.back()}
      warranty={{
        label: isInWarranty ? 'ในค้ำ' : 'หมดค้ำ',
        color: isInWarranty ? '#05F2DB' : '#979797',
      }}
      googleMap={{ coord: bridge.coord }}
      anydesk={{ id: bridge.anydesk }}
      online={{ isOnline }}
    />
  )
}

export default React.memo<Props>(TitleSection)
