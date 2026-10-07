import { FALLBACK, VEHICLE_TYPE_COLOR } from '@/constants'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetLicenseDetailModalData } from '@/stores/reducers/modal/customModalSlice'
import { Col, ConfigProvider, Image, Modal, Row } from 'antd'
import React, { useCallback } from 'react'
import { TableTop5DetectionData } from '../../../components'
import { LPRPlateData } from '@/types/lpr/new-lpr-api'
import { getConfidenceColor, parseConfidence } from '../detection/TableDetectionData'

interface Props {

}

interface ContentProps {
  data?: LPRPlateData | null
}

const Content: React.FC<ContentProps> = (props) => {
  const { data } = props
  const confidence = parseConfidence(data?.confidence)

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={24} lg={10} xl={10} xxl={10} xxxl={10}>
        <figure className='figure-extra-large rounded-lg overflow-hidden mb-3'>
          <Image
            src={data?.vehicle_image}
            alt='img-01'
            width={'100%'}
            height={'100%'}
            className='object-cover object-center'
            fallback={FALLBACK}
          />
        </figure>
        <figure className='figure-normal rounded-lg overflow-hidden'>
          <Image
            src={data?.plate_image}
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
          <h1>{data?.plate_number || '-'}</h1>
          <p className='mb-1.5'>{data?.plate_province || '-'}</p>
          <div
            className='inline-block border rounded-3xl px-3 text-center'
            style={{
              color: VEHICLE_TYPE_COLOR[data?.vehicle_type_name as keyof typeof VEHICLE_TYPE_COLOR] || '#FFFFFF50',
              borderColor: VEHICLE_TYPE_COLOR[data?.vehicle_type_name as keyof typeof VEHICLE_TYPE_COLOR] || '#FFFFFF50',
            }}
          >
            <p className='fs-12'>{data?.vehicle_type_name || 'ไม่ระบุ'}</p>
          </div>
        </section>
        <section className='mt-3'>
          {confidence == null ? (
            <p className='text-white/50'>Confidence : -</p>
          ) : (
            <p style={{ color: getConfidenceColor(confidence) }}>Confidence : {confidence.toFixed(1)}%</p>
          )}
          <p>{data?.captured_at_display || '-'}</p>
          <p className='text-(--default-blue)'>ชื่อกล้อง : {data?.camera_name || '-'}</p>
        </section>
        <section className='mt-5'>
          <TableTop5DetectionData data={data} />
        </section>
      </Col>
    </Row>
  )
}

const ModalLicenseDetail: React.FC<Props> = (props) => {
  const { } = props
  const { open, data } = useAppSelector(state => state.custom_modal.license_detail_modal)
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
        width={1600}
      >
        <Content data={data} />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalLicenseDetail)
