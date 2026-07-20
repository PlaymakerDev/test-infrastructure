"use client"
import React from 'react'
import { Col, Empty, Row, Spin } from 'antd'
import { TbBulb, TbBolt } from 'react-icons/tb'
import LineChart from '@/components/chart/LineChart'
import type { LineChartDataPoint } from '@/components/chart/LineChart'
import { useLightingAmpGraph } from '@/hooks/queries/lighting'

const CHART_CARD = {
  iconCircle: false,
  showGlow: false,
  cardBackground: '#00000080',
  cardBorderColor: '#1f2d3d',
  accentColor: '#FCD116',
  height: 240,
} as const

interface Props { imei: string }

const UnavailableCard: React.FC = () => (
  <div className='h-[240px] rounded-[20px] border border-[#1f2d3d] bg-[#00000080] p-4 flex flex-col'>
    <div className='flex items-center gap-2 text-[#FCD116] font-bold'>
      <TbBulb size={18} />
      <span>ประวัติสถานะโคมไฟ 7 วันย้อนหลัง</span>
    </div>
    <div className='flex-1 flex items-center justify-center'>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ยังไม่มีข้อมูลรายโคมจาก API' />
    </div>
  </div>
)

const LampChartsSection: React.FC<Props> = ({ imei }) => {
  const ampQuery = useLightingAmpGraph(imei)
  const ampData: LineChartDataPoint[] = (ampQuery.data ?? [])
    .filter((point) => point.amp !== null)
    .map((point) => ({
      label: point.Period_Name,
      amp: point.amp as number,
    }))

  return (
    <section className='mt-4 w-full'>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <UnavailableCard />
        </Col>
        <Col xs={24} lg={12}>
          {ampQuery.isLoading ? (
            <div className='h-[240px] flex items-center justify-center'><Spin /></div>
          ) : ampQuery.isError ? (
            <div className='h-[240px] flex items-center justify-center'>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่สามารถโหลดข้อมูลกระแสไฟฟ้าได้' />
            </div>
          ) : ampData.length > 0 ? (
            <LineChart
              {...CHART_CARD}
              title='กระแสไฟฟ้าเฉลี่ย 24 ชั่วโมงล่าสุด (Amp)'
              icon={<TbBolt size={18} style={{ color: '#FCD116' }} />}
              data={ampData}
              lines={[{ dataKey: 'amp', color: '#FF5C8A', label: 'Avg Current' }]}
              tooltipUnit='A'
              showGlow={false}
            />
          ) : (
            <div className='h-[240px] flex items-center justify-center'>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่พบข้อมูลกระแสไฟฟ้า' />
            </div>
          )}
        </Col>
      </Row>
    </section>
  )
}

export default React.memo(LampChartsSection)
