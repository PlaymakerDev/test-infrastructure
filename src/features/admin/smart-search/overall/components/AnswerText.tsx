"use client"
import React, { useMemo } from "react"

interface Props {
  text: string
  streaming?: boolean
}

// Linkifier + image detector. Supports THREE embed shapes so the chat
// backend can emit either:
//   1) [display text](/admin/cctv?dept_id=50)         — markdown link
//   2) ![alt](https://…/event123.jpg)                  — markdown image
//   3) https://its.drr.go.th/…/event.png               — bare URL to an
//      image (auto-detected via extension) → renders as <img>, not <a>
// Everything else (bare non-image URL, `/admin/...` relative path) still
// linkifies to <a>. Markdown pass runs FIRST so a URL nested inside a
// markdown-link/image doesn't get double-wrapped.
const MARKDOWN_IMAGE = /!\[([^\]]*)\]\(([^)]+)\)/g
const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/g
const BARE_URL = /(https?:\/\/[^\s<)]+|\/admin\/[^\s<)]+)/g
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|svg)(?:$|\?)/i

type Node =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string }
  | { type: "image"; alt: string; src: string }

const parseAnswer = (raw: string): Node[] => {
  const nodes: Node[] = []
  let cursor = 0

  // Pass 1 — markdown images. Matched first so a URL inside ![]() doesn't
  // get grabbed by the link pass.
  const seen: Array<{ idx: number; end: number; node: Node }> = []
  const imgRe = new RegExp(MARKDOWN_IMAGE.source, "g")
  for (const m of raw.matchAll(imgRe)) {
    const idx = m.index ?? 0
    seen.push({ idx, end: idx + m[0].length, node: { type: "image", alt: m[1] || "รูปภาพ", src: m[2] } })
  }

  // Pass 2 — markdown links (skip ranges already consumed by an image).
  const linkRe = new RegExp(MARKDOWN_LINK.source, "g")
  for (const m of raw.matchAll(linkRe)) {
    const idx = m.index ?? 0
    // Skip if the [ is actually a ![ (part of an image we already matched).
    if (idx > 0 && raw[idx - 1] === "!") continue
    seen.push({ idx, end: idx + m[0].length, node: { type: "link", label: m[1], href: m[2] } })
  }

  // Sort discovered nodes left-to-right and slot in plain-text linkifier
  // for whatever's between them.
  seen.sort((a, b) => a.idx - b.idx)
  for (const s of seen) {
    if (s.idx > cursor) nodes.push(...linkifyPlain(raw.slice(cursor, s.idx)))
    nodes.push(s.node)
    cursor = s.end
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
    // Auto-detect: bare URL ending in .jpg/.png/etc → embed as image
    // (matches user request: "ต้องตอบด้วยรูปได้ เช่น ขอรูปเหตุการณ์..."
    // — chat backend just returns the URL, FE recognises + inlines it).
    if (IMAGE_EXT.test(m[0])) {
      out.push({ type: "image", alt: "รูปภาพจากคำตอบ", src: m[0] })
    } else {
      out.push({ type: "link", label: m[0], href: m[0] })
    }
    cursor = idx + m[0].length
  }
  if (cursor < chunk.length) out.push({ type: "text", value: chunk.slice(cursor) })
  return out
}

/** Renders the streamed answer as a mix of text, clickable links, and
 *  inline images. The chat backend embeds URLs (bare, markdown link, or
 *  markdown image) — the FE recognises each shape and renders it accordingly
 *  so users see incident photos + click through to detail pages without
 *  leaving the conversation. `aria-live` keeps screen readers narrating
 *  streaming updates.
 *
 *  Images render lazy-loaded, capped to a reasonable width so the chat
 *  card doesn't blow up on a big-camera photo. Click opens the original
 *  in a new tab. */
const AnswerText: React.FC<Props> = ({ text, streaming }) => {
  const nodes = useMemo(() => parseAnswer(text), [text])

  return (
    <div
      aria-live="polite"
      className="text-white whitespace-pre-wrap break-words leading-relaxed"
    >
      {nodes.map((n, i) => {
        if (n.type === "text") {
          return <React.Fragment key={i}>{n.value}</React.Fragment>
        }
        if (n.type === "link") {
          return (
            <a
              key={i}
              href={n.href}
              target={n.href.startsWith("/") ? "_self" : "_blank"}
              rel={n.href.startsWith("/") ? undefined : "noreferrer noopener"}
              className="text-(--yellow) underline decoration-dotted underline-offset-2 hover:text-yellow-300 transition-colors"
            >
              {n.label}
            </a>
          )
        }
        // Image: block-level so it wraps to its own line even inside a
        // paragraph. `no-referrer` on both anchor + img so the incident
        // photo origin doesn't leak referer to a third-party image host.
        return (
          <a
            key={i}
            href={n.src}
            target="_blank"
            rel="noreferrer noopener"
            className="block my-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={n.src}
              alt={n.alt}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="max-w-full rounded-md border border-white/10 shadow"
              style={{ maxHeight: 400 }}
            />
          </a>
        )
      })}
      {streaming && (
        <span className="ml-0.5 inline-block w-2 h-4 align-middle bg-(--yellow) animate-pulse" />
      )}
    </div>
  )
}

export default React.memo(AnswerText)
