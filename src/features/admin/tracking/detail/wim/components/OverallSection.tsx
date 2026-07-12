import React from 'react'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import {
  // LEFT COLUMN
  OverallWeightStat,
  OverallStatCard,
  OverallCalibrateWeight,
  OverallAvgSpeed,
  // RIGHT COLUMN
  OverallMap,
  OverallCCTV,
  TableOverallWeight,
  // LOWER SECTION
  OverallDataDisplaySection,
  ChartPreviousWeightVehicle,
  ChartTraffic,
} from '../components'
import { usePCU, useCalibrationHistory, usePositionById, useDailyWeightLog } from '../hooks'
import { useWIMContext } from '../context'
import QueryBoundary from '@/components/common/QueryBoundary'
import { useQuery } from '@tanstack/react-query'
import { getTrackingCalibrationHistoryAPI } from '@/services/routes/TrackingDetailService'

interface Props {

}

const OverallSection: React.FC<Props> = () => {
  const { id, stationType, stationTypeId } = useWIMContext()
  const isStation = stationType === 'STATION'

  // OverallAvgSpeed/ChartTraffic read a WIM-only endpoint (`/masters/wim/traffic_avg_speed`) —
  // hide both columns for STATION and let the weight-comparison chart take the full row.
  const previousWeightColSpan = isStation
    ? { xs: 24, sm: 24, md: 24, lg: 24, xl: 24, xxl: 24, xxxl: 24 }
    : { xs: 24, sm: 24, md: 24, lg: 12, xl: 12, xxl: 12, xxxl: 7 }

  const {
    data: pcu,
    isLoading: isPcuLoading,
    isError: isPcuError
  } = usePCU({
    station_id: id as string,
    date: dayjs().format('YYYY-MM-DD'),
  })

  const {
    data: calibrationHistory,
    isLoading: isCalibrationHistoryLoading,
    isError: isCalibrationHistoryError
  } = useCalibrationHistory(stationTypeId, id as string | number | undefined)

  const {
    data: positionByID,
    isLoading: isPositionByIDLoading,
    isError: isPositionByIDError
  } = usePositionById(id as string | number | undefined, stationTypeId)

  const {
    data: dailyLog,
    isLoading: isDailyLogLoading,
    isError: isDailyLogError
  } = useDailyWeightLog(id as string | number | undefined, stationType)

  return (
    <>
      <section>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={10}>
            <section>
              <QueryBoundary isLoading={isDailyLogLoading} isError={isDailyLogError}>
                <OverallWeightStat dailyLog={dailyLog} />
              </QueryBoundary>
            </section>
            <section className='mt-5'>
              <QueryBoundary isLoading={isPcuLoading} isError={isPcuError}>
                <OverallStatCard
                  pcu={pcu?.data.data}
                  dailyLog={dailyLog}
                  isDailyLogLoading={isDailyLogLoading}
                  isDailyLogError={isDailyLogError}
                />
              </QueryBoundary>
            </section>
            <section className='mt-5'>
              <QueryBoundary isLoading={isCalibrationHistoryLoading} isError={isCalibrationHistoryError}>
                <OverallCalibrateWeight calibrationHistory={calibrationHistory?.data} />
              </QueryBoundary>
            </section>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={14}>
            <section>
              <QueryBoundary isLoading={isPositionByIDLoading} isError={isPositionByIDError}>
                <OverallMap positionByID={positionByID?.data} />
              </QueryBoundary>
            </section>
            <section className='mt-5'>
              <OverallCCTV />
            </section>
            <section className='mt-5'>
              <TableOverallWeight />
            </section>
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <Row gutter={[16, 16]} style={{ alignItems: 'stretch' }}>
          {!isStation && (
            <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={10} className='flex flex-col'>
              <OverallAvgSpeed />
            </Col>
          )}
          <Col {...previousWeightColSpan} className='flex flex-col'>
            <ChartPreviousWeightVehicle />
          </Col>
          {!isStation && (
            <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={7} className='flex flex-col'>
              <ChartTraffic />
            </Col>
          )}
        </Row>
      </section>
      <section className='mt-5'>
        <OverallDataDisplaySection />
      </section>
    </>
  )
}

export default React.memo<Props>(OverallSection)
