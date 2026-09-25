import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React, { useCallback } from 'react'
import { TbRoad } from 'react-icons/tb'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { useProjectContext } from '../context'

interface Props {

}

const EmptyRoadSolution: React.FC<Props> = (props) => {
  const { } = props
  const dispatch = useAppDispatch()
  const { id } = useProjectContext()

  // Same UPDATE modal ProjectListView opens from its pencil icon — roads are
  // linked to a project through that form. FormCreateProject only reads
  // `data.id` and fetches the full project (incl. project_roads) itself, so
  // the id is all it needs here.
  const onOpenProjectModal = useCallback(() => {
    if (!id) return
    dispatch(setProjectModalOpen({ open: true, type: 'UPDATE', data: { id: Number(id) } }))
  }, [dispatch, id])

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
              onClick={onOpenProjectModal}
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
            <p className='fs-14 font-semibold underline cursor-pointer'>คุณต้องการลบโครงการหรือไม่ ?</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(EmptyRoadSolution)
