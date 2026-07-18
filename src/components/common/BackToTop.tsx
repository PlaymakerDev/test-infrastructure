"use client"
import React from 'react'
import { FloatButton } from 'antd'
import { TbArrowUp } from 'react-icons/tb'

/**
 * Global back-to-top button — mounted ONCE in the admin layout, so every
 * admin page gets it without per-page wiring. antd's FloatButton.BackTop
 * tracks window scroll itself: hidden at the top, fades in after the page
 * is scrolled `visibilityHeight` px, smooth-scrolls to 0 on click.
 *
 * Pages that never scroll the window (dashboard desktop is h-screen
 * overflow-hidden) therefore never show it — no per-page opt-out needed.
 * Inner scroll containers (e.g. the dashboard mobile bottom sheet) are NOT
 * covered; mount a second instance with `target` pointing at that element
 * if one ever needs it.
 */
const BackToTop: React.FC = () => (
  <FloatButton.BackTop
    type='primary'
    visibilityHeight={300}
    icon={<TbArrowUp />}
    // Clear of the map attribution / chat launchers that sit bottom-left.
    style={{ insetInlineEnd: 20, insetBlockEnd: 20 }}
  />
)

export default React.memo(BackToTop)
