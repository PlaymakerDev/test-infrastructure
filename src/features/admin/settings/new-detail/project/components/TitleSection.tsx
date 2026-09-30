import { useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'
import { TbArrowBigLeftFilled, TbInfoSquareRoundedFilled } from 'react-icons/tb'
import { Empty, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { INIT_ROAD_SOLUTION, useProjectContext } from '../context';
import { getProjectByIDAPI, getRoadSolutionAPI } from '@/services/routes/ProjectDetailService';
import { RoadActions, SwapButton } from '../components';
import { RoadSolutionList } from '@/types/manage/project-detail-api';
import { useAppDispatch } from '@/stores/hooks';
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice';
import { roadAfterDelete } from '../data/projectRoads';
import { useCanEditProjectRoads } from '../hooks/useCanEditProjectRoads';

interface Props {

}

// Stable fallback reference — `roadSolutionRes?.data ?? []` would otherwise
// create a brand-new array every render while the query is loading, which
// breaks the `roads`-keyed useMemo below.
const EMPTY_ROADS: RoadSolutionList[] = []


const TitleSection: React.FC<Props> = (props) => {
  const { } = props
  const router = useRouter()
  const { id, setRoadSolution } = useProjectContext()
  const dispatch = useAppDispatch()

  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectByIDAPI(String(id)),
    enabled: !!id,
  })

  const {
    data: roadSolutionRes,
    isLoading: isRoadSolutionLoading,
    isError: isRoadSolutionError,
    refetch: refetchRoads,
  } = useQuery({
    queryKey: ['roadSolution', id],
    queryFn: () => getRoadSolutionAPI({ project_id: String(id) }),
    enabled: !!id,
  })

  const roads = roadSolutionRes?.data ?? EMPTY_ROADS
  const canEditRoads = useCanEditProjectRoads()

  const [activeRoadId, setActiveRoadId] = useState<string>()
  const activeRoad = activeRoadId ?? (roads[0] ? String(roads[0].project_road_id) : undefined)
  const activeRoadRow = roads.find((road) => String(road.project_road_id) === activeRoad)

  // The tab strip and MainContent (via the context's roadSolution) move together.
  const selectRoad = useCallback((road: RoadSolutionList | undefined) => {
    setActiveRoadId(road ? String(road.project_road_id) : undefined)
    setRoadSolution(road ?? { ...INIT_ROAD_SOLUTION })
  }, [setRoadSolution])

  // Land on the road just added — it comes with its "จุดติดตั้งที่ 1".
  const onRoadAdded = useCallback(async (roadId: number) => {
    const before = new Set(roads.map((road) => road.project_road_id))
    const { data } = await refetchRoads()
    const rows = data?.data ?? []
    const added = rows.find((road) => road.road_id === roadId && !before.has(road.project_road_id))
    if (added) selectRoad(added)
  }, [roads, refetchRoads, selectRoad])

  const onRoadDeleted = useCallback(async (deleted: RoadSolutionList) => {
    const { data } = await refetchRoads()
    selectRoad(roadAfterDelete(roads, deleted.project_road_id, data?.data ?? []))
  }, [roads, refetchRoads, selectRoad])

  const renderSwapButton = useMemo(() => {
    if (isRoadSolutionLoading) return <Skeleton.Button active shape='round' size='large' style={{ width: 160 }} />
    if (isRoadSolutionError) return <Empty description='ไม่พบสายทางในโครงการนี้' />
    // A project without roads adds its first one from EmptyRoadSolution.
    if (!roads.length) return
    return (
      <section className='mt-5 px-0 lg:px-10'>
        <p className='text-(--default-blue) mb-2'>สายทางทั้งหมดในโครงการ</p>
        {/* The buttons sit right after the tabs; once the tabs fill the row
            they drop to the next line and the tabs scroll sideways. */}
        <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
          <div className='min-w-0 max-w-full'>
            <SwapButton
              options={roads}
              activeValue={activeRoad}
              setLabelValue={setActiveRoadId}
              onChange={setRoadSolution}
            />
          </div>
          {canEditRoads && (
            <RoadActions activeRoad={activeRoadRow} onAdded={onRoadAdded} onDeleted={onRoadDeleted} />
          )}
        </div>
      </section>
    )
  }, [isRoadSolutionLoading, isRoadSolutionError, roads, activeRoad, activeRoadRow, canEditRoads, onRoadAdded, onRoadDeleted, setActiveRoadId, setRoadSolution])

  if (isProjectLoading) return <Skeleton active paragraph={{ rows: 1 }} />
  if (isProjectError) return <Empty description='ไม่พบข้อมูลโครงการ' />

  return (
    <div className='px-8'>
      <p
        className='block mb-3 lg:hidden text-(--yellow) cursor-pointer'
        onClick={() => router.back()}
      >
        &lt; ย้อนกลับ
      </p>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2 hidden lg:block'
          onClick={() => router.back()}
        />
        <div>
          <h1 className='text-(--yellow)'>จัดการข้อมูลโครงการ</h1>
          <div className='flex flex-wrap items-center gap-2'>
            <p>{project?.data.project_name || '-'}</p>
            <TbInfoSquareRoundedFilled
              size={24}
              title='ดูข้อมูลโครงการ'
              className='text-white cursor-pointer hover:text-(--yellow) shrink-0'
              onClick={() => {
                dispatch(
                  setProjectInfoModalOpen({
                    open: true,
                    project_id: project?.data?.id,
                    road_id: null,
                  }),
                )
              }}
            />
            <span
              className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'
              style={{
                borderColor: project?.data?.is_warranty ? '#05F2DB' : '#979797',
                color: project?.data?.is_warranty ? '#05F2DB' : '#979797'
              }}
            >
              {project?.data?.is_warranty ? 'ในค้ำ' : 'หมดค้ำ'}
            </span>
          </div>
        </div>
      </section>
      {renderSwapButton}
    </div>
  )
}

export default React.memo<Props>(TitleSection)
