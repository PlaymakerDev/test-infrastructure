"use client"
import React, { useMemo } from 'react'
import {
  TbCalendarEvent,
  TbClipboardList,
  TbHourglassHigh,
  TbUser,
  TbUserShield,
} from 'react-icons/tb'
import ProjectInfoModal, {
  type ProjectInfoField,
} from '@/components/project-info-modal/ProjectInfoModal'
import type { TrafficSignalProject } from '@/features/admin/traffic-signal/overall/data/trafficSignals'

interface Props {
  /** Project to display. `null` keeps the modal closed. */
  project: TrafficSignalProject | null
  onClose: () => void
}

/**
 * Traffic-signal-specific wrapper around the central `ProjectInfoModal`.
 *
 * Mirrors `ModalInfoBridgeLighting` so both features render the same dialog
 * layout — caller owns "which project is selected" state.
 */
const ModalInfoTrafficSignal: React.FC<Props> = ({ project, onClose }) => {
  const rows: ProjectInfoField[][] = useMemo(() => {
    if (!project) return []
    return [
      [
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
        // TODO: backend to expose "ผู้ว่าจ้าง" — currently hardcoded.
        {
          icon: <TbUser size={30} />,
          label: 'ผู้ว่าจ้าง',
          value: 'สำนักอำนวยความปลอดภัย',
        },
      ],
      // TODO: wire warranty dates + contractor from `/manage/contract/{id}`
      // once backend confirms the ID mapping (project.id from central list).
      [
        {
          icon: <TbCalendarEvent size={30} />,
          label: 'เริ่มต้นการรับประกัน',
          value: '25 พ.ค. 2568',
        },
        {
          icon: <TbCalendarEvent size={30} />,
          label: 'สิ้นสุดการรับประกัน',
          value: '26 พ.ค. 2570',
        },
        {
          icon: <TbHourglassHigh size={30} color='#05F2DB' />,
          label: 'ระยะเวลาที่เหลือ',
          value: <span style={{ color: '#05F2DB' }}>106 วัน</span>,
        },
        {
          icon: <TbUser size={30} />,
          label: 'ผู้รับจ้าง',
          value: (
            <>
              FTD
              <br />
              บริษัท เฟิร์สเทค ดีไซน์ จำกัด
            </>
          ),
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
          : project
            ? { text: 'หมดค้ำ', color: '#979797' }
            : undefined
      }
      description={project?.projectName}
      rows={rows}
    />
  )
}

export default React.memo(ModalInfoTrafficSignal)
