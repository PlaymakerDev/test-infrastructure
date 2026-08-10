"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import DiagramIframe from '@/features/admin/traffic-lighting/shared/DiagramIframe'
import { buildLightingDetailUrl } from '@/features/admin/traffic-lighting/shared/lightingDetailNavigation'
import { useOverallContext } from '../../../context'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** LEFT rail — the random-online device summary (ตู้ควบคุม + IMEI), its
 *  single-line diagram, the ระบบไฟฟ้า phase card and the two status cards.
 *  Content is unchanged from when this markup lived inline in `OverallSection`;
 *  only the outer box moved from an absolutely-positioned overlay to a normal
 *  `MapFocusGrid` cell, so it now behaves like every other overall page's left
 *  rail (CctvListTrafficVolume et al). */
const LeftPanelTrafficLighting: React.FC = () => {
  const router = useRouter()
  const {
    deptId,
    leftPanelItems,
    phaseLabel,
    phaseSubLabel,
    phaseMetrics,
    leftBottomCards,
    diagramImei,
  } = useOverallContext()

  return (
    <div className='min-h-full rounded-[20px] bg-[#2B2B2B] p-3 sm:p-4 flex flex-col'>
      <div className='flex flex-col gap-3 shrink-0'>
        {leftPanelItems.map((item) => (
          <div key={item.id} className='flex flex-col gap-1 min-w-0 flex-1'>
            <div className='flex flex-row items-center gap-0.5'>
              <p className='fs-12 font-normal m-0 shrink-0' style={{ color: '#66AEFF' }}>{item.cabinet}</p>
            </div>
            <div className='flex flex-row items-center gap-2 justify-between'>
              <p className='fs-12 font-normal m-0 shrink-0' style={{ color: '#979797' }}>IMEI : {item.imei}</p>
              <button
                type='button'
                disabled={!item.imei || item.imei === '-'}
                className='shrink-0 flex items-center justify-center border-0 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 p-0 fs-12 font-normal text-white leading-none'
                style={{ width: 80, height: 27, borderRadius: 88, background: '#212121' }}
                onClick={() => {
                  const equipType = item.equipmentType || ''
                  router.push(buildLightingDetailUrl({
                    routeId: item.imei,
                    imei: item.imei,
                    type: equipType,
                    deptId,
                  }))
                }}
              >
                ดูเพิ่มเติม
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* No `overflow-hidden` here on purpose — the row height follows this
        * rail's content now (see LocationTrafficLighting), so clipping would
        * only ever hide a card instead of being needed. */}
      <div className='mt-3 flex-1 min-h-0 w-full min-w-0 flex flex-col'>
        {diagramImei && (
          <div className='shrink-0 min-h-[180px] sm:min-h-[210px] w-full min-w-0 flex items-center justify-center'>
            <DiagramIframe
              imei={diagramImei}
              minHeight={180}
              className='h-full max-h-[210px] sm:max-h-[250px] lg:max-h-[280px] xl:max-h-[340px]'
            />
          </div>
        )}
        <div className='flex-1 min-h-0 flex flex-col gap-2 w-full min-w-0'>
          <div
            className='flex-1 min-h-[200px] rounded-[20px] w-full min-w-0 p-3 sm:p-4 flex flex-col'
            style={{ background: '#191919CC' }}
          >
            <div className='flex flex-row items-start gap-2 shrink-0'>
              <img src={`${BASE_PATH}/images/Lighting/icelt1.png`} alt='' width={40} height={40} className='shrink-0 w-8 h-8 sm:w-10 sm:h-10' />
              <p className='fs-12 sm:text-[16px] font-bold m-0 text-white'>ระบบไฟฟ้า</p>
            </div>
            <div className='flex-1 flex flex-col items-center justify-center text-center py-2 sm:py-3 min-h-[56px]'>
              <p className='text-[22px] sm:text-[28px] lg:text-[30px] xl:text-[32px] font-bold m-0 text-white leading-none'>{phaseLabel}</p>
              <p className='fs-12 font-normal m-0 mt-1' style={{ color: '#66AEFF' }}>{phaseSubLabel}</p>
            </div>
            {/* 5 chips on one row. Every label/value here is forced to 14px by
              * TrafficLightingMinimumFontSize, so the cells are narrow: the
              * value is `truncate`d (ellipsis INSIDE its own chip) rather than
              * left to spill over the border, and the readings themselves are
              * rounded to fit in the context's `fmt` — hover shows the exact
              * number. */}
            <div className='grid grid-cols-5 gap-1 sm:gap-1.5 w-full min-w-0 shrink-0 mt-auto'>
              {phaseMetrics.map((metric) => (
                <div
                  key={metric.label}
                  title={metric.full ? `${metric.label} : ${metric.full}` : metric.label}
                  className='flex flex-col items-center justify-center rounded-[10px] w-full min-w-0 min-h-[56px] sm:min-h-[60px] xl:min-h-[64px] px-0.5 py-1.5 overflow-hidden'
                  style={{ background: '#191919', border: '1px solid #66AEFF' }}
                >
                  <span className='text-[10px] font-normal m-0 leading-none' style={{ color: '#66AEFF' }}>{metric.label}</span>
                  <span className='text-[10px] font-bold m-0 mt-1 text-white tabular-nums leading-tight text-center w-full min-w-0 truncate'>
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className='flex flex-col gap-2 shrink-0'>
            {leftBottomCards.map((card) => (
              <div
                key={card.border}
                className='w-full min-w-0 min-h-[72px] sm:min-h-[80px] xl:min-h-[96px] rounded-[16px] sm:rounded-[20px] px-2 sm:px-3 py-2 sm:py-3 flex flex-row items-center'
                style={{ background: '#66AEFF1A', border: `2px solid ${card.border}` }}
              >
                <img src={card.icon} alt='' width={30} height={30} className='shrink-0 w-7 h-7 sm:w-[30px] sm:h-[30px] ml-1 sm:ml-2' />
                <div className='flex flex-col min-w-0 flex-1 pl-2 sm:pl-3'>
                  <p className='fs-12 font-bold m-0 truncate' style={{ color: card.titleColor, lineHeight: 1.4 }}>{card.title}</p>
                  <p className='text-[16px] sm:text-[18px] xl:text-[22px] font-bold m-0 mt-0.5 text-white truncate' style={{ lineHeight: 1.4 }}>{card.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(LeftPanelTrafficLighting)
