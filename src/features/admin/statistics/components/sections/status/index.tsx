"use client"
import React, { useState, useCallback } from 'react'
import { TbArrowBigLeftFilled, TbChevronDown } from 'react-icons/tb'
import { Segmented, Collapse } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import SwapButton from '@/components/swap-button/SwapButton'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { useMap } from '@/components/map/hooks/useMap'
import { SearchCard } from '@/components/search-card'

interface Props {
  onBack: () => void
}

const SUB_TAB_OPTIONS = [
  { label: 'ภาพรวมเหตุการณ์', value: 'overview' },
  { label: 'ตารางเปรียบเทียบเหตุการณ์', value: 'comparison' },
]

const renderCount = (count: string) => {
  const [left, right] = count.split('/')
  const l = parseInt(left, 10)
  const r = parseInt(right, 10)
  // เต็ม → ขาวทั้งหมด, เป็น 0 → แดงทั้งหมด, ไม่เต็ม → ซ้าย cyan / ขวา yellow
  if (l === r) {
    return <span style={{ fontSize: 12, fontWeight: 500, color: '#FFFFFF', width: 28, textAlign: 'right' }}>{count}</span>
  }
  if (l === 0) {
    return <span style={{ fontSize: 12, fontWeight: 500, color: '#E94C4C', width: 28, textAlign: 'right' }}>{count}</span>
  }
  return (
    <span style={{ fontSize: 12, fontWeight: 500, width: 28, textAlign: 'right' }}>
      <span style={{ color: '#05F2DB' }}>{left}</span>
      <span style={{ color: '#FCD116' }}>/{right}</span>
    </span>
  )
}

const ROUTE_ITEMS = [
  {
    name: 'สทช. 1 (ปทุมธานี)',
    count: '1/1',
    lngLat: [100.5, 13.75] as [number, number],
    sub3: [
      { label: 'ชม.3028', detail: '67 - ชม.3028(31) ป้าย 1 : กม.0+300', connected: true },
    ],
  },
  {
    name: 'สทช. 2 (สระบุรี)',
    count: '0/8',
    lngLat: [100.9, 14.5] as [number, number],
    sub3: [
      { label: 'ชม.3045', detail: '67 - ชม.3045(31) ป้าย 1 : กม.0+500', connected: false },
      { label: 'ชม.3046', detail: '67 - ชม.3046(31) ป้าย 2 : กม.1+200', connected: false },
      { label: 'ชม.3047', detail: '67 - ชม.3047(31) ป้าย 1 : กม.3+100', connected: false },
      { label: 'ชม.3048', detail: '67 - ชม.3048(31) ป้าย 3 : กม.5+000', connected: false },
      { label: 'ชม.3049', detail: '67 - ชม.3049(31) ป้าย 1 : กม.0+800', connected: false },
      { label: 'ชม.3050', detail: '67 - ชม.3050(31) ป้าย 2 : กม.2+400', connected: false },
      { label: 'ชม.3051', detail: '67 - ชม.3051(31) ป้าย 1 : กม.1+600', connected: false },
      { label: 'ชม.3052', detail: '67 - ชม.3052(31) ป้าย 4 : กม.6+200', connected: false },
    ],
  },
  {
    name: 'สทช. 3 (ชลบุรี)',
    count: '16/20',
    lngLat: [100.98, 13.36] as [number, number],
    sub3: [
      { label: 'ชม.3010', detail: '7 - ชม.3010(2) ป้าย 1 : กม.0+100', connected: true },
      { label: 'ชม.3011', detail: '7 - ชม.3011(2) ป้าย 2 : กม.1+500', connected: true },
      { label: 'ชม.3012', detail: '7 - ชม.3012(2) ป้าย 1 : กม.2+300', connected: true },
      { label: 'ชม.3013', detail: '7 - ชม.3013(2) ป้าย 3 : กม.4+000', connected: true },
      { label: 'ชม.3014', detail: '7 - ชม.3014(2) ป้าย 1 : กม.0+700', connected: true },
      { label: 'ชม.3015', detail: '7 - ชม.3015(2) ป้าย 2 : กม.3+200', connected: true },
      { label: 'ชม.3016', detail: '7 - ชม.3016(2) ป้าย 1 : กม.1+800', connected: true },
      { label: 'ชม.3017', detail: '7 - ชม.3017(2) ป้าย 4 : กม.5+600', connected: true },
      { label: 'ชม.3018', detail: '7 - ชม.3018(2) ป้าย 1 : กม.0+400', connected: true },
      { label: 'ชม.3019', detail: '7 - ชม.3019(2) ป้าย 2 : กม.2+100', connected: true },
      { label: 'ชม.3020', detail: '7 - ชม.3020(2) ป้าย 1 : กม.3+500', connected: true },
      { label: 'ชม.3021', detail: '7 - ชม.3021(2) ป้าย 3 : กม.6+000', connected: true },
      { label: 'ชม.3022', detail: '7 - ชม.3022(2) ป้าย 1 : กม.1+000', connected: true },
      { label: 'ชม.3023', detail: '7 - ชม.3023(2) ป้าย 2 : กม.4+800', connected: true },
      { label: 'ชม.3024', detail: '7 - ชม.3024(2) ป้าย 1 : กม.0+900', connected: true },
      { label: 'ชม.3025', detail: '7 - ชม.3025(2) ป้าย 1 : กม.2+700', connected: true },
      { label: 'ชม.3026', detail: '7 - ชม.3026(2) ป้าย 5 : กม.7+300', connected: false },
      { label: 'ชม.3027', detail: '7 - ชม.3027(2) ป้าย 1 : กม.0+200', connected: false },
      { label: 'ชม.3028', detail: '7 - ชม.3028(2) ป้าย 2 : กม.3+900', connected: false },
      { label: 'ชม.3029', detail: '7 - ชม.3029(2) ป้าย 1 : กม.5+100', connected: false },
    ],
  },
  {
    name: 'สทช. 6 (ขอนแก่น)',
    count: '4/6',
    lngLat: [102.83, 16.43] as [number, number],
    sub3: [
      { label: 'ชม.2100', detail: '2 - ชม.2100(20) ป้าย 1 : กม.0+500', connected: true },
      { label: 'ชม.2101', detail: '2 - ชม.2101(20) ป้าย 2 : กม.2+000', connected: true },
      { label: 'ชม.2102', detail: '2 - ชม.2102(20) ป้าย 1 : กม.4+300', connected: true },
      { label: 'ชม.2103', detail: '2 - ชม.2103(20) ป้าย 3 : กม.6+100', connected: true },
      { label: 'ชม.2104', detail: '2 - ชม.2104(20) ป้าย 1 : กม.1+700', connected: false },
      { label: 'ชม.2105', detail: '2 - ชม.2105(20) ป้าย 1 : กม.3+400', connected: false },
    ],
  },
  {
    name: 'สทช. 10 (เชียงใหม่)',
    count: '7/7',
    lngLat: [98.98, 18.79] as [number, number],
    sub3: [
      { label: 'ชม.1080', detail: '1 - ชม.1080(10) ป้าย 1 : กม.0+200', connected: true },
      { label: 'ชม.1081', detail: '1 - ชม.1081(10) ป้าย 2 : กม.1+800', connected: true },
      { label: 'ชม.1082', detail: '1 - ชม.1082(10) ป้าย 1 : กม.3+500', connected: true },
      { label: 'ชม.1083', detail: '1 - ชม.1083(10) ป้าย 1 : กม.5+000', connected: true },
      { label: 'ชม.1084', detail: '1 - ชม.1084(10) ป้าย 3 : กม.7+200', connected: true },
      { label: 'ชม.1085', detail: '1 - ชม.1085(10) ป้าย 1 : กม.2+100', connected: true },
      { label: 'ชม.1086', detail: '1 - ชม.1086(10) ป้าย 2 : กม.4+600', connected: true },
    ],
  },
  {
    name: 'สทช. 13 (ฉะเชิงเทรา)',
    count: '3/3',
    lngLat: [101.16, 13.68] as [number, number],
    sub3: [
      { label: 'ชม.3040', detail: '3 - ชม.3040(13) ป้าย 1 : กม.0+400', connected: true },
      { label: 'ชม.3041', detail: '3 - ชม.3041(13) ป้าย 2 : กม.2+800', connected: true },
      { label: 'ชม.3042', detail: '3 - ชม.3042(13) ป้าย 1 : กม.5+100', connected: true },
    ],
  },
  {
    name: 'สทช. 14 (กระบี่)',
    count: '2/5',
    lngLat: [98.93, 8.08] as [number, number],
    sub3: [
      { label: 'ชม.4010', detail: '4 - ชม.4010(14) ป้าย 1 : กม.0+600', connected: true },
      { label: 'ชม.4011', detail: '4 - ชม.4011(14) ป้าย 2 : กม.3+200', connected: true },
      { label: 'ชม.4012', detail: '4 - ชม.4012(14) ป้าย 1 : กม.1+000', connected: false },
      { label: 'ชม.4013', detail: '4 - ชม.4013(14) ป้าย 1 : กม.4+500', connected: false },
      { label: 'ชม.4014', detail: '4 - ชม.4014(14) ป้าย 3 : กม.6+800', connected: false },
    ],
  },
  {
    name: 'สทช. 15 (อุดรธานี)',
    count: '9/9',
    lngLat: [102.82, 17.42] as [number, number],
    sub3: [
      { label: 'ชม.2200', detail: '2 - ชม.2200(15) ป้าย 1 : กม.0+100', connected: true },
      { label: 'ชม.2201', detail: '2 - ชม.2201(15) ป้าย 2 : กม.1+300', connected: true },
      { label: 'ชม.2202', detail: '2 - ชม.2202(15) ป้าย 1 : กม.2+700', connected: true },
      { label: 'ชม.2203', detail: '2 - ชม.2203(15) ป้าย 1 : กม.4+000', connected: true },
      { label: 'ชม.2204', detail: '2 - ชม.2204(15) ป้าย 3 : กม.5+500', connected: true },
      { label: 'ชม.2205', detail: '2 - ชม.2205(15) ป้าย 1 : กม.6+200', connected: true },
      { label: 'ชม.2206', detail: '2 - ชม.2206(15) ป้าย 2 : กม.7+800', connected: true },
      { label: 'ชม.2207', detail: '2 - ชม.2207(15) ป้าย 1 : กม.8+100', connected: true },
      { label: 'ชม.2208', detail: '2 - ชม.2208(15) ป้าย 1 : กม.9+400', connected: true },
    ],
  },
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activePeriod, setActivePeriod] = useState<string>('ALL')
  const [searchText, setSearchText] = useState('')

  const activeSubTab = searchParams.get('sub') || 'overview'

  const setActiveSubTab = useCallback((value: string) => {
    router.push('/admin/statistics?tab=status&sub=' + value)
  }, [router])

  const filteredRoutes = React.useMemo(() => {
    if (!searchText) return ROUTE_ITEMS
    const keyword = searchText.toLowerCase()
    return ROUTE_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.sub3.some(
          (sub) =>
            sub.label.toLowerCase().includes(keyword) ||
            sub.detail.toLowerCase().includes(keyword)
        )
    )
  }, [searchText])

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
          defaultActive={activeSubTab}
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
          <BaseMap>
            {filteredRoutes.map((item, index) => (
              <HTMLMarker key={item.name} lngLat={item.lngLat}>
                <div
                  onClick={() => router.push(`/admin/statistics/detail?detail=${encodeURIComponent(item.name)}`)}
                  style={{
                    width: 50, height: 50, borderRadius: '50%',
                    backgroundColor: '#B2FF00',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#000000',
                    boxShadow: '0 0 12px rgba(178, 255, 0, 0.5)',
                    border: '2px solid #000000',
                    cursor: 'pointer',
                  }}
                >
                  {index + 1}
                </div>
              </HTMLMarker>
            ))}
          </BaseMap>
          <div className="absolute top-4 left-4 z-10" style={{ width: 370 }}>
            <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => setSearchText(value)}>
              <Collapse
                ghost
                expandIcon={({ isActive }) => (
                  <TbChevronDown
                    size={20}
                    style={{
                      color: '#FCD116',
                      transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                )}
                style={{ marginTop: 16 }}
                items={filteredRoutes.map((item, index) => ({
                  key: item.name,
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>
                        {item.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 12, fontWeight: 500, color: '#FCD116',
                          width: 50, height: 22, borderRadius: 88,
                          border: '1px solid #FCD116',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FCD116' }} />
                          {index + 1}
                        </span>
                        {renderCount(item.count)}
                      </div>
                    </div>
                  ),
                  style: { marginBottom: 4 },
                  classNames: { header: 'rounded-lg bg-[#363636]' },
                  styles: {
                    header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 },
                    content: { padding: '8px 0 0 0' },
                    body: { padding: 0 },
                  },
                  children: (
                    <Collapse
                      ghost
                      expandIcon={({ isActive }) => (
                        <span style={{ marginLeft: 24 }}>
                          <TbChevronDown
                            size={20}
                            style={{
                              color: '#FCD116',
                              transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                            }}
                          />
                        </span>
                      )}
                      style={{ marginTop: 4 }}
                      items={[{
                        key: `${item.name}-sub`,
                        label: (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>
                              {item.name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              <span style={{
                                fontSize: 12, fontWeight: 500, color: '#FCD116',
                                width: 50, height: 22, borderRadius: 88,
                                border: '1px solid #FCD116',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FCD116' }} />
                                {index + 1}
                              </span>
                              {renderCount(item.count)}
                            </div>
                          </div>
                        ),
                        style: { marginBottom: 4 },
                        classNames: { header: 'rounded-lg bg-[#4B4B4B]' },
                        styles: {
                          header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 },
                          content: { padding: '8px 0 0 0' },
                          body: { padding: 0 },
                        },
                        children: (
                          <Collapse
                            ghost
                            expandIcon={({ isActive }) => (
                              <span style={{ marginLeft: 56 }}>
                                <TbChevronDown
                                  size={20}
                                  style={{
                                    color: '#FCD116',
                                    transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                  }}
                                />
                              </span>
                            )}
                            style={{ marginTop: 4 }}
                            items={item.sub3.map((sub) => ({
                              key: `${item.name}-${sub.label}`,
                              label: (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>
                                    {sub.label}
                                  </span>
                                </div>
                              ),
                              style: { marginBottom: 4 },
                              classNames: { header: 'rounded-lg' },
                              styles: {
                                header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16, backgroundColor: '#212121' },
                                content: { padding: '8px 0 0 0' },
                                body: { padding: 0 },
                              },
                              children: (
                                <div
                                  onClick={() => router.push(`/admin/statistics/detail?detail=${encodeURIComponent(sub.detail)}`)}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: '#000000', borderRadius: 8, paddingBlock: 12, paddingInline: 16, marginTop: 4, cursor: 'pointer' }}
                                >
                                  <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0, paddingLeft: 36 }}>
                                    {sub.detail}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    {sub.connected ? (
                                      <img src="/images/statistics/iconconnect.png" alt="connected" width={20} height={20} />
                                    ) : (
                                      <img src="/images/statistics/iconnoconnect.png.png" alt="no connect" width={20} height={20} />
                                    )}
                                  </div>
                                </div>
                              ),
                            }))}
                          />
                        ),
                      }]}
                    />
                  ),
                }))}
              />
            </SearchCard>
          </div>
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <div style={{ width: 280, height: 160, borderRadius: 20, border: '2px solid #66AEFF', backgroundColor: '#33333380', backdropFilter: 'blur(10px)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <img src="/images/statistics/c1.png" alt="" width={40} height={40} />
                <p style={{ fontSize: 16, fontWeight: 700, color: '#66AEFF', margin: 0 }}>จุดติดตั้งทั้งหมด</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>53</span>
                <span style={{ fontSize: 14, fontWeight: 400, color: '#FFFFFF' }}>จุดติดตั้ง</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 400, color: '#979797', margin: 0 }}>ภาคกลาง (75.6%)</p>
            </div>
            <div style={{ width: 280, height: 160, borderRadius: 20, border: '2px solid #666BFF', backgroundColor: '#33333380', backdropFilter: 'blur(10px)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <img src="/images/statistics/c2.png" alt="" width={40} height={40} />
                <p style={{ fontSize: 16, fontWeight: 700, color: '#666BFF', margin: 0 }}>เหตุการณ์ทั้งหมด</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>16</span>
                <span style={{ fontSize: 14, fontWeight: 400, color: '#FFFFFF' }}>เหตุการณ์</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 400, color: '#979797', margin: 0 }}>สทช. 10 (เชียงใหม่) (72.1%)</p>
            </div>
            <div style={{ width: 280, height: 160, borderRadius: 20, border: '2px solid #C300FF', backgroundColor: '#33333380', backdropFilter: 'blur(10px)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <img src="/images/statistics/c3.png" alt="" width={40} height={40} />
                <p style={{ fontSize: 16, fontWeight: 700, color: '#C300FF', margin: 0 }}>หน่วยงานที่มีเหตุการณ์</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>45</span>
                <span style={{ fontSize: 14, fontWeight: 400, color: '#FFFFFF' }}>หน่วยงาน</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 400, color: '#979797', margin: 0 }}>แขวงทางหลวงชนบทเชียงใหม่ (4 เหตุการณ์)</p>
            </div>
            <div style={{ width: 280, height: 160, borderRadius: 20, border: '2px solid #FC1691', backgroundColor: '#33333380', backdropFilter: 'blur(10px)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <img src="/images/statistics/c4.png" alt="" width={40} height={40} />
                <p style={{ fontSize: 16, fontWeight: 700, color: '#FC1691', margin: 0 }}>หมวดหมู่ยอดนิยม</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>การท่องเที่ยว</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 400, color: '#979797', margin: 0 }}>การท่องเที่ยว · 36 จุดติดตั้ง</p>
            </div>
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
