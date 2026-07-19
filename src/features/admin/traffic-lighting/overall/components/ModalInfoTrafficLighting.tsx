"use client"
import React, { useMemo } from 'react'
import {
  TbClipboardList,
  TbBulb,
  TbLock,
  TbMapPin,
  TbPlugConnected,
  TbUser,
  TbUserShield,
} from 'react-icons/tb'
import ProjectInfoModal, {
  type ProjectInfoField,
} from '@/components/project-info-modal/ProjectInfoModal'
import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'

interface Props {
  project: TrafficLightingProject | null
  onClose: () => void
}

const ModalInfoTrafficLighting: React.FC<Props> = ({ project, onClose }) => {
  const rows: ProjectInfoField[][] = useMemo(() => {
    if (!project) return []
    return [
      [
        {
          icon: <TbLock size={30} />,
          label: 'รหัสโครงการ',
          value: project.projectId != null ? String(project.projectId) : '-',
        },
        {
          icon: <TbClipboardList size={30} />,
          label: 'เลขที่สัญญา',
          value: project.contractNo,
        },
        {
          icon: <TbUserShield size={30} />,
          label: 'หน่วยงานรับผิดชอบ',
          value: project.bureau,
        },
        {
          icon: <TbMapPin size={30} />,
          label: 'สายทาง',
          value: project.roadCode || '-',
        },
      ],
      [
        {
          icon: <TbMapPin size={30} />,
          label: 'จุดติดตั้ง',
          value: project.installPoint || '-',
        },
        {
          icon: <TbBulb size={30} />,
          label: 'ประเภท / จำนวนอุปกรณ์',
          value: `${project.equipment.type || '-'} / ${project.equipment.count ?? '-'} จุด`,
        },
        {
          icon: <TbPlugConnected size={30} />,
          label: 'สถานะการเชื่อมต่อ',
          value: project.connection === 'online'
            ? 'ออนไลน์'
            : project.connection === 'offline' ? 'ออฟไลน์' : '-',
        },
        {
          icon: <TbUser size={30} />,
          label: 'Phase',
          value: project.phase != null ? `${project.phase} Phase` : '-',
        },
      ],
    ]
  }, [project])

  return (
    <ProjectInfoModal
      open={project !== null}
      onClose={onClose}
      title='ข้อมูลโครงการ'
      badge={
        project?.warranty === 'in-warranty'
          ? { text: 'ในค้ำ', color: '#05F2DB' }
          : project?.warranty === 'expired'
            ? { text: 'หมดค้ำ', color: '#979797' }
            : undefined
      }
      description={project?.projectName}
      rows={rows}
    />
  )
}

export default React.memo(ModalInfoTrafficLighting)
