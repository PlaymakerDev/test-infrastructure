"use client"
import React, { useMemo, useState } from 'react'
import styles from '../components/vms.module.css'
import HeaderVms from '../components/HeaderVms'
import SidebarVms, { SidebarRoute } from '@/components/sideabar/sidebar'
import ContentPanelVms from '../components/ContentPanelVms'

const VMS_ROUTES: SidebarRoute[] = [
  { id: 'kt1001', name: 'กท.1001', dots: [{ variant: 'teal', count: '2' }], signs: [] },
  { id: 'kt1001b', name: 'กท.1001 (กัลปพฤกษ์)', dots: [{ variant: 'teal', count: '5' }], signs: [] },
  { id: 'kn4036', name: 'กส.4036', dots: [{ variant: 'teal', count: '3' }, { variant: 'red', count: '1' }], signs: [] },
  { id: 'rn1027', name: 'ขก.1027', dots: [{ variant: 'teal', count: '2' }], signs: [] },
  {
    id: 'ch4050', name: 'ฉช.4050',
    dots: [{ variant: 'teal', count: '6' }, { variant: 'red', count: '3' }],
    defaultExpanded: true,
    signs: [
      { id: 's1', name: 'VMS >> ฉช.4050 จุดที่ 1', anydesk: 'Anydesk : 1194336831', online: true, hasDisplay: true },
      { id: 's2', name: 'VMS >> ฉช.4050 จุดที่ 2', anydesk: 'Anydesk : 1150133823', online: true, hasDisplay: true },
      { id: 's3', name: 'ฉช.4050 - VMS จุดที่ 1', anydesk: 'Anydesk : 1150133823', online: false, hasDisplay: false },
      { id: 's4', name: 'ฉช.4050 - VMS จุดที่ 2', anydesk: 'Anydesk : 1818466595', online: false, hasDisplay: false },
      { id: 's5', name: 'ฉช.4050 - VMS จุดที่ 3', anydesk: 'Anydesk : 1680979458', online: false, hasDisplay: false },
    ],
  },
]
import MapPanelVms from '../components/MapPanelVms'
import AlertHistoryScreen from '@/features/admin/vms/detail/alerthistory/screen'
import { VmsProvider } from '../context'
import { Col, Row } from 'antd'

const VmsScreenInner: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('vms')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'history':
        return <AlertHistoryScreen />
      case 'vms':
      default:
        return (
          <Row className={styles.mainRow} style={{ flex: 1, minHeight: 0, flexWrap: 'nowrap' }}>
            <Col xs={0} md={7} lg={5}>
              <aside className={`${styles.screenCol} ${styles.colSidebar}`}>
                <SidebarVms routes={VMS_ROUTES} />
              </aside>
            </Col>
            <Col xs={24} md={17} lg={19} style={{ minHeight: 0, height: '100%' }}>
              <div className={styles.sharedScroll}>
                <div className={styles.colContent}>
                  <ContentPanelVms />
                </div>
                <div className={styles.colRight}>
                  <MapPanelVms />
                </div>
              </div>
            </Col>
          </Row>
        )
    }
  }, [currentTab])

  return (
    <div className={`${styles.screen} px-4 md:px-10`}>
      <HeaderVms onTabChange={setCurrentTab} />
      <section className='mt-8' style={{ flex: 1, minHeight: 0 }}>
        {renderContent}
      </section>
    </div>
  )
}

const VmsScreen: React.FC = () => (
  <VmsProvider>
    <VmsScreenInner />
  </VmsProvider>
)

export default React.memo(VmsScreen)
