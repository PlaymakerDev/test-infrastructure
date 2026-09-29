import { FALLBACK } from '@/constants'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetLicenseDetailModalData } from '@/stores/reducers/modal/customModalSlice'
import { Col, ConfigProvider, Image, Modal, Row } from 'antd'
import React, { useCallback } from 'react'
import { TableTop5DetectionData } from '../../../components'

interface Props {

}

const Content: React.FC<Props> = (props) => {
  const { } = props
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={24} lg={10} xl={10} xxl={10} xxxl={10}>
        <figure className='figure-extra-large rounded-lg overflow-hidden mb-3'>
          <Image
            src={'https://i.pinimg.com/1200x/13/da/f5/13daf554f76ef4097be0ae4ecc69f3c2.jpg'}
            alt='img-01'
            width={'100%'}
            height={'100%'}
            className='object-cover object-center'
            fallback={FALLBACK}
          />
        </figure>
        <figure className='figure-normal rounded-lg overflow-hidden'>
          <Image
            src={'https://i.pinimg.com/1200x/a5/97/b7/a597b7da7d2ebcb511b518a1242ead53.jpg'}
            alt='img-02'
            width={'100%'}
            height={'100%'}
            className='object-cover object-center'
            fallback={FALLBACK}
          />
        </figure>
      </Col>
      <Col xs={24} sm={24} md={24} lg={14} xl={14} xxl={14} xxxl={14}>
        <section>
          <h1>กต196</h1>
          <p className='mb-1.5'>สิงห์บุรี</p>
          <div className='inline-block text-[#00DDFF] border border-[#00DDFF] rounded-3xl px-3 text-center'>
            <p className='fs-12'>รถยนต์</p>
          </div>
        </section>
        <section className='mt-3'>
          <p className='text-white/50'>Confidence : 46.0%</p>
          <p>25 เม.ย. 2569 14:12:14</p>
          <p className='text-(--default-blue)'>ชื่อกล้อง : 69MST-SBR2006-LPR002-จุดที่1-กม.0+500-มุ่งหน้าที่พัก สายตรวจตำบลน้ำตาล</p>
        </section>
        <section className='mt-5'>
          <TableTop5DetectionData />
        </section>
      </Col>
    </Row>
  )
}

const ModalLicenseDetail: React.FC<Props> = (props) => {
  const { } = props
  const { open } = useAppSelector(state => state.custom_modal.license_detail_modal)
  const dispatch = useAppDispatch()

  const handleCloseModal = useCallback(() => {
    dispatch(resetLicenseDetailModalData())
  }, [dispatch])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#FFFFFF',
            borderRadiusLG: 20,
          }
        }
      }}
    >
      <Modal
        title={false}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={handleCloseModal}
        onCancel={handleCloseModal}
        footer={false}
        destroyOnHidden
        width={1800}
      >
        <Content />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalLicenseDetail)
