"use client"
import React, { useEffect } from 'react'
import { OverallSection, TitleSection } from '../components'
import { OverallProvider } from '../context'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { getVMSOverviewData, getVMSOverviewListData, getVMSOverviewRandomOnlineData, getVMSOverviewTotalData } from '@/stores/reducers/vms/vmsOverviewSlice'
import { useSearchParams } from 'next/navigation'

const VMSScreen = () => {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const deptId = searchParams.get('dept_id')
  const { vms_list } = useAppSelector(state => state.vms_overview)

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

  useEffect(() => {
    if (deptId) {
      dispatch(getVMSOverviewListData({
        deptId,
        requestParams: vms_list.search
      }))
    }
  }, [deptId, dispatch, vms_list.search])

  return (
    <OverallProvider>
      <div className='main-screen px-10'>
        <TitleSection />
        <section className='mt-8'>
          <OverallSection />
        </section>
      </div>
    </OverallProvider>
  )
}

export default React.memo(VMSScreen)
