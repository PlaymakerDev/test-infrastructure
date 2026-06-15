"use client"
import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { App, ConfigProvider, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff, TbX } from 'react-icons/tb'
import { TitleSection } from '../components'
import { createMaintenanceCaseAPI, getMaintenanceSolutionAPI } from '@/services/routes/MaintenanceService'
import type { CameraItem, SolutionDetailResponse } from '@/types/maintenance'

interface Props {
  id: string
}

interface TableRow {
  key: string
  status: 'online' | 'offline'
  cameraName: string
  ipAddress: string
  caseNo: string | null
  cameraId: string
  category: string
  brand: string
  model: string
  hostname: string
  anydesk: string
  zerotier: string
  username: string
  password: string
}

/** Wrapper อ่าน title/subtitle จาก sessionStorage แล้วส่งเข้า TitleSection */
const TitleSectionWithData: React.FC<{ id: string; data: SolutionDetailResponse | null }> = ({ id, data }) => {
  // title/subtitle มาจาก sessionStorage (ส่งมาจาก tree) ถ้าไม่มีค่อย fallback เป็น solution_name
  const title = typeof window !== 'undefined' ? (sessionStorage.getItem('maintenance_detail_title') || data?.solution_name || id) : (data?.solution_name || id)
  const subtitle = typeof window !== 'undefined' ? (sessionStorage.getItem('maintenance_detail_subtitle') || '') : ''
  const onlineCount = data?.online_count ?? 0
  const offlineCount = data?.offline_count ?? 0
  const warranty = data?.warranty_status ? 'ในค้ำ' : 'หมดค้ำ'
  return (
    <TitleSection
      id={id}
      title={title}
      subtitle={subtitle}
      onlineCount={onlineCount}
      offlineCount={offlineCount}
      warranty={warranty}
    />
  )
}

const DetailContent: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter()
  const { modal } = App.useApp()
  const [solutionData, setSolutionData] = useState<SolutionDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<TableRow | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch solution detail
  const fetchSolution = useCallback(async () => {
    const numericId = Number(id)
    if (!numericId) return
    try {
      setLoading(true)
      setError(null)
      const res = await getMaintenanceSolutionAPI(numericId)
      setSolutionData(res.data)
    } catch (err) {
      console.error('Error fetching solution detail:', err)
      setError('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSolution()
  }, [fetchSolution])

  // Map API data to table rows
  const tableData: TableRow[] = (solutionData?.lists ?? []).map((item: CameraItem) => ({
    key: item.camera_id,
    status: item.status ? 'online' : 'offline',
    cameraName: item.camera_name,
    ipAddress: item.camera_ip,
    caseNo: item.case_no ?? null,
    cameraId: item.camera_id,
    category: item.category ?? '-',
    brand: item.brand ?? '-',
    model: item.model ?? '-',
    hostname: item.hostname ?? '-',
    anydesk: item.anydesk ?? '-',
    zerotier: item.zerotier ?? '-',
    username: item.username ?? '-',
    password: item.password ?? '-',
  }))

  const warranty = solutionData?.warranty_status ? 'ในค้ำ' : 'หมดค้ำ'

  const columns: ColumnsType<TableRow> = [
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status: string) => {
        const isOnline = status === 'online'
        return (
          <span
            className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-normal whitespace-nowrap'
            style={{ border: `1px solid ${isOnline ? '#66AEFF' : '#E94C4C'}`, color: isOnline ? '#66AEFF' : '#E94C4C' }}
          >
            {isOnline ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
            {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        )
      },
    },
    {
      title: 'Case No.',
      dataIndex: 'caseNo',
      key: 'caseNo',
      width: 160,
      align: 'center',
      render: (text: string | null, record: TableRow) =>
        text ? (
          <span
            style={{ color: '#FCD116', cursor: 'pointer' }}
            onClick={() => {
                  sessionStorage.setItem('maintenance_detail_id', id)
                  router.push(`/admin/maintenance/case/${text}`)
                }}
          >
            {text}
          </span>
        ) : (
          <button
            type='button'
            className='px-3 py-1 rounded-full text-[12px] font-normal whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity'
            style={{ background: '#FCD116', color: '#212121' }}
            onClick={() => {
              setSelectedRow(record)
              setIsModalOpen(true)
            }}
          >
            เปิด Case
          </button>
        ),
    },
    { title: 'ประเภท', dataIndex: 'category', key: 'category', width: 120, align: 'center' },
    { title: 'ยี่ห้อ', dataIndex: 'brand', key: 'brand', width: 120, align: 'center' },
    { title: 'รุ่น', dataIndex: 'model', key: 'model', width: 120, align: 'center' },
    { title: 'ชื่ออุปกรณ์', dataIndex: 'cameraName', key: 'cameraName', width: 200 },
    { title: 'Hostname', dataIndex: 'hostname', key: 'hostname', width: 140, align: 'center' },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 140, align: 'center' },
    { title: 'Anydesk', dataIndex: 'anydesk', key: 'anydesk', width: 130, align: 'center' },
    { title: 'ZeroTier', dataIndex: 'zerotier', key: 'zerotier', width: 130, align: 'center' },
    { title: 'Username', dataIndex: 'username', key: 'username', width: 120, align: 'center' },
    { title: 'Password', dataIndex: 'password', key: 'password', width: 120, align: 'center' },
  ]

  if (loading) {
    return (
      <div className='main-screen flex items-center justify-center h-64'>
        <Spin size='large' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='main-screen flex items-center justify-center h-64 text-[#E94C4C]'>
        {error}
      </div>
    )
  }

  return (
    <div className='main-screen'>
      <style>{`
        /* ─── Pagination dark theme ─── */
        .maintenance-detail-pagination .ant-pagination-item {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid #3c3e4e !important;
          border-radius: 20px !important;
          min-width: 32px !important;
          height: 32px !important;
          line-height: 30px !important;
          transition: all 0.2s ease !important;
        }
        .maintenance-detail-pagination .ant-pagination-item a {
          color: #c2c2d3 !important;
          font-size: 13px !important;
        }
        .maintenance-detail-pagination .ant-pagination-item:hover {
          border-color: #FCD116 !important;
        }
        .maintenance-detail-pagination .ant-pagination-item:hover a {
          color: #FCD116 !important;
        }
        .maintenance-detail-pagination .ant-pagination-item-active {
          background: #FCD116 !important;
          border-color: #FCD116 !important;
        }
        .maintenance-detail-pagination .ant-pagination-item-active,
        .maintenance-detail-pagination .ant-pagination-item-active a,
        .maintenance-detail-pagination .ant-pagination-item-active span,
        .maintenance-detail-pagination .ant-pagination-item-active div {
          color: #212121 !important;
        }
        .maintenance-detail-pagination .ant-pagination-prev .ant-pagination-item-link,
        .maintenance-detail-pagination .ant-pagination-next .ant-pagination-item-link {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid #3c3e4e !important;
          border-radius: 20px !important;
        }
        .maintenance-detail-pagination .ant-pagination-prev button,
        .maintenance-detail-pagination .ant-pagination-next button {
          color: #c2c2d3 !important;
        }
        .maintenance-detail-pagination .ant-pagination-prev:not(.ant-pagination-disabled):hover .ant-pagination-item-link,
        .maintenance-detail-pagination .ant-pagination-next:not(.ant-pagination-disabled):hover .ant-pagination-item-link {
          border-color: #FCD116 !important;
        }
        .maintenance-detail-pagination .ant-pagination-prev:not(.ant-pagination-disabled):hover button,
        .maintenance-detail-pagination .ant-pagination-next:not(.ant-pagination-disabled):hover button {
          color: #FCD116 !important;
        }
        .maintenance-detail-pagination .ant-pagination-disabled .ant-pagination-item-link {
          opacity: 0.3 !important;
        }
        .maintenance-detail-pagination .ant-pagination-disabled button {
          color: #555 !important;
        }
        .maintenance-detail-pagination .ant-pagination-total-text {
          color: #979797 !important;
          font-size: 13px !important;
        }
        .maintenance-detail-pagination .ant-select-selector {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid #3c3e4e !important;
          border-radius: 20px !important;
          color: #c2c2d3 !important;
          padding: 0 8px !important;
          height: 32px !important;
        }
        .maintenance-detail-pagination .ant-select-selection-item {
          color: #c2c2d3 !important;
          line-height: 30px !important;
        }
        .maintenance-detail-pagination .ant-select-arrow {
          color: #979797 !important;
        }
      `}</style>
      <TitleSectionWithData id={id} data={solutionData} />
      <section className='maintenance-detail-pagination mt-5 px-3 sm:px-10'>
        <ConfigProvider
          theme={{
            token: { colorPrimary: '#FCD116', colorBgContainer: '#2a2a2a', colorText: '#c2c2d3' },
            components: {
              Select: {
                optionActiveBg: '#FCD11620',
                optionSelectedBg: '#FCD11640',
                colorBgElevated: '#2a2a2a',
              },
            },
          }}
        >
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
            }}
            scroll={{ x: 'max-content' }}
            size='middle'
          />
        </ConfigProvider>
      </section>

      {/* Custom White Modal */}
      {isModalOpen && (
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
          {/* Overlay */}
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

          {/* Modal Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: 'calc(100% - 32px)',
              maxWidth: 800,
              minHeight: 400,
              borderRadius: 20,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              padding: '20px 24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ปิด */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                <TbX size={20} color='#999' />
              </button>
            </div>

            {/* รูป */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <img
                src='/images/Maintenance/icmd1.png'
                alt='maintenance'
                style={{ width: 100, height: 100, objectFit: 'contain' }}
              />
            </div>

            {/* หัวข้อ */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: '#525252', margin: '0 0 8px 0', textAlign: 'center' }}>
              ยืนยันเปิด Case อุปกรณ์นี้หรือไม่?
            </h3>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#525252', margin: '0 0 24px 0', textAlign: 'center' }}>
              ระบบจะออก Case No. ให้อัตโนมัติ
            </p>

            {/* เนื้อหา */}
            <div
              style={{
                fontSize: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: 16,
                borderRadius: 12,
                backgroundColor: '#E94C4C33',
                border: '2px solid #E94C4C',
              }}
            >
              <div><span style={{ color: '#979797' }}>ชื่ออุปกรณ์ : </span><span style={{ color: '#212121' }}>{selectedRow?.cameraName || '-'}</span></div>
              <div><span style={{ color: '#979797' }}>IP Address : </span><span style={{ color: '#212121' }}>{selectedRow?.ipAddress || '-'}</span></div>
              <div><span style={{ color: '#979797' }}>สถานะการค้ำประกัน : </span><span style={{ color: '#E94C4C', fontWeight: 700, fontSize: 14 }}>{warranty}</span></div>
            </div>

            {/* ปุ่ม */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 'auto',
                paddingTop: 32,
              }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 88,
                  fontSize: 14,
                  fontWeight: 500,
                  border: '1px solid #C4C4C4',
                  backgroundColor: '#FFFFFF',
                  color: '#212121',
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  if (!selectedRow || submitting) return
                  try {
                    setSubmitting(true)
                    await createMaintenanceCaseAPI({ camera_id: selectedRow.cameraId })
                    setIsModalOpen(false)
                    await fetchSolution()
                    modal.success({
                      title: 'เปิด Case สำเร็จ',
                      content: `สร้าง Case สำหรับอุปกรณ์ ${selectedRow.cameraName} เรียบร้อยแล้ว`,
                      okText: 'ตกลง',
                      centered: true,
                    })
                  } catch (err) {
                    console.error('Error creating case:', err)
                    modal.error({
                      title: 'ไม่สามารถเปิด Case ได้',
                      content: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
                      okText: 'ตกลง',
                      centered: true,
                    })
                  } finally {
                    setSubmitting(false)
                  }
                }}
                disabled={submitting}
                style={{
                  padding: '8px 20px',
                  borderRadius: 88,
                  fontSize: 14,
                  fontWeight: 500,
                  border: 'none',
                  backgroundColor: submitting ? '#C4C4C4' : '#FCD116',
                  color: '#212121',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'กำลังสร้าง...' : 'เปิด Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MaintenanceDetailScreen: React.FC<Props> = ({ id }) => {
  return (
    <Suspense fallback={<div className='flex items-center justify-center h-64'><Spin size='large' /></div>}>
      <DetailContent id={id} />
    </Suspense>
  )
}

export default React.memo<Props>(MaintenanceDetailScreen)
