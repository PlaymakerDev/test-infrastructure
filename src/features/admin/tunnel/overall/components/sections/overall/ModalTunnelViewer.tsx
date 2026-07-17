"use client"
import React from 'react'
import { Modal } from 'antd'
import { TbArrowBigLeftFilled } from 'react-icons/tb'

export interface TunnelViewerTarget {
  /** Signed URL that logs the iframe into the tunnel dashboard. */
  url: string
  /** Header title — usually the solution name / จุดติดตั้ง. */
  title: string
  /** Small subtitle — usually the road code (`ชม.3029`). */
  subtitle?: string
}

interface Props {
  open: boolean
  target: TunnelViewerTarget | null
  onClose: () => void
}

/** Near-fullscreen modal that embeds the tunnel's live-control dashboard.
 *
 *  Design notes:
 *  - Modal is full-width and pinned to the top (`top: 0`) so it reads as a
 *    site-owned page rather than a floating dialog. antd's default centering
 *    would leave stripes of backdrop on all sides.
 *  - `closable={false}` — antd's default × is replaced with an in-body header
 *    that mirrors the app's detail-page pattern (yellow `TbArrowBigLeftFilled`
 *    on desktop, `< ย้อนกลับ` link on mobile) so the modal reads as a real
 *    "sub-page" of the site rather than a floating dialog.
 *  - `destroyOnHidden` unmounts the iframe on close so the tunnel session
 *    stops (no background timers / video streams eating CPU).
 *  - `sandbox` is intentionally omitted — the target is same-origin
 *    (`its.drr.go.th`) and needs cookies + navigation to complete its own
 *    login flow; sandboxing without `allow-same-origin allow-scripts` would
 *    break the token handshake.
 *  - `referrerPolicy="no-referrer"` — the URL contains a token; don't leak
 *    it via the Referer header. */
const ModalTunnelViewer: React.FC<Props> = ({ open, target, onClose }) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      closable={false}
      width='100%'
      centered={false}
      style={{ top: 0, paddingBottom: 0, maxWidth: '100%' }}
      styles={{
        header: { display: 'none' },
        body: {
          padding: 0,
          height: 'calc(100vh - 20px)',
          background: '#0b0b0b',
        },
      }}
      title={null}
      className='tunnel-viewer-modal'
    >
      <div className='flex flex-col h-full'>
        {/* Detail-page-style header — yellow back arrow (desktop) + text link
            (mobile), title in yellow. Matches TitleSection.tsx patterns
            across vms/detail, tracking/detail/wim etc. */}
        <div className='py-4 shrink-0' style={{ background: '#191919' }}>
          <p
            className='block mb-3 lg:hidden text-(--yellow) cursor-pointer'
            onClick={onClose}
          >
            &lt; ย้อนกลับ
          </p>
          <section className='flex items-start gap-3'>
            <TbArrowBigLeftFilled
              className='fs-24 text-(--yellow) cursor-pointer mt-2 hidden lg:block'
              onClick={onClose}
            />
            <div className='flex-1 min-w-0'>
              <h1 className='text-(--yellow) truncate mb-0'>
                {target?.title ?? '-'}
              </h1>
              {target?.subtitle && (
                <p className='text-(--yellow) mb-0'>{target.subtitle}</p>
              )}
            </div>
          </section>
        </div>

        {/* Iframe fills the remaining space. `key` on the URL forces a fresh
            mount when the user opens a different tunnel back-to-back so we
            don't show the previous tunnel's cached page for a frame. */}
        <div className='flex-1 min-h-0'>
          {target?.url ? (
            <iframe
              key={target.url}
              src={target.url}
              title={target.title}
              referrerPolicy='no-referrer'
              className='w-full h-full block border-0'
              allow='fullscreen'
            />
          ) : null}
        </div>
      </div>
    </Modal>
  )
}

export default React.memo(ModalTunnelViewer)
