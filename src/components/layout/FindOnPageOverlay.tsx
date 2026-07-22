"use client"
import React, { useCallback, useEffect, useRef } from 'react'
import {
  TbSearch,
  TbChevronUp,
  TbChevronDown,
  TbX,
} from 'react-icons/tb'
import { AnimatePresence, motion } from 'motion/react'
import { useFindOnPage } from '@/utils/hooks/useFindOnPage'

interface Props {
  open: boolean
  onClose: () => void
}

/** Chrome/Edge Ctrl+F clone. Pinned top-right below the navbar, matches the
 *  browser UI users already know (input · counter · ↑ · ↓ · ×) but styled
 *  with the app's yellow + trapezoid feel.
 *
 *  Search root = the app's `<main>` element (Layout.tsx wraps every page in
 *  it), so the navbar / sidebar text can never match — otherwise typing a
 *  menu name would match itself. */
const FindOnPageOverlay: React.FC<Props> = ({ open, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const getRoot = useCallback(
    () => (typeof document === 'undefined' ? null : document.querySelector('main')),
    [],
  )

  const { query, setQuery, count, activeIndex, next, prev, clear } =
    useFindOnPage(getRoot, open)

  // Autofocus the input on open — the whole "Ctrl+F feel" hinges on typing
  // immediately without an extra click. `preventScroll` because the input
  // sits at top:76px and focusing would otherwise scroll the page up on some
  // browsers when the user just triggered a scroll.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true })
        inputRef.current?.select()
      }, 60)
      return () => window.clearTimeout(t)
    }
  }, [open])

  // Global Escape close — mirrors the browser's own Ctrl+F. Only bound while
  // the overlay is open so it doesn't fight other listeners at rest.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleClose = useCallback(() => {
    clear()
    onClose()
  }, [clear, onClose])

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Enter → next, Shift+Enter → previous (same as browser Ctrl+F).
      if (e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) prev()
        else next()
      }
    },
    [next, prev],
  )

  return (
    <>
      {/* Raw, unprocessed CSS — NOT in src/styles/custom.css. lightningcss
       *  (used by both @tailwindcss/postcss and Next's own build pipeline)
       *  doesn't parse the CSS Custom Highlight API's `::highlight()`
       *  pseudo-element yet and fails the build if this rule sits in a
       *  Tailwind-processed stylesheet. Plain <style> children bypass that
       *  pipeline entirely — browsers that support the Highlight API read it
       *  fine at runtime. Two custom highlights are painted:
       *    `find-on-page`        — every match (softer yellow)
       *    `find-on-page-active` — the currently-focused match (brand yellow)
       *  `find-on-page-active` is set AFTER `find-on-page`, so it wins the paint. */}
      <style>{`
        *::highlight(find-on-page) {
          background-color: rgba(252, 209, 22, 0.35);
          color: inherit;
        }
        *::highlight(find-on-page-active) {
          background-color: #FCD116;
          color: #212121;
        }
      `}</style>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            // Layout:
            //  - Mobile  (<sm): full-width bar with 8px margins so nothing gets
            //    clipped off-screen; input flexes to fill available space.
            //  - Desktop (≥sm): compact fit-content bar pinned to the top-right
            //    like Chrome/Edge's own Ctrl+F chip.
            className='fixed left-2 right-2 sm:left-auto sm:right-4 z-50 flex items-center gap-1.5 sm:gap-2 pl-3 pr-1.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md'
            style={{
              // Track the CSS variable — the navbar can grow on some layouts
              // and hardcoding 80px would leave a visible gap or overlap.
              top: 'calc(var(--nav-h, 72px) + 8px)',
              background: 'rgba(20, 20, 20, 0.92)',
              border: '1px solid rgba(252, 209, 22, 0.35)',
              boxShadow:
                '0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(252,209,22,0.08), 0 0 22px rgba(252,209,22,0.18)',
            }}
            role='dialog'
            aria-label='ค้นหาในหน้า'
          >
            <TbSearch className='text-(--yellow) shrink-0' size={18} />

            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder='ค้นหาในหน้านี้…'
              // `min-w-0` is REQUIRED alongside `flex-1` — without it a flex
              // child's implicit `min-width: auto` refuses to shrink below its
              // intrinsic input width, pushing the buttons off-screen on mobile.
              className='bg-transparent outline-none border-0 text-white text-sm flex-1 min-w-0 sm:flex-none sm:w-52 placeholder:text-white/40'
              aria-label='คำค้น'
            />

            <span
              className='fs-12 tabular-nums shrink-0 min-w-10 sm:min-w-14 text-right'
              style={{ color: count === 0 && query ? '#E94C4C' : 'rgba(255,255,255,0.6)' }}
              aria-live='polite'
            >
              {query ? `${activeIndex}/${count}` : ''}
            </span>

            <div className='h-6 w-px bg-white/15 shrink-0' aria-hidden />

            <button
              type='button'
              onClick={prev}
              disabled={count === 0}
              title='ก่อนหน้า (Shift+Enter)'
              className='p-2 sm:p-1.5 rounded-full text-white/80 hover:text-(--yellow) hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/80 transition-colors cursor-pointer disabled:cursor-not-allowed'
              aria-label='ผลก่อนหน้า'
            >
              <TbChevronUp size={16} />
            </button>

            <button
              type='button'
              onClick={next}
              disabled={count === 0}
              title='ถัดไป (Enter)'
              className='p-2 sm:p-1.5 rounded-full text-white/80 hover:text-(--yellow) hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/80 transition-colors cursor-pointer disabled:cursor-not-allowed'
              aria-label='ผลถัดไป'
            >
              <TbChevronDown size={16} />
            </button>

            <button
              type='button'
              onClick={handleClose}
              title='ปิด (Esc)'
              className='p-2 sm:p-1.5 rounded-full text-white/70 hover:text-white hover:bg-red-500/20 transition-colors cursor-pointer'
              aria-label='ปิดค้นหา'
            >
              <TbX size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default React.memo(FindOnPageOverlay)
