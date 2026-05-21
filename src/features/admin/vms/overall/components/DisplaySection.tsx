import { Col, Row } from 'antd'
import React from 'react'
import {
  DisplayStatCard,
  DisplayTableList,
  DisplayTitle,
  FormSearchCalendar,
  ScheduleSection
} from '../components'

interface Props {

}

const DisplaySection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={19} xxxl={19}>
          <div className='px-10 2xl:pl-10 2xl:pr-3'>
            <section>
              <DisplayStatCard />
            </section>
            <section className='mt-5'>
              <DisplayTitle />
            </section>
            <section className='mt-5'>
              <DisplayTableList />
            </section>
          </div>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={5} xxxl={5}>
          <div className='sticky top-0 max-h-screen overflow-y-auto bg-(--dark-black) rounded-lg p-5'>
            <section>
              <FormSearchCalendar />
            </section>
            <section className='mt-5'>
              <ScheduleSection />
            </section>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default React.memo<Props>(DisplaySection)
