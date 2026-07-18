"use client"
import React, { useMemo } from "react"

interface Props {
  text: string
  streaming?: boolean
}

// Linkifier — supports two shapes so the chat backend can emit either:
//   1) [display text](/admin/cctv?dept_id=50)      — markdown link
//   2) https://its.drr.go.th/atlas/admin/cctv       — bare URL
// Both render as <a> in the response. Relative /admin/... paths keep the
// user inside the app; absolute URLs open in a new tab so the chat context
// doesn't get lost.
// Matched greedily: markdown FIRST so a bare URL nested inside a markdown
// link doesn't get double-wrapped.
const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/g
const BARE_URL = /(https?:\/\/[^\s<)]+|\/admin\/[^\s<)]+)/g

type Node = { type: "text"; value: string } | { type: "link"; label: string; href: string }

const parseAnswer = (raw: string): Node[] => {
  const nodes: Node[] = []
  let cursor = 0
  // First pass — markdown links.
  const re = new RegExp(MARKDOWN_LINK.source, "g")
  for (const m of raw.matchAll(re)) {
    const idx = m.index ?? 0
    if (idx > cursor) nodes.push(...linkifyPlain(raw.slice(cursor, idx)))
    nodes.push({ type: "link", label: m[1], href: m[2] })
    cursor = idx + m[0].length
  }
  if (cursor < raw.length) nodes.push(...linkifyPlain(raw.slice(cursor)))
  return nodes
}

const linkifyPlain = (chunk: string): Node[] => {
  const out: Node[] = []
  let cursor = 0
  const re = new RegExp(BARE_URL.source, "g")
  for (const m of chunk.matchAll(re)) {
    const idx = m.index ?? 0
    if (idx > cursor) out.push({ type: "text", value: chunk.slice(cursor, idx) })
    out.push({ type: "link", label: m[0], href: m[0] })
    cursor = idx + m[0].length
  }
  if (cursor < chunk.length) out.push({ type: "text", value: chunk.slice(cursor) })
  return out
}

/** Renders the streamed answer with clickable links to project / road pages.
 *  The chat backend embeds URLs (either bare or in markdown link syntax) — the
 *  FE turns them into <a> so users can jump straight to the referenced dashboard
 *  view without hunting through the menus. `aria-live` keeps screen readers
 *  narrating streaming updates. */
const AnswerText: React.FC<Props> = ({ text, streaming }) => {
  const nodes = useMemo(() => parseAnswer(text), [text])

  return (
    <p
      aria-live="polite"
      className="text-white whitespace-pre-wrap break-words leading-relaxed"
    >
      {nodes.map((n, i) =>
        n.type === "text" ? (
          <React.Fragment key={i}>{n.value}</React.Fragment>
        ) : (
          <a
            key={i}
            href={n.href}
            target={n.href.startsWith("/") ? "_self" : "_blank"}
            rel={n.href.startsWith("/") ? undefined : "noreferrer noopener"}
            className="text-(--yellow) underline decoration-dotted underline-offset-2 hover:text-yellow-300 transition-colors"
          >
            {n.label}
          </a>
        ),
      )}
      {streaming && (
        <span className="ml-0.5 inline-block w-2 h-4 align-middle bg-(--yellow) animate-pulse" />
      )}
    </p>
  )
}

export default React.memo(AnswerText)
