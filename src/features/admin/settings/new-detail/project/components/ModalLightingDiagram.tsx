"use client"
import { ConfigProvider, Modal } from 'antd'
import React, { useCallback } from 'react'
import { TbCircuitCapacitor } from 'react-icons/tb'
import DiagramIframe from '@/features/admin/traffic-lighting/shared/DiagramIframe'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetDiagramModalData } from '@/stores/reducers/modal/customModalSlice'

interface Props {

}

/** ผังวงจร viewer for a Street Light (solution_type 6) row, opened from
 *  TableSolution's "รายการอุปกรณ์" column via the `diagram_modal` Redux state.
 *  Mounted once on the screen, like the other viewers here.
 *
 *  This replaces a `window.open` onto
 *  `${NEXT_PUBLIC_HOST_BACKEND}/lighting/diagram?imei=…`. That URL is not
 *  broken — the lighting service serves the standalone diagram EDITOR there
 *  and does honour the `?imei=` deep link (`static/js/init.js`) — but it is a
 *  separate, unauthenticated page in another tab. What belongs on a settings
 *  row is the read-only viewer the traffic-lighting detail page already
 *  embeds (`/lighting/diagram/view/{imei}`), so this mounts that same
 *  `DiagramIframe`: identical sizing handshake, and the same
 *  "ไม่มีข้อมูลวงจรไฟฟ้า" placeholder for a device whose diagram has
 *  connections saved but no components. */
const ModalLightingDiagram: React.FC<Props> = (props) => {
  const { } = props
  const { open, imei, record, item } = useAppSelector((state) => state.custom_modal.diagram_modal)
  const dispatch = useAppDispatch()

  const handleClose = useCallback(() => {
    dispatch(resetDiagramModalData())
  }, [dispatch])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { contentBg: '#1A1A1A', headerBg: '#1A1A1A', footerBg: '#1A1A1A', colorIcon: '#FFFFFF', titleColor: '#FFFFFF', borderRadiusLG: 16 },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={handleClose}
        footer={null}
        destroyOnHidden
        width={1000}
        styles={{ container: { padding: '28px 32px', borderRadius: 16, background: '#1A1A1A' }, mask: { background: 'rgba(0,0,0,0.55)' } }}
        title={null}
      >
        <div className='mb-1 flex items-center gap-2'>
          <TbCircuitCapacitor size={22} className='text-(--default-blue)' />
          <h3 className='text-white text-xl font-bold m-0'>ผังวงจร</h3>
        </div>
        <p className='text-(--default-blue) fs-12 break-words m-0 mb-4'>
          {[record?.solution_name, item?.location_name].filter(Boolean).join(' · ') || '-'}
          {imei ? ` · IMEI ${imei}` : ''}
        </p>

        {/* `open` gates the mount so the iframe's ResizeObserver measures a
          * laid-out container rather than a zero-size one behind the mask. */}
        {open && imei ? (
          <DiagramIframe imei={imei} minHeight={420} className='rounded-lg overflow-hidden bg-black' />
        ) : null}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalLightingDiagram)
