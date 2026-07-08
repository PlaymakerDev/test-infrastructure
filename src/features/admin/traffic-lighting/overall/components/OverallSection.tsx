"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { Button, ConfigProvider, Input } from 'antd'
import { TbPrinter, TbSearch } from 'react-icons/tb'
import { TableTrafficLighting, MapTrafficLighting } from '../components'
import { useOverallContext } from '../context'
import DiagramIframe from '@/features/admin/traffic-lighting/shared/DiagramIframe'

const OverallSection: React.FC = () => {
  const router = useRouter()
  const {
    deptId,
    searchQuery,
    setSearchQuery,
    statCards,
    summaryStats,
    filteredProjects,
    leftPanelItems,
    phaseLabel,
    phaseSubLabel,
    phaseMetrics,
    leftBottomCards,
    diagramImei,
  } = useOverallContext()
  const deptQuery = deptId ? `?dept_id=${deptId}` : ''

  return (
    <>
      <section className='mt-4 flex flex-col md:flex-row md:items-stretch gap-3 md:gap-4 md:min-h-[760px]'>
        <div className='shrink-0 w-full md:w-[240px] lg:w-[360px] xl:w-[500px] h-auto min-h-[280px] sm:min-h-[320px] md:h-[760px] md:min-h-0 rounded-[20px] bg-[#2B2B2B] p-3 sm:p-4 flex flex-col overflow-hidden'>
          <div className='flex flex-col gap-3 shrink-0'>
            {leftPanelItems.map((item) => (
              <div key={item.id} className='flex flex-col gap-1 min-w-0 flex-1'>
                <div className='flex flex-row items-center gap-0.5'>
                  <p className='text-[12px] font-normal m-0 shrink-0' style={{ color: '#66AEFF' }}>{item.cabinet}</p>
                </div>
                <div className='flex flex-row items-center gap-2 justify-between'>
                  <p className='text-[12px] font-normal m-0 shrink-0' style={{ color: '#979797' }}>IMEI : {item.imei}</p>
                  <button
                    type='button'
                    className='shrink-0 flex items-center justify-center border-0 cursor-pointer p-0 text-[12px] font-normal text-white leading-none'
                    style={{ width: 80, height: 27, borderRadius: 88, background: '#212121' }}
                    onClick={() => {
                      const equipType = item.equipmentType || 'phase'
                      sessionStorage.setItem('lighting_detail_type', equipType)
                      sessionStorage.setItem('lighting_detail_imei', item.imei)
                      sessionStorage.setItem('lighting_detail_row', JSON.stringify({
                        roadCode: item.route,
                        projectName: item.cabinet,
                        installPoint: item.cabinet,
                        bureau: '-',
                        coord: item.coord ?? [],
                        warranty: '',
                        connection: '',
                      }))
                      const base = equipType === 'lamp'
                        ? `/admin/traffic-lighting/detail/lamp/${item.imei}`
                        : `/admin/traffic-lighting/detail/${item.imei}`
                      router.push(`${base}${deptQuery}`)
                    }}
                  >
                    ดูเพิ่มเติม
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className='mt-3 flex-1 min-h-0 w-full min-w-0 flex flex-col overflow-hidden'>
            {diagramImei && (
              <div className='shrink-0 min-h-[180px] sm:min-h-[210px] w-full min-w-0 flex items-center justify-center'>
                <DiagramIframe
                  imei={diagramImei}
                  minHeight={180}
                  className='h-full max-h-[210px] sm:max-h-[250px] md:max-h-[220px] lg:max-h-[280px] xl:max-h-[340px]'
                />
              </div>
            )}
            <div className='flex-1 min-h-0 flex flex-col gap-2 w-full min-w-0'>
              <div
                className='flex-1 min-h-[200px] rounded-[20px] w-full min-w-0 p-3 sm:p-4 flex flex-col'
                style={{ background: '#191919CC' }}
              >
                <div className='flex flex-row items-start gap-2 shrink-0'>
                  <img src='/images/Lighting/icelt1.png' alt='' width={40} height={40} className='shrink-0 w-8 h-8 sm:w-10 sm:h-10' />
                  <p className='text-[14px] sm:text-[16px] font-bold m-0 text-white'>ระบบไฟฟ้า</p>
                </div>
                <div className='flex-1 flex flex-col items-center justify-center text-center py-2 sm:py-3 min-h-[56px]'>
                  <p className='text-[22px] sm:text-[28px] lg:text-[30px] xl:text-[32px] font-bold m-0 text-white leading-none'>{phaseLabel}</p>
                  <p className='text-[11px] sm:text-[13px] xl:text-[14px] font-normal m-0 mt-1' style={{ color: '#66AEFF' }}>{phaseSubLabel}</p>
                </div>
                <div className='grid grid-cols-3 gap-1.5 sm:gap-2 xl:grid-cols-6 w-full min-w-0 shrink-0 mt-auto'>
                  {phaseMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className='flex flex-col items-center justify-center rounded-[10px] w-full min-w-0 min-h-[56px] sm:min-h-[60px] xl:min-h-[64px] px-1 py-1.5'
                      style={{ background: '#191919', border: '1px solid #66AEFF' }}
                    >
                      <span className='text-[10px] sm:text-[11px] font-normal m-0 leading-none' style={{ color: '#66AEFF' }}>{metric.label}</span>
                      <span className='text-[10px] sm:text-[12px] xl:text-[11px] font-bold m-0 mt-1 text-white tabular-nums leading-tight text-center w-full'>
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
                    <p className='text-[11px] sm:text-[13px] xl:text-[14px] font-bold m-0 leading-tight truncate' style={{ color: card.titleColor }}>{card.title}</p>
                    <p className='text-[16px] sm:text-[18px] xl:text-[22px] font-bold m-0 mt-0.5 text-white leading-none truncate'>{card.status}</p>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>

        <div className='relative w-full min-w-0 h-[300px] sm:h-[400px] md:flex-1 md:min-h-[400px] md:h-[760px] rounded-[20px] overflow-hidden'>
          <MapTrafficLighting deptId={deptId} />
        </div>

        <div className='flex flex-col gap-3 md:gap-4 w-full md:w-[240px] lg:w-[280px] shrink-0'>
          {statCards.map((s) => (
            <div
              key={s.title}
              className='flex flex-col justify-between h-[140px] sm:h-[160px] md:h-[170px] rounded-[20px] p-3 sm:p-4'
              style={{ background: s.bg, border: s.border }}
            >
              <div className='flex flex-col gap-2'>
                <img src={s.icon} alt='' width={30} height={30} className='shrink-0' />
                <p style={{ color: s.titleColor, fontWeight: 700, fontSize: 16, margin: 0, lineHeight: 1.2 }}>{s.title}</p>
              </div>
              <div className='flex items-baseline gap-2'>
                <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 32, margin: 0, lineHeight: 1 }}>{s.value}</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: 0 }}>จุดติดตั้ง</p>
              </div>
              <p style={{ color: '#979797', fontWeight: 400, fontSize: 12, margin: 0 }}>Active : {s.active}</p>
            </div>
          ))}
        </div>
      </section>

      <div className='mt-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 shrink-0'>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full xl:w-full xl:max-w-[850px] xl:shrink-0 min-w-0'>
          {summaryStats.map((stat) => (
            <div
              key={stat.label}
              className='box-border flex flex-row items-center justify-between rounded-[10px] px-2 w-full min-w-0 h-[46px]'
              style={{
                ...(stat.variant === 'filled'
                  ? { background: stat.color }
                  : { background: 'transparent', border: `2px solid ${stat.color}` }),
              }}
            >
              <span
                className='text-[11px] sm:text-[12px] font-normal m-0 leading-none shrink-0'
                style={{ color: stat.variant === 'filled' ? '#212121' : stat.color }}
              >
                {stat.label}
              </span>
              <span
                className='flex items-center justify-center text-[13px] sm:text-[14px] font-normal m-0 leading-none shrink-0 rounded-[5px]'
                style={{
                  width: 46,
                  height: 28,
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
        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full xl:w-auto xl:shrink-0 min-w-0'>
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
              root: 'traffic-lighting-search !w-full sm:!flex-1 xl:!w-[360px] xl:!max-w-[360px] xl:!flex-none !shrink-0 !rounded-[10px]! !h-[46px]! !bg-[#2B2B2B]! !border-[#FCD116]! !overflow-hidden',
              input: 'traffic-lighting-search-input !bg-transparent!',
            }}
            styles={{
              root: { height: 46, background: '#2B2B2B', borderRadius: 10 },
              input: { background: 'transparent', fontSize: 14, fontWeight: 400, color: '#FFFFFF' },
            }}
            suffix={<TbSearch style={{ color: '#FCD116', fontSize: 18 }} />}
            allowClear
          />
          <div className='flex flex-row items-center justify-end sm:justify-start gap-2 w-full sm:w-auto shrink-0'>
            <img src='/images/Lighting/icbar1.png' alt='' width={30} height={30} className='shrink-0' />
            <img src='/images/Lighting/icbar2.png' alt='' width={30} height={30} className='shrink-0' />
            <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
              <Button
                type='primary'
                size='small'
                icon={<TbPrinter />}
                onClick={() => alert('TODO: นำออกเอกสาร')}
                className='w-full! sm:w-[130px]! h-[27px]! rounded-[88px]! px-2! text-xs! inline-flex! items-center! justify-center!'
              >
                นำออกเอกสาร
              </Button>
            </ConfigProvider>
          </div>
        </div>
      </div>

      <section className='mt-4 pb-16'>
        <TableTrafficLighting projects={filteredProjects} />
      </section>
    </>
  )
}

export default React.memo(OverallSection)
