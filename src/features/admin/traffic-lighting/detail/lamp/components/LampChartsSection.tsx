"use client"
import React, { useMemo, useState } from 'react'
import { Col, Empty, Row, Spin } from 'antd'
import { TbBulb, TbBolt } from 'react-icons/tb'
import LineChart from '@/components/chart/LineChart'
import type { LineChartDataPoint } from '@/components/chart/LineChart'
import BarChart from '@/components/chart/Barchart'
import { useLightingAmpGraph, useLightingLampsCurrentHourly, useLightingLampsWeekly } from '@/hooks/queries/lighting'
import { thaiDateBE } from '@/utils/thaiDate'
import type { DetailsLineChecks } from '@/types/lighting'
import {
  LAMP_FAULT_COLOR,
  LAMP_WORKING_COLOR,
  MOCK_LAMP_DATA,
  buildMockLampHistory,
} from '../data/mockLampData'
import { lampCountTicks, lampCurrentPoints, lampHistoryFromWeekly, parseIsoDay } from '../data/lampRows'

/** The plot's height — the Figma cards are ~430px tall at 1920 (user
 *  2026-11-05); the card adds 74px of padding and title around it. */
const CHART_HEIGHT = 360

const CHART_CARD = {
  iconCircle: false,
  showGlow: false,
  cardBackground: '#00000080',
  cardBorderColor: '#1f2d3d',
  accentColor: '#FCD116',
  height: CHART_HEIGHT,
} as const

interface Props {
  imei: string
  /** The 7-day history comes by solution (`/lamps/weekly`). */
  solutionId?: number | null
  phase?: number | null
  phaseReady?: boolean
  /** Lamp count from the central equipment list — sizes the history series. */
  lampCount?: number | null
  /** Real per-line on/off, so the last history bar agrees with today. */
  lineChecks?: DetailsLineChecks
}

/** A chart card with no chart in it yet — the chart card's own frame, title
 *  and height (Barchart / LineChart), so the page keeps its shape and nothing
 *  moves once the data comes. */
const ChartPlaceholder: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title, icon, children,
}) => (
  <div
    className='relative rounded-2xl pt-5 px-5 pb-4 w-full overflow-hidden'
    style={{ background: CHART_CARD.cardBackground, border: `1px solid ${CHART_CARD.cardBorderColor}` }}
  >
    <div className='flex items-center gap-3 mb-4' style={{ color: CHART_CARD.accentColor }}>
      <div className='shrink-0'>{icon}</div>
      <h2 className='leading-tight' style={{ fontSize: 16, fontWeight: 400 }}>{title}</h2>
    </div>
    <div className='flex items-center justify-center' style={{ height: CHART_HEIGHT }}>{children}</div>
  </div>
)

const HISTORY_TITLE = 'แผนภูมิแสดงประวัติสถานะโคมไฟ 7 วันย้อนหลัง'
const AMP_TITLE = 'กระแสไฟฟ้าเฉลี่ย 24 ชั่วโมงล่าสุด (Amp)'

const HistoryPlaceholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChartPlaceholder title={HISTORY_TITLE} icon={<TbBulb size={18} />}>{children}</ChartPlaceholder>
)

const LampChartsSection: React.FC<Props> = ({ imei, solutionId, phase, phaseReady = true, lampCount, lineChecks }) => {
  const ampQuery = useLightingAmpGraph(imei, phase, phaseReady)
  const weeklyQuery = useLightingLampsWeekly(solutionId)
  // Same 24h-of-today window as VoltageAmpChartsRow — tooltip header shows the
  // date + hovered hour. Lazy initializer keeps the clock read out of render.
  const [todayLabel] = useState(() => thaiDateBE(Date.now()))
  const [now] = useState(() => Date.now())

  const weeklyDays = weeklyQuery.data?.days
  const historyData = useMemo(() => {
    const real = lampHistoryFromWeekly(weeklyDays)
    if (real.length > 0 || !MOCK_LAMP_DATA || !imei || !lampCount) return real
    const working = lineChecks
      ? Array.from({ length: lampCount }, (_, i) =>
        lineChecks[`line_check${i + 1}` as keyof DetailsLineChecks] === 1).filter(Boolean).length
      : lampCount
    return buildMockLampHistory(imei, lampCount, working, now)
  }, [weeklyDays, imei, lampCount, lineChecks, now])

  // Whole-lamp counts up to the largest day's total (or the lamp count) —
  // about five steps, never a fractional "1.5 โคม".
  const historyTicks = useMemo(() => {
    const dayTotals = (weeklyDays ?? []).map((day) => Math.max(day.total, day.work + day.fail))
    return lampCountTicks(Math.max(lampCount ?? 0, ...dayTotals))
  }, [weeklyDays, lampCount])

  // A lamp point's current comes by solution — its lamps' hourly average for
  // today (BE 2026-11-05); a cabinet's from its own amp graph.
  const lampCurrentQuery = useLightingLampsCurrentHourly(imei ? null : solutionId)
  const ampQueryNow = imei ? ampQuery : lampCurrentQuery
  const ampData: LineChartDataPoint[] = imei
    ? (ampQuery.data ?? [])
      .filter((point) => point.amp !== null)
      .map((point) => ({
        label: point.Period_Name,
        amp: point.amp as number,
      }))
    // Every hour of the day stays on the axis; one no lamp reported in is a
    // gap, not a 0 A reading.
    : lampCurrentPoints(lampCurrentQuery.data?.hours).map((point) => ({ label: point.hour, amp: point.amp }))
  const hasAmp = ampData.some((point) => typeof point.amp === 'number')
  const lampDay = parseIsoDay(lampCurrentQuery.data?.date)
  const ampTooltipDate = !imei && lampDay ? thaiDateBE(lampDay) : todayLabel

  return (
    <section className='mt-4 w-full'>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          {historyData.length > 0 ? (
            <BarChart
              {...CHART_CARD}
              title={HISTORY_TITLE}
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
          ) : weeklyQuery.isLoading ? (
            <HistoryPlaceholder><Spin /></HistoryPlaceholder>
          ) : weeklyQuery.isError ? (
            <HistoryPlaceholder>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่สามารถโหลดประวัติสถานะโคมไฟได้' />
            </HistoryPlaceholder>
          ) : (
            <HistoryPlaceholder>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่มีข้อมูลประวัติสถานะโคมไฟ 7 วันย้อนหลัง' />
            </HistoryPlaceholder>
          )}
        </Col>
        <Col xs={24} lg={12}>
          {ampQueryNow.isLoading ? (
            <ChartPlaceholder title={AMP_TITLE} icon={<TbBolt size={18} />}><Spin /></ChartPlaceholder>
          ) : ampQueryNow.isError ? (
            <ChartPlaceholder title={AMP_TITLE} icon={<TbBolt size={18} />}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่สามารถโหลดข้อมูลกระแสไฟฟ้าได้' />
            </ChartPlaceholder>
          ) : hasAmp ? (
            <LineChart
              {...CHART_CARD}
              title={AMP_TITLE}
              icon={<TbBolt size={18} style={{ color: '#FCD116' }} />}
              data={ampData}
              lines={[{ dataKey: 'amp', color: '#FF5C8A', label: 'Avg Current' }]}
              tooltipDate={ampTooltipDate}
              tooltipUnit='A'
              preserveNullValues={!imei}
              // Idle cabinets read ~0.0002 A. Without this the tooltip falls back
              // to toLocaleString()'s 3-digit default and every hour reads "0 A".
              // 4dp matches ElectricalSystemCard and the OVERVIEW tab's Amp
              // chart; a lamp's ~0.3–1 A reads at 2dp, as the card above.
              tooltipValueDecimals={imei ? 4 : 2}
              showGlow={false}
            />
          ) : (
            <ChartPlaceholder title={AMP_TITLE} icon={<TbBolt size={18} />}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={imei ? 'ไม่พบข้อมูลกระแสไฟฟ้า' : 'ยังไม่มีข้อมูลกระแสไฟฟ้าของวันนี้'}
              />
            </ChartPlaceholder>
          )}
        </Col>
      </Row>
    </section>
  )
}

export default React.memo(LampChartsSection)
