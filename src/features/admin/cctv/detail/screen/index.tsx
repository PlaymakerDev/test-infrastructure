"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from 'antd'
import { TitleSection, OverallSection } from '../components'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'
import type { InstallGroup, CameraRow } from '../components/sections/CameraGridView'
import {
  useCctvCameraCentralList,
  useCctvOverviewCentralList,
} from '@/hooks/queries/cctv'
import { extractCameraFunctions } from '@/features/admin/cctv/components/cameraFunctions'
import type {
  CctvInstallDetail,
  PanelCamera,
  CctvInstallPin,
} from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  id: string
  deptId: string
}

const CctvDetailScreen: React.FC<Props> = ({ id, deptId }) => {
  const router = useRouter()

  // Solution-level metadata (road code, contract, warranty, project/road ids).
  // Uses the SAME bureau-nested central list as the overall page (NO paging, the
  // whole department) so the cache is shared on navigation AND every solution
  // resolves. Previously this used the paginated overview list capped at
  // `limit: 100`, so any solution past row 100 resolved to `undefined` → roadId
  // undefined → the road-scoped camera query never fired → the page hung on the
  // skeleton forever (e.g. /cctv/detail/2439). `road.id` keys the camera query.
  const overviewList = useCctvOverviewCentralList(deptId)

  const listItem = useMemo(() => {
    for (const bureau of overviewList.data ?? []) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          if (String(sol.solution.id) === id) return sol
        }
      }
    }
    return undefined
  }, [overviewList.data, id])
  const roadId = listItem?.road.id

  // Cameras for the road, grouped by install point (solution_location) — the
  // SAME endpoint the search page uses. One call returns geometry + online
  // status + ip + sta + per-camera function tags (so the map can plot each
  // camera and the table can group + tag them). It returns the whole road; we
  // filter to the clicked solution below.
  const central = useCctvCameraCentralList(roadId)

  const loading = overviewList.isLoading || (!!roadId && central.isLoading)

  // central/list returns EVERY solution on the road (keyed by road_id). The
  // overall page links here by the clicked `solution.id`, so scope down to just
  // that solution — otherwise the detail shows the whole road's cameras (e.g.
  // 26) instead of the clicked install point's (e.g. 8). Other solutions on the
  // same road each have their own overall row → their own detail page.
  const solutionLists = useMemo(
    () => (central.data?.lists ?? []).filter((l) => String(l.solution_id) === id),
    [central.data, id]
  )

  // Camera groups (one per install point of THIS solution) — same shape as search.
  const groups = useMemo<InstallGroup[]>(() => {
    return solutionLists.map((item) => ({
      id: String(item.solution_location_id),
      label: [item.solution_name, item.solution_location_name].filter(Boolean).join(' '),
      warranty: item.project.is_warranty ? 'in-warranty' : 'expired',
      projectId: item.project.project_id,
      roadId,
      cameras: item.cameras.map<CameraRow>((c) => ({
        id: c.id,
        name: c.camera_name,
        km: c.sta,
        functions: extractCameraFunctions(c),
        ip: c.ip_address,
        hlsUrl: c.hls_url,
        streamStatus: c.is_online ? 'connect' : 'disconnect',
        deviceStatus: c.is_online ? 'connect' : 'disconnect',
      })),
    }))
  }, [solutionLists, roadId])

  const detail = useMemo<CctvInstallDetail | null>(() => {
    // `solutionLists` is already scoped to the clicked solution (NOT the whole
    // road), so its cameras match the overall row's count.
    const clicked = solutionLists[0]
    // Nothing to show until the solution row resolves (gives us the road code)
    // or the cameras arrive.
    if (!listItem && solutionLists.length === 0) return null

    const allCams = solutionLists.flatMap((l) => l.cameras)

    // Flat camera list for the right-side preview panel + map markers.
    const panelCameras: PanelCamera[] = allCams.map((c) => ({
      id: c.id,
      name: c.camera_name,
      ip: c.ip_address,
      online: c.is_online,
      km: c.sta,
      hlsUrl: c.hls_url,
      functions: extractCameraFunctions(c),
      coord: c.geometry_point ?? undefined,
    }))

    // Map pins — only cameras that have a coordinate.
    const pins: CctvInstallPin[] = allCams
      .filter((c) => c.geometry_point)
      .map((c) => ({ id: c.id, coord: c.geometry_point as [number, number], online: c.is_online }))

    // Centre the map on the first camera (of this solution) with a coordinate.
    const coord =
      allCams.find((c) => c.geometry_point)?.geometry_point ?? [100.5, 13.75]

    // Counts from the overall row (authoritative — matches the overall page);
    // fall back to counting the fetched cameras.
    const onlineCount = listItem?.camera.online ?? allCams.filter((c) => c.is_online).length
    const offlineCount = listItem?.camera.offline ?? allCams.filter((c) => !c.is_online).length
    const totalCount = listItem?.camera.total ?? (onlineCount + offlineCount)
    const roadCode = listItem?.road.code_name ?? ''

    return {
      id,
      roadCode,
      title: listItem?.solution.solution_name ?? clicked?.solution_name ?? `Solution #${id}`,
      location: listItem?.solution.solution_name ?? clicked?.solution_name ?? roadCode,
      projectName: listItem?.solution.solution_name ?? clicked?.solution_name ?? '',
      contractNo: listItem?.project.contract_no ?? '',
      warrantyStatus:
        (listItem?.is_warranty ?? clicked?.project.is_warranty) ? 'in-warranty' : 'expired',
      projectId: listItem?.project.id ?? clicked?.project.project_id,
      roadId,
      coord: coord as [number, number],
      totalCameras: totalCount,
      onlineCameras: onlineCount,
      offlineCameras: offlineCount,
      pins,
      cameras: panelCameras,
    }
  }, [solutionLists, listItem, roadId, id])

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

  // List finished loading but the solution isn't in this department — show a
  // clear message instead of an infinite skeleton (e.g. wrong dept_id in the URL).
  if (!overviewList.isLoading && !listItem) {
    return (
      <div className='main-screen px-10 pt-10'>
        <h1 className='text-(--yellow)'>ไม่พบข้อมูลสายทางนี้</h1>
        <p className='text-white/70 mt-2'>สายทางที่เลือกไม่อยู่ในแขวงทางหลวงชนบทนี้</p>
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
      <section className='mt-5 px-10 pb-8'>
        <OverallSection detail={detail} groups={groups} />
      </section>
      {/* Global Project Info modal — fires when the ⓘ icon in the title bar or
        * a group header is clicked. Reads project_id/road_id from Redux. */}
      <ProjectInfoModal />
      {/* Central Live Stream modal — opened (via Redux) from the map, side
        * panel, grid + table; fetches /cctv/cameras/{id} for complete info. */}
      <CCTVModal />
    </div>
  )
}

export default React.memo<Props>(CctvDetailScreen)
