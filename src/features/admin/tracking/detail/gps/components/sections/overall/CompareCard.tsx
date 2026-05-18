import React from 'react'

interface RegionData {
  region: string
  routes: number
  totalTraffic: number
  dailyAverage: number
}

const regionData: RegionData[] = [
  { region: 'ภาคเหนือ', routes: 354, totalTraffic: 5366496, dailyAverage: 40320 },
  { region: 'ภาคตะวันออกเฉียงเหนือ', routes: 967, totalTraffic: 7334374, dailyAverage: 128042 },
  { region: 'ภาคตะวันออก', routes: 274, totalTraffic: 2985243, dailyAverage: 23762 },
  { region: 'ภาคกลาง', routes: 165, totalTraffic: 1495394, dailyAverage: 16395 },
  { region: 'ภาคตะวันตก', routes: 278, totalTraffic: 3582461, dailyAverage: 56254 },
  { region: 'ภาคใต้', routes: 237, totalTraffic: 2384187, dailyAverage: 42094 },
]

// Breakpoints: 1-col → md:2-col → lg:3-col → xl:3-col → 2xl:6-col
// Border rules per index for each layout:
//   1-col: border-b on all except last
//   2-col (md): left col (0,2,4) gets border-r; last row (4,5) no border-b
//   3-col (lg/xl): first two per row (0,1,3,4) get border-r; last row (3,4,5) no border-b
//   6-col (2xl): items 0-4 get border-r; no border-b
const borderClasses: string[] = [
  'border-b md:border-r 2xl:border-b-0',
  'border-b lg:border-r 2xl:border-b-0',
  'border-b md:border-r lg:border-r-0 2xl:border-r 2xl:border-b-0',
  'border-b lg:border-r lg:border-b-0',
  'border-b md:border-r md:border-b-0',
  '',
]

const CompareCard = () => (
  <div className='border-2 rounded-lg border-(--yellow) p-5'>
    <div className='flex flex-wrap'>
      {regionData.map((item, index) => (
        <div
          key={item.region}
          className={`w-full md:w-1/2 lg:w-1/3 2xl:w-1/6 flex flex-col items-center text-center justify-between gap-2 py-3 px-4 border-(--yellow)/40 ${borderClasses[index]}`}
        >
          <div>
            <h3 className='font-semibold text-white text-sm leading-snug'>{item.region}</h3>
            <p className='text-white/50 text-sm'>{item.routes.toLocaleString()} สายทาง</p>
          </div>
          <div>
            <p className='text-(--yellow) text-sm mb-0.5'>รถวิ่งผ่านรวม</p>
            <p className='fs-18 font-bold text-(--yellow) leading-tight'>{item.totalTraffic.toLocaleString()}</p>
          </div>
          <div>
            <p className='text-blue-400 text-sm mb-0.5'>เฉลี่ยต่อวัน</p>
            <p className='fs-18 font-bold text-blue-400 leading-tight'>{item.dailyAverage.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default React.memo(CompareCard)
