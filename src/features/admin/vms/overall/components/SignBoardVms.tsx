"use client"
import React from 'react'
import styles from './vms.module.css'
import { MdOutlineWindow } from "react-icons/md";

const HJunction: React.FC = () => (
  <div className={styles.junctionWrap}>
    <div className={styles.junctionArrows}>
      <div className={styles.arrowUp} />
      <div className={styles.arrowUp} />
    </div>
    <div className={styles.junctionBody}>
      <div className={styles.junctionBar} />
      <div className={styles.junctionConnector} />
      <div className={styles.junctionBar} />
    </div>
  </div>
)

const SignBoardVms: React.FC = () => {
  return (
    <div className={styles.signBoardWrap}>
      <div className={styles.panelHeader} style={{ marginBottom: 20 }}>
        <span className={styles.panelIcon} style={{ marginBottom: 10 }}>
          <MdOutlineWindow size={30} />
        </span>
        <div>
          <div className={styles.panelTitle}>รูปแบบการทำงานของป้าย VMS</div>
          <div className={styles.panelSubtitle}>การทำงานของโปรแกรม</div>
        </div>
      </div>
      <div className={styles.signBoardLed}>
        <div className={styles.signBoardContent}>
          {/* Right col 1 */}
          <div className={styles.signCol}>
            <div className={styles.signColDest}>อ.เมืองฉะเชิงเทรา</div>
            <div className={styles.signColTime}>22</div>
            <div className={styles.signColUnit}>นาที</div>
            <div style={{ color: '#16b47c', fontSize: 32, margin: '8px 0', fontWeight: 800 }}>↑</div>
            <div className={styles.signColSub}>
              สถานีขนส่งฉะเชิงเทรา<br />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>17</span> นาที
            </div>
          </div>

          {/* Far right col */}
          <div className={styles.signCol}>
            <div className={styles.signColDest}>สถานีรถไฟฉะเชิงเทรา</div>
            <div className={styles.signColTime}>17</div>
            <div className={styles.signColUnit}>นาที</div>
            <div className={styles.signColSub} style={{ marginTop: 'auto' }}>
              วัดโสธรวรารามวรวิหาร<br />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>19</span> นาที
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.signBoardBottom}>
          <span className={styles.signText}>ท่านคู่แซนซึ่</span>
          <div className={styles.signWeather}>
            <span style={{ color: '#ff5555' }}>🌡</span><span style={{ fontWeight: 600 }}>39°C</span>
          </div>
          <div className={styles.signAqi}>
            <div className={styles.aqiBadge}>38</div>
            <span className={styles.aqiLabel}>US AQI</span>
          </div>
          <div className={`${styles.signStatusDot} ${styles.signStatusRed}`} />
          <div className={`${styles.signStatusDot} ${styles.signStatusOrange}`} />
        </div>
      </div>
    </div>
  )
}

export default React.memo(SignBoardVms)
