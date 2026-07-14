"use client"
import React from 'react'

const CARDS = [
  {
    id: 1, src: '/images/statistics/Frame1.png', imageBg: true, value: '97,895',
    label: 'Incident Detection', glowColor: '#66AEFF',
    detail1: { img: '/images/statistics/Frame1.1.png', title: 'ประเภทเหตุการณ์ที่พบบ่อย', subtitle: 'รถจอดไหล่ทาง', summary: '33,580 เหตุการณ์ (59.6%)' },
    detail2: { img: '/images/statistics/Frame1.2.png', title: 'หน่วยงานที่มีเหตุการณ์มากที่สุด', subtitle: 'แขวงทางหลวงชนบทฉะเชิงเทรา', summary: '4,885 เหตุการณ์ (63.1%)' },
  },
  {
    id: 2, src: '/images/statistics/Frame2.png', imageBg: true, value: '37,027',
    label: 'Traffic Lighting', glowColor: '#66FFCA',
    detail1: { img: '/images/statistics/Frame2.1.png', title: 'สายทางที่ใช้ไฟมากที่สุด', subtitle: 'ฉช.3001', summary: '3 จุดติดตั้ง (870.5 kW)' },
    detail2: { img: '/images/statistics/Frame2.2.png', title: 'ประเภทการแจ้งเตือนมากที่สุด', subtitle: 'Line Check', summary: 'ขทช.ชลบุรี 8,173 เหตุการณ์ (43.9%)' },
  },
  {
    id: 3, src: '/images/statistics/Frame3.png', imageBg: true, value: '415',
    label: 'VMS', glowColor: '#BDFF66',
    detail1: { img: '/images/statistics/Frame3.1.png', title: 'หมวดหมู่ยอดนิยม', subtitle: 'การท่องเที่ยว', summary: '36 จุดติดตั้ง (59.6%)' },
    detail2: { img: '/images/statistics/Frame3.2.png', title: 'ชุดคำสั่งล่าสุด', subtitle: 'ธงชาติไทย', summary: '16 สำนักทางหลวงชนบท (100.0%)' },
  },
]

const OverviewSection: React.FC = () => {
  return (
    <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
      {CARDS.map(card => (
        <div
          key={card.id}
          className="relative rounded-2xl overflow-hidden w-full h-auto min-h-115 sm:min-h-145 lg:min-h-175"
          style={{ backgroundColor: '#191919' }}
        >
          {card.imageBg && (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-[30px] sm:translate-y-[45px] lg:translate-y-[60px] w-[180px] sm:w-[240px] lg:w-[310px] h-[180px] sm:h-[240px] lg:h-[310px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${card.glowColor}1A 0%, transparent 70%)`,
                filter: 'blur(40px)',
              }}
            />
          )}
          {card.src && (
            <div className="mx-auto mt-[40px] sm:mt-[60px] lg:mt-[80px] flex flex-col items-center justify-center px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.src}
                alt={`overview-card-${card.id}`}
                className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] lg:w-[150px] lg:h-[150px]"
              />
              <p className="mt-3 sm:mt-4 text-center text-2xl sm:text-3xl lg:text-[40px] font-bold text-white">{card.value}</p>
              <p className="mt-1 sm:mt-2 text-center text-lg sm:text-2xl lg:text-[32px] font-bold" style={{ color: card.glowColor }}>{card.label}</p>
              <p className="mt-1 sm:mt-2 text-center text-xs sm:text-sm lg:text-base text-[#979797]">จำนวนการแจ้งเตือน</p>
              <div className="flex flex-col gap-2 sm:gap-[10px] mt-6 sm:mt-8 lg:mt-10 w-full">
                <div
                  className="flex items-center mx-auto rounded-2xl border-2 border-solid px-3 sm:px-5 w-full sm:w-[400px] md:w-[460px] lg:w-[500px] h-[95px] sm:h-[115px] md:h-[135px]"
                  style={{ borderColor: card.glowColor }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.detail1.img} alt="detail-1" className="w-[36px] h-[36px] sm:w-[48px] sm:h-[48px] md:w-[60px] md:h-[60px] shrink-0" />
                  <div className="ml-2 sm:ml-3 md:ml-4 self-start mt-2 sm:mt-[14px] md:mt-[18px] min-w-0">
                    <p className="text-xs sm:text-sm md:text-base font-bold truncate" style={{ color: card.glowColor }}>{card.detail1.title}</p>
                    <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg md:text-2xl font-bold text-white truncate">{card.detail1.subtitle}</p>
                    <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-[#979797] truncate">{card.detail1.summary}</p>
                  </div>
                </div>
                <div
                  className="flex items-center mx-auto rounded-2xl border-2 border-solid px-3 sm:px-5 w-full sm:w-[400px] md:w-[460px] lg:w-[500px] h-[95px] sm:h-[115px] md:h-[135px]"
                  style={{ borderColor: card.glowColor }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.detail2.img} alt="detail-2" className="w-[36px] h-[36px] sm:w-[48px] sm:h-[48px] md:w-[60px] md:h-[60px] shrink-0" />
                  <div className="ml-2 sm:ml-3 md:ml-4 self-start mt-2 sm:mt-[14px] md:mt-[18px] min-w-0">
                    <p className="text-xs sm:text-sm md:text-base font-bold truncate" style={{ color: card.glowColor }}>{card.detail2.title}</p>
                    <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg md:text-2xl font-bold text-white truncate">{card.detail2.subtitle}</p>
                    <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-[#979797] truncate">{card.detail2.summary}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default React.memo(OverviewSection)
