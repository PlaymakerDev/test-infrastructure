"use client"
import React, { useMemo } from 'react'
import { TbBulb, TbBolt, TbMapPin } from 'react-icons/tb'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import StatusInfoCard from '@/features/admin/traffic-lighting/detail/components/StatusInfoCard'
import DonutChart from '../components/DonutChart'
import LampChartsSection from '../components/LampChartsSection'
import LampEquipmentTable from '../components/LampEquipmentTable'
import { LAMP_EQUIPMENT_ROWS } from '../data/lampEquipment'
import { LampProvider } from '../context'
import LampTitleSection from '../components/TitleSection'
import { buildTrafficLightingProject } from '@/features/admin/traffic-lighting/shared/buildTrafficLightingProject'
import { useLightingDetailBootstrap } from '@/features/admin/traffic-lighting/shared/useLightingDetailBootstrap'

interface Props {
  id: string
}

/** Lamp detail screen — map + stat cards, then charts + equipment table below. */
const LampDetailScreen: React.FC<Props> = ({ id }) => {
  const { row, ready } = useLightingDetailBootstrap(id, { includeType: false })

  if (!ready) return null

  const project = buildTrafficLightingProject(id, row, 'lamp')
  const totalLamps = LAMP_EQUIPMENT_ROWS.length
  const avgAmp = useMemo(() => {
    const amps = LAMP_EQUIPMENT_ROWS.map((r) => r.amp).filter((a): a is number => a !== null)
    return amps.length ? amps.reduce((s, a) => s + a, 0) / amps.length : 0
  }, [])
  const onToday = LAMP_EQUIPMENT_ROWS.filter((r) => r.lampStatus === 'up').length
  const downToday = LAMP_EQUIPMENT_ROWS.filter((r) => r.lampStatus === 'down').length

  return (
    <LampProvider project={project}>
      <div className='main-screen px-3 sm:px-6 xl:px-10 pt-3 pb-6'>
        <LampTitleSection />

        {/* Top row: map (left) + 3 stat cards (right) */}
        <section className='mt-6 flex flex-col lg:flex-row lg:items-stretch w-full gap-3'>
          <div className='relative w-full lg:flex-1 min-w-0 min-h-[480px] lg:min-h-[600px] rounded-2xl overflow-hidden bg-[#212121]'>
            <BaseMap
              style={{ height: '100%', width: '100%', minHeight: 480 }}
              initialCenter={project.coord}
              initialZoom={15}
              initialPitch={45}
              edgeFade={{ all: 20 }}
            >
              <HTMLMarker lngLat={project.coord} anchor='bottom' title={project.installPoint}>
                <div
                  className='flex items-center justify-center'
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#FCD116',
                    boxShadow: '0 4px 12px rgba(252,209,22,0.6)',
                    border: '2px solid #fff',
                  }}
                >
                  <TbMapPin size={20} color='#212121' />
                </div>
              </HTMLMarker>
            </BaseMap>
          </div>

          <div className='flex flex-col gap-3 ml-auto shrink-0 items-end'>
            <div style={{ width: 300, height: 120 }} className='shrink-0'>
              <StatusInfoCard
                borderColor='#05F2DB'
                titleColor='#05F2DB'
                title='โคมไฟทั้งหมด'
                iconNode={<TbBulb size={28} style={{ color: '#05F2DB' }} className='shrink-0' />}
                status={String(totalLamps)}
                valueUnit='จุด'
                active={`${onToday} (${totalLamps ? ((onToday / totalLamps) * 100).toFixed(1) : 0}%)`}
                valueFontSize={24}
              />
            </div>
            <div style={{ width: 300, height: 120 }} className='shrink-0'>
              <StatusInfoCard
                borderColor='#FFFFFF'
                titleColor='#FFFFFF'
                title='กระแสไฟฟ้าเฉลี่ย'
                iconNode={<TbBolt size={28} style={{ color: '#FFFFFF' }} className='shrink-0' />}
                status={`${avgAmp.toFixed(2)}`}
                valueUnit='A'
                valueUnitLarge
                subtitle='Peak Hour Current : 03.00 - 04.00'
                valueFontSize={24}
              />
            </div>
            <div
              style={{ width: 440, height: 330, background: '#191919CC' }}
              className='shrink-0 rounded-2xl px-5 pt-4 pb-5 flex flex-col'
            >
              <div className='flex items-center gap-2 shrink-0 mb-1'>
                <TbBulb size={20} style={{ color: '#05F2DB' }} />
                <p className='text-[16px] font-bold m-0 leading-none' style={{ color: '#05F2DB' }}>
                  สถานะโคมไฟวันนี้
                </p>
              </div>
              <div className='flex-1 flex items-center justify-center min-h-0 w-full'>
                <DonutChart
                  segments={[
                    { label: 'ทำงาน', value: onToday, color: '#66AEFF' },
                    { label: 'ไม่ทำงาน', value: downToday, color: '#E94C4C' },
                  ]}
                  centerValue={String(totalLamps)}
                  centerLabel='โคม'
                  size={165}
                />
              </div>
            </div>
          </div>
        </section>

        <LampChartsSection />
        <LampEquipmentTable />
      </div>
    </LampProvider>
  )
}

export default React.memo(LampDetailScreen)
