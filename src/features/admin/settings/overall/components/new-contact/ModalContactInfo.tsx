import { Empty, Modal } from 'antd'
import React, { useMemo } from 'react'
import { INIT_CONTACT_INFO, useOverallContext } from '../../context'
import { ContractorData } from '@/types/manage/contractor-api'
import SolutionTagList from './SolutionTagList'

interface Props {

}

interface ContentProps {
  data: ContractorData
}

const Content: React.FC<ContentProps> = (props) => {
  const { data } = props

  return (
    <div>
      <section>
        <h2 className='text-(--default-blue) mb-1.5'>{data.company_name || '-'}</h2>
        <p className='fs-12 mb-3'>{data.address || '-'}</p>
        <SolutionTagList
          items={data.solution_group || []}
          display='all'
        />
      </section>
      <section className='mt-5'>
        <div>
        </div>
      </section>
    </div>
  )
}

const ModalContactInfo: React.FC<Props> = (props) => {
  const { } = props
  const { contactInfo, setContactInfo } = useOverallContext()

  const renderContent = useMemo(() => {
    if (!contactInfo.data) {
      return (
        <div className="block m-auto py-18">
          <Empty description="ไม่มีข้อมูล" />
        </div>
      )
    }
    return <Content data={contactInfo.data} />
  }, [contactInfo.data])

  return (
    <Modal
      title={false}
      // title="Basic Modal"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={contactInfo.open}
      footer={false}
      // onOk={() => setContactInfo(INIT_CONTACT_INFO)}
      onCancel={() => setContactInfo(INIT_CONTACT_INFO)}
      width={1000}
      destroyOnHidden
    >
      {renderContent}
    </Modal>
  )
}

export default React.memo<Props>(ModalContactInfo)
