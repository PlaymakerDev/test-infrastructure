import { fmtNumber } from '@/utils/formatNumber'

/**
 * ค่าที่ backend ส่ง null เมื่อ "ประเมินไม่ได้" (แก้ 11 ต.ค. 2569 — ห้ามแสดงข้อมูลผิด)
 *
 * - v/c · LOS · Capacity Utilization: ยังไม่มีจำนวนช่องจราจร/ความจุถนนที่ยืนยันรายจุด
 *   (ของเดิมใช้ค่าเฉลี่ยทั้งวัน ÷ 2 × lane × 1400 → ทุกจุดขึ้น LOS A แม้สะพานภูมิพลพีค 8,433 คัน/ชม.)
 * - Flow Efficiency: คิดจากความเร็วที่ถูกตัดพื้นไว้ 40 กม./ชม. (ไม่มีรถคันไหนช้ากว่านั้นแม้ตอนติด)
 * - PHF: ค่าจริงจากข้อมูลราย 15 นาที · null = ชั่วโมงพีคมีข้อมูลไม่ครบ 4 ช่วง
 */
export const NOT_ASSESSABLE = 'ประเมินไม่ได้'

export const naOr = (v: number | null | undefined, decimals: number, suffix = ''): string =>
  v == null ? NOT_ASSESSABLE : `${fmtNumber(v, decimals)}${suffix}`

/** PHF ต้องมี 2 ตำแหน่ง — 0.96 กับ 0.85 ต่างกันมากในทางวิศวกรรม แต่ปัด 1 ตำแหน่งได้ 1.0/0.9 */
export const phfOr = (v: number | null | undefined): string => (v == null ? 'ข้อมูลไม่ครบ' : fmtNumber(v, 2))
