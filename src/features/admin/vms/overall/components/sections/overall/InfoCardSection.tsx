import { getVMSOverviewTotalAPI } from '@/services/routes/VMSService'
import { useAppDispatch } from '@/stores/hooks'
import { setVMSTotalData } from '@/stores/reducers/vms/vmsOverviewSlice'
// import { useAppSelector } from '@/stores/hooks'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Col, Row, Skeleton } from 'antd'
import React, { useEffect, useMemo } from 'react'
import { TbDeviceDesktop, TbShield } from 'react-icons/tb'

interface Props {
  deptId?: string | string[] | number
}

const InfoCardSection: React.FC<Props> = (props) => {
  const { deptId } = props
  // const { vms_total } = useAppSelector(state => state.vms_overview)
  const dispatch = useAppDispatch()

  const { data, isLoading } = useQuery({
    queryKey: ['vms_total'],
    queryFn: () => getVMSOverviewTotalAPI(Number(deptId)!),
    enabled: !!deptId,
    placeholderData: keepPreviousData
  })

  useEffect(() => {
    if (!isLoading && data) {
      dispatch(setVMSTotalData(data.data))
    }
  }, [isLoading, data, dispatch])

  const renderTotalVMS = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 3 }} />
    return (
      <>
        <TbDeviceDesktop className='fs-24 text-(--yellow) mb-1' />
        <h3 className='text-(--yellow)'>ป้าย VMS ในระบบทั้งหมด</h3>
        <p>
          <span className='fs-24 font-bold'>{data?.data.solution.total || 0}</span> จุดติดตั้ง
        </p>
        <p className='fs-11 text-gray-400'>Active : 55 (41.4%)</p>
      </>
    )
  }, [isLoading, data?.data.solution.total])

  const renderInWarranty = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 3 }} />
    return (
      <>
        <TbShield className='fs-24 text-teal-500 mb-1' />
        <h3 className='text-teal-500'>ในค้ำ</h3>
        <p>
          <span className='fs-24 font-bold'>{data?.data.warranty.active || 0}</span> จุดติดตั้ง
        </p>
        <p className='fs-11 text-gray-400'>Active : 45 (42.9%)</p>
      </>
    )
  }, [isLoading, data?.data.warranty.active])

  const renderExpired = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 3 }} />
    return (
      <>
        <TbShield className='fs-24 text-gray-500 mb-1' />
        <h3 className='text-gray-500'>หมดค้ำ</h3>
        <p>
          <span className='fs-24 font-bold'>{data?.data.warranty.expired || 0}</span> จุดติดตั้ง
        </p>
        <p className='fs-11 text-gray-400'>Active : 10 (8.5%)</p>
      </>
    )
  }, [isLoading, data?.data.warranty.expired])

  return (
    <Row gutter={[16, 16]}>
      <Col
        xs={24}
        sm={24}
        md={8}
        lg={24}
        xl={24}
        xxl={24}
        xxxl={24}
      >
        <div className='h-full bg-[#FFB1001A] border-2 rounded-lg p-5 border-(--yellow)'>
          {renderTotalVMS}
        </div>
      </Col>
      <Col
        xs={24}
        sm={24}
        md={8}
        lg={24}
        xl={24}
        xxl={24}
        xxxl={24}
      >
        <div className='h-full bg-[#05F2DB1A] border-2 rounded-lg p-5 border-teal-500'>
          {renderInWarranty}
        </div>
      </Col>
      <Col
        xs={24}
        sm={24}
        md={8}
        lg={24}
        xl={24}
        xxl={24}
        xxxl={24}
      >
        <div className='h-full bg-[#9797971A] border-2 rounded-lg p-5 border-gray-500'>
          {renderExpired}
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardSection)
