"use client"
import React, { useMemo } from 'react'
import {
  TbCalendarEvent,
  TbClipboardList,
  TbHourglassHigh,
  TbLock,
  TbUser,
  TbUserShield,
} from 'react-icons/tb'
import ProjectInfoModal, {
  type ProjectInfoField,
} from '@/components/project-info-modal/ProjectInfoModal'
import type { BridgeProject } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

interface Props {
  /** Bridge to display. `null` keeps the modal closed. */
  bridge: BridgeProject | null
  onClose: () => void
}

/**
 * Bridge-lighting-specific wrapper around the central `ProjectInfoModal`.
 *
 * Encapsulates the bridge → row mapping in one place so every spot that
 * shows project info (overall table info icons, detail page title bar)
 * stays in sync. State (which bridge is selected) is owned by the caller.
 */
const ModalInfoBridgeLighting: React.FC<Props> = ({ bridge, onClose }) => {
  const rows: ProjectInfoField[][] = useMemo(() => {
    if (!bridge) return []
    return [
      [
        {
          icon: <TbLock size={30} />,
          label: 'รหัสโครงการ',
          value: `MT${bridge.id.replace(/[^\d]/g, '').padStart(5, '0')}`,
        },
        {
          icon: <TbClipboardList size={30} />,
          label: 'เลขที่สัญญา',
          value: bridge.contractNo,
        },
        {
          icon: <TbUserShield size={30} />,
          label: 'หน่วยงานรับผิดชอบ',
          value: bridge.bureau,
        },
        {
          icon: <TbUser size={30} />,
          label: 'ผู้ว่าจ้าง',
          value: 'สำนักอำนวยความปลอดภัย',
        },
      ],
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
  }, [bridge])

  return (
    <ProjectInfoModal
      open={bridge !== null}
      onClose={onClose}
      title='ข้อมูลโครงการ'
      badge={
        bridge?.warranty === 'in-warranty'
          ? { text: 'ในค้ำ', color: '#05F2DB' }
          : bridge
            ? { text: 'หมดค้ำ', color: '#979797' }
            : undefined
      }
      description={bridge?.projectName}
      rows={rows}
    />
  )
}

export default React.memo(ModalInfoBridgeLighting)
