"use client"
import React, { useMemo, useState } from 'react'
import { Col, Empty, Row, Spin } from 'antd'
import { TbBulb, TbBolt } from 'react-icons/tb'
import LineChart from '@/components/chart/LineChart'
import type { LineChartDataPoint } from '@/components/chart/LineChart'
import BarChart from '@/components/chart/Barchart'
import { useLightingAmpGraph } from '@/hooks/queries/lighting'
import { thaiDateBE } from '@/utils/thaiDate'
import type { DetailsLineChecks } from '@/types/lighting'
import {
  LAMP_FAULT_COLOR,
  LAMP_WORKING_COLOR,
  MOCK_LAMP_DATA,
  buildMockLampHistory,
} from '../data/mockLampData'

const CHART_CARD = {
  iconCircle: false,
  showGlow: false,
  cardBackground: '#00000080',
  cardBorderColor: '#1f2d3d',
  accentColor: '#FCD116',
  height: 240,
} as const

interface Props {
  imei: string
  phase?: number | null
  phaseReady?: boolean
  /** Lamp count from the central equipment list — sizes the history series. */
  lampCount?: number | null
  /** Real per-line on/off, so the last history bar agrees with today. */
  lineChecks?: DetailsLineChecks
}

/** A chart card with no chart in it yet — its own title over the state, so
 *  an empty / loading chart keeps the card its neighbour has. */
const ChartPlaceholder: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title, icon, children,
}) => (
  <div className='h-[240px] rounded-[20px] border border-[#1f2d3d] bg-[#00000080] p-4 flex flex-col'>
    <div className='flex items-center gap-2 text-[#FCD116] font-bold'>
      {icon}
      <span>{title}</span>
    </div>
    <div className='flex-1 flex items-center justify-center'>{children}</div>
  </div>
)

const AMP_TITLE = 'กระแสไฟฟ้าเฉลี่ย 24 ชั่วโมงล่าสุด (Amp)'

const UnavailableCard: React.FC = () => (
  <ChartPlaceholder title='ประวัติสถานะโคมไฟ 7 วันย้อนหลัง' icon={<TbBulb size={18} />}>
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ยังไม่มีข้อมูลรายโคมจาก API' />
  </ChartPlaceholder>
)

const LampChartsSection: React.FC<Props> = ({ imei, phase, phaseReady = true, lampCount, lineChecks }) => {
  const ampQuery = useLightingAmpGraph(imei, phase, phaseReady)
  // Same 24h-of-today window as VoltageAmpChartsRow — tooltip header shows the
  // date + hovered hour. Lazy initializer keeps the clock read out of render.
  const [todayLabel] = useState(() => thaiDateBE(Date.now()))
  const [now] = useState(() => Date.now())

  const historyData = useMemo(() => {
    if (!MOCK_LAMP_DATA || !imei || !lampCount) return []
    const working = lineChecks
      ? Array.from({ length: lampCount }, (_, i) =>
        lineChecks[`line_check${i + 1}` as keyof DetailsLineChecks] === 1).filter(Boolean).length
      : lampCount
    return buildMockLampHistory(imei, lampCount, working, now)
  }, [imei, lampCount, lineChecks, now])

  // Whole-lamp counts only — a fractional "1.5 โคม" tick would be nonsense.
  const historyTicks = useMemo(
    () => Array.from({ length: (lampCount ?? 0) + 1 }, (_, i) => i),
    [lampCount],
  )

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
          {historyData.length > 0 ? (
            <BarChart
              {...CHART_CARD}
              title='แผนภูมิแสดงประวัติสถานะโคมไฟ 7 วันย้อนหลัง'
              icon={<TbBulb size={18} style={{ color: '#FCD116' }} />}
              data={historyData}
              bars={[
                { dataKey: 'working', color: LAMP_WORKING_COLOR, label: 'ทำงาน' },
                { dataKey: 'notWorking', color: LAMP_FAULT_COLOR, label: 'ไม่ทำงาน' },
              ]}
              yAxisTicks={historyTicks}
              xAxisLabelFontSize={12}
              xAxisLabelLineHeight={15}
              xAxisLabelColor='rgba(255, 255, 255, 0.5)'
              xAxisLabelFontFamily='var(--font-ibm-plex-sans-thai), Arial, Helvetica, sans-serif'
              xAxisLabelWidth={76}
              tooltipUnit='โคม'
            />
          ) : (
            <UnavailableCard />
          )}
        </Col>
        <Col xs={24} lg={12}>
          {ampQuery.isLoading ? (
            <ChartPlaceholder title={AMP_TITLE} icon={<TbBolt size={18} />}><Spin /></ChartPlaceholder>
          ) : ampQuery.isError ? (
            <ChartPlaceholder title={AMP_TITLE} icon={<TbBolt size={18} />}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่สามารถโหลดข้อมูลกระแสไฟฟ้าได้' />
            </ChartPlaceholder>
          ) : ampData.length > 0 ? (
            <LineChart
              {...CHART_CARD}
              title={AMP_TITLE}
              icon={<TbBolt size={18} style={{ color: '#FCD116' }} />}
              data={ampData}
              lines={[{ dataKey: 'amp', color: '#FF5C8A', label: 'Avg Current' }]}
              tooltipDate={todayLabel}
              tooltipUnit='A'
              // Idle cabinets read ~0.0002 A. Without this the tooltip falls back
              // to toLocaleString()'s 3-digit default and every hour reads "0 A".
              // 4dp matches ElectricalSystemCard and the OVERVIEW tab's Amp chart.
              tooltipValueDecimals={4}
              showGlow={false}
            />
          ) : (
            <ChartPlaceholder title={AMP_TITLE} icon={<TbBolt size={18} />}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่พบข้อมูลกระแสไฟฟ้า' />
            </ChartPlaceholder>
          )}
        </Col>
      </Row>
    </section>
  )
}

export default React.memo(LampChartsSection)
