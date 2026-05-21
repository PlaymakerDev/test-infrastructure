import { Col, Row } from 'antd'
import React from 'react'
import {
  DisplayStatCard,
  DisplayTableList,
  DisplayTitle,
  FormSearchCalendar
} from '../components'

interface Props {

}

const DisplaySection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='px-10'>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={20} xxl={20} xxxl={20}>
          <section>
            <DisplayStatCard />
          </section>
          <section className='mt-5'>
            <DisplayTitle />
          </section>
          <section className='mt-5'>
            <DisplayTableList />
          </section>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={4} xxl={4} xxxl={4}>
          <section>
            <FormSearchCalendar />
          </section>
          <section className='mt-5'></section>
        </Col>
      </Row>
    </div>
  )
}

export default React.memo<Props>(DisplaySection)
