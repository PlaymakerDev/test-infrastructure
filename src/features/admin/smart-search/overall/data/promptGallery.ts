// "What can I ask?" gallery (Future #2) — example questions grouped by topic.
// Clicking one sends it via /ask, so it doubles as onboarding + adoption aid for
// non-technical users. Keep questions concrete (the backend answers these well).

export interface PromptCategory {
  key: string
  label: string
  prompts: string[]
}

export const PROMPT_GALLERY: PromptCategory[] = [
  {
    key: "cctv",
    label: "กล้อง CCTV",
    prompts: [
      "จังหวัดเชียงใหม่มีกล้อง CCTV กี่ตัว",
      "กล้อง CCTV ที่ออฟไลน์มีกี่ตัว แยกตามจังหวัด",
      "แต่ละจังหวัดมีกล้อง CCTV กี่ตัว",
    ],
  },
  {
    key: "traffic",
    label: "ปริมาณจราจร",
    prompts: [
      "สายทางไหนมีปริมาณ PCU มากที่สุด",
      "ปริมาณจราจรเฉลี่ยต่อวันของแต่ละจังหวัด",
      "เปรียบเทียบปริมาณจราจรปีนี้กับปีที่แล้ว",
    ],
  },
  {
    key: "signal",
    label: "สัญญาณไฟจราจร",
    prompts: [
      "มีจุดสัญญาณไฟจราจรทั้งหมดกี่จุด",
      "จังหวัดเชียงใหม่มีจุดสัญญาณไฟจราจรกี่จุด",
      "ตู้สัญญาณไฟที่ไม่เชื่อมต่อมีกี่จุด",
    ],
  },
  {
    key: "lighting",
    label: "ไฟส่องสว่าง",
    prompts: [
      "ไฟส่องสว่างที่ออฟไลน์มีกี่จุด",
      "แต่ละจังหวัดมีไฟส่องสว่างกี่จุด",
      "ทางม้าลายมีทั้งหมดกี่แห่ง",
    ],
  },
  {
    key: "area",
    label: "พื้นที่ / แผนที่",
    prompts: [
      "แต่ละภาคมีกล้อง CCTV กี่ตัว",
      "จำนวนจุดสัญญาณไฟแยกตามจังหวัด",
      "ภาคที่มีกล้อง CCTV เยอะสุด มีจุดสัญญาณไฟกี่จุด",
    ],
  },
]
