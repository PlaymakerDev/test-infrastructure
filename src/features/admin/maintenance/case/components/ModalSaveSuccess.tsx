"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { TbX } from 'react-icons/tb'

interface Props {
  open: boolean
  onClose: () => void
  isClosingCase?: boolean
  data?: {
    caseNo: string
    deviceName: string
    agency: string
    warrantyStatus: string
    repairDate: string
  }
}

const ModalSaveSuccess: React.FC<Props> = ({ open, onClose, isClosingCase = false, data }) => {
  const router = useRouter()

  if (!open || !data) return null

  const isExpired = data.warrantyStatus === 'หมดค้ำ'

  const handleConfirm = () => {
    onClose()
    router.push('/admin/maintenance/detail/1001-1?title=สะพานตากสิน&subtitle=GS%20-%20CCTV%20ถนนกัลปพฤกษ์%20เขตบางแค')
  }

  return (
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
      onClick={onClose}
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
          width: 800,
          minHeight: 560,
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          padding: '24px 32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ปิด */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
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
            src={isClosingCase ? '/images/Maintenance/icmd4.png' : '/images/Maintenance/icmd3.png'}
            alt='maintenance'
            style={{ width: 100, height: 100, objectFit: 'contain' }}
          />
        </div>

        {/* หัวข้อ */}
        <h3 style={{ fontSize: 24, fontWeight: 700, color: '#525252', margin: '0 0 8px 0', textAlign: 'center' }}>
          {isClosingCase ? 'บันทึกและปิด Case เสร็จสิ้น' : 'บันทึกการแจ้งซ่อมเสร็จสิ้น'}
        </h3>

        {/* เนื้อหา */}
        <div
          style={{
            fontSize: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 16,
            borderRadius: 12,
            backgroundColor: isClosingCase ? '#05F2DB33' : '#FCD11633',
            border: `2px solid ${isClosingCase ? '#05F2DB' : '#FCD116'}`,
          }}
        >
          <div><span style={{ color: '#979797' }}>Case No. </span><span style={{ color: '#212121' }}>{data.caseNo}</span></div>
          <div><span style={{ color: '#979797' }}>ชื่ออุปกรณ์ : </span><span style={{ color: '#212121' }}>{data.deviceName}</span></div>
          <div><span style={{ color: '#979797' }}>หน่วยงานที่รับผิดชอบหรือมอบหมาย : </span><span style={{ color: '#212121' }}>{data.agency}</span></div>
          <div><span style={{ color: '#979797' }}>สถานะการค้ำประกัน : </span><span style={{ color: isExpired ? '#E94C4C' : '#66AEFF', fontWeight: 700, fontSize: 14 }}>{data.warrantyStatus}</span></div>
          <div><span style={{ color: '#979797' }}>วันที่แจ้งซ่อม : </span><span style={{ color: '#212121' }}>{data.repairDate}</span></div>
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
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 88,
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              backgroundColor: '#C4C4C4',
              color: '#000000',
              cursor: 'pointer',
            }}
          >
            ย้อนกลับ
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 20px',
              borderRadius: 88,
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              backgroundColor: '#FCD116',
              color: '#212121',
              cursor: 'pointer',
            }}
          >
            รับทราบ
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ModalSaveSuccess)
