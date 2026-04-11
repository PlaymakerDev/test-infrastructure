"use client"
import { useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';

const Map = () => {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    mapboxgl.accessToken = ""
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: [-71.06776, 42.35816], // starting position [lng, lat]. Note that lat must be set between -90 and 90
      zoom: 9, // starting zoom
      style: 'mapbox://styles/brender99/cmmef8kve005x01s6fufgfnfd'
    });

    return () => {
      mapRef.current?.remove()
    }
  }, [])

  return (
    <>
      <div id='map-container' ref={mapContainerRef} className='w-full h-full' />
    </>
  )
}

export default Map