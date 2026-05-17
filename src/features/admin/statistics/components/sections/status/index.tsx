"use client"
import React, { useState } from 'react'
import { TbArrowBigLeftFilled, TbChevronDown } from 'react-icons/tb'
import { Segmented, Collapse } from 'antd'
import SwapButton from '@/components/swap-button/SwapButton'
import BaseMap from '@/components/map/BaseMap'
import { SearchCard } from '@/components/search-card'

interface Props {
  onBack: () => void
}

const SUB_TAB_OPTIONS = [
  { label: 'ภาพรวมเหตุการณ์', value: 'overview' },
  { label: 'ตารางเปรียบเทียบเหตุการณ์', value: 'comparison' },
]

const ROUTE_ITEMS = [
  'สทช. 1 (ปทุมธานี)',
  'สทช. 2 (สระบุรี)',
  'สทช. 3 (ชลบุรี)',
  'สทช. 6 (ขอนแก่น)',
  'สทช. 10 (เชียงใหม่)',
  'สทช. 13 (ฉะเชิงเทรา)',
  'สทช. 14 (กระบี่)',
  'สทช. 15 (อุดรธานี)',
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const StatusSection: React.FC<Props> = (props) => {
  const { onBack } = props
  const [activeSubTab, setActiveSubTab] = useState(SUB_TAB_OPTIONS[0].value)
  const [activePeriod, setActivePeriod] = useState<string>('ALL')

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      <section className="flex items-start gap-3">
        <TbArrowBigLeftFilled
          className="fs-24 text-(--yellow) cursor-pointer"
          onClick={onBack}
        />
        <div>
          <h1 className="text-(--yellow)">สถานะและการปรับเปลี่ยนข้อความ</h1>
          <p className="text-(--yellow)">สถิติและรายงานการแจ้งเตือนเหตุการณ์</p>
        </div>
      </section>
      <section className="mt-5">
        <SwapButton
          options={SUB_TAB_OPTIONS}
          defaultActive="overview"
          setLabelValue={(value) => setActiveSubTab(value)}
        />
      </section>
      <section className="mt-4">
        <Segmented
          value={activePeriod}
          onChange={(value) => setActivePeriod(value as string)}
          options={PERIOD_OPTIONS}
          size="large"
          classNames={{
            root: 'min-w-max border! border-(--yellow)!',
          }}
        />
      </section>
      {activeSubTab === 'overview' && (
        <div className="mt-6 flex-1 relative" style={{ borderRadius: 20, overflow: 'hidden' }}>
          <BaseMap />
          <div className="absolute top-4 left-4 z-10" style={{ width: 360 }}>
            <SearchCard placeholder="ค้นหาสายทาง..." onSearch={(value) => console.log(value)}>
              <Collapse
                ghost
                expandIcon={({ isActive }) => (
                  <TbChevronDown
                    style={{
                      color: '#FCD116',
                      transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                )}
                style={{ marginTop: 16 }}
                items={ROUTE_ITEMS.map((route) => ({
                  key: route,
                  label: (
                    <span style={{ fontSize: 14, fontWeight: 400, color: '#FCD116' }}>
                      {route}
                    </span>
                  ),
                  style: { marginBottom: 4 },
                  classNames: { header: 'rounded-lg bg-[#363636]' },
                  styles: {
                    header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 },
                    content: { padding: '8px 0 0 0' },
                    body: { padding: 0 },
                  },
                  children: (
                    <div
                      style={{
                        backgroundColor: '#4B4B4B',
                        borderRadius: 10,
                        padding: '12px 14px',
                        marginTop: 4,
                      }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 400, color: '#979797', margin: 0 }}>
                        รายละเอียดสายทาง {route}
                      </p>
                    </div>
                  ),
                }))}
              />
            </SearchCard>
          </div>
        </div>
      )}
      {activeSubTab === 'comparison' && (
        <div className="mt-6 flex-1" style={{ backgroundColor: '#191919', borderRadius: 20, padding: 20 }}>
          <p style={{ color: '#979797', fontSize: 14 }}>ตารางเปรียบเทียบเหตุการณ์</p>
        </div>
      )}
    </div>
  )
}

export default React.memo<Props>(StatusSection)
