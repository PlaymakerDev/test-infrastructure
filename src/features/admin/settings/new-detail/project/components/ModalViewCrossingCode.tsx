import { ConfigProvider, Modal } from 'antd'
import React, { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetCrossingCodeModalData } from '@/stores/reducers/modal/customModalSlice'
import { APIResponseCameraCrossingCode, SolutionList, SolutionLocation } from '@/types/manage/project-detail-api'
import { TableCrossingCode } from '../components'

interface Props {

}

interface ContentProps {
  data?: APIResponseCameraCrossingCode
  record?: SolutionList | null
  item?: SolutionLocation | null
}

const Content: React.FC<ContentProps> = (props) => {
  const { data, record, item } = props

  const renderCrossingCodePanel = useMemo(() => {
    return (
      <div className='rounded-lg bg-(--default-blue)/10 border border-(--default-blue) px-5 py-3'>
        <h4 className='text-(--default-blue)'>Master CrossingCode</h4>
        <p className='text-white/50'>{data?.master_index_code || '-'}</p>
      </div>
    )
  }, [data?.master_index_code])

  const renderCrossingCodeTable = useMemo(() => {
    return (
      <TableCrossingCode
        data={data?.camera_crossing_index_code || []}
      />
    )
  }, [data])

  const renderCrossingCodeSection = useMemo(() => {
    if (!!data?.camera_crossing_index_code && !!data?.master_index_code) {
      return renderCrossingCodeTable
    } else {
      if (!!data?.master_index_code) {
        return renderCrossingCodePanel
      } else {
        return renderCrossingCodeTable
      }
    }
  }, [data, renderCrossingCodePanel, renderCrossingCodeTable])

  const renderTitle = useMemo(() => {
    if (!!data?.camera_crossing_index_code && !!data?.master_index_code) {
      return <p>{item?.location_name || '-'} : {record?.solution_type.solution_name || '-'} : {data?.master_index_code || '-'}</p>
    }
    return <p>{item?.location_name || '-'} : {record?.solution_type.solution_name_atlas || '-'}</p>
  }, [data, record, item])

  return (
    <div>
      <section>
        {renderTitle}
      </section>
      <section className='mt-5'>
        {renderCrossingCodeSection}
      </section>
    </div>
  )
}

const ModalViewCrossingCode: React.FC<Props> = (props) => {
  const { } = props
  const { open, data, record, item } = useAppSelector(state => state.custom_modal.crossing_code_modal)
  const dispatch = useAppDispatch()

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            titleColor: 'var(--default-blue)',
            titleFontSize: 24,
            colorIcon: '#FFFFFF',
            borderRadiusLG: 20,
          }
        }
      }}
    >
      <Modal
        title="CrossingCode"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={() => dispatch(resetCrossingCodeModalData())}
        onCancel={() => dispatch(resetCrossingCodeModalData())}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{
          shape: 'round'
        }}
        cancelButtonProps={{
          shape: 'round'
        }}
        destroyOnHidden
        width={1000}
        footer={null}
      >
        <Content
          data={data!}
          record={record}
          item={item}
        />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalViewCrossingCode)
