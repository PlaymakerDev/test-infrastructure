"use client"
import React, { useCallback, useState } from 'react'

export interface RoadItem {
  id: string | number
  road_code: string
  road_name: string
  vehicle_count: number
}

export interface RoadListProps {
  data: RoadItem[]
  onSelect?: (item: RoadItem) => void
}

const RoadCard: React.FC<{
  item: RoadItem
  selected: boolean
  onClick: (item: RoadItem) => void
}> = ({ item, selected, onClick }) => (
  <div
    onClick={() => onClick(item)}
    className={[
      'bg-(--mid-gray) py-4 px-5 rounded-2xl cursor-pointer transition-colors duration-200 border',
      selected ? 'border-(--yellow)' : 'border-transparent',
    ].join(' ')}
  >
    <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start gap-x-3 gap-y-3'>
      <div>
        <h2 className='font-bold text-white leading-tight'>{item.road_code}</h2>
        <p className='fs-12 text-gray-400 mt-1'>{item.road_name}</p>
      </div>
      <div className='flex flex-col sm:items-center gap-1.5'>
        <p className='fs-12 text-(--yellow)'>รถวิ่งบนสายทาง</p>
        <span className='rounded-full py-0.5 px-4 border border-(--yellow) fs-12 text-(--yellow) text-center'>
          {item.vehicle_count}
        </span>
      </div>
    </div>
  </div>
)

const MemoCard = React.memo(RoadCard)

const RoadList: React.FC<RoadListProps> = ({ data, onSelect }) => {
  const [selectedId, setSelectedId] = useState<string | number | null>(
    data.length > 0 ? data[0].id : null
  )

  const handleClick = useCallback((item: RoadItem) => {
    setSelectedId(item.id)
    onSelect?.(item)
  }, [onSelect])

  return (
    <div className='flex flex-col gap-4'>
      {data.map((item) => (
        <MemoCard
          key={item.id}
          item={item}
          selected={selectedId === item.id}
          onClick={handleClick}
        />
      ))}
    </div>
  )
}

export default React.memo(RoadList)
