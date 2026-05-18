import React from 'react'
import FormSearchRoute from './FormSearchRoute'
import { RoadList } from '@/components/list'

interface Props {
  openFromDrawer?: boolean
}

const SearchRouteSection: React.FC<Props> = (props) => {
  const { openFromDrawer } = props

  return (
    <div className={`bg-(--dark-black) rounded-tr-lg ${openFromDrawer ? 'p-5' : 'py-10 px-12'} h-full`}>
      <section>
        <FormSearchRoute />
      </section>
      <section className='mt-5'>
        <RoadList data={[
          {
            id: 1,
            road_code: 'ชบ.3009',
            road_name: 'แขวงทางหลวงชนบทชลบุรี',
            vehicle_count: 455,
          },
          {
            id: 2,
            road_code: 'สป.2001',
            road_name: 'แขวงทางหลวงชนบทสมุทรปราการ',
            vehicle_count: 148,
          },
          {
            id: 3,
            road_code: 'ปท.3004',
            road_name: 'แขวงทางหลวงชนบทปทุมธานี',
            vehicle_count: 132,
          },
          {
            id: 4,
            road_code: 'นย.3001',
            road_name: 'แขวงทางหลวงชนบทนครนายก',
            vehicle_count: 112,
          },
          {
            id: 5,
            road_code: 'ปท.3010',
            road_name: 'สำนักทางหลวงชนบทปทุมธานี',
            vehicle_count: 88,
          },
          {
            id: 6,
            road_code: 'ฉช.2004',
            road_name: 'แขวงทางหลวงชนบทฉะเชิงเทรา',
            vehicle_count: 132,
          },
        ]}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(SearchRouteSection)
