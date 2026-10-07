"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import DetailTitleSection from '@/components/section/DetailTitleSection'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useLPRDetailContext } from '../context'
import { useLPRPointOverview, useLPRProjectBySolution } from '@/hooks/queries/lpr'
import { Alert, Button } from 'antd'

interface Props {
}

const OPTIONS = [
  // { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'ข้อมูลป้ายทะเบียน', value: 'DETECTIONS' },
]

/** Header for the LPR install-point detail page. Reuses `DetailTitleSection`
 *  so tabs / back / info / Google Map behave exactly like the other feature
 *  detail pages (traffic-signal, incident-detection, etc.). */
const TitleSection: React.FC<Props> = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { currentTab, setCurrentTab, departmentId, solutionId, roadId } = useLPRDetailContext()

  const project = useLPRProjectBySolution(solutionId)
  const overview = useLPRPointOverview(departmentId, roadId, solutionId)

  const projectData = project.data
  const location = overview.data?.locations?.[0]
  const centroid = overview.data?.centroid
  const coord: [number, number] | null =
    centroid?.length === 2 ? [centroid[0], centroid[1]] : null

  // The header (back arrow + tabs) never gets swapped out for a skeleton or an
  // Empty — a failed query must not strand the user on a page they can't leave
  // or switch tabs on. Instead each field falls back, and a pill whose data
  // hasn't arrived is simply left out (unknown is not "ออฟไลน์" / "หมดค้ำ").
  const fallback = overview.isLoading ? 'กำลังโหลด...' : '-'
  const hasError = project.isError || overview.isError
  const retry = () => {
    if (project.isError) project.refetch()
    if (overview.isError) overview.refetch()
  }

  return (
    <>
      <DetailTitleSection
        feature='LPR'
        roadCode={location?.road?.code_name || fallback}
        installPoint={location?.solution?.solution_name || fallback}
        onBack={() => router.back()}
        onInfo={() =>
          dispatch(
            setProjectInfoModalOpen({
              open: true,
              project_id: projectData?.id ?? null,
              road_id: roadId ? Number(roadId) : null,
            }),
          )
        }
        googleMap={{ coord, keepWhenEmpty: true }}
        anydesk={{ id: projectData?.project_roads?.[0]?.solution_locations?.[0]?.solutions[0]?.anydesk || '-' }}
        warranty={
          projectData
            ? {
              label: projectData.is_warranty ? 'ในค้ำ' : 'หมดค้ำ',
              color: projectData.is_warranty ? '#05F2DB' : '#979797',
            }
            : undefined
        }
        online={location ? { isOnline: location.is_online } : undefined}
        tabs={{
          options: OPTIONS,
          defaultActive: 'OVERALL',
          activeValue: currentTab,
          onChange: (value: string) => setCurrentTab(value as 'OVERALL' | 'DETECTIONS'),
        }}
      />
      {hasError && (
        <Alert
          className='mx-8 mt-3'
          type='error'
          showIcon
          title='โหลดข้อมูลหัวข้อไม่สำเร็จ'
          action={<Button size='small' onClick={retry}>ลองใหม่</Button>}
        />
      )}
    </>
  )
}

export default React.memo<Props>(TitleSection)
