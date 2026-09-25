'use client'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { ConfigProvider, Modal } from 'antd'
import { SYSTEMS, SYSTEM_BRIGHT, type SystemType } from '@/features/admin/dashboard/data/systems'
import { DEFAULT_NOTICE_TITLE, groupNoticeMessages, type NoticeText } from './noticeRules'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

interface Props {
  /** One chip per system. The modal is closed while this is null or empty. */
  types: SystemType[] | null
  /** The backend's title + text per system; systems without one get the defaults. */
  notices: Partial<Record<SystemType, NoticeText>>
  /** Changes on every opening, so the countdown restarts with it. */
  sessionId: number
  durationMs: number
  onClose: () => void
}

/** Drains along the bottom edge over `durationMs` — the notice closes itself,
 *  and this is the only hint that it will. */
const CountdownBar: React.FC<{ durationMs: number }> = ({ durationMs }) => {
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const animation = barRef.current?.animate(
      [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
      { duration: durationMs, easing: 'linear', fill: 'forwards' },
    )
    return () => animation?.cancel()
  }, [durationMs])
  return (
    <div className='mt-6 h-[3px] w-full overflow-hidden rounded-full bg-(--mid-gray)' aria-hidden>
      <div ref={barRef} className='h-full w-full origin-left bg-(--yellow)' />
    </div>
  )
}

/** "ขออภัยในความไม่สะดวก" — a system (or several) is under maintenance.
 *  Chip colours are the same bright set as the "การทำงาน" chips; labels are
 *  the navbar menu names, since the notice is about a menu. */
const MaintenanceNoticeModal: React.FC<Props> = ({ types, notices, sessionId, durationMs, onClose }) => {
  const list = useMemo(() => types ?? [], [types])
  const single = list.length === 1
  // Systems sharing a title + text show it once, under that title. Different
  // ones each name their own systems and title, under the generic heading —
  // one title up top would read as applying to all of them.
  const messages = useMemo(() => groupNoticeMessages(list, notices), [list, notices])
  const heading = messages.length === 1 ? messages[0].title : DEFAULT_NOTICE_TITLE

  // Take focus onto the content as it mounts. AntD's focus trap otherwise
  // lands it on the close button, whose focus ring the design doesn't have;
  // Tab still reaches the button (ring and all) and Esc still closes.
  const focusOnMount = useCallback((el: HTMLDivElement | null) => {
    el?.focus({ preventScroll: true })
  }, [])

  // AntD hands Esc only to the most recently opened overlay, and the
  // dashboard — where the login notice lands — keeps others open, so Esc
  // never reached this one there. Listen for it directly while open.
  const open = list.length > 0
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <ConfigProvider
      theme={{ components: { Modal: { contentBg: '#1A1A1A', headerBg: '#1A1A1A', colorIcon: '#FFFFFF', colorIconHover: '#FFFFFF', borderRadiusLG: 16 } } }}
    >
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title={null}
        centered
        width={{ xs: '92vw', sm: 560, md: 680, lg: 760 }}
        mask={{ blur: true }}
        destroyOnHidden
        aria-labelledby='maintenance-notice-title'
      >
        <div ref={focusOnMount} tabIndex={-1} className='flex flex-col items-center text-center px-1 sm:px-8 pt-8 pb-2 outline-none'>
          <div className='flex flex-wrap justify-center gap-2'>
            {list.map((type) => (
              <span
                key={type}
                className={`inline-flex items-center rounded-full font-bold leading-tight ${
                  single ? 'px-5 py-1 text-[24px] sm:text-[30px]' : 'px-4 py-0.5 text-[16px] sm:text-[18px]'
                }`}
                style={{ border: `2px solid ${SYSTEM_BRIGHT[type]}`, color: SYSTEM_BRIGHT[type] }}
              >
                {SYSTEMS[type].label}
              </span>
            ))}
          </div>
          <h2 id='maintenance-notice-title' className='mt-5 mb-0 font-bold text-white text-[20px] sm:text-[24px]'>
            {heading}
          </h2>
          <div className='mt-2 flex flex-col gap-2'>
            {messages.map((message) => (
              <p key={message.systems.join(',')} className='m-0 fs-12' style={{ color: '#C9C9C9' }}>
                {messages.length > 1 && (
                  <>
                    <span className='font-bold'>
                      {message.systems.map((type, i) => (
                        <React.Fragment key={type}>
                          {i > 0 && ', '}
                          <span style={{ color: SYSTEM_BRIGHT[type] }}>{SYSTEMS[type].label}</span>
                        </React.Fragment>
                      ))}
                      {' : '}
                    </span>
                    <span className='font-bold text-white'>{message.title}</span>
                    <br />
                  </>
                )}
                {message.lines.map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </div>
          <img
            src={`${BASE_PATH}/images/inconvenience/img-inconvenience.svg`}
            alt=''
            width={390}
            height={389}
            className='mt-6 h-auto w-[min(390px,68vw)]'
          />
          {open && <CountdownBar key={sessionId} durationMs={durationMs} />}
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(MaintenanceNoticeModal)
