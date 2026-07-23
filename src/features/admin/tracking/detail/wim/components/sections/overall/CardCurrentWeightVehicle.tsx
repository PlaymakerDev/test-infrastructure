import React, { useCallback, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Empty, Image } from 'antd'
import { AnimatePresence, motion } from 'motion/react'
import type { Transition } from 'motion/react'
import { WeightStationLogByIDData, WeightWIMLogByIDData } from '@/types/tracking/detail-api'
import { FALLBACK, VEHICLE_PROPERTIES } from '@/constants'

interface Props {
  // STATION data has no `speed` reading (it's a static weighbridge, not a
  // speed-sensing WIM sensor) — narrow with `'speed' in data` at the call site.
  data?: WeightWIMLogByIDData | WeightStationLogByIDData
}

const PHOTO_TRANSITION: Transition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
const LAYOUT_TRANSITION: Transition = { type: 'spring', stiffness: 350, damping: 30 }

const CardCurrentWeightVehicle: React.FC<Props> = (props) => {
  const { data } = props
  const [showVehiclePhotos, setShowVehiclePhotos] = useState(false)

  const renderLicensePlate = useCallback((plateNo: string, plateProvince: string) => {
    const nameArr = [plateNo, plateProvince]
    return nameArr.join(' ')
  }, [])

  const prerenderLicensePlate = useCallback((plateNo: string, plateProvince: string) => {
    console.log(plateNo)
    if (!plateNo) return 'ไม่ระบุทะเบียน'
    return renderLicensePlate(plateNo, plateProvince)
  }, [renderLicensePlate])

  const renderContent = useMemo(() => {
    if (!data) return (
      <div className='m-40'>
        <Empty description='ไม่พบข้อมูล' />
      </div>
    )
    return (
      <>
        <section>
          <h1 className="text-red-500">{prerenderLicensePlate(data?.lp_head_no, data?.lp_head_province?.name)}</h1>
          <p className='text-gray-400'>รถน้ำหนักเกิน</p>
          <p className="fs-12 text-red-500/50">{dayjs(data?.time_stamp).format('DD MMMM BBBB HH:mm:ss')}</p>
        </section>
        <section className='mt-5 flex flex-col gap-4 md:flex-row md:flex-wrap'>
          <AnimatePresence initial={false}>
            {showVehiclePhotos && (
              <>
                <motion.figure
                  key='photo-1'
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={PHOTO_TRANSITION}
                  className='h-52 overflow-hidden rounded-lg md:flex-1 md:min-w-40'
                >
                  <Image
                    src={data?.image_01_name}
                    alt={data?.image_01_name}
                    width={'100%'}
                    height={'100%'}
                    className='object-center object-cover'
                    fallback={FALLBACK}
                  />
                </motion.figure>
                <motion.figure
                  key='photo-2'
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={PHOTO_TRANSITION}
                  className='h-52 overflow-hidden rounded-lg md:flex-1 md:min-w-40'
                >
                  <Image
                    src={data?.image_02_name}
                    alt={data?.image_02_name}
                    width={'100%'}
                    height={'100%'}
                    className='object-center object-cover'
                    fallback={FALLBACK}
                  />
                </motion.figure>
              </>
            )}
          </AnimatePresence>
          <motion.figure
            layout
            transition={LAYOUT_TRANSITION}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className='h-52 overflow-hidden rounded-lg cursor-pointer md:flex-1 md:min-w-40 md:-mr-40'
            onClick={() => setShowVehiclePhotos((prev) => !prev)}
          >
            <Image
              src={VEHICLE_PROPERTIES[String(data?.vehicle_class_id) as keyof typeof VEHICLE_PROPERTIES]?.vehicle?.image}
              alt='vehicle-appearance'
              width={'100%'}
              height={'100%'}
              className='object-left object-contain'
              preview={false}
              fallback={FALLBACK}
            />
          </motion.figure>
        </section>
        <section className='mt-5'>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${showVehiclePhotos ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
            {/* f1 — xs: border-b | sm: border-b + border-r | lg: border-r only */}
            <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--white)/50 border-b sm:border-r lg:border-b-0'>
              <section className='text-center'>
                <h1 className='text-(--yellow)'>{data?.vehicle_class_id || '-'}</h1>
                <p className='fs-12 text-gray-400'>{data?.vehicle_class?.vehicle_class_desc || '-'}</p>
              </section>
            </figure>

            {/* f2 — xs: border-b | sm: border-b (rightmost, no border-r) | lg: border-b-0 + border-r */}
            <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--white)/50 border-b lg:border-b-0 lg:border-r'>
              <section className='text-center'>
                <h1 className='text-(--yellow)'>{data?.legal_weight || '-'}</h1>
                <p className='fs-12 text-gray-400'>น้ำหนักมาตราฐาน</p>
                <p className='fs-12 text-gray-400'>(ตัน)</p>
              </section>
            </figure>

            {/* f3 — xs: border-b | sm: border-b-0 + border-r | lg: border-r */}
            <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--white)/50 border-b sm:border-b-0 sm:border-r'>
              <section className='text-center'>
                <h1 className='text-white'>{data?.gross_weight || '-'}</h1>
                <p className='fs-12 text-gray-400'>น้ำหนักที่ชั่ง</p>
                <p className='fs-12 text-gray-400'>(ตัน)</p>
              </section>
            </figure>

            {/* f4 — xs: border-b | sm: border-b-0, no border-r (rightmost at sm) | lg: border-r only while f5 is shown (otherwise f4 is the last column) */}
            <figure className={`flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--white)/50 ${showVehiclePhotos ? 'lg:border-r border-b sm:border-b-0' : ''}`}>
              <section className='text-center'>
                <h1 className={`text-red-500`}>{data?.gross_weight_over || '-'}</h1>
                <p className='fs-12 text-gray-400'>น้ำหนักเกิน</p>
                <p className='fs-12 text-gray-400'>(ตัน)</p>
              </section>
            </figure>

            {/* f5 — only rendered once showVehiclePhotos is true; last item, no border needed at any breakpoint.
              sm:col-span-2 avoids it becoming an orphan alone in col1 (5 items in a 2-col grid) with an
              awkward empty gap beside it; lg:col-span-1 resets that since it's a legitimate 5th column there. */}
            {showVehiclePhotos && (
              <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 sm:col-span-2 lg:col-span-1'>
                <section className='text-center'>
                  <h1 className={`text-(--yellow)`}>{(data && 'speed' in data && data.speed) || '-'}</h1>
                  <p className='fs-12 text-gray-400'>ความเร็ว</p>
                  <p className='fs-12 text-gray-400'>(กม./ชม.)</p>
                </section>
              </figure>
            )}
          </div>
        </section>
      </>
    )
  }, [data, showVehiclePhotos, prerenderLicensePlate])

  return (
    <div className="border-2 rounded-2xl p-5 border-red-500 overflow-hidden">
      {renderContent}
    </div>
  )
}

export default React.memo<Props>(CardCurrentWeightVehicle)