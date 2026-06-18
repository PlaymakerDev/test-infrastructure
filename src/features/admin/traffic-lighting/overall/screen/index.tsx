"use client"
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ConfigProvider, Input } from 'antd'
import { TbPrinter, TbSearch } from 'react-icons/tb'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { TitleSection, TableTrafficLighting } from '../components'
import { TRAFFIC_LIGHTING_PROJECTS } from '../data/trafficLightingProjects'

// TODO: replace mock markers with real data when API is ready
const MOCK_MARKERS = [
  { lng: 100.5, lat: 13.75, no: 5 },   // กทม.
  { lng: 98.98, lat: 18.79, no: 12 },  // เชียงใหม่
  { lng: 102.83, lat: 16.44, no: 8 },  // ขอนแก่น
  { lng: 102.1, lat: 14.97, no: 3 },   // โคราช
  { lng: 99.97, lat: 17.01, no: 15 },  // พิษณุโลก
]

const STAT_CARDS = [
  { title: 'ตู้โจรกรรมในระบบทั้งหมด', value: 184, active: '126 (77.4%)', bg: '#FCD1161A', border: '2px solid #FCD116' },
  { title: 'โคมไฟในระบบทั้งหมด', value: 16, active: '12 (84.8%)', bg: '#FCD1161A', border: '2px solid #FCD116' },
  { title: 'ในค้ำ', value: 234, active: '59 (52.1%)', bg: '#05F2DB1A', border: '2px solid #05F2DB' },
  { title: 'หมดค้ำ', value: 66, active: '10 (38.5%)', bg: '#9797971A', border: '2px solid #979797' },
] as const

const SUMMARY_STATS = [
  { label: 'ทั้งหมด', value: 300, color: '#FCD116', variant: 'filled' },
  { label: 'ออนไลน์', value: 138, color: '#66AEFF', variant: 'outlined' },
  { label: 'ออฟไลน์', value: 162, color: '#E94C4C', variant: 'outlined' },
  { label: 'ในค้ำ', value: 234, color: '#05F2DB', variant: 'outlined' },
  { label: 'หมดค้ำ', value: 66, color: '#979797', variant: 'outlined' },
] as const

// TODO: replace with real API data
const LEFT_PANEL_ITEMS = [
  { id: '1', route: 'อน.3023', cabinet: 'ตู้ที่ 2 กม.6+400', imei: '860946061754746' },
] as const

const LEFT_BOTTOM_CARDS = [
  {
    border: '#6666FF',
    icon: '/images/Lighting/icel1.png',
    titleColor: '#6666FF',
    title: 'สถานะการเชื่อมต่อ',
    status: 'เชื่อมต่อปกติ',
  },
  {
    border: '#B066FF',
    icon: '/images/Lighting/icel2.png',
    titleColor: '#B066FF',
    title: 'สถานะการเชื่อมต่อ',
    status: 'เชื่อมต่อปกติ',
  },
] as const

const PHASE_METRICS = [
  { label: 'Volt', value: '240.2' },
  { label: 'Amp', value: '35.2' },
  { label: 'Watt', value: '50.27' },
  { label: 'Pf', value: '0.97' },
  { label: 'kWh', value: '3.02' },
  { label: 'Hz', value: '50.03' },
] as const

const TrafficLightingScreen: React.FC = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProjects = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()
    if (!term) return TRAFFIC_LIGHTING_PROJECTS
    return TRAFFIC_LIGHTING_PROJECTS.filter((p) => {
      const haystack = `${p.roadCode} ${p.projectName} ${p.installPoint} ${p.contractNo} ${p.bureau}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [searchQuery])

  return (
    <div className='main-screen px-3 sm:px-6 xl:px-10 pt-3 pb-6'>
      <TitleSection />
      <section className='mt-4 flex flex-col md:flex-row md:items-stretch gap-3 md:gap-4 md:min-h-[760px]'>
        {/* Left panel */}
        <div className='shrink-0 w-full md:w-[240px] lg:w-[360px] xl:w-[500px] h-auto min-h-[280px] sm:min-h-[320px] md:h-[760px] md:min-h-[760px] rounded-[20px] bg-[#2B2B2B] p-3 sm:p-4 flex flex-col'>
          <div className='flex flex-col gap-3 shrink-0'>
            {LEFT_PANEL_ITEMS.map((item) => (
              <div key={item.id} className='flex flex-row items-center gap-2'>
                <div className='flex flex-col gap-1 min-w-0 flex-1'>
                  <div className='flex flex-row items-center gap-0.5'>
                    <p className='text-[12px] font-normal m-0 shrink-0' style={{ color: '#66AEFF' }}>{item.route}</p>
                    <p className='text-[12px] font-normal m-0 shrink-0' style={{ color: '#66AEFF' }}>{item.cabinet}</p>
                  </div>
                  <p className='text-[12px] font-normal m-0' style={{ color: '#979797' }}>IMEI : {item.imei}</p>
                </div>
                <button
                  type='button'
                  className='shrink-0 flex items-center justify-center border-0 cursor-pointer p-0 text-[12px] font-normal text-white leading-none'
                  style={{ width: 80, height: 27, borderRadius: 88, background: '#212121' }}
                  onClick={() => router.push(`/admin/traffic-lighting/detail/${item.id}`)}
                >
                  ดูเพิ่มเติม
                </button>
              </div>
            ))}
          </div>
          <div className='mt-auto flex flex-col gap-3 shrink-0 w-full min-w-0'>
          <div
            className='shrink-0 rounded-[20px] w-full min-w-0 p-3 sm:p-4 flex flex-col xl:min-h-[270px]'
            style={{ background: '#191919CC' }}
          >
            <div className='flex flex-row items-start gap-2 shrink-0'>
              <img src='/images/Lighting/icelt1.png' alt='' width={40} height={40} className='shrink-0 w-8 h-8 sm:w-10 sm:h-10' />
              <p className='text-[14px] sm:text-[16px] font-bold m-0 text-white'>ระบบไฟฟ้า</p>
            </div>
            <div className='flex flex-col items-center justify-center text-center py-3 sm:py-4 lg:py-5 xl:flex-1 xl:justify-end xl:pb-8 min-h-[64px] sm:min-h-[72px]'>
              <p className='text-[22px] sm:text-[28px] lg:text-[30px] xl:text-[32px] font-bold m-0 text-white leading-none'>3 Phase</p>
              <p className='text-[11px] sm:text-[13px] xl:text-[14px] font-normal m-0 mt-1' style={{ color: '#66AEFF' }}>Three Phase</p>
            </div>
            <div className='grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-6 w-full min-w-0 shrink-0'>
              {PHASE_METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className='flex flex-col items-center justify-center rounded-[10px] w-full min-w-0 h-[54px] sm:h-[60px] lg:h-[64px] xl:h-[70px] xl:max-w-[65px] xl:justify-self-center'
                  style={{
                    background: '#191919',
                    border: '1px solid #66AEFF',
                  }}
                >
                  <span className='text-[10px] sm:text-[11px] xl:text-[12px] font-normal m-0 truncate max-w-full px-0.5' style={{ color: '#66AEFF' }}>{metric.label}</span>
                  <span className='text-[11px] sm:text-[13px] xl:text-[14px] font-bold m-0 mt-0.5 sm:mt-1 text-white truncate max-w-full px-0.5'>{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className='flex flex-col xl:flex-row gap-2 shrink-0'>
            {LEFT_BOTTOM_CARDS.map((card) => (
              <div
                key={card.border}
                className='w-full xl:w-[230px] xl:h-[110px] xl:shrink-0 min-h-[96px] sm:min-h-[110px] rounded-[20px] px-3 pb-3 pt-4 sm:pt-5 flex flex-col'
                style={{
                  background: '#66AEFF1A',
                  border: `2px solid ${card.border}`,
                }}
              >
                <div className='pl-2 sm:pl-3 flex flex-col min-w-0'>
                  <div className='flex flex-row items-center gap-2 min-w-0'>
                    <img src={card.icon} alt='' width={30} height={30} className='shrink-0' />
                    <p className='text-[13px] sm:text-[16px] font-bold m-0 leading-tight truncate' style={{ color: card.titleColor }}>{card.title}</p>
                  </div>
                  <p className='text-[20px] sm:text-[24px] font-bold m-0 mt-1 pl-[34px] sm:pl-[38px] text-white leading-none'>{card.status}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Map */}
        <div className='relative w-full min-w-0 h-[300px] sm:h-[400px] md:flex-1 md:min-h-[400px] md:h-[760px] rounded-[20px] overflow-hidden'>
          <BaseMap style={{ height: '100%', width: '100%' }}>
            {MOCK_MARKERS.map((m) => (
              <HTMLMarker key={m.no} lngLat={[m.lng, m.lat]} anchor='center'>
                <div className='flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FCD116] text-[#121319] text-sm sm:text-base font-bold'>
                  {m.no}
                </div>
              </HTMLMarker>
            ))}
          </BaseMap>
        </div>

        {/* Stats cards — 1 per row on mobile, column on md+ */}
        <div className='flex flex-col gap-3 md:gap-4 w-full md:w-[240px] lg:w-[280px] shrink-0'>
          {STAT_CARDS.map((s) => (
            <div
              key={s.title}
              className='flex flex-col justify-between h-[140px] sm:h-[160px] md:h-[170px] rounded-[20px] p-3 sm:p-4'
              style={{ background: s.bg, border: s.border }}
            >
              <p className='text-[#979797] text-xs sm:text-sm m-0 leading-tight'>{s.title}</p>
              <div>
                <p className='text-white text-3xl sm:text-4xl md:text-[40px] font-bold m-0 leading-none'>{s.value}</p>
                <p className='text-[#979797] text-[11px] sm:text-[13px] mt-0.5 sm:mt-1 m-0'>จุดติดตั้ง</p>
              </div>
              <p className='text-[#FCD116] text-[11px] sm:text-[13px] m-0'>Active : {s.active}</p>
            </div>
          ))}
        </div>
      </section>

      <div className='mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-4 shrink-0'>
        <div className='flex flex-row flex-wrap items-center gap-2 w-full lg:w-auto min-w-0'>
          {SUMMARY_STATS.map((stat) => (
            <div
              key={stat.label}
              className='box-border flex flex-row items-center justify-between rounded-[10px] px-2 w-[calc(50%-4px)] min-w-[120px] max-w-[130px] sm:w-[130px] h-[46px]'
              style={{
                ...(stat.variant === 'filled'
                  ? { background: stat.color }
                  : { background: 'transparent', border: `2px solid ${stat.color}` }),
              }}
            >
              <span
                className='text-[12px] font-normal m-0 leading-none shrink-0'
                style={{ color: stat.variant === 'filled' ? '#212121' : stat.color }}
              >
                {stat.label}
              </span>
              <span
                className='flex items-center justify-center text-[14px] font-normal m-0 leading-none shrink-0 rounded-[5px]'
                style={{
                  width: 50,
                  height: 30,
                  ...(stat.variant === 'filled'
                    ? { background: '#212121', color: stat.color }
                    : { background: stat.color, color: '#212121' }),
                }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full lg:w-auto lg:shrink-0'>
          <style>{`
            .traffic-lighting-search-input::placeholder {
              color: #FFFFFF80 !important;
              font-weight: 400;
              font-size: 14px;
            }
          `}</style>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='ค้นหาหน่วยงาน สายทาง หรือชื่อโครงการ...'
            classNames={{
              root: 'traffic-lighting-search !w-full lg:!w-[360px] lg:!max-w-[360px] !shrink-0 !rounded-[10px]! !h-[46px]! !bg-[#2B2B2B]! !border-[#FCD116]! !overflow-hidden',
              input: 'traffic-lighting-search-input !bg-transparent!',
            }}
            styles={{
              root: {
                height: 46,
                background: '#2B2B2B',
                borderRadius: 10,
              },
              input: {
                background: 'transparent',
                fontSize: 14,
                fontWeight: 400,
                color: '#FFFFFF',
              },
            }}
            suffix={<TbSearch style={{ color: '#FCD116', fontSize: 18 }} />}
            allowClear
          />
          <div className='flex flex-row items-center gap-2 w-full sm:w-auto'>
            <img src='/images/Lighting/icbar1.png' alt='' width={30} height={30} className='shrink-0' />
            <img src='/images/Lighting/icbar2.png' alt='' width={30} height={30} className='shrink-0' />
            <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
              <Button
                type='primary'
                size='small'
                icon={<TbPrinter />}
                onClick={() => alert('TODO: นำออกเอกสาร')}
                className='w-[130px]! h-[27px]! rounded-[88px]! px-2! text-xs! inline-flex! items-center! justify-center!'
              >
                <span className='hidden sm:inline'>นำออกเอกสาร</span>
              </Button>
            </ConfigProvider>
          </div>
        </div>
      </div>

      <section className='mt-4 pb-5 md:pb-0'>
        <TableTrafficLighting projects={filteredProjects} />
      </section>
    </div>
  )
}

export default React.memo(TrafficLightingScreen)
