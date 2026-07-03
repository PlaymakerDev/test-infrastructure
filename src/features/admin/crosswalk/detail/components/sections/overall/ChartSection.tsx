"use client"
import React, { useMemo } from 'react'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import { TbWalk, TbX } from 'react-icons/tb'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import { useCrosswalkGraph } from '@/hooks/queries/crosswalk'
import { useDetailContext } from '../../../context'

interface Props {}

const ChartSection: React.FC<Props> = () => {
  const { id } = useDetailContext()
  const startDate = dayjs().format('YYYY-MM-DD')
  const { data } = useCrosswalkGraph({ solution_id: id, start_date: startDate })

  const dateLabel = dayjs(startDate).format('D MMM BBBB')

  // ── Chart 1 — crossing_stats (pedestrians + button presses) ─────────────
  const crossingData = useMemo<LineChartDataPoint[]>(
    () =>
      (data?.crossing_stats ?? []).map((b) => ({
        label: dayjs(b.hour_timestamp).format('HH.mm'),
        pedestrian: b.total_pedestrians,
        button: b.button_pressed,
      })),
    [data],
  )
  const crossingStats = useMemo(() => {
    const buckets = data?.crossing_stats ?? []
    let ped = 0
    let btn = 0
    for (const b of buckets) {
      ped += b.total_pedestrians
      btn += b.button_pressed
    }
    return { ped, btn }
  }, [data])

  // ── Chart 2 — violation_stats (person + vehicle red-light violations) ───
  const violationData = useMemo<LineChartDataPoint[]>(
    () =>
      (data?.violation_stats ?? []).map((b) => ({
        label: dayjs(b.hour_timestamp).format('HH.mm'),
        person: b.unbuttoned_crossing,
        vehicle: b.red_light_violation,
      })),
    [data],
  )
  const violationStats = useMemo(() => {
    const buckets = data?.violation_stats ?? []
    let person = 0
    let vehicle = 0
    for (const b of buckets) {
      person += b.unbuttoned_crossing
      vehicle += b.red_light_violation
    }
    return { person, vehicle }
  }, [data])

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
        <LineChart
          title='สถิติคนข้ามและการกดปุ่มประจำวัน'
          subtitle='เปรียบเทียบจำนวนคนข้ามและการกดปุ่มรายชั่วโมง'
          icon={<TbWalk size={20} />}
          accentColor='#ffffff'
          data={crossingData}
          lines={[
            { dataKey: 'pedestrian', color: '#00E5CC', label: 'คนข้าม' },
            { dataKey: 'button', color: '#B5FF3B', label: 'การกดปุ่ม' },
          ]}
          stats={[
            { value: crossingStats.ped, label: 'จำนวนคนข้าม (คน)', color: '#00E5CC' },
            { value: crossingStats.btn, label: 'จำนวนการกดปุ่ม (ครั้ง)', color: '#B5FF3B' },
          ]}
          tooltipDate={dateLabel}
          tooltipShowDot
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
        <LineChart
          title='สถิติการฝ่าฝืนสัญญาณไฟทางข้ามประจำวัน'
          subtitle='เปรียบเทียบจำนวนคน/รถฝ่าฝืนสัญญาณไฟรายชั่วโมง'
          icon={<TbX size={20} />}
          accentColor='#ffffff'
          data={violationData}
          lines={[
            { dataKey: 'person', color: '#FF6B9D', label: 'คนฝ่าฝืนสัญญาณไฟ' },
            { dataKey: 'vehicle', color: '#FF7B00', label: 'รถฝ่าฝืนสัญญาณไฟ' },
          ]}
          stats={[
            { value: violationStats.person, label: 'จำนวนคนฝ่าฝืนสัญญาณไฟทางข้าม', color: '#FF6B9D' },
            { value: violationStats.vehicle, label: 'จำนวนรถฝ่าฝืนสัญญาณไฟทางข้าม', color: '#FF7B00' },
          ]}
          tooltipDate={dateLabel}
          tooltipShowDot
        />
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ChartSection)
