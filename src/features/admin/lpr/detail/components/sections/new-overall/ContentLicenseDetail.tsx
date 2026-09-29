import { FALLBACK } from '@/constants'
import { useAppDispatch } from '@/stores/hooks'
import { setLicenseDetailModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { Button, Image } from 'antd'
import React, { useCallback } from 'react'
import { TbCar } from 'react-icons/tb'

interface Props {

}

const ContentLicenseDetail: React.FC<Props> = (props) => {
  const { } = props
  const dispatch = useAppDispatch()

  const handleOpenModal = useCallback(() => {
    dispatch(setLicenseDetailModalOpen({ open: true }))
  }, [dispatch])

  return (
    <div className='p-5 bg-(--dark-black) rounded-2xl h-full'>
      <section>
        <div className='flex items-center gap-2'>
          <TbCar className='text-(--yellow) fs-22' />
          <h4 className='text-(--yellow) font-normal!'>ป้ายทะเบียนล่าสุด</h4>
        </div>
      </section>
      <section className='mt-5'>
        <figure className='h-52 rounded-lg overflow-hidden mb-3'>
          <Image
            src='https://i.pinimg.com/736x/9d/ff/86/9dff86e548aa89219d77f3f3891791fa.jpg'
            alt='img-01'
            width={'100%'}
            height={'100%'}
            className='object-cover object-center'
            fallback={FALLBACK}
          />
        </figure>
        <figure className='h-40 rounded-lg overflow-hidden'>
          <Image
            src='https://i.pinimg.com/1200x/07/c0/cc/07c0ccabd8468a9e91076e94f4f74856.jpg'
            alt='img-02'
            width={'100%'}
            height={'100%'}
            className='object-cover object-center'
            fallback={FALLBACK}
          />
        </figure>
      </section>
      <section className='mt-5'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex flex-col'>
            <h2>6กต4724</h2>
            <p>กรุงเทพมหานคร</p>
          </div>
          <span className={`shrink-0 fs-12 border rounded-full px-3 py-0.5 whitespace-nowrap border-[#00DDFF] text-[#00DDFF]`}>
            รถยนต์
          </span>
        </div>
        <div className='flex flex-col'>
          <p className='text-white/50'>Confidence : 46.0%</p>
          <p>25 เม.ย. 2569 14:14:29</p>
          <p className='text-(--default-blue)'>ชื่อกล้อง : 69MST-SBR2006-LPR002-จุดที่1-กม.0+500-มุ่งหน้าที่พักสายตรวจตำบลน้ำตาล</p>
        </div>
      </section>
      <section className='mt-5'>
        <Button
          block
          type="primary"
          shape='round'
          onClick={handleOpenModal}
        >
          ดูประวัติ
        </Button>
      </section>
    </div>
  )
}

export default React.memo<Props>(ContentLicenseDetail)
