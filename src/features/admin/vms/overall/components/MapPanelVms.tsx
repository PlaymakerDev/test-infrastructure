"use client"
import React, { useState } from 'react'
import Map, { Marker, Layer } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import styles from './vms.module.css'
import MediaLibraryVms from './MediaLibraryVms'
import { useVmsContext } from '../context'

const MapPanelVms: React.FC = () => {
  const { mediaExpanded } = useVmsContext()
  const [viewState, setViewState] = useState({
    longitude: 101.132292,
    latitude: 13.740392,
    zoom: 16.5,
    pitch: 65,
    bearing: -55
  })

  return (
    <div className={styles.mapPanel}>
      {/* Map */}
      <div className={styles.mapWrapper}>
        <Map
          {...viewState}
          onMove={(evt: any) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
          style={{ width: '100%', height: '100%' }}
        >
          <Layer
            id="3d-buildings"
            source="composite"
            source-layer="building"
            filter={['==', 'extrude', 'true']}
            type="fill-extrusion"
            minzoom={14}
            paint={{
              'fill-extrusion-color': '#5d6d81',
              'fill-extrusion-height': [
                'interpolate', ['linear'], ['zoom'],
                14, 0,
                14.05, ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate', ['linear'], ['zoom'],
                14, 0,
                14.05, ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.8
            }}
          />
          <Marker longitude={101.132292} latitude={13.740392} anchor="bottom">
            <svg width="28" height="36" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))', marginTop: '-4px' }}>
              <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="white" />
              <circle cx="12" cy="11" r="4" fill="#F8C318" />
            </svg>
          </Marker>
        </Map>
        <button className={styles.mapBtnGoogleMap}>Google Map</button>
      </div>

      {/* Location Card */}
      <div className={styles.locationCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8C318" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </span>
          <span className={styles.cardHeaderTitle}>จุดติดตั้งป้าย VMS</span>
        </div>
        <p className={styles.cardLine}>TrafficSign : VMS &gt;&gt; ฉช.4050 จุดที่ 1</p>
        <p className={styles.cardLine}><span className={styles.cardLineMuted}>รหัสสายทาง :</span> ฉช.4050</p>
        <p className={styles.cardLine}><span className={styles.cardLineMuted}>13.740392° N, 101.132292° E</span></p>
      </div>

      {/* Project Info Card */}
      <div className={styles.projectCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F8C318" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              <path d="M9 14h6"></path><path d="M9 18h6"></path><path d="M9 10h6"></path>
            </svg>
          </span>
          <span className={styles.cardHeaderTitle}>ข้อมูลโครงการ</span>
        </div>
        <p className={styles.projectDesc}>
          จ้างก่อสร้างโครงการปรับปรุงทางเพื่อความปลอดภัย ถนนสาย ฉช.4050 แยกทางหลวงหมายเลข 3200 - บ้านบางขนาก อ.เมืองฉะเชิงเทรา, คลองเขื่อน, บางน้ำเปรี้ยว จ.ฉะเชิงเทรา 1 แห่ง
        </p>

        <div className={styles.projectStatsGrid}>
          <div className={styles.projectStat}>
            <span className={styles.projectStatIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <span className={styles.projectStatValue}>MT25029</span>
            <span className={styles.projectStatLabel}>รหัสโครงการ</span>
          </div>
          <div className={styles.projectStat}>
            <span className={styles.projectStatIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </span>
            <span className={styles.projectStatValue}>สอป.67/2568</span>
            <span className={styles.projectStatLabel}>เลขที่สัญญา</span>
          </div>
          <div className={styles.projectStat}>
            <span className={styles.projectStatIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <span className={styles.projectStatValue}>MST</span>
            <span className={styles.projectStatLabel}>ผู้รับจ้าง</span>
          </div>

          <div className={styles.projectStat}>
            <span className={styles.projectStatIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </span>
            <span className={styles.projectStatValue}>25 พ.ค. 2568</span>
            <span className={styles.projectStatLabel}>เริ่มต้นการรับประกัน</span>
          </div>
          <div className={styles.projectStat}>
            <span className={styles.projectStatIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </span>
            <span className={styles.projectStatValue}>26 พ.ค. 2570</span>
            <span className={styles.projectStatLabel}>สิ้นสุดการรับประกัน</span>
          </div>
          <div className={styles.projectStat}>
            <span className={styles.projectStatIconCyan}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path>
              </svg>
            </span>
            <span className={styles.projectStatValueCyan}>416 วัน</span>
            <span className={styles.projectStatLabel}>ระยะเวลาที่เหลือ</span>
          </div>
        </div>
      </div>

      {/* คลังรูปภาพและวิดีโอ: แสดงเมื่อกด ดูเพิ่มเติม */}
      {mediaExpanded && <MediaLibraryVms variant="grid" />}
    </div>
  )
}

export default React.memo(MapPanelVms)
