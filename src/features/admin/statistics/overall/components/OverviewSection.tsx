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
          className="relative rounded-[20px] overflow-hidden w-full h-auto min-h-[600px] lg:min-h-[700px]"
          style={{ backgroundColor: '#191919' }}
        >
          {card.imageBg && (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-[60px]"
              style={{
                width: 310,
                height: 310,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${card.glowColor}1A 0%, transparent 70%)`,
                filter: 'blur(40px)',
              }}
            />
          )}
          {card.src && (
            <div className="mx-auto mt-[80px] flex flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.src}
                alt={`overview-card-${card.id}`}
                style={{ width: 150, height: 150 }}
              />
              <p className="mt-4 text-center text-3xl sm:text-4xl lg:text-[40px] font-bold text-white">{card.value}</p>
              <p className="mt-2 text-center text-2xl sm:text-3xl lg:text-[32px] font-bold" style={{ color: card.glowColor }}>{card.label}</p>
              <p className="mt-2 text-center text-sm sm:text-base text-[#979797]">จำนวนการแจ้งเตือน</p>
              <div className="flex flex-col gap-[10px] mt-10">
                <div
                  className="flex items-center mx-auto rounded-[20px] border-2 border-solid px-3 sm:px-5 w-[calc(100%-16px)] sm:w-[400px] md:w-[460px] lg:w-[500px] h-[100px] sm:h-[110px] md:h-[120px]"
                  style={{ borderColor: card.glowColor }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.detail1.img} alt="detail-1" className="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] md:w-[60px] md:h-[60px] shrink-0" />
                  <div className="ml-3 sm:ml-4 self-start mt-[14px] sm:mt-[16px] md:mt-[18px]">
                    <p className="text-sm sm:text-base font-bold" style={{ color: card.glowColor }}>{card.detail1.title}</p>
                    <p className="mt-1 text-lg sm:text-xl md:text-2xl font-bold text-white">{card.detail1.subtitle}</p>
                    <p className="mt-1 text-xs sm:text-sm text-[#979797]">{card.detail1.summary}</p>
                  </div>
                </div>
                <div
                  className="flex items-center mx-auto rounded-[20px] border-2 border-solid px-3 sm:px-5 w-[calc(100%-16px)] sm:w-[400px] md:w-[460px] lg:w-[500px] h-[100px] sm:h-[110px] md:h-[120px]"
                  style={{ borderColor: card.glowColor }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.detail2.img} alt="detail-2" className="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] md:w-[60px] md:h-[60px] shrink-0" />
                  <div className="ml-3 sm:ml-4 self-start mt-[14px] sm:mt-[16px] md:mt-[18px]">
                    <p className="text-sm sm:text-base font-bold" style={{ color: card.glowColor }}>{card.detail2.title}</p>
                    <p className="mt-1 text-lg sm:text-xl md:text-2xl font-bold text-white">{card.detail2.subtitle}</p>
                    <p className="mt-1 text-xs sm:text-sm text-[#979797]">{card.detail2.summary}</p>
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
