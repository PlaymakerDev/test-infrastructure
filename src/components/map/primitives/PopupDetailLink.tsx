"use client"
import React from 'react'
import { Button, ConfigProvider } from 'antd'
import { theme } from '@/configs/antd/themeConfig'

/** "ดูเพิ่มเติม" action button for map-marker popups.
 *
 *  UI mirrors the VMS overall map popup's button (antd `type='primary'` /
 *  `shape='round'` / `size='small'` / `block`) so every feature's popup shares
 *  the same call-to-action.
 *
 *  Map popups render in a DETACHED React root (see `popupHelper.showReactPopup`
 *  → `createRoot`), OUTSIDE the app's root ConfigProvider — so we re-apply the
 *  app theme here, otherwise the antd Button falls back to its default blue
 *  instead of the yellow primary. Navigation arrives as an `onNavigate`
 *  callback captured by the map component (which IS inside the router
 *  provider); clicking runs a client-side `router.push`, which also prepends
 *  the deploy basePath (e.g. `/atlas`) automatically. */
export const PopupDetailLink: React.FC<{
  /** App-relative detail URL, e.g. `/admin/cctv/detail/123?dept_id=50`. */
  url: string
  /** Client-side navigator captured from the map component (`router.push`). */
  onNavigate?: (url: string) => void
}> = ({ url, onNavigate }) => {
  return (
    <div className='mt-2'>
      <ConfigProvider theme={{ ...theme.theme }}>
        <Button
          htmlType='button'
          type='primary'
          size='small'
          shape='round'
          block
          onClick={() => onNavigate?.(url)}
        >
          <p className='fs-12'>ดูเพิ่มเติม</p>
        </Button>
      </ConfigProvider>
    </div>
  )
}

export default PopupDetailLink
