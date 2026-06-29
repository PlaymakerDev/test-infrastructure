"use client"
import React from 'react'
import { DeviceInfo, ProjectInfo } from '../data/mockData'

interface InfoCellProps {
  icon: string
  label: string
  value: React.ReactNode
}

const InfoCell: React.FC<InfoCellProps> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <img src={icon} alt='' width={30} height={30} style={{ marginBottom: 8 }} />
    <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0 }}>{label}</p>
    <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0' }}>{value}</p>
  </div>
)

interface Props {
  project: ProjectInfo
  device: DeviceInfo
}

const CaseInfoSidebar: React.FC<Props> = ({ project, device }) => (
  <div className='flex flex-col gap-4' style={{ flex: '0 0 30%' }}>
    <div style={{ borderRadius: 20, background: '#191919', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src='/atlas/images/Maintenance/icf1.png' alt='' width={30} height={30} />
        <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: 0 }}>ข้อมูลโครงการ</p>
      </div>
      <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '12px 0 0 0' }}>{project.projectName}</p>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <InfoCell icon='/atlas/images/Maintenance/icsc1.png' label='ผู้รับจ้าง' value={project.contractor} />
        <InfoCell icon='/atlas/images/Maintenance/icsc2.png' label='หน่วยงานรับผิดชอบ' value={project.agency} />
        <InfoCell icon='/atlas/images/Maintenance/icsc3.png' label='เลขที่สัญญา' value={project.contractNo} />
        <InfoCell icon='/atlas/images/Maintenance/icsc1.png' label='เริ่มต้นการรับประกัน' value={project.warrantyStart} />
        <InfoCell icon='/atlas/images/Maintenance/icsc2.png' label='สิ้นสุดการรับประกัน' value={project.warrantyEnd} />
        <InfoCell
          icon='/atlas/images/Maintenance/icsc3.png'
          label='สถานะค้ำประกัน'
          value={
            <span style={{ color: project.warrantyStatus === 'expired' ? '#E94C4C' : '#66AEFF' }}>
              {project.warrantyStatus === 'expired' ? 'หมดค้ำ' : 'ในค้ำ'}
            </span>
          }
        />
      </div>
    </div>
    <div style={{ borderRadius: 20, background: '#191919', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src='/atlas/images/Maintenance/icf1.png' alt='' width={30} height={30} />
        <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: 0 }}>ข้อมูลอุปกรณ์</p>
      </div>
      <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '12px 0 0 0' }}>{device.deviceName}</p>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <InfoCell icon='/atlas/images/Maintenance/icsc2.1.png' label='ประเภทอุปกรณ์' value={device.deviceType} />
        <InfoCell icon='/atlas/images/Maintenance/icsc2.2.png' label='จุดติดตั้ง / สายทาง' value={device.installPoint} />
        <InfoCell icon='/atlas/images/Maintenance/icsc3.png' label='IP Address' value={device.ipAddress} />
        <InfoCell icon='/atlas/images/Maintenance/icsc4-5.png' label='วันที่เริ่มออฟไลน์' value={device.offlineDate || '-'} />
        <InfoCell icon='/atlas/images/Maintenance/icsc6.png' label='จำนวนวันออฟไลน์' value={device.offlineDays > 0 ? `${device.offlineDays} วัน` : '-'} />
        {device.hasLive && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 90, height: 69, borderRadius: 10, background: '#66AEFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <img src='/atlas/images/Maintenance/iclive.png' alt='' width={30} height={30} />
              <p style={{ color: '#000000', fontWeight: 400, fontSize: 14, margin: 0 }}>Live</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)

export default React.memo(CaseInfoSidebar)
