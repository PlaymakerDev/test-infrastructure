import { VMSSettingStatusCount } from '@/types/control-vms/display-api'
import { Col, Empty, Row, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { StatusList } from '../../../components'
import { useControlVMSContext } from '../../../context'
import { useVMSSettingByStatus } from '../../../hooks/useVMSSettingByStatus'

interface Props {
  item: VMSSettingStatusCount
}

const StatusTabContent: React.FC<Props> = (props) => {
  const { item } = props
  const { statusSearchText } = useControlVMSContext()

  const { data, isLoading, isError } = useVMSSettingByStatus(item.status_id)

  const filteredData = useMemo(() => {
    const list = data?.data ?? []
    const search = statusSearchText.trim().toLowerCase()
    if (!search) return list
    return list.filter((setting) => setting.solution_name.toLowerCase().includes(search))
  }, [data?.data, statusSearchText])

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="ไม่พบข้อมูล" />
  if (!filteredData.length) return <Empty description="ไม่พบข้อมูล" />

  return (
    <Row gutter={[16, 16]}>
      {filteredData.map((setting) => (
        <Col key={setting.setting_id} xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
          <StatusList item={setting} />
        </Col>
      ))}
    </Row>
  )
}

export default React.memo<Props>(StatusTabContent)
