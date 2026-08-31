"use client"
import React, { useMemo, useState } from 'react'
import { Collapse, Empty, Input } from 'antd'
import { TbBulb, TbChevronDown, TbDeviceDesktop, TbSearch, TbVideo, TbWifi, TbWifiOff } from 'react-icons/tb'
import type { InstallBureau } from '../data/installPoints'

/**
 * สทช. → ขทช. picker for the จุดติดตั้งอุปกรณ์ tab. Visuals mirror the
 * Statistics route picker (`statistics/overall/components/shared/
 * StatisticsRouteSearchList.tsx` — same Collapse chrome, header fills and
 * online/total colour rules) per the 2026-08-24 spec, but stops at the ขทช.
 * level: clicking a ขทช. row selects it (highlighted like the mock) instead
 * of expanding a third device level.
 */

interface Props {
  bureaus: InstallBureau[]
  selectedDeptId: number | null
  onSelectDept: (deptId: number) => void
  /** Nationwide device totals for the selected system — the icon summary
   *  row under the search box (2026-08-28; text labels wrapped in 340px, so
   *  icons + numbers only, meanings on hover). `word` = กล้อง/อุปกรณ์ for
   *  the tooltip; `type` picks the device icon. */
  summary: { word: string; type: string; total: number; online: number; offline: number }
}

// Same colour rules as StatisticsRouteSearchList.renderCount: all-online →
// white, none-online → red, mixed → teal online / yellow total.
const renderCount = (online: number, total: number) => {
  const text = `${online}/${total}`
  if (total > 0 && online === total)
    return <span style={{ fontSize: 'var(--fs-12)', fontWeight: 500, color: '#FFFFFF' }}>{text}</span>
  if (online === 0)
    return <span style={{ fontSize: 'var(--fs-12)', fontWeight: 500, color: '#E94C4C' }}>{text}</span>
  return (
    <span style={{ fontSize: 'var(--fs-12)', fontWeight: 500 }}>
      <span style={{ color: '#05F2DB' }}>{online}</span>
      <span style={{ color: '#FCD116' }}>/{total}</span>
    </span>
  )
}

const InstallSidebar: React.FC<Props> = ({ bureaus, selectedDeptId, onSelectDept, summary }) => {
  const [search, setSearch] = useState('')

  // Filter by สทช./ขทช. name — a hit on the bureau keeps all its departments;
  // otherwise keep only the matching departments.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return bureaus
    return bureaus
      .map((b) => {
        if (b.name.toLowerCase().includes(q)) return b
        const departments = b.departments.filter((d) => d.name.toLowerCase().includes(q))
        return { ...b, departments }
      })
      .filter((b) => b.departments.length > 0)
  }, [bureaus, search])

  // Controlled open keys: auto-open the bureau that owns the current
  // selection (the default selection lands AFTER first render, so a
  // defaultActiveKey snapshot would stay collapsed) while keeping the
  // user's own expand/collapse toggles.
  const selectedBureauKey = useMemo(() => {
    const owner = bureaus.find((b) => b.departments.some((d) => d.id === selectedDeptId))
    return owner ? String(owner.stch) : undefined
  }, [bureaus, selectedDeptId])
  const [openKeys, setOpenKeys] = useState<string[]>([])
  React.useEffect(() => {
    if (selectedBureauKey) {
      setOpenKeys((keys) => (keys.includes(selectedBureauKey) ? keys : [...keys, selectedBureauKey]))
    }
  }, [selectedBureauKey])

  return (
    <div>
      {/* Same chrome as the statistics pages' SearchCard input (default
          themed border = yellow, yellow placeholder/icon) — 2026-08-26 request. */}
      <style>{`
        .install-sidebar-search::placeholder {
          color: #FCD116 !important;
          font-weight: 400;
          font-size: 14px;
        }
      `}</style>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder='ค้นหาสายทาง...'
        prefix={<TbSearch style={{ color: '#FCD116' }} />}
        className='rounded-lg'
        classNames={{ input: 'install-sidebar-search' }}
        styles={{ input: { fontSize: 'var(--fs-12)', fontWeight: 400, color: '#FFFFFF' } }}
        size='large'
        allowClear
      />
      {/* สรุปทั้งประเทศของระบบที่เลือก — icon + ตัวเลขล้วนให้จบบรรทัดเดียว
          (ข้อความเต็มโดน 340px ตัดขึ้นบรรทัดสอง): icon อุปกรณ์ตามระบบ = ทั้งหมด,
          TbWifi เขียว = ออนไลน์, TbWifiOff แดง = ออฟไลน์ (ภาษา icon เดิมของแอป);
          ความหมายเต็มอยู่ใน tooltip. */}
      <div className='mt-3 px-1 flex items-center gap-5' style={{ fontSize: 'var(--fs-12)' }}>
        <span className='inline-flex items-center gap-1.5 text-white cursor-default' title={`${summary.word}ทั้งหมด ${summary.total.toLocaleString()}`}>
          {summary.type === 'CCTV' ? <TbVideo size={16} className='text-(--yellow)' />
            : summary.type === 'LIGHTING' ? <TbBulb size={16} className='text-(--yellow)' />
            : <TbDeviceDesktop size={16} className='text-(--yellow)' />}
          <span className='font-semibold'>{summary.total.toLocaleString()}</span>
        </span>
        <span className='inline-flex items-center gap-1.5 cursor-default' style={{ color: '#05F2DB' }} title={`ออนไลน์ ${summary.online.toLocaleString()}`}>
          <TbWifi size={16} />
          {summary.online.toLocaleString()}
        </span>
        <span className='inline-flex items-center gap-1.5 cursor-default' style={{ color: '#E94C4C' }} title={`ออฟไลน์ ${summary.offline.toLocaleString()}`}>
          <TbWifiOff size={16} />
          {summary.offline.toLocaleString()}
        </span>
      </div>
      {filtered.length === 0 ? (
        <div className='py-10'>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='ไม่พบหน่วยงาน' />
        </div>
      ) : (
        <Collapse
          ghost
          expandIcon={({ isActive }) => (
            <TbChevronDown
              size={20}
              style={{ color: '#FCD116', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            />
          )}
          style={{ marginTop: 12 }}
          activeKey={openKeys}
          onChange={(keys) => setOpenKeys(Array.isArray(keys) ? keys : [keys])}
          items={filtered.map((bureau) => ({
            key: String(bureau.stch),
            label: (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: 'var(--fs-12)', fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>
                  {bureau.name}
                </span>
                <span style={{ flexShrink: 0, marginLeft: 8 }}>{renderCount(bureau.online, bureau.total)}</span>
              </div>
            ),
            style: { marginBottom: 4 },
            classNames: { header: 'rounded-lg bg-[#363636]' },
            styles: { header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 }, content: { padding: '8px 0 0 0' }, body: { padding: 0 } },
            children: (
              <div style={{ marginTop: 4 }}>
                {bureau.departments.map((dept) => {
                  const isSelected = dept.id === selectedDeptId
                  return (
                    <div
                      key={dept.id}
                      onClick={() => onSelectDept(dept.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                        backgroundColor: isSelected ? '#FCD11630' : '#4B4B4B',
                        border: isSelected ? '1px solid #FCD116' : '1px solid transparent',
                        borderRadius: 8, paddingBlock: 12, paddingInline: 16, marginBottom: 4, cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 'var(--fs-12)', fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0, paddingLeft: 20 }}>
                        {dept.name}
                      </span>
                      <span style={{ flexShrink: 0, marginLeft: 8 }}>{renderCount(dept.online, dept.total)}</span>
                    </div>
                  )
                })}
              </div>
            ),
          }))}
        />
      )}
    </div>
  )
}

export default React.memo(InstallSidebar)
