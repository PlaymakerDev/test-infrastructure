"use client"
import React from "react"
import { TbDatabase } from "react-icons/tb"
import type { Provenance } from "@/types/chat"

interface Props {
  provenance: Provenance
}

// Data lineage shown under an answer (§1) — the source view(s) and how many
// rows the answer was computed from. A transparency/trust signal. Live-only:
// the backend doesn't persist this, so re-rendered history turns won't have it.
const ProvenanceBadge: React.FC<Props> = ({ provenance }) => {
  const { source_views, row_count } = provenance

  const parts: string[] = []
  if (source_views.length > 0) parts.push(`จาก: ${source_views.join(", ")}`)
  if (row_count > 0) parts.push(`${row_count.toLocaleString("en-US")} แถว`)
  if (parts.length === 0) return null

  // source_views are ready-to-display Thai labels (the backend already maps
  // internal view names → Thai), so render them verbatim. They can be long
  // phrases (sometimes several), so wrap instead of truncating — otherwise the
  // trailing row count would be clipped.
  return (
    <div className="mt-1.5 flex items-start gap-1.5 fs-12 text-white/40">
      <TbDatabase size={13} className="shrink-0 mt-0.5" />
      <span className="leading-snug">{parts.join(" · ")}</span>
    </div>
  )
}

export default React.memo(ProvenanceBadge)
