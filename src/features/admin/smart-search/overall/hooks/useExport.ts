"use client"
import { useCallback, useState } from "react"
import { exportHtml, exportXlsx } from "@/services/routes/ChatService"
import type { ExportFormat } from "@/types/chat"

// Export the data behind a question via POST /export. xlsx downloads a file;
// html opens a print-ready window (the user saves as PDF).
export function useExport() {
  const [exporting, setExporting] = useState(false)

  const exportFile = useCallback(
    async (message: string, format: ExportFormat = "xlsx") => {
      setExporting(true)
      try {
        if (format === "html") {
          const html = await exportHtml(message)
          const win = window.open("", "_blank")
          if (win) {
            win.document.write(html)
            win.document.close()
            win.focus()
            win.print()
          }
        } else {
          const blob = await exportXlsx(message)
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `smart-search-${Date.now()}.xlsx`
          document.body.appendChild(link)
          link.click()
          link.remove()
          URL.revokeObjectURL(url)
        }
        return true
      } catch {
        return false
      } finally {
        setExporting(false)
      }
    },
    [],
  )

  return { exporting, exportFile }
}
