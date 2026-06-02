"use client"
import React, { useState } from 'react'
import { Button, ConfigProvider, DatePicker, Input, Select, Upload } from 'antd'
import thTH from 'antd/locale/th_TH'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TbChevronDown, TbFileText, TbPrinter, TbTrash } from 'react-icons/tb'
import styles from './maintenance-case.module.css'
import ModalSaveSuccess from '../components/ModalSaveSuccess'

dayjs.extend(buddhistEra)
dayjs.locale('th')
import { TitleSection } from '../components'

interface Props {
  id: string
}

type RepairStatus = 'pending' | 'in_progress' | 'completed'
type WarrantyStatus = 'active' | 'expired'

interface ProjectInfo {
  projectName: string
  contractor: string
  agency: string
  contractNo: string
  warrantyStart: string
  warrantyEnd: string
  warrantyStatus: WarrantyStatus
}

interface DeviceInfo {
  deviceName: string
  deviceType: string
  installPoint: string
  ipAddress: string
  offlineDate: string
  offlineDays: number
  hasLive: boolean
}

interface FormData {
  category: string
  agency: string
  problem: string
  solution: string
  reportDate: string
  inspectDate: string
  beforeImages: number
  afterImages: number
}

interface CaseMockData {
  repairStatus: RepairStatus
  problemCategory: string
  project: ProjectInfo
  device: DeviceInfo
  form: FormData
}

const CASE_MOCK: Record<string, CaseMockData> = {
  'C-20260331-0050': {
    repairStatus: 'pending',
    problemCategory: 'ยังไม่ระบุ',
    project: {
      projectName: 'GS - CCTV+AI สะพานสมเด็จพระเจ้าตากสินมหาราช เขตคลองสาน, สาทร, บางรัก กทม.',
      contractor: 'FTD',
      agency: 'บทช.กัลปพฤกษ์',
      contractNo: 'สบธ.88/2566',
      warrantyStart: '22 ก.พ. 2566',
      warrantyEnd: '22 มิ.ย. 2568',
      warrantyStatus: 'expired',
    },
    device: {
      deviceName: 'DRR-TS-BulletCAM08 – ฝั่งพระนคร',
      deviceType: 'CCTV',
      installPoint: 'สะพานตากสิน',
      ipAddress: '192.168.3.170',
      offlineDate: '26 ก.พ. 2569',
      offlineDays: 20,
      hasLive: true,
    },
    form: {
      category: '',
      agency: '',
      problem: '',
      solution: '',
      reportDate: '',
      inspectDate: '',
      beforeImages: 0,
      afterImages: 0,
    },
  },
  'C-20260330-0012': {
    repairStatus: 'in_progress',
    problemCategory: 'กล้องเสีย',
    project: {
      projectName: 'GS - CCTV ถนนกัลปพฤกษ์ เขตบางแค กทม.',
      contractor: 'Firsttech Design Co., Ltd.',
      agency: 'สทช. 1 (ปทุมธานี)',
      contractNo: 'สบธ.45/2567',
      warrantyStart: '10 ม.ค. 2567',
      warrantyEnd: '10 ม.ค. 2570',
      warrantyStatus: 'active',
    },
    device: {
      deviceName: 'DRR-KP-CCTV01 – ฝั่งธนบุรี',
      deviceType: 'AI Camera',
      installPoint: 'ถนนกัลปพฤกษ์',
      ipAddress: '192.168.5.101',
      offlineDate: '15 มี.ค. 2569',
      offlineDays: 5,
      hasLive: false,
    },
    form: {
      category: 'cctv',
      agency: 'agency_2',
      problem: 'กล้องไม่สามารถจับภาพได้ หน้าจอดำสนิท',
      solution: 'เปลี่ยนกล้องตัวใหม่และตั้งค่า IP ใหม่',
      reportDate: '10 เม.ย. 2569',
      inspectDate: '12 เม.ย. 2569',
      beforeImages: 2,
      afterImages: 1,
    },
  },
  'C-20260329-0088': {
    repairStatus: 'completed',
    problemCategory: 'ไฟส่องสว่าง',
    project: {
      projectName: 'GS - Traffic Lighting ถนนพระราม 2 เขตบางขุนเทียน กทม.',
      contractor: 'ABC Engineering',
      agency: 'สทช. 2 (นนทบุรี)',
      contractNo: 'สบธ.12/2565',
      warrantyStart: '1 เม.ย. 2565',
      warrantyEnd: '1 เม.ย. 2568',
      warrantyStatus: 'expired',
    },
    device: {
      deviceName: 'DRR-RL-LIGHT05 – ขาออก',
      deviceType: 'Traffic Light',
      installPoint: 'พระราม 2',
      ipAddress: '192.168.10.50',
      offlineDate: '1 ม.ค. 2569',
      offlineDays: 45,
      hasLive: true,
    },
    form: {
      category: 'traffic_lighting',
      agency: 'agency_3',
      problem: 'ไฟส่องสว่างดับหลายจุด บริเวณทางขึ้นสะพาน',
      solution: 'เปลี่ยนหลอด LED ใหม่ 5 จุด ตรวจสอบสายไฟ',
      reportDate: '5 ม.ค. 2569',
      inspectDate: '8 ม.ค. 2569',
      beforeImages: 3,
      afterImages: 2,
    },
  },
  'C-20260328-0015': {
    repairStatus: 'pending',
    problemCategory: 'ยังไม่ระบุ',
    project: {
      projectName: 'GS - VMS ทางด่วนเฉลิมมหานคร เขตคลองเตย กทม.',
      contractor: 'XYZ Technology',
      agency: 'สทช. 3 (สมุทรปราการ)',
      contractNo: 'สบธ.99/2566',
      warrantyStart: '15 ส.ค. 2566',
      warrantyEnd: '15 ส.ค. 2569',
      warrantyStatus: 'active',
    },
    device: {
      deviceName: 'DRR-EX-VMS01 – ขาเข้า',
      deviceType: 'VMS',
      installPoint: 'ทางด่วนเฉลิมมหานคร',
      ipAddress: '192.168.20.10',
      offlineDate: '',
      offlineDays: 0,
      hasLive: true,
    },
    form: {
      category: '',
      agency: '',
      problem: '',
      solution: '',
      reportDate: '',
      inspectDate: '',
      beforeImages: 0,
      afterImages: 0,
    },
  },
  'C-20260327-0042': {
    repairStatus: 'in_progress',
    problemCategory: 'Network',
    project: {
      projectName: 'GS - Network ถนนราชพฤกษ์ เขตภาษีเจริญ กทม.',
      contractor: 'Net Solutions',
      agency: 'บทช.กัลปพฤกษ์',
      contractNo: 'สบธ.33/2567',
      warrantyStart: '1 ก.ย. 2567',
      warrantyEnd: '1 ก.ย. 2570',
      warrantyStatus: 'active',
    },
    device: {
      deviceName: 'DRR-RP-SW01 – ตู้หลัก',
      deviceType: 'Switch',
      installPoint: 'ถนนราชพฤกษ์',
      ipAddress: '192.168.1.1',
      offlineDate: '20 พ.ค. 2569',
      offlineDays: 10,
      hasLive: false,
    },
    form: {
      category: 'incident_detection',
      agency: 'agency_1',
      problem: 'Switch หลักไม่ตอบสนอง อุปกรณ์ทั้งหมดออฟไลน์',
      solution: 'รีบูต Switch และอัพเดท Firmware',
      reportDate: '15 พ.ค. 2569',
      inspectDate: '18 พ.ค. 2569',
      beforeImages: 1,
      afterImages: 0,
    },
  },
}

const DEFAULT_DATA: CaseMockData = {
  repairStatus: 'pending',
  problemCategory: 'ยังไม่ระบุ',
  project: {
    projectName: 'ไม่พบข้อมูลโครงการ',
    contractor: '-',
    agency: '-',
    contractNo: '-',
    warrantyStart: '-',
    warrantyEnd: '-',
    warrantyStatus: 'expired',
  },
  device: {
    deviceName: 'ไม่พบข้อมูลอุปกรณ์',
    deviceType: '-',
    installPoint: '-',
    ipAddress: '-',
    offlineDate: '-',
    offlineDays: 0,
    hasLive: false,
  },
  form: {
    category: '',
    agency: '',
    problem: '',
    solution: '',
    reportDate: '',
    inspectDate: '',
    beforeImages: 0,
    afterImages: 0,
  },
}

const REPAIR_STATUS_CONFIG: Record<RepairStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'ยังไม่มีการตรวจเช็ค', color: '#E94C4C', bg: '#E94C4C1A' },
  in_progress: { label: 'กำลังดำเนินการ', color: '#66AEFF', bg: '#66AEFF1A' },
  completed: { label: 'เสร็จสิ้น', color: '#66AEFF', bg: '#66AEFF33' },
}

const MaintenanceCaseScreen: React.FC<Props> = ({ id }) => {
  const caseData = CASE_MOCK[id] || DEFAULT_DATA
  const statusConfig = REPAIR_STATUS_CONFIG[caseData.repairStatus]
  const { project, device, form } = caseData
  const [modalOpen, setModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    category: form.category,
    agency: form.agency,
    problem: form.problem,
    solution: form.solution,
    reportDate: form.reportDate,
    inspectDate: form.inspectDate,
    beforeImages: form.beforeImages,
    afterImages: form.afterImages,
  })
  const [closeCaseAfterSave, setCloseCaseAfterSave] = useState(false)

  const handleSave = () => {
    setModalOpen(true)
  }

  const hasData = Boolean(
    formData.category ||
    formData.agency ||
    formData.problem ||
    formData.solution ||
    formData.reportDate ||
    formData.inspectDate
  )

  const handleDeleteBeforeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      beforeImages: prev.beforeImages - 1
    }))
  }

  const handleDeleteAfterImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      afterImages: prev.afterImages - 1
    }))
  }

  return (
    <div className='main-screen'>
      <style>{`
        .maintenance-upload-dragger .ant-upload {
          padding: 8px !important;
        }
        .maintenance-upload-dragger .ant-upload-drag {
          min-height: unset !important;
        }
      `}</style>
      <TitleSection caseId={id} />
      <section className='mt-5 px-10 flex gap-4'>
        <div
          style={{
            width: 300,
            height: 110,
            borderRadius: 20,
            background: statusConfig.bg,
            border: `2px solid ${statusConfig.color}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 4,
            paddingLeft: 24,
          }}
        >
          <p style={{ color: statusConfig.color, fontWeight: 400, fontSize: 14, margin: 0 }}>
            สถานะซ่อมแซม
          </p>
          <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16, margin: 0 }}>
            {statusConfig.label}
          </p>
        </div>
        <div
          style={{
            width: 300,
            height: 110,
            borderRadius: 20,
            background: '#FFFFFF1A',
            border: '2px solid #FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 4,
            paddingLeft: 24,
          }}
        >
          <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: 0, opacity: 0.6 }}>
            หมวดปัญหา
          </p>
          <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16, margin: 0 }}>
            {caseData.problemCategory}
          </p>
        </div>
      </section>
      <section className='mt-4 px-10 flex gap-4'>
        <div
          style={{
            flex: '0 0 70%',
            minHeight: 200,
            borderRadius: 20,
            background: '#333333',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 16, flex: 1 }}>
          <div
            style={{
              flex: `0 0 calc(70% - 16px * 0.3)`,
              borderRadius: 16,
              background: '#191919',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 8 }}>
              <img src='/images/Maintenance/iccf.png' alt='' width={30} height={30} />
              <div>
                <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: 0 }}>บันทึกแจ้งซ่อม</p>
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 12, margin: 0, marginTop: -4 }}>เพิ่มรายละเอียดปัญหาหรือสาเหตุที่พบ แนบรูปภาพหรือวิดีโอ</p>
              </div>
            </div>
            <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: 0, marginTop: 16, paddingLeft: 38 }}>ข้อมูลการแจ้งซ่อม</p>
            <div style={{ paddingLeft: 38, marginTop: 12, display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หมวดหมู่ของปัญหาที่พบ<span style={{ color: '#E94C4C' }}>*</span></p>
                <Select
                  placeholder='กรุณาเลือกหมวดหมู่...'
                  style={{ width: '100%', height: 40, borderRadius: 10 }}
                  suffixIcon={<TbChevronDown style={{ color: '#FCD116', fontSize: 16 }} />}
                  value={formData.category || undefined}
                  onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  options={[
                    { label: 'CCTV', value: 'cctv' },
                    { label: 'Traffic Volume', value: 'traffic_volume' },
                    { label: 'Incident Detection', value: 'incident_detection' },
                    { label: 'Traffic Signal', value: 'traffic_signal' },
                    { label: 'Traffic Lighting', value: 'traffic_lighting' },
                    { label: 'VMS', value: 'vms' },
                  ]}
                />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หน่วยงานรับผิดชอบหรือมอบหมาย<span style={{ color: '#E94C4C' }}>*</span></p>
                <Select
                  placeholder='กรุณาเลือกหน่วยงาน...'
                  style={{ width: '100%', height: 40, borderRadius: 10 }}
                  suffixIcon={<TbChevronDown style={{ color: '#FCD116', fontSize: 16 }} />}
                  value={formData.agency || undefined}
                  onChange={(value) => setFormData(prev => ({ ...prev, agency: value }))}
                  options={[
                    { label: 'หมวดบำรุงทางหลวงชนบทกัลปพฤกษ์', value: 'agency_1' },
                    { label: 'สทช. 1 (ปทุมธานี)', value: 'agency_2' },
                    { label: 'สทช. 2 (นนทบุรี)', value: 'agency_3' },
                    { label: 'สทช. 3 (สมุทรปราการ)', value: 'agency_4' },
                  ]}
                />
              </div>
            </div>
            <div style={{ paddingLeft: 38, marginTop: 12 }}>
              <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>ปัญหาที่พบ<span style={{ color: '#E94C4C' }}>*</span></p>
              <Input.TextArea
                placeholder='กรุณาระบุปัญหาที่พบ...'
                style={{ background: 'transparent', border: '1px solid #FCD116', borderRadius: 10, color: '#FFFFFF', resize: 'none' }}
                autoSize={{ minRows: 3, maxRows: 5 }}
                value={formData.problem}
                onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
              />
            </div>
            <div style={{ paddingLeft: 38, marginTop: 12 }}>
              <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>การดำเนินการหรือวิธีการแก้ไข<span style={{ color: '#E94C4C' }}>*</span></p>
              <Input.TextArea
                placeholder='กรุณาระบุวิธีการแก้ไข...'
                style={{ background: 'transparent', border: '1px solid #FCD116', borderRadius: 10, color: '#FFFFFF', resize: 'none' }}
                autoSize={{ minRows: 3, maxRows: 5 }}
                value={formData.solution}
                onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
              />
            </div>
            <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: 0, marginTop: 16, paddingLeft: 38 }}>ระยะเวลา</p>
            <ConfigProvider locale={thTH}>
              <div style={{ paddingLeft: 38, marginTop: 12, display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่แจ้งซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
                  <DatePicker
                    placeholder='กรุณาเลือกวันที่...'
                    format='DD MMM BBBB'
                    style={{ width: '100%', height: 40, background: 'transparent', border: '1px solid #FCD116', borderRadius: 10 }}
                    suffixIcon={<img src='/images/Maintenance/icdate.png' alt='' width={24} height={24} />}
                    value={formData.reportDate ? dayjs(formData.reportDate, 'DD MMM BBBB', 'th') : null}
                    onChange={(date) => setFormData(prev => ({ ...prev, reportDate: date ? date.format('DD MMM BBBB') : '' }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่ตรวจสอบ<span style={{ color: '#E94C4C' }}>*</span></p>
                  <DatePicker
                    placeholder='กรุณาเลือกวันที่...'
                    format='DD MMM BBBB'
                    style={{ width: '100%', height: 40, background: 'transparent', border: '1px solid #FCD116', borderRadius: 10 }}
                    suffixIcon={<img src='/images/Maintenance/icdate.png' alt='' width={24} height={24} />}
                    value={formData.inspectDate ? dayjs(formData.inspectDate, 'DD MMM BBBB', 'th') : null}
                    onChange={(date) => setFormData(prev => ({ ...prev, inspectDate: date ? date.format('DD MMM BBBB') : '' }))}
                  />
                </div>
              </div>
            </ConfigProvider>
          </div>
          <div
            style={{
              flex: `0 0 calc(30% - 16px * 0.7)`,
              borderRadius: 16,
              background: '#191919',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: 0 }}>รูปภาพหรือวิดิโอ</p>
            <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '12px 0 4px 0' }}>ก่อนซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
            <p style={{ color: '#979797', fontWeight: 400, fontSize: 12, margin: '0 0 8px 0' }}>ลากและวางที่นี่เพื่อดำเนินการต่อ</p>
            <Upload.Dragger
              style={{ background: 'transparent', border: '1px dashed #FCD116', borderRadius: 10, height: 120, textAlign: 'center' }}
              className='maintenance-upload-dragger'
              accept='.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif,.pdf'
            >
              <img src='/images/Maintenance/cloud-upload.png' alt='' width={44} height={44} style={{ display: 'block', margin: '0 auto' }} />
              <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: '4px 0 0 0' }}>ลากหรือวางไฟล์</p>
              <p style={{ color: '#7C7C7C', fontWeight: 400, fontSize: 10, margin: '2px 0 0 0' }}>ไฟล์วิดีโอ MP4, AVI, MOV หรือไฟล์ JPG, PNG, GIF หรือไฟล์ PDF</p>
            </Upload.Dragger>
            {formData.beforeImages > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {Array.from({ length: formData.beforeImages }).map((_, index) => (
                  <div
                    key={index}
                    className={styles.imagePreviewItem}
                    style={{ background: '#2A2A2A' }}
                  >
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src='/images/Maintenance/iccf.png' alt='' width={32} height={32} style={{ opacity: 0.5 }} />
                    </div>
                    <div
                      className={styles.imagePreviewOverlay}
                      onClick={() => handleDeleteBeforeImage(index)}
                    >
                      <TbTrash size={24} color='#FFFFFF' />
                    </div>
                  </div>
                ))}
                {/* PDF mock */}
                <div className={styles.imagePreviewItem} style={{ background: '#FCD116', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <TbFileText size={24} color='#000000' />
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#000000', lineHeight: 1.2 }}>เอกสาร PDF</span>
                  <span style={{ fontSize: 8, color: '#000000' }}>5.9 MB</span>
                </div>
              </div>
            )}
            <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '12px 0 4px 0' }}>หลังซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
            <p style={{ color: '#979797', fontWeight: 400, fontSize: 12, margin: '0 0 8px 0' }}>ลากและวางที่นี่เพื่อดำเนินการต่อ</p>
            <Upload.Dragger
              style={{ background: 'transparent', border: '1px dashed #FCD116', borderRadius: 10, height: 120, textAlign: 'center' }}
              className='maintenance-upload-dragger'
              accept='.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif,.pdf'
            >
              <img src='/images/Maintenance/cloud-upload.png' alt='' width={44} height={44} style={{ display: 'block', margin: '0 auto' }} />
              <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: '4px 0 0 0' }}>ลากหรือวางไฟล์</p>
              <p style={{ color: '#7C7C7C', fontWeight: 400, fontSize: 10, margin: '2px 0 0 0' }}>ไฟล์วิดีโอ MP4, AVI, MOV หรือไฟล์ JPG, PNG, GIF หรือไฟล์ PDF</p>
            </Upload.Dragger>
            {formData.afterImages > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {Array.from({ length: formData.afterImages }).map((_, index) => (
                  <div
                    key={index}
                    className={styles.imagePreviewItem}
                    style={{ background: '#2A2A2A' }}
                  >
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src='/images/Maintenance/iccf.png' alt='' width={32} height={32} style={{ opacity: 0.5 }} />
                    </div>
                    <div
                      className={styles.imagePreviewOverlay}
                      onClick={() => handleDeleteAfterImage(index)}
                    >
                      <TbTrash size={24} color='#FFFFFF' />
                    </div>
                  </div>
                ))}
                {/* PDF mock */}
                <div className={styles.imagePreviewItem} style={{ background: '#FCD116', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <TbFileText size={24} color='#000000' />
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#000000', lineHeight: 1.2 }}>เอกสาร PDF</span>
                  <span style={{ fontSize: 8, color: '#000000' }}>5.9 MB</span>
                </div>
              </div>
            )}
          </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: hasData ? 'flex-start' : 'flex-end', gap: 12, marginTop: 'auto' }}>
            {hasData && (
              <div
                onClick={() => setCloseCaseAfterSave(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  marginRight: 'auto',
                  padding: '6px 16px',
                  borderRadius: 50,
                  border: `1px solid ${closeCaseAfterSave ? '#05F2DB' : '#555'}`,
                  background: closeCaseAfterSave ? 'rgba(5, 242, 219, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    background: closeCaseAfterSave ? '#05F2DB' : '#3C3C3C',
                    position: 'relative',
                    transition: 'background 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      position: 'absolute',
                      top: 1,
                      left: closeCaseAfterSave ? 18 : 2,
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>
                <span style={{ color: closeCaseAfterSave ? '#05F2DB' : '#999', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  ปิด Case หลังบันทึก
                </span>
              </div>
            )}
            <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
              <Button type="primary" size="small" shape="round" icon={<TbPrinter />} style={{ height: 31 }}>
                นำออกเอกสาร
              </Button>
            </ConfigProvider>
            <button className={styles.btnSecondary} style={{ background: '#C4C4C4', color: '#000000' }}>
              ยกเลิก
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleSave}
              style={hasData ? { background: '#05F2DB', color: '#000000' } : undefined}
            >
              {hasData ? 'บันทึก + ปิด Case' : 'บันทึก'}
            </button>
          </div>
        </div>
        <div className='flex flex-col gap-4' style={{ flex: '0 0 30%' }}>
          <div
            style={{
              borderRadius: 20,
              background: '#191919',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src='/images/Maintenance/icf1.png' alt='' width={30} height={30} />
              <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: 0 }}>ข้อมูลโครงการ</p>
            </div>
            <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '12px 0 0 0' }}>{project.projectName}</p>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src='/images/Maintenance/icsc1.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>ผู้รับจ้าง</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>{project.contractor}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src='/images/Maintenance/icsc2.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>หน่วยงานรับผิดชอบ</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>{project.agency}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src='/images/Maintenance/icsc3.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>เลขที่สัญญา</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>{project.contractNo}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src='/images/Maintenance/icsc1.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>เริ่มต้นการรับประกัน</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>{project.warrantyStart}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src='/images/Maintenance/icsc2.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>สิ้นสุดการรับประกัน</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>{project.warrantyEnd}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src='/images/Maintenance/icsc3.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>สถานะค้ำประกัน</p>
                <p style={{ color: project.warrantyStatus === 'expired' ? '#E94C4C' : '#66AEFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>
                  {project.warrantyStatus === 'expired' ? 'หมดค้ำ' : 'ในค้ำ'}
                </p>
              </div>
            </div>
          </div>
          <div
            style={{
              borderRadius: 20,
              background: '#191919',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src='/images/Maintenance/icf1.png' alt='' width={30} height={30} />
              <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: 0 }}>ข้อมูลอุปกรณ์</p>
            </div>
            <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '12px 0 0 0' }}>{device.deviceName}</p>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src='/images/Maintenance/icsc2.1.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>ประเภทอุปกรณ์</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>{device.deviceType}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src='/images/Maintenance/icsc2.2.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>จุดติดตั้ง / สายทาง</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>{device.installPoint}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src='/images/Maintenance/icsc3.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>IP Address</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>{device.ipAddress}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src='/images/Maintenance/icsc4-5.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>วันที่เริ่มออฟไลน์</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>{device.offlineDate || '-'}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src='/images/Maintenance/icsc6.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>จำนวนวันออฟไลน์</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>{device.offlineDays > 0 ? `${device.offlineDays} วัน` : '-'}</p>
              </div>
              {device.hasLive && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 90, height: 69, borderRadius: 10, background: '#66AEFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <img src='/images/Maintenance/iclive.png' alt='' width={30} height={30} />
                    <p style={{ color: '#000000', fontWeight: 400, fontSize: 14, margin: 0 }}>Live</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <ModalSaveSuccess
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isClosingCase={hasData}
        data={{
          caseNo: id,
          deviceName: device.deviceName,
          agency: project.agency,
          warrantyStatus: project.warrantyStatus === 'expired' ? 'หมดค้ำ' : 'ในค้ำ',
          repairDate: formData.reportDate || '-',
        }}
      />
    </div>
  )
}

export default React.memo<Props>(MaintenanceCaseScreen)
