import { WEATHER_STATUS } from '@/constants/weather'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import { APIResponseTemperature, APIResponseWAQI } from '@/types/weather/api'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Col, Row, Skeleton } from 'antd'
import axios from 'axios'
import React, { useCallback, useMemo } from 'react'
import { TbCloud, TbRainbow, TbThermometer, TbUmbrella, TbWind } from 'react-icons/tb'

interface Props {
  data?: APIResponseVMSDetail
}

const InfoCardSection: React.FC<Props> = (props) => {
  const { data } = props

  const renderAQIName = useCallback((aqiNo: number) => {
    let aqiName = ""

    if (aqiNo >= 100) {
      aqiName = "คุณภาพอากาศมีผลกระทบต่อสุขภาพ"
    } else if (aqiNo >= 50) {
      aqiName = "คุณภาพอากาศปานกลาง"
    } else {
      aqiName = "คุณภาพอากาศดี"
    }

    return aqiName
  }, [])

  const { data: tempData, isLoading: tempLoading } = useQuery({
    queryKey: ['temperature'],
    queryFn: () => axios.get<APIResponseTemperature>(data?.vms_weather?.temp_url ?? ''),
    enabled: !!data?.vms_weather?.temp_url,
    placeholderData: keepPreviousData
  })

  const renderOverallWeather = useMemo(() => {
    if (tempLoading) return <Skeleton loading={tempLoading} active paragraph={{ rows: 4 }} />
    return (
      <>
        <TbRainbow className='fs-24 text-(--yellow) mb-1' />
        <h4 className='text-(--yellow)'>สภาพอากาศโดยรวม</h4>
        <p className='fs-14 font-bold'>{WEATHER_STATUS[tempData?.data.weather[0].id as keyof typeof WEATHER_STATUS] || ''}</p>
      </>
    )
  }, [tempData, tempLoading])

  const renderWeatherQuality = useMemo(() => {
    if (tempLoading) return <Skeleton loading={tempLoading} active paragraph={{ rows: 4 }} />

    const sortAQI = data?.vms_weather?.weather_logs.sort((b, a) => b.aqi - a.aqi) ?? []

    return (
      <>
        <TbCloud className='fs-24 text-teal-500 mb-1' />
        <h4 className='text-teal-500'>คุณภาพอากาศ AQI</h4>
        <p className='fs-14 font-bold'>{renderAQIName(sortAQI[0]?.aqi ?? 0)}</p>
      </>
    )
  }, [tempLoading, data?.vms_weather?.weather_logs, renderAQIName])

  const renderWeatherTemperature = useMemo(() => {
    if (tempLoading) return <Skeleton loading={tempLoading} active paragraph={{ rows: 4 }} />
    return (
      <>
        <TbThermometer className='fs-24 text-blue-500 mb-1' />
        <h4 className='text-blue-500'>อุณหภูมิ</h4>
        <p className='mb-0.5'><span className='fs-14 font-bold'>{tempData?.data.main.temp || 0}</span> <span className='fs-12'>°C</span></p>
      </>
    )
  }, [tempData, tempLoading])

  const renderRainVolume = useMemo(() => {
    if (tempLoading) return <Skeleton loading={tempLoading} active paragraph={{ rows: 4 }} />
    return (
      <>
        <TbUmbrella className='fs-24 text-blue-500 mb-1' />
        <h4 className='text-blue-500'>ปริมาณน้ำฝน</h4>
        <p className='mb-0.5'><span className='fs-14 font-bold'>{tempData?.data.rain?.['1h'] || 0}</span> <span className='fs-12'>mm/min</span></p>
      </>
    )
  }, [tempData, tempLoading])

  const renderWindSpeed = useMemo(() => {
    if (tempLoading) return <Skeleton loading={tempLoading} active paragraph={{ rows: 4 }} />
    return (
      <>
        <TbWind className='fs-24 text-blue-500 mb-1' />
        <h4 className='text-blue-500'>ความเร็วลม</h4>
        <p className='mb-0.5'><span className='fs-14 font-bold'>{tempData?.data.wind.speed || 0}</span> <span className='fs-12'>km/h</span></p>
      </>
    )
  }, [tempData, tempLoading])

  return (
    <div className='flex-1 min-h-0 flex flex-col bg-black/70 backdrop-blur-xs rounded-lg p-5'>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
          <div className='h-full bg-[#FFB1001A] border-2 rounded-lg px-4 py-2 border-(--yellow)'>
            {renderOverallWeather}
          </div>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
          <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-teal-500'>
            {renderWeatherQuality}
          </div>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
          <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-blue-500'>
            {renderWeatherTemperature}
          </div>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
          <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-blue-500'>
            {renderRainVolume}
          </div>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
          <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-blue-500'>
            {renderWindSpeed}
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default React.memo<Props>(InfoCardSection)