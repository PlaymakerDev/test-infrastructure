"use client"
import React, { useEffect } from 'react'
import { TitleSection, OverallSection } from '../components'
import { CCTVProvider } from '../context'
import { useAppDispatch } from '@/stores/hooks'
import { getCctvDeptOverviewData } from '@/stores/reducers/cctv/cctvSlice'
import { useSearchParams } from 'next/dist/client/components/navigation'

const CCTVScreen: React.FC = () => {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const deptId = searchParams.get('dept_id')

  useEffect(() => {
    dispatch(getCctvDeptOverviewData(deptId!))
  }, [dispatch, deptId])

  return (
    <CCTVProvider>
      <div className='main-screen px-10'>
        <TitleSection />
        <section className='mt-8'>
          <OverallSection />
        </section>
      </div>
    </CCTVProvider>
  )
}

export default React.memo(CCTVScreen)
