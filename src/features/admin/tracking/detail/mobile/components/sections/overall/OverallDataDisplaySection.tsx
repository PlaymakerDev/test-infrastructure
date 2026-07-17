import React, { useMemo, useState } from 'react'
import {
  TableMobileDailyWeight,
  MobileDailyWeightList,
  FormSearchDailyWeight
} from '@/features/admin/tracking/detail/mobile/components'
import { getTrackingMobileCarAPI, getTrackingMobileCarByTDIDAPI } from '@/services/routes/TrackingDetailService';
import { useQuery } from '@tanstack/react-query';


interface Props {
  id: string[] | string | number | undefined;
}

const OverallDataDisplaySection: React.FC<Props> = (props) => {
  const { id } = props
  const [displayType, setDisplayType] = useState<'TABLE' | 'GRID'>('TABLE')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['weight_mobile_car', id],
    queryFn: () => getTrackingMobileCarByTDIDAPI(String(id)),
    enabled: !!id,
  })

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableMobileDailyWeight data={data?.data.data} isLoading={isLoading} isError={isError} />
      case 'GRID':
        return <MobileDailyWeightList data={data?.data.data} isLoading={isLoading} isError={isError} />
      default:
        return null
    }
  }, [displayType, data, isLoading, isError])

  return (
    <div>
      <section>
        <FormSearchDailyWeight
          displayType={displayType}
          setDisplayType={setDisplayType}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
