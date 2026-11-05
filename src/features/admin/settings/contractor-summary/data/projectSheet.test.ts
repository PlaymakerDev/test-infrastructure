import { describe, expect, it } from 'vitest'
import { buildWorkbook, excelTextPx, excelWrappedLines, type ExcelLayoutRow } from '@/utils/export/excel'
import {
  CAMERA_COLUMNS,
  PDF_ROWS_PER_BLOCK,
  PROJECT_SOLUTIONS,
  STREET_LIGHT_COLUMNS,
  TUNNEL_COLUMNS,
  connectionLabel,
  projectDevicesPdfBlocks,
  projectDevicesSheet,
  solutionBox,
  type ProjectSheetProject,
} from './projectSheet'

// The user's sample report (2026-10-27): project 2 had CCTV, Traffic Volume
// and Street Light; Street Light lists its cabinets with no install-point line.
const projects: ProjectSheetProject[] = [
  {
    name: 'โครงการงานบำรุงถนนสาย ชน.3018',
    contractNo: 'ขทช.สห./30/2567',
    solutions: ['CCTV', 'Street Light'],
    sections: [
      {
        solution: 'CCTV',
        columns: CAMERA_COLUMNS,
        points: [
          { label: 'ชน.3018 จุดติดตั้งที่ 1', rows: [['กล้อง 1', '22+200', 'CCTV', 'Disconnect', '10.22.1.1']] },
          { label: 'ชน.3018 จุด 2', rows: [['กล้อง 2', '23+000', 'CCTV, Incident', 'Connect', '10.22.2.3']] },
        ],
      },
      { solution: 'Street Light', columns: STREET_LIGHT_COLUMNS, points: [{ rows: [['ชน.3018 ตู้ที่ 1 กม.22+280', '22+280', 'Street Light', 'Disconnect', 'Connect']] }] },
    ],
  },
  { name: 'โครงการ 2', contractNo: '', solutions: [], sections: [] },
]

const values = (row: ExcelLayoutRow) => row.cells.map((cell) => [cell.col, cell.value, cell.span ?? 1])

describe('โครงการ sheet', () => {
  const sheet = projectDevicesSheet({ title: 'T', filterNote: 'สถานะค้ำประกัน: ทั้งหมด', projects })
  const { rows } = sheet

  it('is thirteen columns wide (A–M), as the sample', () => {
    expect(sheet.sheetName).toBe('โครงการ')
    expect(sheet.widths).toHaveLength(13)
    expect(sheet.filterNote).toBe('สถานะค้ำประกัน: ทั้งหมด')
  })

  it('opens each project with its name over B–M, the row the project folds under', () => {
    expect(values(rows[0])).toEqual([[0, 'โครงการที่ 1 :', 1], [1, 'โครงการงานบำรุงถนนสาย ชน.3018', 12]])
    expect(rows[0].level).toBeUndefined()
    expect(rows[0].cells.every((cell) => cell.style?.fill === 'DCEAF7')).toBe(true)
    // Everything else of the project is a level below it.
    const second = rows.findIndex((row) => row.cells[0]?.value === 'โครงการที่ 2 :')
    expect(rows.slice(1, second).every((row) => row.level === 1)).toBe(true)
    expect(rows[second].level).toBeUndefined()
  })

  it('then its contract and the eleven Solution boxes, ticked for what it has', () => {
    expect(values(rows[1])).toEqual([[1, 'เลขที่สัญญา :', 1], [2, 'ขทช.สห./30/2567', 11]])
    expect(rows[2].height).toBe(42)
    expect(rows[2].cells[0].value).toBe('Solution :')
    expect(rows[2].cells.slice(1).map((cell) => [cell.col, cell.value])).toEqual(
      PROJECT_SOLUTIONS.map((solution, i) => [2 + i, solutionBox(solution, solution === 'CCTV' || solution === 'Street Light')]),
    )
    expect(rows[3].cells).toEqual([])
  })

  it('writes the boxes as the sample does: a short name beside its box, a long one under it', () => {
    expect(solutionBox('CCTV', true)).toBe('☑ CCTV')
    expect(solutionBox('Tunnel', false)).toBe('☐ Tunnel')
    expect(solutionBox('Crosswalk', false)).toBe('☐ \nCrosswalk')
    expect(solutionBox('Traffic Volume', true)).toBe('☑ \nTraffic Volume')
  })

  it('a section: the system’s name and the column header, install points, devices numbered from 1 at each', () => {
    expect(values(rows[4])).toEqual([[0, 'CCTV', 1], [1, 'ชื่อกล้อง', 7], [8, 'กม.ที่', 1], [9, 'การทำงาน', 2], [11, 'สถานะ', 1], [12, 'IP Address', 1]])
    expect(rows[4].cells[0].style?.fill).toBe('A6CAEC')
    expect(values(rows[5])).toEqual([[0, 'จุดติดตั้ง : ชน.3018 จุดติดตั้งที่ 1', 13]])
    expect(values(rows[6])).toEqual([[0, 1, 1], [1, 'กล้อง 1', 7], [8, '22+200', 1], [9, 'CCTV', 2], [11, 'Disconnect', 1], [12, '10.22.1.1', 1]])
    expect(values(rows[7])).toEqual([[0, 'จุดติดตั้ง : ชน.3018 จุด 2', 13]])
    // The next install point starts again at 1 (user 2026-10-28).
    expect(rows[8].cells[0].value).toBe(1)
    expect(rows[9].cells).toEqual([])
    // Header, points and devices are all boxed in.
    expect(rows.slice(4, 9).flatMap((row) => row.cells).every((cell) => cell.style?.border)).toBe(true)
  })

  it('every header and device cell sits in the middle of its row — ชื่อกล้อง and การทำงาน too (user 2026-10-29)', () => {
    const header = rows[4].cells
    const device = rows[6].cells
    expect([...header, ...device].every((cell) => cell.style?.vertical === 'center')).toBe(true)
    expect(header.map((cell) => cell.style?.align)).toEqual(['center', 'center', 'center', 'center', 'center', 'center'])
    // A device's name reads from the left, wrapping when it's long.
    expect(device[1].style).toMatchObject({ align: 'left', wrap: true })
  })

  it('wide enough for what the report holds: an IP address in M, the labels in A and B (user 2026-10-29)', () => {
    // Width w draws trunc(7 × (w + 5/6) + 0.49) px; less 6 of padding.
    const room = (col: number) => Math.trunc(7 * (sheet.widths[col] + 5 / 6) + 0.49) - 6
    expect(excelTextPx('192.168.200.255')).toBeLessThanOrEqual(room(12))
    expect(excelTextPx('โครงการที่ 431 :')).toBeLessThanOrEqual(room(0))
    expect(excelTextPx('เลขที่สัญญา :')).toBeLessThanOrEqual(room(1))
    expect(excelTextPx('Disconnect')).toBeLessThanOrEqual(room(11))
    // การทำงาน over J–K: the usual tags on one line, the longest on two at most.
    const tags = room(9) + room(10) + 6
    expect(excelTextPx('CCTV, Volume, Incident')).toBeLessThanOrEqual(tags)
    expect(excelWrappedLines('CCTV, Volume, Truck Tracking', tags)).toBeLessThanOrEqual(2)
  })

  it('a long name or project name wraps, its row as tall as its lines', () => {
    const name = 'DRR-RYG1035PC1-CAM02-กม.1+518-ขาออกจากทางแยกสนามกีฬาบ้านฉาง มุ่งหน้าไปทางแยกพลา-บูรพาพัฒน์ ฝั่งขาเข้า'
    const project = 'โครงการปรับปรุงจุดเสี่ยงจุดอันตราย ถนนสาย รย.4036 เฉลิมบูรพาชลทิต (ตอนระยอง) อำเภอแกลง อำเภอนายายอาม อำเภอท่าใหม่ จังหวัดระยอง (ระบบไฟฟ้า 3 เฟส)'
    const long = projectDevicesSheet({
      title: 'T',
      projects: [{ name: project, contractNo: '-', solutions: ['CCTV'], sections: [{ solution: 'CCTV', columns: CAMERA_COLUMNS, points: [{ label: 'จุด', rows: [[name, '1+518', 'CCTV', 'Connect', '10.1.1.1'], ['สั้น', '-', 'CCTV', 'Connect', '10.1.1.2']] }] }] }],
    })
    const ws = buildWorkbook([long]).workbook.Sheets['โครงการ']
    const heightOf = (value: string) => {
      const r = Object.keys(ws).find((ref) => ws[ref]?.v === value)!.replace(/^[A-Z]+/, '')
      return ws['!rows']?.[Number(r) - 1]?.hpt
    }
    expect(heightOf(project)).toBeGreaterThanOrEqual(31)
    expect(heightOf(name)).toBeGreaterThanOrEqual(31)
    expect(heightOf('สั้น')).toBeUndefined()
  })

  it('Street Light: its own columns, the cabinets straight under the header', () => {
    expect(values(rows[10]).map(([, value]) => value)).toEqual(['Street Light', 'ชื่อจุดติดตั้ง', 'กม.ที่', 'การทำงาน', 'การเชื่อมต่อ', 'สถานะสาย'])
    expect(values(rows[11])).toEqual([[0, 1, 1], [1, 'ชน.3018 ตู้ที่ 1 กม.22+280', 7], [8, '22+280', 1], [9, 'Street Light', 2], [11, 'Disconnect', 1], [12, 'Connect', 1]])
    expect(rows[12].cells).toEqual([])
  })

  it('a project with nothing yet still gets its name, contract ("-") and boxes', () => {
    const second = rows.findIndex((row) => row.cells[0]?.value === 'โครงการที่ 2 :')
    expect(rows.slice(second).map((row) => row.cells[1]?.value ?? row.cells[0]?.value ?? null)).toEqual([
      'โครงการ 2',
      '-',
      PROJECT_SOLUTIONS.map((solution) => solutionBox(solution, false))[0],
      null,
    ])
  })

  it('a controller’s install point: its state after the label as (ระบบ : …), the state alone in green or red', () => {
    const controllers: ProjectSheetProject = {
      name: 'p',
      contractNo: '-',
      solutions: ['Traffic Signal'],
      sections: [{ solution: 'Traffic Signal', columns: CAMERA_COLUMNS, points: [{ label: 'แยก 1', online: true, rows: [] }, { label: 'แยก 2', online: false, rows: [] }] }],
    }
    const { rows: lines } = projectDevicesSheet({ title: 'T', projects: [controllers] })
    expect(lines[5].cells[0]).toMatchObject({
      value: 'จุดติดตั้ง : แยก 1 (ระบบ : ออนไลน์)',
      runs: [{ text: 'จุดติดตั้ง : แยก 1 (ระบบ : ' }, { text: 'ออนไลน์', color: '00B050' }, { text: ')' }],
    })
    expect(lines[6].cells[0]).toMatchObject({
      value: 'จุดติดตั้ง : แยก 2 (ระบบ : ออฟไลน์)',
      runs: [{ text: 'จุดติดตั้ง : แยก 2 (ระบบ : ' }, { text: 'ออฟไลน์', color: 'FF0000' }, { text: ')' }],
    })
    // A point without a state is plain text.
    expect(rows[5].cells[0].runs).toBeUndefined()
    // The PDF band says the same, coloured the same.
    const [block] = projectDevicesPdfBlocks([controllers]) as { rows: unknown[] }[]
    expect(block.rows.slice(1, 3)).toEqual([
      {
        group: 'Traffic Signal · จุดติดตั้ง : แยก 1 (ระบบ : ออนไลน์)',
        tone: 'soft',
        runs: [{ text: 'Traffic Signal · จุดติดตั้ง : แยก 1 (ระบบ : ' }, { text: 'ออนไลน์', color: '#00B050' }, { text: ')' }],
      },
      {
        group: 'Traffic Signal · จุดติดตั้ง : แยก 2 (ระบบ : ออฟไลน์)',
        tone: 'soft',
        runs: [{ text: 'Traffic Signal · จุดติดตั้ง : แยก 2 (ระบบ : ' }, { text: 'ออฟไลน์', color: '#FF0000' }, { text: ')' }],
      },
    ])
  })

  it('words a device’s state as the sample does', () => {
    expect([true, false, null].map(connectionLabel)).toEqual(['Connect', 'Disconnect', 'Disconnect'])
  })

  it('a four-column section (Bridge Lighting, Tunnel) runs its last column across L–M', () => {
    const { rows: tunnelRows } = projectDevicesSheet({
      title: 'T',
      projects: [{ name: 'p', contractNo: '-', solutions: ['Tunnel'], sections: [{ solution: 'Tunnel', columns: TUNNEL_COLUMNS, points: [{ label: 'อุโมงค์', rows: [['Lux Sensor1', '-', 'Tunnel', 'Connect']] }] }] }],
    })
    expect(values(tunnelRows[4])).toEqual([[0, 'Tunnel', 1], [1, 'ชื่ออุปกรณ์', 7], [8, 'กม.ที่', 1], [9, 'การทำงาน', 2], [11, 'การเชื่อมต่อ', 2]])
    expect(values(tunnelRows[6])).toEqual([[0, 1, 1], [1, 'Lux Sensor1', 7], [8, '-', 1], [9, 'Tunnel', 2], [11, 'Connect', 2]])
  })
})

describe('โครงการ in the PDF', () => {
  // 120 cameras each: a band, a point band and the rows — 122 rows a project.
  const big = (n: number): ProjectSheetProject => ({
    name: `โครงการ ${n}`,
    contractNo: '-',
    solutions: ['CCTV'],
    sections: [{ solution: 'CCTV', columns: CAMERA_COLUMNS, points: [{ label: 'ถนน', rows: Array.from({ length: 120 }, (_, i) => [`กล้อง ${i}`, '-', 'CCTV', 'Connect', '-'] as const) }] }],
  })
  type Block = { title?: string; rows: (unknown[] | { group: string })[] }

  it('cuts the table between projects every few hundred rows — never inside one — the title on the first block', () => {
    const blocks = projectDevicesPdfBlocks([big(1), big(2), big(3), big(4), big(5)]) as Block[]
    expect(blocks.map((block) => block.rows.length)).toEqual([244, 244, 122])
    expect(blocks.every((block) => block.rows.length <= PDF_ROWS_PER_BLOCK)).toBe(true)
    expect(blocks.map((block) => block.title)).toEqual(['รายการอุปกรณ์ทั้งหมดแยกตามโครงการ (5 โครงการ)', undefined, undefined])
    // Each block opens on a project band, numbered across blocks.
    expect(blocks.map((block) => (block.rows[0] as { group: string }).group.split('\n')[0])).toEqual([
      'โครงการที่ 1 : โครงการ 1',
      'โครงการที่ 3 : โครงการ 3',
      'โครงการที่ 5 : โครงการ 5',
    ])
  })

  it('keeps a project bigger than a block whole', () => {
    const huge: ProjectSheetProject = { ...big(9), sections: [{ ...big(9).sections[0], points: [{ label: 'ถนน', rows: Array.from({ length: 400 }, () => ['ก', '-', 'CCTV', 'Connect', '-'] as const) }] }] }
    expect((projectDevicesPdfBlocks([big(1), huge, big(2)]) as Block[]).map((block) => block.rows.length)).toEqual([122, 402, 122])
  })

  // A project whose last section has columns of its own.
  const cabinets = (n: number, count: number): ProjectSheetProject => ({
    name: `โครงการ ${n}`,
    contractNo: '-',
    solutions: ['Street Light'],
    sections: [{ solution: 'Street Light', columns: STREET_LIGHT_COLUMNS, points: [{ rows: Array.from({ length: count }, (_, i) => [`ตู้ ${i}`, '-', 'Street Light', 'Connect', 'Connect'] as const) }] }],
  })
  const cameraHeader = { cells: ['ลำดับ', ...CAMERA_COLUMNS], emphasis: true }

  it('brings the camera header back for cameras after a section with columns of its own — into the next project too', () => {
    const [block] = projectDevicesPdfBlocks([cabinets(1, 2), big(2)]) as Block[]
    expect(block.rows.slice(0, 5)).toEqual([
      expect.objectContaining({ group: expect.stringMatching(/^โครงการที่ 1 :/) }),
      // Its header and both cabinets stay on the band's page.
      { group: 'Street Light', tone: 'soft', keepAhead: 60 },
      { cells: ['ลำดับ', ...STREET_LIGHT_COLUMNS], emphasis: true },
      [1, 'ตู้ 0', '-', 'Street Light', 'Connect', 'Connect'],
      [2, 'ตู้ 1', '-', 'Street Light', 'Connect', 'Connect'],
    ])
    expect(block.rows.slice(5, 9)).toEqual([
      expect.objectContaining({ group: expect.stringMatching(/^โครงการที่ 2 :/) }),
      { group: 'CCTV · จุดติดตั้ง : ถนน', tone: 'soft' },
      cameraHeader,
      [1, 'กล้อง 0', '-', 'CCTV', 'Connect', '-'],
    ])
  })

  it('a new block opens under the page header, so its cameras need no header of their own', () => {
    const blocks = projectDevicesPdfBlocks([cabinets(1, 240), big(2)]) as Block[]
    expect(blocks.map((block) => block.rows.length)).toEqual([243, 122])
    expect(blocks[1].rows.slice(1, 3)).toEqual([{ group: 'CCTV · จุดติดตั้ง : ถนน', tone: 'soft' }, [1, 'กล้อง 0', '-', 'CCTV', 'Connect', '-']])
  })

  it('keeps a section with columns of its own on one page while it fits one; cameras only keep a couple of rows with their band', () => {
    const band = (project: ProjectSheetProject) => (projectDevicesPdfBlocks([project]) as Block[])[0].rows[1]
    // Header + 21 cabinets = 440pt: the most that still moves whole.
    expect(band(cabinets(1, 21))).toEqual({ group: 'Street Light', tone: 'soft', keepAhead: 440 })
    expect(band(cabinets(1, 22))).toEqual({ group: 'Street Light', tone: 'soft' })
    expect(band(big(1))).toEqual({ group: 'CCTV · จุดติดตั้ง : ถนน', tone: 'soft' })
    // Tunnel: its devices, the header and the next tunnels' bands.
    const tunnels: ProjectSheetProject = {
      name: 'p',
      contractNo: '-',
      solutions: ['Tunnel'],
      sections: [{ solution: 'Tunnel', columns: TUNNEL_COLUMNS, points: [{ label: 'A', rows: [['s1', '-', 'Tunnel', 'Connect'], ['s2', '-', 'Tunnel', 'Connect']] }, { label: 'B', rows: [] }] }],
    }
    expect(band(tunnels)).toEqual({ group: 'Tunnel · จุดติดตั้ง : A', tone: 'soft', keepAhead: 80 })
  })
})

describe('รวมผู้รับจ้าง — each project names its contractor (user 2026-10-29)', () => {
  const named: ProjectSheetProject[] = [
    { ...projects[0], contractor: 'บริษัท เอ็ม จำกัด' },
    { ...projects[1], contractor: '' },
  ]

  it('Excel: ผู้รับจ้าง under เลขที่สัญญา, folding with the rest of the project', () => {
    const { rows } = projectDevicesSheet({ title: 'T', projects: named })
    expect(values(rows[1])).toEqual([[1, 'เลขที่สัญญา :', 1], [2, 'ขทช.สห./30/2567', 11]])
    expect(values(rows[2])).toEqual([[1, 'ผู้รับจ้าง :', 1], [2, 'บริษัท เอ็ม จำกัด', 11]])
    expect(rows[2].level).toBe(1)
    expect(rows[3].cells[0].value).toBe('Solution :')
    const second = rows.findIndex((row) => row.cells[0]?.value === 'โครงการที่ 2 :')
    expect(values(rows[second + 2])).toEqual([[1, 'ผู้รับจ้าง :', 1], [2, '-', 11]])
  })

  it('PDF: the contractor in the project band, between its contract and its Solutions', () => {
    const [block] = projectDevicesPdfBlocks(named) as { rows: unknown[] }[]
    expect(block.rows[0]).toEqual({
      group: 'โครงการที่ 1 : โครงการงานบำรุงถนนสาย ชน.3018\nเลขที่สัญญา : ขทช.สห./30/2567 · ผู้รับจ้าง : บริษัท เอ็ม จำกัด · Solution : CCTV, Street Light',
    })
  })

  it('one contractor’s report leaves it out — its title names the contractor', () => {
    const { rows } = projectDevicesSheet({ title: 'T', projects })
    expect(rows.some((row) => row.cells.some((cell) => cell.value === 'ผู้รับจ้าง :'))).toBe(false)
    const [block] = projectDevicesPdfBlocks(projects) as { rows: { group?: string }[] }[]
    expect(block.rows[0].group).not.toContain('ผู้รับจ้าง')
  })
})
