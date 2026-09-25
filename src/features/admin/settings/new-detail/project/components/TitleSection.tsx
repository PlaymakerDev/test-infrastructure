import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { TbArrowBigLeftFilled, TbInfoSquareRoundedFilled } from 'react-icons/tb'
import { Empty, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useProjectContext } from '../context';
import { getProjectByIDAPI, getRoadSolutionAPI } from '@/services/routes/ProjectDetailService';
import { SwapButton } from '../components';
import { RoadSolutionList } from '@/types/manage/project-detail-api';
import { useAppDispatch } from '@/stores/hooks';
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice';

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
  } = useQuery({
    queryKey: ['roadSolution', id],
    queryFn: () => getRoadSolutionAPI({ project_id: String(id) }),
    enabled: !!id,
  })

  const roads = roadSolutionRes?.data ?? EMPTY_ROADS

  const [activeRoadId, setActiveRoadId] = useState<string>()
  const activeRoad = activeRoadId ?? (roads[0] ? String(roads[0].project_road_id) : undefined)

  const renderSwapButton = useMemo(() => {
    if (isRoadSolutionLoading) return <Skeleton.Button active shape='round' size='large' style={{ width: 160 }} />
    if (isRoadSolutionError) return <Empty description='ไม่พบสายทางในโครงการนี้' />
    if (!roads.length) return
    return (
      <section className='mt-5 px-0 lg:px-10'>
        <p className='text-(--default-blue) mb-2'>สายทางทั้งหมดในโครงการ</p>
        <SwapButton
          options={roads}
          activeValue={activeRoad}
          setLabelValue={setActiveRoadId}
          onChange={setRoadSolution}
        />
      </section>
    )
  }, [isRoadSolutionLoading, isRoadSolutionError, roads, activeRoad, setActiveRoadId, setRoadSolution])

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
