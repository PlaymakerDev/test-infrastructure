import React, { useMemo, useState } from 'react'
import {
  CompareCard,
  FormSearchCompare,
  TableCompareData
} from '@/features/admin/tracking/detail/gps/components/'
import { TbMap } from 'react-icons/tb'
import { useQuery } from '@tanstack/react-query'
import { getTrackingGPSAnalyticProvinceTrafficAPI } from '@/services/routes/TrackingGPSService'
import dayjs from 'dayjs'

interface Props {

}

const CompareInfoSection: React.FC<Props> = (props) => {
  const { } = props
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytic_province_traffic'],
    queryFn: () => getTrackingGPSAnalyticProvinceTrafficAPI({
      days: 30
    })
  })

  const filteredData = useMemo(() => {
    const list = data?.data.data ?? []
    if (!search.trim()) return list
    return list.filter((item) => item.province.toLowerCase().includes(search.trim().toLowerCase()))
  }, [data, search])

  return (
    <div className='bg-(--dark-black) rounded-2xl p-5'>
      <div className='flex items-center gap-2 mb-4'>
        <TbMap className='fs-22 text-(--yellow) shrink-0' />
        <h4 className='text-(--yellow) font-normal!'>ข้อมูลเปรียบเทียบรถวิ่งผ่าน <span className='text-white'>เดือน{dayjs().format('MMMM')}</span></h4>
      </div>
      <section>
        <CompareCard
          data={data?.data.data}
          isLoading={isLoading}
          isError={isError}
        />
      </section>
      <section className='mt-5'>
        <FormSearchCompare onSearch={setSearch} />
      </section>
      <section className='mt-5'>
        <TableCompareData
          data={filteredData}
          isLoading={isLoading}
          isError={isError}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(CompareInfoSection)
