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
    <div className="mt-6 flex flex-wrap gap-4">
      {CARDS.map(card => (
        <div
          key={card.id}
          className="relative rounded-[20px] overflow-hidden"
          style={{ width: 585, height: 740, backgroundColor: '#191919' }}
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
              <p className="mt-4 text-center" style={{ fontWeight: 700, fontSize: 40, color: '#FFFFFF' }}>{card.value}</p>
              <p className="mt-2 text-center" style={{ fontWeight: 700, fontSize: 32, color: card.glowColor }}>{card.label}</p>
              <p className="mt-2 text-center" style={{ fontWeight: 400, fontSize: 16, color: '#979797' }}>จำนวนการแจ้งเตือน</p>
              <div className="flex flex-col gap-[10px] mt-10">
                <div
                  className="flex items-center mx-auto"
                  style={{
                    width: 500,
                    height: 120,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: card.glowColor,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.detail1.img} alt="detail-1" style={{ width: 60, height: 60, marginLeft: 20 }} />
                  <div className="ml-4 self-start" style={{ marginTop: 10 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: card.glowColor }}>{card.detail1.title}</p>
                    <p className="mt-1" style={{ fontWeight: 700, fontSize: 24, color: '#FFFFFF' }}>{card.detail1.subtitle}</p>
                    <p className="mt-1" style={{ fontWeight: 400, fontSize: 14, color: '#979797' }}>{card.detail1.summary}</p>
                  </div>
                </div>
                <div
                  className="flex items-center mx-auto"
                  style={{
                    width: 500,
                    height: 120,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: card.glowColor,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.detail2.img} alt="detail-2" style={{ width: 60, height: 60, marginLeft: 20 }} />
                  <div className="ml-4 self-start" style={{ marginTop: 10 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: card.glowColor }}>{card.detail2.title}</p>
                    <p className="mt-1" style={{ fontWeight: 700, fontSize: 24, color: '#FFFFFF' }}>{card.detail2.subtitle}</p>
                    <p className="mt-1" style={{ fontWeight: 400, fontSize: 14, color: '#979797' }}>{card.detail2.summary}</p>
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
