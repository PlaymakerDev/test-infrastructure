"use client"
import React from 'react'
import { Alert, Button, Empty, Spin } from 'antd'
import { TbBulb, TbBolt } from 'react-icons/tb'
import MapLightingDetail from '@/features/admin/traffic-lighting/shared/MapLightingDetail'
import StatusInfoCard from '@/features/admin/traffic-lighting/detail/components/StatusInfoCard'
import LampChartsSection from '../components/LampChartsSection'
import LampEquipmentTable from '../components/LampEquipmentTable'
import { LampProvider } from '../context'
import LampTitleSection from '../components/TitleSection'
import { resolveLightingImei } from '@/features/admin/traffic-lighting/shared/lightingDetailNavigation'
import { useLightingProject } from '@/features/admin/traffic-lighting/shared/useLightingProject'
import { useLightingAmpGraph, useLightingDeviceDetails } from '@/hooks/queries/lighting'
import TrafficLightingMinimumFontSize from '../../../shared/TrafficLightingMinimumFontSize'

interface Props {
  id: string
  imeiParam?: string
}

/** Lamp detail screen — map + stat cards, then charts + equipment table below. */
const LampDetailScreen: React.FC<Props> = ({ id, imeiParam }) => {
  const requestedImei = resolveLightingImei(id, imeiParam)
  const projectQuery = useLightingProject(id, requestedImei, 'lamp')
  const { project } = projectQuery
  const imei = requestedImei || project.imei || ''
  const deviceQuery = useLightingDeviceDetails(imei)
  const resolvedPhase = deviceQuery.data
    ? (deviceQuery.data.phase === 1 || deviceQuery.data.phase === 3 ? deviceQuery.data.phase : project.phase)
    : project.phase
  // Gate on the device query having settled first, same rationale as
  // OverviewSection's `phaseReady` — otherwise this fires once with no
  // `phase_type` before re-firing once phase resolves.
  const phaseReady = !deviceQuery.isLoading
  const ampQuery = useLightingAmpGraph(imei, resolvedPhase, phaseReady)
  const totalLamps = project.equipment.count
  const amps = (ampQuery.data ?? []).map((point) => point.amp).filter((amp): amp is number => amp !== null)
  const avgAmp = amps.length ? amps.reduce((sum, amp) => sum + amp, 0) / amps.length : 0
  const resolvedProject = deviceQuery.data
    ? {
        ...project,
        imei: imei || project.imei,
        connection: deviceQuery.data.is_online ? 'online' as const : 'offline' as const,
        phase: resolvedPhase,
        circuitStatus: deviceQuery.data.has_broken_wire ? 'abnormal' as const : 'normal' as const,
      }
    : project

  if (projectQuery.isLoading) {
    return (
      <div className='main-screen min-h-64 flex items-center justify-center'>
        <Spin />
      </div>
    )
  }

  return (
    <LampProvider project={resolvedProject}>
      <div className='main-screen px-3 sm:px-6 xl:px-10 pt-3 pb-6 traffic-lighting-font-min-14'>
        <TrafficLightingMinimumFontSize />
        {projectQuery.isError && (
          <Alert
            className='mb-4'
            type='error'
            showIcon
            message='ไม่สามารถโหลดข้อมูลโครงการได้'
            action={<Button size='small' onClick={projectQuery.refetch}>ลองใหม่</Button>}
          />
        )}
        <LampTitleSection />

        {/* Top row: map (left) + 3 stat cards (right) */}
        <section className='mt-6 flex flex-col lg:flex-row lg:items-stretch w-full gap-3'>
          <div className='relative w-full lg:flex-1 min-w-0 min-h-[480px] lg:min-h-[600px] rounded-[20px] overflow-hidden bg-[#212121]'>
            <MapLightingDetail
              coord={resolvedProject.coord}
              imei={imei}
              isOnline={deviceQuery.data
                ? deviceQuery.data.is_online
                : resolvedProject.connection === 'online'
                  ? true
                  : resolvedProject.connection === 'offline'
                    ? false
                    : undefined}
              roadCode={resolvedProject.roadCode}
              installPoint={resolvedProject.installPoint}
              projectName={resolvedProject.projectName}
            />
          </div>

          <div className='flex flex-col gap-3 ml-auto shrink-0 items-end'>
            <div style={{ width: 300, height: 120 }} className='shrink-0'>
              <StatusInfoCard
                borderColor='#05F2DB'
                titleColor='#05F2DB'
                title='โคมไฟทั้งหมด'
                iconNode={<TbBulb size={28} style={{ color: '#05F2DB' }} className='shrink-0' />}
                status={totalLamps == null ? '-' : String(totalLamps)}
                valueUnit={totalLamps == null ? undefined : 'จุด'}
                subtitle='ข้อมูลจากรายการอุปกรณ์ส่วนกลาง'
                valueFontSize={24}
              />
            </div>
            <div style={{ width: 300, height: 120 }} className='shrink-0'>
              <StatusInfoCard
                borderColor='#FFFFFF'
                titleColor='#FFFFFF'
                title='กระแสไฟฟ้าเฉลี่ย'
                iconNode={<TbBolt size={28} style={{ color: '#FFFFFF' }} className='shrink-0' />}
                status={ampQuery.isLoading || ampQuery.isError || amps.length === 0 ? '-' : avgAmp.toFixed(2)}
                valueUnit={amps.length > 0 ? 'A' : undefined}
                valueUnitLarge
                subtitle='ค่าเฉลี่ยจากข้อมูล 24 ชั่วโมงล่าสุด'
                valueFontSize={24}
              />
            </div>
            <div
              style={{ width: 440, height: 330, background: '#191919CC' }}
              className='shrink-0 rounded-[20px] px-5 pt-4 pb-5 flex flex-col'
            >
              <div className='flex items-center gap-2 shrink-0 mb-1'>
                <TbBulb size={20} style={{ color: '#05F2DB' }} />
                <p className='text-[16px] font-bold m-0 leading-none' style={{ color: '#05F2DB' }}>
                  สถานะโคมไฟวันนี้
                </p>
              </div>
              <div className='flex-1 flex items-center justify-center min-h-0 w-full'>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description='ยังไม่มีข้อมูลสถานะรายโคมจาก API'
                />
              </div>
            </div>
          </div>
        </section>

        <LampChartsSection imei={imei} phase={resolvedPhase} phaseReady={phaseReady} />
        <LampEquipmentTable />
      </div>
    </LampProvider>
  )
}

export default React.memo(LampDetailScreen)
