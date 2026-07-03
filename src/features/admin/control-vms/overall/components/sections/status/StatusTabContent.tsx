import { getVMSSettingByStatusAPI } from '@/services/routes/ControlVMSService'
import { VMSSettingStatusCount } from '@/types/control-vms/display-api'
import { useQuery } from '@tanstack/react-query'
import { Col, Empty, Row, Skeleton } from 'antd'
import React from 'react'
import { StatusList } from '../../../components'

interface Props {
  item: VMSSettingStatusCount
}

const StatusTabContent: React.FC<Props> = (props) => {
  const { item } = props

  const { data, isLoading, isError } = useQuery({
    queryKey: ['status_count', item.status_id],
    queryFn: () => getVMSSettingByStatusAPI({
      status_id: item.status_id
    }),
  })

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return (
    <Row gutter={[16, 16]}>
      {data?.data?.map((item, index) => (
        <Col key={index} xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
          <StatusList item={item} />
        </Col>
      ))}
    </Row>
  )
}

export default React.memo<Props>(StatusTabContent)
