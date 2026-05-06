"use client"
import { Image } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'
import type { Swiper as SwiperClass } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

export interface DataType {
  id: string | number
  plate: string
  vehicleType: string
  status: string
  actualWeight: string
  stdWeight: string
  overweight: string
  laneAcceptance?: string
  speed: string
  datetime: string
  images?: { image: string; description: string }[]
  vehicleImage?: string
}

type ColCount = 1 | 2 | 3 | 4 | 5 | 6

export interface ColumnsConfig {
  base?: ColCount
  sm?: ColCount
  lg?: ColCount
  xl?: ColCount
}

export interface CardListProps {
  data: DataType[]
  /** Grid columns per breakpoint. Default: { base:1, sm:2, lg:3, xl:4 } */
  columns?: ColumnsConfig
  /** lg:col-span-N for the expanded card. Default: 2 */
  expandedColSpan?: 1 | 2 | 3 | 4
  /** Height (px) of the vehicle image in collapsed state. Default: 120 */
  collapsedImageHeight?: number
  /** Height (px) of the vehicle image in expanded state. Default: 140 */
  expandedImageHeight?: number
  /** Status value → Tailwind class string mapping */
  statusMap?: Record<string, string>
  /** Called when a card is expanded or collapsed */
  onExpand?: (id: string | number | null) => void
  /** Pre-expand a card by id */
  defaultExpandedId?: string | number | null
}

// ── Tailwind class maps (full strings so Tailwind scanner detects them) ──
const GRID_BASE: Record<ColCount, string> = {
  1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3',
  4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6',
}
const GRID_SM: Record<ColCount, string> = {
  1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6',
}
const GRID_LG: Record<ColCount, string> = {
  1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6',
}
const GRID_XL: Record<ColCount, string> = {
  1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4', 5: 'xl:grid-cols-5', 6: 'xl:grid-cols-6',
}
const EXPANDED_SPAN: Record<1 | 2 | 3 | 4, string> = {
  1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4',
}

export const DEFAULT_STATUS_MAP: Record<string, string> = {
  'น้ำหนักปกติ': 'text-white/40',
  'น้ำหนักเกิน': 'text-red-400',
  'แจ้งเตือนน้ำหนัก': 'bg-(--yellow) text-black rounded-full px-2 py-0.5 text-xs',
}

const LAYOUT_TRANSITION: Transition = { type: 'spring', stiffness: 350, damping: 30 }
const CONTENT_TRANSITION: Transition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] }

// ── Swiper with custom bottom navigation ──
interface CardImageSwiperProps {
  images: { image: string; description: string }[]
  plate: string
}

const CardImageSwiper: React.FC<CardImageSwiperProps> = ({ images, plate }) => {
  const swiperRef = useRef<SwiperClass | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className='rounded-lg overflow-hidden'>
      <Swiper
        loop={images.length > 1}
        onSwiper={(s) => { swiperRef.current = s }}
        onSlideChange={(s) => setActiveIndex(s.realIndex)}
      >
        {images.map(({ image }, i) => (
          <SwiperSlide key={i}>
            <Image
              src={image}
              alt={`${plate}-${i}`}
              width="100%"
              className='aspect-video object-cover'
              preview={true}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className='flex items-center justify-between bg-[#1A1A1A] px-3 py-2'>
        <button
          className='w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors'
          onClick={() => swiperRef.current?.slidePrev()}
        >
          <TbChevronLeft className='text-white text-base' />
        </button>
        <span className='text-white/70 text-xs'>
          {images[activeIndex]?.description}
        </span>
        <button
          className='w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors'
          onClick={() => swiperRef.current?.slideNext()}
        >
          <TbChevronRight className='text-white text-base' />
        </button>
      </div>
    </div>
  )
}

// ── Data rows ──
const DataRows: React.FC<{ item: DataType }> = ({ item }) => (
  <div className='flex flex-col gap-1.5'>
    <div className='flex justify-between gap-4'>
      <span className='text-white/60 text-sm whitespace-nowrap'>น้ำหนักที่ชั่งได้ :</span>
      <span className='text-white text-sm'>{item.actualWeight}</span>
    </div>
    <div className='flex justify-between gap-4'>
      <span className='text-white/60 text-sm whitespace-nowrap'>น้ำหนักตามกำหนด :</span>
      <span className='text-(--yellow) text-sm'>{item.stdWeight}</span>
    </div>
    <div className='flex justify-between gap-4'>
      <span className={`text-sm whitespace-nowrap ${parseFloat(item.overweight) > 0 ? 'text-red-500' : 'text-white/60'}`}>
        น้ำหนักเกิน :
      </span>
      <span className={`text-sm ${parseFloat(item.overweight) > 0 ? 'text-red-500' : 'text-white/25'}`}>
        {item.overweight}
      </span>
    </div>
    {item.laneAcceptance !== undefined && (
      <div className='flex justify-between gap-4'>
        <span className='text-white/60 text-sm whitespace-nowrap'>ช่องยอมรับบรรทุก :</span>
        <span className='text-white text-sm'>{item.laneAcceptance}</span>
      </div>
    )}
    <div className='flex justify-between gap-4'>
      <span className='text-white/60 text-sm whitespace-nowrap'>ความเร็ว :</span>
      <span className='text-white text-sm'>{item.speed}</span>
    </div>
    <div className='flex justify-between gap-4'>
      <span className='text-white/60 text-sm whitespace-nowrap'>วันที่และเวลา :</span>
      <span className='text-white text-sm'>{item.datetime}</span>
    </div>
  </div>
)

// ── Card list ──
const CardList: React.FC<CardListProps> = ({
  data,
  columns = { base: 1, sm: 2, lg: 3, xl: 4 },
  expandedColSpan = 2,
  collapsedImageHeight = 120,
  expandedImageHeight = 140,
  statusMap = DEFAULT_STATUS_MAP,
  onExpand,
  defaultExpandedId = null,
}) => {
  const [expandedId, setExpandedId] = useState<string | number | null>(defaultExpandedId)

  const toggle = useCallback((id: string | number) => {
    setExpandedId(prev => {
      const next = prev === id ? null : id
      onExpand?.(next)
      return next
    })
  }, [onExpand])

  const gridClass = [
    columns.base ? GRID_BASE[columns.base] : 'grid-cols-1',
    columns.sm   ? GRID_SM[columns.sm]    : '',
    columns.lg   ? GRID_LG[columns.lg]    : '',
    columns.xl   ? GRID_XL[columns.xl]    : '',
  ].filter(Boolean).join(' ')

  const expandedSpanClass = EXPANDED_SPAN[expandedColSpan]

  const renderItem = useMemo(() => data.map((item) => {
    const isExpanded = expandedId === item.id
    const images = item.images?.length
      ? item.images
      : item.vehicleImage ? [{ image: item.vehicleImage, description: '' }] : []

    return (
      <motion.div
        key={item.id}
        layout
        transition={LAYOUT_TRANSITION}
        onClick={() => toggle(item.id)}
        className={[
          'bg-[#2D2D2D] rounded-xl p-4 cursor-pointer transition-colors duration-300',
          isExpanded
            ? `border-2 border-(--yellow) ${expandedSpanClass}`
            : 'border-2 border-transparent',
        ].join(' ')}
      >
        {/* Header */}
        <motion.div layout='position' className='flex items-start justify-between gap-2 mb-1'>
          <h4 className='text-[#66AEFF] font-bold mb-0 leading-snug'>{item.plate}</h4>
          <span className={`text-xs whitespace-nowrap pt-0.5 ${statusMap[item.status] ?? 'text-white/40'}`}>
            {item.status}
          </span>
        </motion.div>
        <motion.p layout='position' className='text-white/50 fs-12 mb-0'>{item.vehicleType}</motion.p>
        <motion.div layout='position' className='border-b border-dashed border-(--yellow) my-3' />

        {/* Expanded body */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key='expanded'
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={CONTENT_TRANSITION}
              style={{ overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}
            >
              <div className='flex flex-col sm:flex-row gap-4 items-start'>
                <div className='w-full sm:w-2/5 shrink-0'>
                  {images.length > 0 ? (
                    <CardImageSwiper images={images} plate={String(item.plate)} />
                  ) : (
                    <div className='w-full aspect-video rounded-lg bg-white/10 flex items-center justify-center text-white/30 text-xs'>
                      ไม่มีภาพ
                    </div>
                  )}
                </div>
                <div className={`flex-1 min-w-0 w-full relative ${item.vehicleImage ? 'pb-36' : ''}`}>
                  <DataRows item={item} />
                  {item.vehicleImage && (
                    <div className='absolute bottom-0 right-0'>
                      <Image
                        src={item.vehicleImage}
                        alt={item.plate}
                        height={expandedImageHeight}
                        className='object-contain'
                        preview={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed body */}
        <AnimatePresence initial={false}>
          {!isExpanded && (
            <motion.div
              key='collapsed'
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={CONTENT_TRANSITION}
              style={{ overflow: 'hidden' }}
            >
              <div className='flex flex-col gap-2'>
                <DataRows item={item} />
                {item.vehicleImage && (
                  <div className='flex justify-end'>
                    <Image
                      src={item.vehicleImage}
                      alt={item.plate}
                      height={collapsedImageHeight}
                      className='object-contain'
                      preview={false}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }), [data, expandedId, toggle, statusMap, expandedSpanClass, collapsedImageHeight, expandedImageHeight])

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {renderItem}
    </div>
  )
}

export default React.memo(CardList)
