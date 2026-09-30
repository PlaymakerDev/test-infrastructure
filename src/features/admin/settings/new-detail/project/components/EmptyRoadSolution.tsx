import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Empty, Skeleton } from 'antd'
import React, { useCallback, useState } from 'react'
import { TbMapPinPlus, TbRoad } from 'react-icons/tb'
import { useQuery } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { setProjectModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { getProjectByIDAPI, getRoadSolutionAPI } from '@/services/routes/ProjectDetailService'
import { useProjectContractors } from '@/hooks/queries/manage'
import type { ProjectListData } from '@/types/manage/project-api'
import { isAdmin } from '@/utils/isAdmin'
import { useProjectContext } from '../context'
import { useCanEditProjectRoads } from '../hooks/useCanEditProjectRoads'
import ModalAddRoad from './ModalAddRoad'

interface Props {

}

/** What MainContent shows when the selected road has no จุดติดตั้ง — or when
 *  the project has no road at all. The two need different next steps (user
 *  2026-09-29): a road without points gets "เพิ่มจุดติดตั้ง" (the first point,
 *  then the tabs appear); only a project without roads gets "เพิ่มสายทาง". */
const EmptyRoadSolution: React.FC<Props> = (props) => {
  const { } = props
  const dispatch = useAppDispatch()
  const { id, roadSolution, onCreate, isCreating } = useProjectContext()
  // Deleting the project is offered to the same viewers the settings table
  // shows its trash icon to; adding a road or a point to every role but 'user'.
  const { info } = useAppSelector((state) => state.auth)
  const canDeleteProject = isAdmin(info)
  const canEdit = useCanEditProjectRoads()
  const [isAddRoadOpen, setAddRoadOpen] = useState(false)

  // Same queries (and cache entries) as TitleSection. A project the viewer may
  // not open comes back as [] rather than an error.
  const { data: projectRes, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectByIDAPI(String(id)),
    enabled: !!id,
  })
  const { data: roadsRes, isLoading: isRoadsLoading } = useQuery({
    queryKey: ['roadSolution', id],
    queryFn: () => getRoadSolutionAPI({ project_id: String(id) }),
    enabled: !!id,
  })
  // Only the delete dialog reads it (for the contractor's company name).
  const { data: contractors } = useProjectContractors({ enabled: canDeleteProject })

  const project = projectRes?.data?.id != null ? projectRes.data : null
  const roads = Array.isArray(roadsRes?.data) ? roadsRes.data : []
  // The backend refuses to delete a project any install point still references
  // (res_code 40098) — this road having none isn't enough, no road may.
  const hasInstallPoints = roads.some((road) => (road.solution_locations ?? []).length > 0)

  // Same confirm dialog + DELETE /manage/project/{id} as the settings table's
  // trash icon. The dialog reads a list row; /manage/project/{id} has the same
  // fields except the contractor's company name, which only the list nests.
  const onOpenDeleteModal = useCallback(() => {
    if (!project) return
    const companyName = contractors?.find((c) => c.user_id === project.contractor_id)?.company_name ?? ''
    const data = {
      ...project,
      contractor: { ...project.contractor, contractor: { company_name: companyName } },
    } as unknown as ProjectListData
    dispatch(setProjectModalOpen({ open: true, type: 'DELETE', data }))
  }, [dispatch, project, contractors])

  // Wait for the project, its roads, and the road picker to settle on one —
  // a project that has roads would otherwise flash this empty state first.
  if (isProjectLoading || isRoadsLoading || (roads.length > 0 && !roadSolution.project_road_id)) {
    return <Skeleton active paragraph={{ rows: 4 }} />
  }
  if (!project) return <Empty description='ไม่พบข้อมูลโครงการ' />

  const hasRoads = roads.length > 0

  return (
    <div>
      <section>
        <div className='p-5 rounded-lg border-2 border-(--default-blue)'>
          {hasRoads ? (
            <div className='flex flex-col items-center justify-center gap-3 my-6'>
              <TbMapPinPlus className='fs-36 text-(--default-blue)' />
              <p className='fs-12'>{canEdit ? 'กรุณาเพิ่มจุดติดตั้ง ภายในสายทางนี้' : 'ยังไม่มีจุดติดตั้งในสายทางนี้'}</p>
              {canEdit && (
                // The tab strip's "+ เพิ่มจุดติดตั้ง": creates "จุดติดตั้งที่ 1"
                // and selects it, which brings up the tabs.
                <Button
                  type='primary'
                  shape='round'
                  icon={<PlusOutlined />}
                  loading={isCreating}
                  onClick={onCreate}
                >
                  <p className='fs-12'>เพิ่มจุดติดตั้ง</p>
                </Button>
              )}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center gap-3 my-6'>
              <TbRoad className='fs-36 text-(--default-blue)' />
              <p className='fs-12'>{canEdit ? 'กรุณาเพิ่มสายทาง ภายในโครงการนี้' : 'ยังไม่มีสายทางในโครงการนี้'}</p>
              {canEdit && (
                <Button
                  type='primary'
                  shape='round'
                  icon={<PlusOutlined />}
                  onClick={() => setAddRoadOpen(true)}
                >
                  <p className='fs-12'>เพิ่มสายทาง</p>
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
      {/* The first road of a project; later ones come from beside the tabs. */}
      <ModalAddRoad open={isAddRoadOpen} onClose={() => setAddRoadOpen(false)} />
      {canDeleteProject && !hasInstallPoints && (
        <section className='mt-5'>
          <div className='p-5 rounded-lg border-2 border-(--default-red)'>
            <div className='flex flex-col items-center justify-center gap-3 my-6'>
              <ExclamationCircleOutlined
                style={{
                  fontSize: 'clamp(2.25rem, 9.6vw, 2.625rem)',
                  color: 'var(--default-red)',
                }}
              />
              <p className='fs-12'>คุณสามารถลบโครงการนี้ได้ เนื่องจากไม่มีจุดติดตั้งในโครงการนี้</p>
              <p
                role='button'
                tabIndex={0}
                className='fs-14 font-semibold underline cursor-pointer'
                onClick={onOpenDeleteModal}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpenDeleteModal()
                  }
                }}
              >
                คุณต้องการลบโครงการหรือไม่ ?
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default React.memo<Props>(EmptyRoadSolution)
