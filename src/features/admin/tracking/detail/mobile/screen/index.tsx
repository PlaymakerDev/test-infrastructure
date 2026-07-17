import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  OverallSection,
  VehicleSection
} from '../components'
import { MobileProvider } from '../context';
import { useQuery } from '@tanstack/react-query';
import { getTrackingMobileMasterDepartmentByTIDAPI } from '@/services/routes/TrackingDetailService';
import { Empty, Skeleton } from 'antd';

interface Props {
  id: string[] | string | number | undefined;
}

const MobileDetailScreen: React.FC<Props> = (props) => {
  const { id } = props
  const [currentTab, setCurrentTab] = useState('OVERALL')

  const {
    data: departmentData,
    isLoading: isDepartmentLoading,
    isError: isDepartmentError
  } = useQuery({
    queryKey: ['weight_mobile_master_department', id],
    queryFn: () => getTrackingMobileMasterDepartmentByTIDAPI(String(id)),
    enabled: !!id,
  })

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL':
        return <OverallSection id={id} departmentData={departmentData?.data.data} isDepartmentLoading={isDepartmentLoading} isDepartmentError={isDepartmentError} />
      case 'VEHICLE':
        return <VehicleSection id={id} />
      default:
        return <OverallSection id={id} departmentData={departmentData?.data.data} isDepartmentLoading={isDepartmentLoading} isDepartmentError={isDepartmentError} />
    }
  }, [currentTab, id, departmentData, isDepartmentLoading, isDepartmentError])

  const renderTitleSection = useMemo(() => {
    if (isDepartmentLoading) return <Skeleton loading={isDepartmentLoading} active paragraph={{ rows: 10 }} />
    if (isDepartmentError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <TitleSection
        departmentData={departmentData?.data.data}
        setCurrentTab={setCurrentTab}
      />
    )
  }, [departmentData, isDepartmentLoading, isDepartmentError, setCurrentTab])

  return (
    <MobileProvider>
      <div className='main-screen'>
        {renderTitleSection}
        <section className='mt-8 px-8'>
          {renderContent}
        </section>
      </div>
    </MobileProvider>
  )
}

export default React.memo<Props>(MobileDetailScreen)
