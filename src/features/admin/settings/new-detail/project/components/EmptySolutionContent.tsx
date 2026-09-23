import { setCreateDeviceModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { SolutionLocation } from '@/types/manage/project-detail-api'
import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React from 'react'
import { useAppDispatch } from '@/stores/hooks'
import { TbCubePlus } from 'react-icons/tb'

interface Props {
  item?: SolutionLocation | null
}

const EmptySolutionContent: React.FC<Props> = (props) => {
  const { item } = props
  const dispatch = useAppDispatch()

  return (
    <div>
      <section>
        <div className='p-5 rounded-lg border-2 border-(--default-blue)'>
          <div className='flex flex-col items-center justify-center gap-3 my-6'>
            <TbCubePlus className='fs-36 text-(--default-blue)' />
            <p className='fs-12'>กรุณาเพิ่มประเภทงานของแต่ละสายทาง ภายในโครงการนี้</p>
            <Button
              type='primary'
              shape='round'
              icon={<PlusOutlined />}
              onClick={() => dispatch(setCreateDeviceModalOpen({ open: true, item, type: 'CREATE' }))}
            >
              <p className='fs-12'>เพิ่มประเภทงาน</p>
            </Button>
          </div>
        </div>
      </section>
      {/* <section className='mt-5'>
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
      </section> */}
    </div>
  )
}

export default React.memo<Props>(EmptySolutionContent)
