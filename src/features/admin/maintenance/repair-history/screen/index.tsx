"use client"
import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input, Segmented, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbArrowBigLeftFilled, TbFileText, TbPrinter, TbSearch, TbX } from 'react-icons/tb'
import { getMaintenanceSolutionAPI, getMaintenanceCasesAPI, getMaintenanceHistoryAPI } from '@/services/routes/MaintenanceService'
import type { CaseHistoryItem, SolutionDetailResponse, HistoryCase } from '@/types/maintenance'
import useIsMobile from '@/utils/hooks/useIsMobile'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  id: string
}

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
]

const RepairHistoryContent: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const warrantyParam = searchParams.get('warranty') || ''
  const storedSubtitle = typeof window !== 'undefined' ? (sessionStorage.getItem('maintenance_detail_subtitle') || '') : ''

  const [loading, setLoading] = useState(true)
  const [solutionData, setSolutionData] = useState<SolutionDetailResponse | null>(null)
  const [cases, setCases] = useState<CaseHistoryItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<CaseHistoryItem | null>(null)
  // case_no → HistoryCase lookup (history API has device/project fields the cases API lacks)
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryCase>>({})

  // Derived from API
  const warranty = warrantyParam || (solutionData?.warranty_status ? 'ในค้ำ' : 'หมดค้ำ')
  const onlineCount = solutionData?.online_count ?? 0
  const offlineCount = solutionData?.offline_count ?? 0
  // HistoryCase for the selected record (carries device/project fields the cases API lacks)
  const historyCase = selectedRecord ? historyMap[selectedRecord.case_no] : undefined
  const agencyText = historyCase?.department_name || selectedRecord?.responsible || '-'
  const deviceTypeText = historyCase?.solution_type || '-'
  const installPointText = historyCase ? [historyCase.location_name, historyCase.road_name].filter(Boolean).join(' - ') || '-' : '-'
  const offlineSinceText = selectedRecord?.reported_at ? dayjs(selectedRecord.reported_at).format('DD MMM BBBB') : '-'
  const offlineDaysText = historyCase?.offline_days ? `${historyCase.offline_days} วัน` : '-'

  const fetchData = useCallback(async () => {
    const numericId = Number(id)
    if (!numericId) return
    try {
      setLoading(true)
      const [solutionRes, casesRes, historyRes] = await Promise.all([
        getMaintenanceSolutionAPI(numericId),
        getMaintenanceCasesAPI(numericId),
        getMaintenanceHistoryAPI({ status: 'all' }),
      ])
      setSolutionData(solutionRes.data)
      setCases(casesRes.data ?? [])
      // Build case_no → HistoryCase map for the modal's project/device fields
      const map: Record<string, HistoryCase> = {}
        ; (historyRes.data ?? []).forEach((region) => {
          region.cases.forEach((c) => { map[c.case_no] = c })
        })
      setHistoryMap(map)
    } catch (err) {
      console.error('Error fetching repair history:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleBack = () => {
    router.push(`/admin/maintenance/detail/${id}`)
  }

  const columns: ColumnsType<CaseHistoryItem> = [
    { title: 'Case No.', dataIndex: 'case_no', key: 'case_no', width: 180 },
    { title: 'ชื่ออุปกรณ์', dataIndex: 'camera_name', key: 'camera_name', width: 200 },
    { title: 'IP Address', dataIndex: 'camera_ip', key: 'camera_ip', width: 140 },
    { title: 'หมวดหมู่ของปัญหาที่พบ', dataIndex: 'problem', key: 'problem', width: 200 },
    { title: 'หน่วยงานรับผิดชอบ', dataIndex: 'responsible', key: 'responsible', width: 250 },
    { title: 'วันที่แจ้งซ่อม', dataIndex: 'reported_at', key: 'reported_at', width: 140 },
    { title: 'วันที่ตรวจสอบ', dataIndex: 'inspection_date', key: 'inspection_date', width: 140 },
    { title: 'วันที่ปิด Case', dataIndex: 'closed_at', key: 'closed_at', width: 140 },
  ]

  if (loading) {
    return (
      <div className='main-screen flex items-center justify-center h-64'>
        <Spin size='large' />
      </div>
    )
  }

  return (
    <div className='main-screen'>
      <div className='px-4 sm:px-10 pt-3'>
        <section className='flex items-start gap-3'>
          <TbArrowBigLeftFilled
            className='text-[24px] cursor-pointer mt-1.5 shrink-0'
            style={{ color: '#FCD116' }}
            onClick={handleBack}
          />
          <div>
            <h1 className='text-[20px] sm:text-[24px] font-bold' style={{ color: '#FCD116' }}>
              ประวัติการซ่อม
            </h1>
            <div className='flex items-center gap-2 mt-2 flex-wrap'>
              {(storedSubtitle || solutionData?.solution_name) && (
                <p className='text-[13px] sm:text-[14px] font-normal' style={{ color: '#FFFFFF' }}>
                  {storedSubtitle || solutionData?.solution_name}
                </p>
              )}
              <span
                className='inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[12px] sm:text-[14px] font-normal whitespace-nowrap'
                style={{ border: `1px solid ${warranty === 'ในค้ำ' ? '#05F2DB' : '#979797'}`, color: warranty === 'ในค้ำ' ? '#05F2DB' : '#979797' }}
              >
                {warranty}
              </span>
              <span
                className='inline-flex items-center gap-1.5 text-[12px] sm:text-[14px] font-normal whitespace-nowrap'
                style={{ padding: '2px 12px', borderRadius: 9999, border: '1px solid #66AEFF', color: '#66AEFF', minWidth: 60, textAlign: 'center' }}
              >
                <img src='/atlas/images/Maintenance/icrpblue.png' alt='' width={13} height={13} />
                <span style={{ marginTop: 2 }}>{onlineCount}</span>
              </span>
              <span
                className='inline-flex items-center gap-1.5 text-[12px] sm:text-[14px] font-normal whitespace-nowrap'
                style={{ padding: '2px 12px', borderRadius: 9999, border: '1px solid #E94C4C', color: '#E94C4C', minWidth: 60, textAlign: 'center' }}
              >
                <img src='/atlas/images/Maintenance/icrpred.png' alt='' width={13} height={13} />
                <span style={{ marginTop: 2 }}>{offlineCount}</span>
              </span>
              <img src='/atlas/images/statistics/icbt.png' alt='' width={26} height={26} className='shrink-0' />
              <button
                className='inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[12px] sm:text-[14px] font-normal whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity'
                style={{ background: '#66AEFF', color: '#0A0A0A' }}
                type='button'
              >
                <TbPrinter size={14} />
                นำออกเอกสาร
              </button>
            </div>
          </div>
        </section>
      </div>
      <section className='mt-5 px-4 sm:px-10'>
        <div className='flex flex-col sm:flex-row sm:items-end gap-3 mb-4'>
          <div className='w-full sm:w-auto'>
            <p className='text-[16px] font-normal mb-1' style={{ color: '#FCD116' }}>ค้นหา</p>
            <Input
              placeholder='ค้นหา Case No. หรือชื่ออุปกรณ์...'
              suffix={<TbSearch size={18} color='#FCD116' />}
              size='middle'
              style={{ width: isMobile ? '100%' : 360, height: 40, borderRadius: 10 }}
            />
          </div>
          <div>
            <p className='text-[16px] font-normal mb-1' style={{ color: '#FCD116' }}>ปิด Case สำเร็จ</p>
            <div className='overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
              <Segmented
                options={PERIOD_OPTIONS}
                defaultValue='THIS_MONTH'
                size={isMobile ? 'middle' : 'large'}
                classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
              />
            </div>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={cases}
          rowKey='case_no'
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'], showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ` }}
          scroll={{ x: 'max-content' }}
          size='middle'
          onRow={(record) => ({
            onClick: () => {
              setSelectedRecord(record)
              setIsModalOpen(true)
            },
            style: { cursor: 'pointer' },
          })}
        />
      </section>

      {/* Modal */}
      {isModalOpen && selectedRecord && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1 }} />
          <div
            style={{
              position: 'relative', zIndex: 2,
              width: 'calc(100% - 32px)', maxWidth: 1630, minHeight: 400, maxHeight: '90vh',
              borderRadius: 20, backgroundColor: '#333333', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              padding: '24px 32px', display: 'flex', flexDirection: 'column', overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 400, margin: 0 }}>
                <span style={{ color: '#FCD116' }}>Case No.</span>
                <span style={{ color: '#FFFFFF', marginLeft: 8 }}>{selectedRecord.case_no}</span>
              </p>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <TbX size={20} color='#66AEFF' />
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Row: ข้อมูลโครงการ + ข้อมูลอุปกรณ์ */}
              <div className='flex flex-col lg:flex-row gap-4'>
                {/* Card: ข้อมูลโครงการ */}
                <div className='flex-1 lg:flex-[55] rounded-xl p-5' style={{ backgroundColor: '#191919' }}>
                  <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: '0 0 4px 0' }}>ข้อมูลโครงการ</p>
                  <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '0 0 16px 0' }}>
                    {storedSubtitle || solutionData?.solution_name || '-'}
                  </p>
                  <div className='grid grid-cols-3 lg:grid-cols-6 gap-4'>
                    {([
                      { label: 'ผู้รับจ้าง', value: '-', icon: 'icsc1.png' },
                      { label: 'หน่วยงานรับผิดชอบ', value: agencyText, icon: 'icsc2.png' },
                      { label: 'เลขที่สัญญา', value: '-', icon: 'icsc3.png' },
                      { label: 'เริ่มต้นการรับประกัน', value: '-', icon: 'icsc4-5.png' },
                      { label: 'สิ้นสุดการรับประกัน', value: '-', icon: 'icsc4-5.png' },
                      { label: 'สถานะค้ำประกัน', value: solutionData?.warranty_status ? 'ในค้ำ' : 'หมดค้ำ', icon: 'icsc6.png' },
                    ] as { label: string; value: string; icon: string }[]).map(({ label, value, icon }) => (
                      <div key={label} className='flex flex-col items-center'>
                        <img src={`/atlas/images/Maintenance/${icon}`} alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                        <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>{label}</p>
                        <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card: ข้อมูลอุปกรณ์ */}
                <div className='flex-1 lg:flex-[45] rounded-xl p-5' style={{ backgroundColor: '#191919' }}>
                  <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: '0 0 4px 0' }}>ข้อมูลอุปกรณ์</p>
                  <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '0 0 16px 0' }}>
                    {selectedRecord.camera_name || '-'}
                  </p>
                  <div className='flex flex-wrap justify-between gap-4'>
                    {([
                      { label: 'ประเภทอุปกรณ์', value: deviceTypeText, icon: 'icsc2.1.png' },
                      { label: 'จุดติดตั้ง / สายทาง', value: installPointText, icon: 'icsc2.2.png' },
                      { label: 'IP Address', value: selectedRecord.camera_ip || '-', icon: 'icsc3.png' },
                      { label: 'วันที่เร่มออฟไลน์', value: offlineSinceText, icon: 'icsc4-5.png' },
                      { label: 'จำนวนวันออฟไลน์', value: offlineDaysText, icon: 'icsc6.png' },
                    ] as { label: string; value: string; icon: string }[]).map(({ label, value, icon }) => (
                      <div key={label} className='flex flex-col items-center' style={{ flex: '1 1 0', minWidth: 90 }}>
                        <img src={`/atlas/images/Maintenance/${icon}`} alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                        <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>{label}</p>
                        <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 1 */}
              <div className='flex flex-col lg:flex-row gap-4'>
                <div className='flex-1 lg:flex-[55] rounded-xl p-5' style={{ backgroundColor: '#191919' }}>
                  <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 12px 0' }}>ข้อมูลการแจ้งซ่อม</p>
                  <div className='flex flex-col sm:flex-row gap-4'>
                    <div className='flex-1'>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หมวดหมู่ของปัญหาที่พบ</p>
                      <Input value={historyCase?.category || '-'} readOnly style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }} />
                    </div>
                    <div className='flex-1'>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หน่วยงานรับผิดชอบหรือมอบหมาย</p>
                      <Input value={agencyText} readOnly style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }} />
                    </div>
                  </div>
                  <div className='mt-3'>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>ปัญหาที่พบ</p>
                    <Input.TextArea value={selectedRecord.problem || '-'} readOnly autoSize={{ minRows: 2, maxRows: 4 }} style={{ width: '100%', borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF', resize: 'none' }} />
                  </div>
                  <div className='mt-3'>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>การดำเนินการหรือวิธีการแก้ไข</p>
                    <Input.TextArea value={'-'} readOnly autoSize={{ minRows: 2, maxRows: 4 }} style={{ width: '100%', borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF', resize: 'none' }} />
                  </div>
                  <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: '16px 0 6px 0' }}>ระยะเวลา</p>
                  <div className='flex flex-col sm:flex-row gap-4'>
                    <div className='flex-1'>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่แจ้งซ่อม</p>
                      <Input value={selectedRecord.reported_at || '-'} readOnly style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }} />
                    </div>
                    <div className='flex-1'>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่ตรวจสอบ</p>
                      <Input value={selectedRecord.inspection_date || '-'} readOnly style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }} />
                    </div>
                    <div className='flex-1'>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่ปิด Case</p>
                      <Input value={selectedRecord.closed_at || '-'} readOnly style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }} />
                    </div>
                  </div>
                </div>
                <div className='flex-1 lg:flex-[45] rounded-xl p-5' style={{ backgroundColor: '#191919' }}>
                  <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: '0 0 16px 0' }}>รายละเอียดรูปแบบไฟล์</p>
                  <div className='mb-4'>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 8px 0' }}>ก่อนซ่อม</p>
                    <div className='flex gap-2 flex-wrap'>
                      <div style={{ width: 160, height: 160, borderRadius: 8, backgroundColor: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TbFileText size={40} color='#555' />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 8px 0' }}>หลังซ่อม</p>
                    <div className='flex gap-2 flex-wrap'>
                      <div style={{ width: 160, height: 160, borderRadius: 8, backgroundColor: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TbFileText size={40} color='#555' />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const RepairHistoryScreen: React.FC<Props> = ({ id }) => {
  return (
    <Suspense fallback={<div className='flex items-center justify-center h-64'><Spin size='large' /></div>}>
      <RepairHistoryContent id={id} />
    </Suspense>
  )
}

export default React.memo<Props>(RepairHistoryScreen)
