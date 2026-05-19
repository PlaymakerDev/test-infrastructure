"use client"
import React from 'react'

export type WeightStatus = 'normal' | 'overweight' | 'within_limit'
export type MoveStatus = 'moving' | 'parked'

export interface VehicleItem {
  id: number
  license: string
  province: string
  speed: number
  weightStatus: WeightStatus
  moveStatus: MoveStatus
}

export interface VehicleListProps {
  items: VehicleItem[]
}

const PILL = 'text-xs whitespace-nowrap rounded-full px-2.5 py-0.5 border'

const WEIGHT_STATUS_CLASS: Record<WeightStatus, string> = {
  normal: `${PILL} text-blue-400 border-blue-400`,
  within_limit: `${PILL} text-cyan-400 border-cyan-400`,
  overweight: `${PILL} text-white bg-red-500 border-red-500`,
}

const WEIGHT_STATUS_LABEL: Record<WeightStatus, string> = {
  normal: 'น้ำหนักปกติ',
  within_limit: 'ไม่เกินพิกัด',
  overweight: 'น้ำหนักเกิน',
}

const MOVE_STATUS_CLASS: Record<MoveStatus, string> = {
  moving: `${PILL} text-lime-400 border-lime-400`,
  parked: `${PILL} text-orange-400 border-orange-400`,
}

const MOVE_STATUS_LABEL: Record<MoveStatus, string> = {
  moving: 'รถเคลื่อนที่',
  parked: 'รถจอด',
}

const VehicleCard: React.FC<{ item: VehicleItem }> = ({ item }) => (
  <div className='bg-(--mid-gray) rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
    <div>
      <h3 className='font-bold text-white leading-tight'>{item.license}</h3>
      <p className='fs-12 text-gray-400 mt-0.5'>{item.province}</p>
      <p className='fs-12 text-(--yellow) mt-2'>ความเร็ว : {item.speed} กม./ชม.</p>
    </div>
    <div className='flex flex-row flex-wrap gap-1.5 sm:flex-col sm:items-end sm:shrink-0'>
      <span className={WEIGHT_STATUS_CLASS[item.weightStatus] ?? 'text-white/40'}>
        {WEIGHT_STATUS_LABEL[item.weightStatus]}
      </span>
      <span className={MOVE_STATUS_CLASS[item.moveStatus] ?? 'text-white/40'}>
        {MOVE_STATUS_LABEL[item.moveStatus]}
      </span>
    </div>
  </div>
)

const MemoVehicleCard = React.memo(VehicleCard)

const VehicleList: React.FC<VehicleListProps> = ({ items }) => (
  <div className='flex flex-col gap-3'>
    {items.length === 0 && (
      <p className='text-center text-gray-500 text-sm py-8'>ไม่พบข้อมูล</p>
    )}
    {items.map((item) => (
      <MemoVehicleCard key={item.id} item={item} />
    ))}
  </div>
)

export default React.memo(VehicleList)
