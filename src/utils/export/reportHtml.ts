// The backend's print-ready HTML reports — สถานะกล้อง of a project
// (/manage/project/device-status/{id}/export) and ผู้รับจ้างและโครงการ
// (/manage/contractor/export?format=html) — open in a tab of their own. The
// backend makes no PDF of them: they are built for the browser's Save as PDF,
// which prints the page itself — real Thai text, the report's own print CSS.
// withSavePdfBar puts that one click on the page (user 2026-10-07): a bar with
// ดาวน์โหลด PDF that never prints. How the page prints (paper, margins,
// colours) stays the backend's to set — the user left it with the backend
// rather than overriding it here (2026-10-07).

/** Matches the reports' own heading blue (.group-head / .contractor-head). */
const REPORT_BLUE = '#2f5597'
const REPORT_BLUE_HOVER = '#264a87'

// The reports pad their body by 24px; the bar's negative margins take it back
// so it spans the page and sticks to the very top while the report scrolls.
const BAR_STYLE = `<style>
.its-save-pdf-bar{position:sticky;top:0;z-index:1000;display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:-24px -24px 18px;padding:12px 24px;background:#fff;border-bottom:1px solid #d0d7de}
.its-save-pdf-bar button{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:6px;background:${REPORT_BLUE};color:#fff;font:inherit;font-size:.9rem;font-weight:600;line-height:1.4;padding:8px 16px;cursor:pointer}
.its-save-pdf-bar button:hover,.its-save-pdf-bar button:focus-visible{background:${REPORT_BLUE_HOVER}}
.its-save-pdf-bar button svg{flex-shrink:0}
.its-save-pdf-bar span{color:#666;font-size:.82rem}
@media print{.its-save-pdf-bar{display:none!important}}
</style>`

// Tabler's "download" — the icon the app's own export buttons use.
const DOWNLOAD_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 11l5 5l5 -5"/><path d="M12 4l0 12"/></svg>'

const BAR = `<div class="its-save-pdf-bar" role="toolbar" aria-label="ดาวน์โหลดรายงาน">
<button type="button" id="its-save-pdf">${DOWNLOAD_ICON}ดาวน์โหลด PDF</button>
<span>ในหน้าต่างที่เปิดขึ้น ให้เลือกปลายทางเป็น “บันทึกเป็น PDF” (Save as PDF) แล้วกดบันทึก</span>
</div>`

/** The bar's click: the browser names a saved PDF after the page title, so
 *  the title becomes `<filenameBase>_YYYYMMDD_HHmmss` for the print — the
 *  app's export file names — and goes back afterwards. */
const barScript = (filenameBase: string) => `<script>
(function () {
  var button = document.getElementById('its-save-pdf');
  if (!button) return;
  var base = ${JSON.stringify(filenameBase).replace(/</g, '\\u003c')};
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  button.addEventListener('click', function () {
    var now = new Date();
    var stamp = '' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    var title = document.title;
    var restore = function () { document.title = title; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    document.title = base + '_' + stamp;
    window.print();
  });
})();
</script>`

/** A file-name stem from free text: no path separators or characters a file
 *  system refuses. */
export const fileStem = (text: string) =>
  text.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim()

/** The report with the ดาวน์โหลด PDF bar at the top of its body. */
export function withSavePdfBar(html: string, filenameBase: string): string {
  const bar = `${BAR_STYLE}${BAR}${barScript(fileStem(filenameBase))}`
  const body = /<body\b[^>]*>/i.exec(html)
  if (!body) return bar + html
  const at = body.index + body[0].length
  return html.slice(0, at) + bar + html.slice(at)
}
