"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/** Result of a find-on-page session. Kept tiny so the overlay component can
 *  destructure the whole thing and let React memo-diff on individual fields. */
export interface UseFindOnPageResult {
  query: string
  setQuery: (q: string) => void
  /** Total number of matches for the current query. */
  count: number
  /** 1-based index of the active match (0 when no matches). */
  activeIndex: number
  next: () => void
  prev: () => void
  clear: () => void
}

/** Text nodes to skip — inputs / hidden UI chrome would otherwise match the
 *  user's own typing (a fresh keystroke of "a" would highlight itself). */
const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'OPTION',
])

/** Walk `root` and return every visible text node in document order. Skips
 *  hidden nodes (display:none / visibility:hidden) by consulting the closest
 *  element's computed style — an element out of the layout tree returns a
 *  zero-height offsetParent chain, which is cheaper than getComputedStyle. */
const collectTextNodes = (root: Node): Text[] => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.nodeValue ?? ''
      if (!text.trim()) return NodeFilter.FILTER_REJECT
      const parent = (node as Text).parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT
      // `offsetParent === null` covers display:none. Cheap enough to run for
      // every text node without ballooning the walk cost.
      if (parent.offsetParent === null && parent.tagName !== 'BODY') {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })
  const out: Text[] = []
  let n: Node | null
  while ((n = walker.nextNode())) out.push(n as Text)
  return out
}

/** Escape a user-typed string for use inside a RegExp. */
const escapeRegex = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const HIGHLIGHT_ALL = 'find-on-page'
const HIGHLIGHT_ACTIVE = 'find-on-page-active'

/** Ctrl+F-style in-app search — highlights matches inside `getRoot()` using
 *  the CSS Custom Highlight API (no DOM mutation, so React re-renders don't
 *  clobber the highlights). Falls back to no-op highlighting on browsers
 *  without the API — the counter + prev/next still work.
 *
 *  Debounces the walk on rapid typing (150ms) so a paste of a long string
 *  doesn't stall the main thread mid-input.
 *
 *  @param getRoot Lazy accessor for the search root. Passing a function
 *    instead of a ref lets the caller resolve `document.querySelector('main')`
 *    once at mount without stashing a ref through every layout wrapper. */
export function useFindOnPage(
  getRoot: () => HTMLElement | null,
  enabled: boolean,
): UseFindOnPageResult {
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0) // 1-based; 0 = no match

  // Every match's DOM Range — kept in a ref (not state) so `next`/`prev` don't
  // re-render the whole overlay every time the active index changes.
  const rangesRef = useRef<Range[]>([])
  const debounceRef = useRef<number | null>(null)

  const supportsHighlightAPI = typeof CSS !== 'undefined' && 'highlights' in CSS

  const clearHighlights = useCallback(() => {
    if (!supportsHighlightAPI) return
    CSS.highlights.delete(HIGHLIGHT_ALL)
    CSS.highlights.delete(HIGHLIGHT_ACTIVE)
  }, [supportsHighlightAPI])

  /** Repaint `HIGHLIGHT_ALL` (every match) + `HIGHLIGHT_ACTIVE` (just the
   *  one at `idx`). Called on each `next`/`prev` — cheap because we already
   *  hold the ranges, no re-walk. */
  const paintHighlights = useCallback(
    (idx: number) => {
      if (!supportsHighlightAPI) return
      const ranges = rangesRef.current
      const allHighlight = new Highlight(...ranges)
      CSS.highlights.set(HIGHLIGHT_ALL, allHighlight)
      const activeRange = ranges[idx - 1]
      if (activeRange) {
        CSS.highlights.set(HIGHLIGHT_ACTIVE, new Highlight(activeRange))
      } else {
        CSS.highlights.delete(HIGHLIGHT_ACTIVE)
      }
    },
    [supportsHighlightAPI],
  )

  /** Scroll the active match's parent into view. Uses `scrollIntoView` on
   *  the parent element — Range itself doesn't scroll on Chromium reliably. */
  const scrollToActive = useCallback((idx: number) => {
    const range = rangesRef.current[idx - 1]
    if (!range) return
    const container = range.startContainer.parentElement
    container?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [])

  const runSearch = useCallback(
    (q: string) => {
      const root = getRoot()
      if (!root || !q) {
        rangesRef.current = []
        setCount(0)
        setActiveIndex(0)
        clearHighlights()
        return
      }
      const nodes = collectTextNodes(root)
      const pattern = new RegExp(escapeRegex(q), 'gi')
      const ranges: Range[] = []
      for (const node of nodes) {
        const text = node.nodeValue ?? ''
        pattern.lastIndex = 0
        let m: RegExpExecArray | null
        while ((m = pattern.exec(text))) {
          if (m[0].length === 0) {
            // Guard against zero-width matches locking exec() in an infinite
            // loop. Shouldn't happen with our escaped pattern, but defend anyway.
            pattern.lastIndex++
            continue
          }
          const range = document.createRange()
          range.setStart(node, m.index)
          range.setEnd(node, m.index + m[0].length)
          ranges.push(range)
        }
      }
      rangesRef.current = ranges
      setCount(ranges.length)
      const nextIdx = ranges.length > 0 ? 1 : 0
      setActiveIndex(nextIdx)
      paintHighlights(nextIdx)
      if (nextIdx > 0) scrollToActive(nextIdx)
    },
    [getRoot, clearHighlights, paintHighlights, scrollToActive],
  )

  // Debounced search on query change. When `enabled` flips off we tear the
  // highlights down immediately so closing the overlay leaves no yellow trail.
  useEffect(() => {
    if (!enabled) {
      rangesRef.current = []
      setCount(0)
      setActiveIndex(0)
      clearHighlights()
      return
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => runSearch(query), 150)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, enabled, runSearch, clearHighlights])

  // Belt-and-braces cleanup on unmount so navigating away can't leave stale
  // Highlight objects pinned to CSS.highlights.
  useEffect(
    () => () => {
      clearHighlights()
    },
    [clearHighlights],
  )

  const next = useCallback(() => {
    setActiveIndex((cur) => {
      if (count === 0) return 0
      const nextIdx = cur >= count ? 1 : cur + 1
      paintHighlights(nextIdx)
      scrollToActive(nextIdx)
      return nextIdx
    })
  }, [count, paintHighlights, scrollToActive])

  const prev = useCallback(() => {
    setActiveIndex((cur) => {
      if (count === 0) return 0
      const nextIdx = cur <= 1 ? count : cur - 1
      paintHighlights(nextIdx)
      scrollToActive(nextIdx)
      return nextIdx
    })
  }, [count, paintHighlights, scrollToActive])

  const clear = useCallback(() => {
    setQuery('')
    rangesRef.current = []
    setCount(0)
    setActiveIndex(0)
    clearHighlights()
  }, [clearHighlights])

  return useMemo(
    () => ({ query, setQuery, count, activeIndex, next, prev, clear }),
    [query, count, activeIndex, next, prev, clear],
  )
}
