/** Capture ECharts instances as PNG data-URLs for PDF embedding.
 *
 *  Charts in this app render through the SVG renderer (`opts={{renderer:'svg'}}`
 *  in the chart wrappers), so `getDataURL()` yields an `image/svg+xml` data-URI —
 *  which @react-pdf's <Image> cannot decode. Rasterize it through a canvas at
 *  2× scale instead. The app draws charts on transparent backgrounds over dark
 *  panels, so a background color is painted behind (default = the panel black).
 */

export interface CapturedChart {
  dataUrl: string
  /** CSS pixel size of the live chart — keeps the PDF aspect ratio true. */
  width: number
  height: number
}

/** Rasterize every ECharts instance found inside `container`, in DOM order.
 *  Instances that fail to capture are skipped (never throws). */
export async function captureEchartsPng(
  container: HTMLElement,
  { scale = 2, background = '#000000' }: { scale?: number; background?: string } = {}
): Promise<CapturedChart[]> {
  const echarts = await import('echarts')
  const hosts = Array.from(container.querySelectorAll<HTMLElement>('div[_echarts_instance_]'))
  const out: CapturedChart[] = []
  for (const host of hosts) {
    try {
      const inst = echarts.getInstanceByDom(host)
      if (!inst) continue
      const width = inst.getWidth()
      const height = inst.getHeight()
      const svgUrl = inst.getDataURL({ type: 'svg' })
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('chart image decode failed'))
        img.src = svgUrl
      })
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(width * scale))
      canvas.height = Math.max(1, Math.round(height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      ctx.fillStyle = background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      out.push({ dataUrl: canvas.toDataURL('image/png'), width, height })
    } catch {
      // Skip a broken chart rather than failing the whole report.
    }
  }
  return out
}
