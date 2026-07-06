"use client"
import React from 'react'
import { ConfigProvider, Modal, Empty, Skeleton } from 'antd'
import { TbShieldFilled } from 'react-icons/tb'
import { useQuery } from '@tanstack/react-query'
import { useTrafficVolumeLicense } from '@/hooks/queries/traffic-volume'
import { getDepartmentByRoadAPI } from '@/services/routes/SharedService'

/** The solution (จุดติดตั้ง) whose camera licenses to show. */
export interface LicenseModalSolution {
  id: string
  /** solution_name (จุดติดตั้ง) — shown in the subtitle. */
  name: string
  roadId: string
}

interface Props {
  open: boolean
  solution: LicenseModalSolution | null
  onClose: () => void
}

/** "ข้อมูล License" modal — lists a solution's cameras with their license key &
 *  type. Source: GET /counting/license/{solution_id}. Mirrors the incident
 *  License modal so both features read identically. */
const LicenseModal: React.FC<Props> = ({ open, solution, onClose }) => {
  const { data, isLoading } = useTrafficVolumeLicense(open ? solution?.id : undefined)

  // หน่วยงานที่รับผิดชอบ — same source/cache as the Project Info modal.
  const { data: dept } = useQuery({
    queryKey: ['department_by_road', solution?.roadId],
    queryFn: () => getDepartmentByRoadAPI({ road_id: Number(solution!.roadId) }).then((r) => r.data.department_name),
    enabled: open && !!solution?.roadId,
  })

  const licenses = data?.license ?? []

  const titleNode = (
    <div className='flex items-center gap-2'>
      <TbShieldFilled className='fs-22' style={{ color: '#66AEFF' }} />
      <span className='fs-18 font-semibold' style={{ color: '#66AEFF' }}>
        ข้อมูล License
      </span>
    </div>
  )

  return (
    <ConfigProvider theme={{ components: { Modal: { colorIcon: '#FFFFFF', borderRadiusLG: 20 } } }}>
      <Modal
        title={titleNode}
        open={open}
        onOk={onClose}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={900}
        classNames={{ container: 'border-2! border-(--default-blue)!' }}
      >
        <p className='fs-12 text-gray-300 mb-4'>
          {data?.solution.name || solution?.name || '-'}
          <span className='text-gray-500 mx-1'>•</span>
          {dept ?? '-'}
        </p>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : licenses.length === 0 ? (
          <Empty description='ไม่พบ License ของจุดติดตั้งนี้' />
        ) : (
          <div className='rounded-lg overflow-hidden border border-white/10'>
            {/* Header */}
            <div className='grid grid-cols-[56px_1fr_220px_120px] gap-4 px-4 py-2.5' style={{ background: '#4F84F0' }}>
              <span className='fs-13 font-semibold text-white text-center'>ลำดับ</span>
              <span className='fs-13 font-semibold text-white'>ชื่อกล้อง</span>
              <span className='fs-13 font-semibold text-white'>License Key</span>
              <span className='fs-13 font-semibold text-white text-center'>ประเภท</span>
            </div>
            {/* Rows */}
            {licenses.map((lic, i) => (
              <div
                key={lic.camera.id}
                className='grid grid-cols-[56px_1fr_220px_120px] gap-4 px-4 py-3 border-b border-white/10 last:border-b-0'
              >
                <span className='fs-13 text-gray-400 text-center'>{i + 1}</span>
                <span className='fs-13 text-white'>{lic.camera.name}</span>
                <span className='fs-13 text-(--yellow) break-all'>{lic.key || '-'}</span>
                <span className='fs-13 text-gray-300 text-center'>{lic.type || '-'}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(LicenseModal)
