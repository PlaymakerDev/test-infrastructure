"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { TbX } from 'react-icons/tb'
import styles from '../screen/maintenance-case.module.css'

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
    const detailId = typeof window !== 'undefined' ? sessionStorage.getItem('maintenance_detail_id') : ''
    if (detailId) {
      router.push(`/admin/maintenance/detail/${detailId}`)
    } else {
      router.push('/admin/maintenance')
    }
  }

  return (
    <div className={styles.saveModalOverlay} onClick={onClose}>
      <div className={styles.saveModalBg} />
      <div className={styles.saveModalContent} onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <div className='flex justify-end'>
          <button
            onClick={onClose}
            className='flex items-center justify-center rounded-full border-none bg-transparent cursor-pointer'
            style={{ width: 32, height: 32 }}
          >
            <TbX size={20} color='#999' />
          </button>
        </div>

        {/* Image */}
        <div className='flex justify-center mb-4'>
          <img
            src={isClosingCase ? '/atlas/images/Maintenance/icmd4.png' : '/atlas/images/Maintenance/icmd3.png'}
            alt='maintenance'
            style={{ width: 100, height: 100, objectFit: 'contain' }}
          />
        </div>

        {/* Title */}
        <h3 className='text-center m-0 mb-2' style={{ fontSize: 24, fontWeight: 700, color: '#525252' }}>
          {isClosingCase ? 'บันทึกและปิด Case เสร็จสิ้น' : 'บันทึกการแจ้งซ่อมเสร็จสิ้น'}
        </h3>

        {/* Info */}
        <div
          className='flex flex-col gap-1.5 p-4 rounded-xl'
          style={{
            fontSize: 14,
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

        {/* Buttons */}
        <div className='flex items-center justify-end gap-3 mt-auto pt-8'>
          <button
            onClick={onClose}
            className='border-none rounded-[88px] cursor-pointer'
            style={{
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: '#C4C4C4',
              color: '#000000',
            }}
          >
            ย้อนกลับ
          </button>
          <button
            onClick={handleConfirm}
            className='border-none rounded-[88px] cursor-pointer'
            style={{
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: '#FCD116',
              color: '#212121',
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
