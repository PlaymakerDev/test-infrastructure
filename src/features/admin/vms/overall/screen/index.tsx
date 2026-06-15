"use client"
import React, { useEffect } from 'react'
import { OverallSection, TitleSection } from '../components'
import { OverallProvider } from '../context'
import { useAppDispatch } from '@/stores/hooks'
import { getVMSOverviewData, getVMSOverviewRandomOnlineData, getVMSOverviewTotalData } from '@/stores/reducers/vms/vmsOverviewSlice'
import { useSearchParams } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

interface Props { }

const VMSScreen: React.FC<Props> = (props) => {
  const { } = props
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const deptId = searchParams.get('dept_id')

  useEffect(() => {
    if (deptId) dispatch(getVMSOverviewData(deptId))
  }, [deptId, dispatch])

  useEffect(() => {
    if (deptId) {
      dispatch(getVMSOverviewRandomOnlineData({
        deptId,
        requestParams: {
          limit: 3
        }
      }))
    }
  }, [deptId, dispatch])

  useEffect(() => {
    if (deptId) dispatch(getVMSOverviewTotalData(deptId))
  }, [deptId, dispatch])

  return (
    <QueryClientProvider client={queryClient}>
      <OverallProvider>
        <div className='main-screen px-10'>
          <TitleSection />
          <section className='mt-8'>
            <OverallSection
              deptId={deptId!}
            />
          </section>
        </div>
      </OverallProvider>
    </QueryClientProvider>
  )
}

export default React.memo(VMSScreen)
