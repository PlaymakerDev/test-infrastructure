"use client"
import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input, Segmented, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbArrowBigLeftFilled, TbFileText, TbPrinter, TbSearch, TbX } from 'react-icons/tb'

interface RepairHistoryRecord {
  key: string
  caseNo: string
  repairCount: number
  type: string
  hostname: string
  ipAddress: string
  problemCategory: string
  agency: string
  repairDate: string
  inspectDate: string
  closeDate: string
}

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
]

const MOCK_DATA: RepairHistoryRecord[] = [
  { key: '1', caseNo: 'C-20260331-0050', repairCount: 3, type: 'CCTV', hostname: 'CCTV-TAKSIN-01', ipAddress: '192.168.1.101', problemCategory: 'ภาพเบลอ', agency: 'หมวดบำรุงทางหลวงชนบทกัลปพฤกษ์', repairDate: '2026-03-31', inspectDate: '2026-04-01', closeDate: '2026-04-03' },
  { key: '2', caseNo: 'C-20260315-0022', repairCount: 1, type: 'CCTV', hostname: 'CCTV-TAKSIN-02', ipAddress: '192.168.1.102', problemCategory: 'ไม่ตอบสนอง', agency: 'หมวดบำรุงทางหลวงชนบทกัลปพฤกษ์', repairDate: '2026-03-15', inspectDate: '2026-03-16', closeDate: '2026-03-18' },
  { key: '3', caseNo: 'C-20260228-0015', repairCount: 2, type: 'AI Camera', hostname: 'AI-TAKSIN-01', ipAddress: '192.168.1.103', problemCategory: 'สายสัญญาณขาด', agency: 'หมวดบำรุงทางหลวงชนบทสาทร', repairDate: '2026-02-28', inspectDate: '2026-03-01', closeDate: '2026-03-05' },
  { key: '4', caseNo: 'C-20260210-0008', repairCount: 1, type: 'NVR', hostname: 'NVR-TAKSIN-01', ipAddress: '192.168.1.200', problemCategory: 'Power Supply เสีย', agency: 'หมวดบำรุงทางหลวงชนบทกัลปพฤกษ์', repairDate: '2026-02-10', inspectDate: '2026-02-11', closeDate: '2026-02-15' },
  { key: '5', caseNo: 'C-20260115-0003', repairCount: 4, type: 'CCTV', hostname: 'CCTV-TAKSIN-03', ipAddress: '192.168.1.104', problemCategory: 'ภาพมืดตอนกลางคืน', agency: 'หมวดบำรุงทางหลวงชนบทบางรัก', repairDate: '2026-01-15', inspectDate: '2026-01-16', closeDate: '2026-01-20' },
]

interface Props {
  id: string
}

const RepairHistoryContent: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subtitle = searchParams.get('subtitle') || ''
  const warranty = searchParams.get('warranty') || 'ในค้ำ'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<RepairHistoryRecord | null>(null)

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(`/admin/maintenance/detail/${id}`)
    }
  }

  const columns: ColumnsType<RepairHistoryRecord> = [
    { title: 'Case No.', dataIndex: 'caseNo', key: 'caseNo', width: 180 },
    { title: 'จำนวนครั้งซ่อมแซม', dataIndex: 'repairCount', key: 'repairCount', width: 160, align: 'center' },
    { title: 'ประเภท', dataIndex: 'type', key: 'type', width: 120 },
    { title: 'Hostname', dataIndex: 'hostname', key: 'hostname', width: 160 },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 140 },
    { title: 'หมวดหมู่ของปัญหาที่พบ', dataIndex: 'problemCategory', key: 'problemCategory', width: 200 },
    { title: 'หน่วยงานรับผิดชอบ', dataIndex: 'agency', key: 'agency', width: 250 },
    { title: 'วันที่แจ้งซ่อม', dataIndex: 'repairDate', key: 'repairDate', width: 140 },
    { title: 'วันที่ตรวจสอบ', dataIndex: 'inspectDate', key: 'inspectDate', width: 140 },
    { title: 'วันที่ปิด Case', dataIndex: 'closeDate', key: 'closeDate', width: 140 },
  ]

  return (
    <div className='main-screen'>
      <div className='px-10 pt-3'>
        <section className='flex items-start gap-3'>
          <TbArrowBigLeftFilled
            className='text-[24px] cursor-pointer mt-1.5 shrink-0'
            style={{ color: '#FCD116' }}
            onClick={handleBack}
          />
          <div>
            <h1 className='text-[24px] font-bold' style={{ color: '#FCD116' }}>
              ประวัติการซ่อม
            </h1>
            {subtitle && (
              <div className='flex items-center gap-2 mt-1 flex-wrap'>
                <p className='text-[14px] font-normal' style={{ color: '#FFFFFF' }}>
                  {subtitle}
                </p>
                <span
                  className='inline-flex items-center px-3 py-1 rounded-full text-[14px] font-normal whitespace-nowrap'
                  style={{ border: `1px solid ${warranty === 'ในค้ำ' ? '#05F2DB' : '#979797'}`, color: warranty === 'ในค้ำ' ? '#05F2DB' : '#979797' }}
                >
                  {warranty}
                </span>
                <span
                  className='inline-flex items-center gap-1.5 text-[14px] font-normal whitespace-nowrap'
                  style={{ padding: '2px 12px', borderRadius: 9999, border: '1px solid #FCD116', color: '#FCD116', minWidth: 70, textAlign: 'center' }}
                >
                  <img src='/images/Maintenance/icrpyellow.png' alt='' width={15} height={15} />
                  <span style={{ marginTop: 2 }}>5</span>
                </span>
                <img src='/images/statistics/icbt.png' alt='' width={30} height={30} className='shrink-0' />
                <button
                  className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[14px] font-normal whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity'
                  style={{ background: '#66AEFF', color: '#0A0A0A' }}
                  type='button'
                >
                  <TbPrinter size={14} />
                  นำออกเอกสาร
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
      <section className='mt-5 px-10'>
        <div className='flex items-end gap-4 mb-4'>
          <div>
            <p className='text-[16px] font-normal mb-1' style={{ color: '#FCD116' }}>ค้นหา</p>
            <Input
              placeholder='ค้นหา Case No. หรือชื่ออุปกรณ์...'
              suffix={<TbSearch size={18} color='#FCD116' />}
              size='middle'
              style={{ width: 320, height: 40, borderRadius: 10 }}
            />
          </div>
          <div>
            <p className='text-[16px] font-normal mb-1' style={{ color: '#FCD116' }}>ปิด Case สำเร็จ</p>
            <Segmented
              options={PERIOD_OPTIONS}
              defaultValue='THIS_MONTH'
              size='large'
              classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
            />
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={MOCK_DATA}
          pagination={false}
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: 1630,
              height: 870,
              borderRadius: 20,
              backgroundColor: '#333333',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              padding: '24px 32px',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 400, margin: 0 }}>
                <span style={{ color: '#FCD116' }}>Case No.</span>
                <span style={{ color: '#FFFFFF', marginLeft: 8 }}>{selectedRecord.caseNo}</span>
              </p>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <TbX size={20} color='#66AEFF' />
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Row 1 */}
              <div style={{ display: 'flex', gap: 16, height: 200 }}>
                <div style={{ flex: 55, backgroundColor: '#191919', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <img src='/images/Maintenance/icf1.png' alt='' width={30} height={30} />
                    <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: 0 }}>ข้อมูลโครงการ</p>
                  </div>
                  <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '0 0 16px 0' }}>GS - CCTV+AI สะพานสมเด็จพระเจ้าตากสินมหาราช เขตคลองสาน, สาทร, บางรัก กทม.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src='/images/Maintenance/icsc1.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>ผู้รับจ้าง</p>
                      <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>FTD</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src='/images/Maintenance/icsc2.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>หน่วยงานรับผิดชอบ</p>
                      <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>บทช.กัลปพฤกษ์</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src='/images/Maintenance/icsc3.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>เลขที่สัญญา</p>
                      <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>สบธ.88/2566</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src='/images/Maintenance/icsc1.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>เริ่มต้นการรับประกัน</p>
                      <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>22 ก.พ. 2566</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src='/images/Maintenance/icsc2.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>สิ้นสุดการรับประกัน</p>
                      <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>22 มิ.ย. 2568</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src='/images/Maintenance/icsc3.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>สถานะค้ำประกัน</p>
                      <p style={{ color: '#E94C4C', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>หมดค้ำ</p>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 45, backgroundColor: '#191919', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <img src='/images/Maintenance/icf1.png' alt='' width={30} height={30} />
                    <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: 0 }}>ข้อมูลอุปกรณ์</p>
                  </div>
                  <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '0 0 16px 0' }}>{selectedRecord.hostname}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src='/images/Maintenance/icsc2.1.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>ประเภทอุปกรณ์</p>
                      <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>CCTV</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src='/images/Maintenance/icsc2.2.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>จุดติดตั้ง / สายทาง</p>
                      <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>สะพานตากสิน</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src='/images/Maintenance/icsc3.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>IP Address</p>
                      <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>192.168.3.170</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src='/images/Maintenance/icsc4-5.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>วันที่เริ่มออฟไลน์</p>
                      <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>26 ก.พ. 2569</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src='/images/Maintenance/icsc6.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>จำนวนวันออฟไลน์</p>
                      <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>58 วัน</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Row 2 */}
              <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                <div style={{ flex: 55, backgroundColor: '#191919', borderRadius: 12, padding: 20 }}>
                  <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: '0 0 12px 0' }}>ข้อมูลการแจ้งซ่อม</p>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หมวดหมู่ของปัญหาที่พบ</p>
                      <Input
                        value={selectedRecord.problemCategory}
                        readOnly
                        style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หน่วยงานรับผิดชอบ</p>
                      <Input
                        value={selectedRecord.agency}
                        readOnly
                        style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>ปัญหาที่พบ</p>
                    <Input.TextArea
                      value={selectedRecord.problemCategory}
                      readOnly
                      rows={3}
                      style={{ width: '100%', borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF', resize: 'none' }}
                    />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>การดำเนินการหรือวิธีการแก้ไข<span style={{ color: '#E94C4C' }}>*</span></p>
                    <Input.TextArea
                      value='เปลี่ยนหลอด LED ใหม่ 5 จุด ตรวจสอบสายไฟ'
                      readOnly
                      rows={3}
                      style={{ width: '100%', borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF', resize: 'none' }}
                    />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>ระยะเวลา</p>
                    <Input
                      value='3 วัน'
                      readOnly
                      style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่แจ้งซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
                      <Input
                        value={selectedRecord.repairDate}
                        readOnly
                        style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่ตรวจสอบ<span style={{ color: '#E94C4C' }}>*</span></p>
                      <Input
                        value={selectedRecord.inspectDate}
                        readOnly
                        style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่ปิด Case</p>
                      <Input
                        value={selectedRecord.closeDate}
                        readOnly
                        style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ flex: 45, backgroundColor: '#191919', borderRadius: 12, padding: 20, overflow: 'auto' }}>
                  <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: '0 0 16px 0' }}>รายละเอียดรูปแบบไฟล์</p>
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 8px 0' }}>ก่อนซ่อม</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <img src='/images/Maintenance/icmd1.png' alt='' style={{ width: 160, height: 160, borderRadius: 8, objectFit: 'cover' }} />
                      <img src='/images/Maintenance/icmd2.png' alt='' style={{ width: 160, height: 160, borderRadius: 8, objectFit: 'cover' }} />
                      <div style={{ width: 160, height: 160, borderRadius: 8, backgroundColor: '#FCD116', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <TbFileText size={24} color='#000000' />
                        <span style={{ fontSize: 9, fontWeight: 600, color: '#000000', lineHeight: 1.2 }}>เอกสาร PDF</span>
                        <span style={{ fontSize: 8, color: '#000000' }}>5.9 MB</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 8px 0' }}>หลังซ่อม</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <img src='/images/Maintenance/icmd1.png' alt='' style={{ width: 160, height: 160, borderRadius: 8, objectFit: 'cover' }} />
                      <img src='/images/Maintenance/icmd2.png' alt='' style={{ width: 160, height: 160, borderRadius: 8, objectFit: 'cover' }} />
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
    <Suspense>
      <RepairHistoryContent id={id} />
    </Suspense>
  )
}

export default React.memo<Props>(RepairHistoryScreen)
