//  WEATHER API
export interface APIResponseTemperature {
  coord: Coord
  weather: Weather[]
  base: string
  main: Main
  visibility: number
  wind: Wind
  rain: Rain
  clouds: Clouds
  dt: number
  sys: Sys
  timezone: number
  id: number
  name: string
  cod: number
}

export interface Coord {
  lon: number
  lat: number
}

export interface Weather {
  id: number
  main: string
  description: string
  icon: string
}

export interface Main {
  temp: number
  feels_like: number
  temp_min: number
  temp_max: number
  pressure: number
  humidity: number
  sea_level: number
  grnd_level: number
}

export interface Wind {
  speed: number
  deg: number
  gust: number
}

export interface Rain {
  "1h": number
}

export interface Clouds {
  all: number
}

export interface Sys {
  type: number
  id: number
  country: string
  sunrise: number
  sunset: number
}

// WAQI API
export interface APIResponseWAQI {
  status: string
  data: WAQIData
}

export interface WAQIData {
  aqi: number
  idx: number
  attributions: Attribution[]
  city: City
  dominentpol: string
  iaqi: Iaqi
  time: Time
  forecast: Forecast
  debug: Debug
}

export interface Attribution {
  url: string
  name: string
  logo?: string
}

export interface City {
  geo: number[]
  name: string
  url: string
  location: string
}

export interface Iaqi {
  h: H
  no2: No2
  o3: O3
  p: P
  pm10: Pm10
  pm25: Pm25
  so2: So2
  t: T
  w: W
}

export interface H {
  v: number
}

export interface No2 {
  v: number
}

export interface O3 {
  v: number
}

export interface P {
  v: number
}

export interface Pm10 {
  v: number
}

export interface Pm25 {
  v: number
}

export interface So2 {
  v: number
}

export interface T {
  v: number
}

export interface W {
  v: number
}

export interface Time {
  s: string
  tz: string
  v: number
  iso: string
}

export interface Forecast {
  daily: Daily
}

export interface Daily {
  o3: O32[]
  pm10: Pm102[]
  pm25: Pm252[]
  uvi: Uvi[]
}

export interface O32 {
  avg: number
  day: string
  max: number
  min: number
}

export interface Pm102 {
  avg: number
  day: string
  max: number
  min: number
}

export interface Pm252 {
  avg: number
  day: string
  max: number
  min: number
}

export interface Uvi {
  avg: number
  day: string
  max: number
  min: number
}

export interface Debug {
  sync: string
}
