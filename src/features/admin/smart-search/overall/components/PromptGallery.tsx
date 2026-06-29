"use client"
import { Modal } from "antd"
import React from "react"
import { TbX } from "react-icons/tb"
import { useSmartSearchContext } from "../context"
import { PROMPT_GALLERY } from "../data/promptGallery"

interface Props {
  open: boolean
  onClose: () => void
}

// "What can I ask?" gallery (Future #2). Dark-styled to match the theme (the
// app's Antd theme has no dark algorithm, so surfaces are set explicitly).
const PromptGallery: React.FC<Props> = ({ open, onClose }) => {
  const { send, isStreaming } = useSmartSearchContext()

  const pick = (q: string) => {
    if (isStreaming) return
    send(q)
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      centered
      title={<span className="text-white">คลังคำถาม — ถามอะไรได้บ้าง</span>}
      closeIcon={<TbX className="text-white/60" />}
      style={{ background: "var(--dark-black)" }}
      styles={{
        header: { background: "transparent" },
        body: { maxHeight: "70vh", overflowY: "auto" },
      }}
    >
      <div className="flex flex-col gap-4 pt-1">
        {PROMPT_GALLERY.map((cat) => (
          <section key={cat.key}>
            <p className="fs-12 text-(--yellow) mb-2">{cat.label}</p>
            <div className="flex flex-wrap gap-2">
              {cat.prompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isStreaming}
                  onClick={() => pick(q)}
                  className="fs-14 text-left px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-white/80 hover:border-(--yellow)/50 hover:text-(--yellow) transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  )
}

export default React.memo(PromptGallery)
