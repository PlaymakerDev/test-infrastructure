"use client"
import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from 'antd'
import { TitleSection, OverallSection } from '../components'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { getCctvDeptCamerasData, getCctvDeptOverviewListData, resetDetailCameras } from '@/stores/reducers/cctv/cctvSlice'
import type { CctvInstallDetail, PanelCamera, CctvInstallPin } from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  id: string
  deptId: string
}

const CctvDetailScreen: React.FC<Props> = ({ id, deptId }) => {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const { detailCameras, overviewList, task_schedules } = useAppSelector((s) => s.cctv)
  const loading = task_schedules.detailCameras.loading

  useEffect(() => {
    if (!deptId) return
    dispatch(getCctvDeptCamerasData({ deptId, solutionId: id }))
    if (!overviewList) {
      dispatch(getCctvDeptOverviewListData({ deptId, page: 1, limit: 100 }))
    }
    return () => { dispatch(resetDetailCameras()) }
  }, [dispatch, deptId, id])

  const listItem = useMemo(
    () => overviewList?.res_data.find((item) => String(item.solution.id) === id),
    [overviewList, id]
  )

  const detail = useMemo<CctvInstallDetail | null>(() => {
    const cameras = detailCameras?.cctv ?? []
    if (cameras.length === 0 && task_schedules.detailCameras.status !== 'SUCCESS') return null

    const firstCoord = cameras[0]?.geometry_point ?? [100.5, 13.75]

    const panelCameras: PanelCamera[] = cameras.map((c) => ({
      id: c.id,
      name: c.camera_name,
      ip: '',
      online: true,
      hlsUrl: c.hls_url,
      functions: [],
    }))

    const pins: CctvInstallPin[] = cameras.map((c) => ({
      id: c.id,
      coord: c.geometry_point,
      online: true,
    }))

    return {
      id,
      roadCode: listItem?.road.code_name ?? '',
      title: listItem?.solution.solution_name ?? `Solution #${id}`,
      location: listItem?.road.code_name ?? '',
      projectName: listItem?.solution.solution_name ?? '',
      contractNo: listItem?.project.contract_no ?? '',
      warrantyStatus: listItem?.is_warranty ? 'in-warranty' : 'expired',
      coord: firstCoord as [number, number],
      totalCameras: listItem?.camera.total ?? cameras.length,
      onlineCameras: listItem?.camera.online ?? cameras.length,
      offlineCameras: listItem?.camera.offline ?? 0,
      pins,
      cameras: panelCameras,
    }
  }, [detailCameras, listItem, id, task_schedules.detailCameras.status])

  if (!deptId) {
    return (
      <div className='main-screen px-10 pt-10'>
        <h1 className='text-(--yellow)'>ไม่พบข้อมูลแขวงทางหลวงชนบท</h1>
        <p className='text-white/70 mt-2'>กรุณาเข้าถึงหน้านี้ผ่านรายการกล้อง CCTV</p>
        <button
          className='mt-4 px-4 py-2 rounded bg-(--yellow) text-black font-semibold'
          onClick={() => router.back()}
          type='button'
        >
          กลับ
        </button>
      </div>
    )
  }

  if (loading || !detail) {
    return (
      <div className='main-screen px-10 pt-10'>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    )
  }

  return (
    <div className='main-screen'>
      <TitleSection detail={detail} />
      <section className='mt-5 px-10'>
        <OverallSection detail={detail} />
      </section>
    </div>
  )
}

export default React.memo<Props>(CctvDetailScreen)
