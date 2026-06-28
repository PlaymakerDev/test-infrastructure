import Barchart from '@/components/chart/Barchart'
import LineChart from '@/components/chart/LineChart'
import { getTrackingWeightInspectionAPI } from '@/services/routes/TrackingService'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import React from 'react'
import { TbArrowsExchange, TbClockBolt, TbFlag, TbMapPin, TbUserCheck } from 'react-icons/tb'
import { ChartMobile, ChartPredictAccident, ChartPredictWeighing, ChartStation, ChartWIM } from '../../../components'

interface Props { }

// ── Shared bar config ─────────────────────────────────────────────────────────
export const BARS_WIM = [
  { color: '#66AEFF', dataKey: 'total', label: 'รถเข้าชั่งทั้งหมด' },
  { color: '#E94C4C', dataKey: 'overweight', label: 'รถเข้าชั่งน้ำหนักเกิน' },
]

const ChartSection: React.FC<Props> = () => {

  return (
    <Row gutter={[16, 16]}>
      {/* ── Bar charts ──────────────────────────────────────────────────────── */}
      <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8} xxxl={8}>
        <ChartStation />
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8} xxxl={8}>
        <ChartWIM />
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={8} xxxl={8}>
        <ChartMobile />
      </Col>

      {/* ── Line charts ─────────────────────────────────────────────────────── */}
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={12}>
        <ChartPredictWeighing />
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={12}>
        <ChartPredictAccident />
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ChartSection)
