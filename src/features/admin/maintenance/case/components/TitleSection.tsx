"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'

interface CaseMockData {
  deviceName: string
  warranty: 'ในค้ำ' | 'หมดค้ำ'
  status: 'ออนไลน์' | 'ออฟไลน์'
}

const CASE_MOCK_DATA: Record<string, CaseMockData> = {
  'C-20260331-0050': { deviceName: 'DRR-TS-BulletCAM01 – ฝั่งธนบุรี', warranty: 'ในค้ำ', status: 'ออนไลน์' },
  'C-20260330-0012': { deviceName: 'DRR-TS-AICAM03 – สาทร', warranty: 'ในค้ำ', status: 'ออฟไลน์' },
  'C-20260329-0088': { deviceName: 'DRR-TS-NVR01 – กัลปพฤกษ์', warranty: 'ในค้ำ', status: 'ออนไลน์' },
  'C-20260328-0015': { deviceName: 'DRR-TS-AICAM07 – คลองสาน', warranty: 'ในค้ำ', status: 'ออนไลน์' },
  'C-20260327-0042': { deviceName: 'DRR-TS-NVR02 – บางรัก', warranty: 'ในค้ำ', status: 'ออฟไลน์' },
}

const DEFAULT_MOCK: CaseMockData = { deviceName: 'DRR-TS-BulletCAM08 – ฝั่งพระนคร', warranty: 'หมดค้ำ', status: 'ออฟไลน์' }

interface Props {
  caseId: string
}

const TitleSection: React.FC<Props> = ({ caseId }) => {
  const router = useRouter()
  const mockData = CASE_MOCK_DATA[caseId] || DEFAULT_MOCK

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/maintenance')
    }
  }

  return (
    <div className='pt-3'>
      <section className='flex items-start gap-3 p-4 px-10' style={{ background: '#363636' }}>
        <TbArrowBigLeftFilled
          className='text-[24px] cursor-pointer mt-1.5 shrink-0'
          style={{ color: '#FCD116' }}
          onClick={handleBack}
        />
        <div className='min-w-0 flex-1'>
          <h1 className='text-[24px] font-bold'>
            <span style={{ color: '#FCD116' }}>Case No.</span>{' '}
            <span style={{ color: '#FFFFFF' }}>{caseId}</span>
          </h1>
          <div className='flex items-center gap-2 mt-1'>
            <p className='text-[14px] font-normal' style={{ color: '#FFFFFF' }}>
              {mockData.deviceName}
            </p>
            <span
              className='inline-flex items-center px-3 py-0.5 rounded-full text-[12px] font-normal'
              style={{ border: `1px solid ${mockData.warranty === 'ในค้ำ' ? '#66AEFF' : '#979797'}`, color: mockData.warranty === 'ในค้ำ' ? '#66AEFF' : '#979797' }}
            >
              {mockData.warranty}
            </span>
            <span
              className='inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[12px] font-normal'
              style={{ border: `1px solid ${mockData.status === 'ออนไลน์' ? '#66AEFF' : '#E94C4C'}`, color: mockData.status === 'ออนไลน์' ? '#66AEFF' : '#E94C4C' }}
            >
              <img src={`/atlas/images/statistics/${mockData.status === 'ออนไลน์' ? 'iconconnect' : 'iconnoconnect'}.png`} alt="" width={14} height={14} />
              {mockData.status}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
