import React, { useMemo } from 'react'
import { Col, Empty, Row, Skeleton } from 'antd'
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
import { getTrackingCalibrationHistoryStatusAPI, getTrackingPCUAPI, getTrackingPositionByIDAPI, getTrackingWIMTodayStatAPI } from '@/services/routes/TrackingDetailService';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

interface Props {
  id: string[] | string | number | undefined;
  stationType: string | null | undefined;
}

const OverallSection: React.FC<Props> = (props) => {
  const { id, stationType } = props

  const getStationType = useMemo(() => {
    if (!stationType) return

    switch (stationType) {
      case 'STATION':
        return 1
      case 'WIM':
        return 3
      default:
        return null
    }
  }, [stationType])

  const {
    data: wimToday,
    isLoading: isWimTodayLoading,
    isError: isWimTodayError } = useQuery({
      queryKey: ['tracking_wim_today_stats', id],
      queryFn: () => getTrackingWIMTodayStatAPI({
        station_id: id as string
      }),
      enabled: !!id,
    })

  const {
    data: pcu,
    isLoading: isPcuLoading,
    isError: isPcuError
  } = useQuery({
    queryKey: ['tracking_pcu', id],
    queryFn: () => getTrackingPCUAPI({
      station_id: id as string,
      date: dayjs().format('YYYY-MM-DD')
    }),
    enabled: !!id,
  })

  const {
    data: calibrationHistory,
    isLoading: isCalibrationHistoryLoading,
    isError: isCalibrationHistoryError
  } = useQuery({
    queryKey: ['tracking_calibration_history', id],
    queryFn: () => getTrackingCalibrationHistoryStatusAPI(getStationType as number, id as string),
    enabled: !!id && !!getStationType,
  })

  const {
    data: positionByID,
    isLoading: isPositionByIDLoading,
    isError: isPositionByIDError
  } = useQuery({
    queryKey: ['tracking_position_by_id', id],
    queryFn: () => getTrackingPositionByIDAPI({
      station_id: id as string,
      StationType: String(getStationType)
    }),
    enabled: !!id && !!getStationType,
  })

  const renderWimTodayStat = useMemo(() => {
    if (isWimTodayLoading) return <Skeleton active paragraph={{ rows: 4 }} />
    if (isWimTodayError) return <Empty description="ไม่พบข้อมูล" />
    return <OverallWeightStat wimToday={wimToday?.data.data} />
  }, [isWimTodayLoading, isWimTodayError, wimToday])

  const renderPCU = useMemo(() => {
    if (isPcuLoading) return <Skeleton active paragraph={{ rows: 4 }} />
    if (isPcuError) return <Empty description="ไม่พบข้อมูล" />
    return <OverallStatCard pcu={pcu?.data.data} wimToday={wimToday?.data.data} isWimTodayLoading={isWimTodayLoading} isWimTodayError={isWimTodayError} />
  }, [isPcuLoading, isPcuError, pcu, wimToday, isWimTodayLoading, isWimTodayError])

  const renderCalibrationHistory = useMemo(() => {
    if (isCalibrationHistoryLoading) return <Skeleton active paragraph={{ rows: 4 }} />
    if (isCalibrationHistoryError) return <Empty description="ไม่พบข้อมูล" />
    return <OverallCalibrateWeight calibrationHistory={calibrationHistory?.data} />
  }, [isCalibrationHistoryLoading, isCalibrationHistoryError, calibrationHistory])

  const renderPositionByID = useMemo(() => {
    if (isPositionByIDLoading) return <Skeleton active paragraph={{ rows: 4 }} />
    if (isPositionByIDError) return <Empty description="ไม่พบข้อมูล" />
    return <OverallMap positionByID={positionByID?.data} />
  }, [isPositionByIDLoading, isPositionByIDError, positionByID])

  return (
    <>
      <section>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={10}>
            <section>
              {renderWimTodayStat}
            </section>
            <section className='mt-5'>
              {renderPCU}
            </section>
            <section className='mt-5'>
              {renderCalibrationHistory}
            </section>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={14}>
            <section>
              {renderPositionByID}
            </section>
            <section className='mt-5'>
              <OverallCCTV
                stationId={id}
                stationType={getStationType}
              />
            </section>
            <section className='mt-5'>
              <TableOverallWeight
                stationId={id}
                stationType={stationType}
              />
            </section>
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <Row gutter={[16, 16]} style={{ alignItems: 'stretch' }}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={10} className='flex flex-col'>
            <OverallAvgSpeed />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={7} className='flex flex-col'>
            <ChartPreviousWeightVehicle />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} xxxl={7} className='flex flex-col'>
            <ChartTraffic />
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <OverallDataDisplaySection />
      </section>
    </>
  )
}

export default React.memo<Props>(OverallSection)
