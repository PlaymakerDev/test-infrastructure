import { Progress } from 'antd'
import React from 'react'
import { TbCar, TbMap, TbTruck, TbWeight } from 'react-icons/tb'

interface StatItem {
  icon: React.ReactNode
  label: string
  count: number
}

const MOCK_STATS: StatItem[] = [
  { icon: <TbCar className='fs-22 text-blue-400' />, label: 'สายทาง สป.2014 กม.0+005', count: 12 },
  { icon: <TbTruck className='fs-22 text-blue-400' />, label: 'สายทาง ปก.3026 กม.5+700', count: 8 },
  { icon: <TbWeight className='fs-22 text-blue-400' />, label: 'WIM อยุธยา (อย.2053)', count: 2 },
]

const MAX_COUNT = Math.max(...MOCK_STATS.map((s) => s.count))

const StatSection: React.FC = () => {
  return (
    <div className='rounded-lg p-5 bg-(--dark-black)'>
      {/* Header */}
      <div className='flex items-center gap-2 mb-4'>
        <TbMap className='fs-22 text-blue-400 shrink-0' />
        <h3 className='text-blue-400'>พื้นที่ตรวจพบบ่อย 30 วันย้อนหลัง</h3>
      </div>

      {/* List */}
      <div className='flex flex-col gap-4'>
        {MOCK_STATS.map((stat, i) => (
          <div key={i} className='flex items-start gap-3'>
            {/* Icon box */}
            <div className='shrink-0 w-11 h-11 flex items-center justify-center rounded-lg bg-(--gray)'>
              {stat.icon}
            </div>

            {/* Content */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between gap-2'>
                <h4 className='truncate'>{stat.label}</h4>
                <span className='shrink-0 text-blue-400 font-bold'>{stat.count}</span>
              </div>
              <Progress
                percent={Math.round((stat.count / MAX_COUNT) * 100)}
                showInfo={false}
                strokeColor='#60a5fa'
                size={['100%', 5]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(StatSection)
