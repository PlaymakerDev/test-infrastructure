import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Empty } from 'antd'
import React, { useCallback } from 'react'
import { TbRoad } from 'react-icons/tb'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { setProjectModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { useProjectDetail } from '@/hooks/queries/manage'
import { useProjectContext } from '../context'
import { isAdmin } from '@/utils/isAdmin'

interface Props {

}

const EmptyRoadSolution: React.FC<Props> = (props) => {
  const { } = props
  const { info } = useAppSelector(state => state.auth)
  const dispatch = useAppDispatch()
  const { id } = useProjectContext()
  const isAdminUser = isAdmin(info)

  const projectId = id ? Number(id) : null
  // Same query (and cache entry) FormCreateProject uses for its edit seed.
  // The delete confirm modal renders name / budget year / contractor /
  // warranty from `data`, so it needs the full record, not just the id.
  const { data: project } = useProjectDetail(projectId)

  // Same UPDATE / DELETE modals ProjectListView opens from its pencil / trash
  // icons — roads are linked to a project through the UPDATE form.
  const onOpenProjectModal = useCallback((type: 'UPDATE' | 'DELETE') => {
    if (!projectId) return
    dispatch(setProjectModalOpen({ open: true, type, data: project ?? { id: projectId } }))
  }, [dispatch, projectId, project])

  if (!isAdminUser) return <Empty description='คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' />

  return (
    <div>
      <section>
        <div className='p-5 rounded-lg border-2 border-(--default-blue)'>
          <div className='flex flex-col items-center justify-center gap-3 my-6'>
            <TbRoad className='fs-36 text-(--default-blue)' />
            <p className='fs-12'>กรุณาเพิ่มสายทาง ภายในโครงการนี้</p>
            <Button
              type='primary'
              shape='round'
              icon={<PlusOutlined />}
              onClick={() => onOpenProjectModal('UPDATE')}
            >
              <p className='fs-12'>เพิ่มสายทาง</p>
            </Button>
          </div>
        </div>
      </section>
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
              className='fs-14 font-semibold underline cursor-pointer'
              onClick={() => onOpenProjectModal('DELETE')}
            >
              คุณต้องการลบโครงการหรือไม่ ?
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(EmptyRoadSolution)
