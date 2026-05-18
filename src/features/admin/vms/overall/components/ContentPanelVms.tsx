import React from 'react'
import styles from './vms.module.css'
import SignBoardVms from './SignBoardVms'
import AddDisplayFormatVms from './AddDisplayFormatVms'
import MediaLibraryVms from './MediaLibraryVms'
import { useVmsContext } from '../context'

const ContentPanelVms: React.FC = () => {
  const { mediaExpanded, setMediaExpanded } = useVmsContext()

  return (
    <>
      {/* Sign Info Header */}
      <div className={styles.signInfoHeader}>
        <div className={styles.signInfoLeft}>
          <h2 className={styles.signInfoTitle}>VMS &gt;&gt; ฉช.4050 จุดที่ 1</h2>
          <p className={styles.signInfoMeta}>รหัสสายทาง : ฉช.4050</p>
          <p className={styles.signInfoMeta}>ปรับเปลี่ยนครั้งล่าสุด : 04 พ.ค. 2568 (Anydesk)</p>
        </div>
        <div className={styles.signInfoRight}>
          <span className={styles.badgeOnline}>
            <span className={styles.badgeOnlineDot} />
            ออนไลน์
          </span>
          <span className={styles.badgeAnydesk}>
            ⊞ Anydesk : 1194336831
          </span>
          <button
            className={mediaExpanded ? styles.btnCancel : styles.btnAddCommand}
            onClick={() => setMediaExpanded(!mediaExpanded)}
          >
            {mediaExpanded ? 'ยกเลิก' : '+ เพิ่มคำสั่ง'}
          </button>
        </div>
      </div>

      <div className={styles.screenControlCardOuter}>
        <div className={styles.screenControlCard}>
          <SignBoardVms />
        </div>
      </div>

      {!mediaExpanded ? (
        <MediaLibraryVms variant="carousel" />
      ) : (
        <AddDisplayFormatVms />
      )}
    </>
  )
}

export default React.memo(ContentPanelVms)
