// Region → provinces, for rendering a region choropleth (§6 "Region taxonomy").
//
// The backend's region scheme is the government **4-region + Bangkok split = 5
// values** (NOT the 6 geographic regions, NOT สทช.). Region strings arrive with
// the "ภาค" prefix; ภาคกลาง is the big bucket that absorbs the East
// (ชลบุรี/ระยอง…) and West (กาญจนบุรี/เพชรบุรี…).
//
// ⚠️ This is the FE's interim copy built from the documented standard
// (counts verified: 17 / 25 / 20 / 14 / 1 = 77). The authoritative source is
// backend's `th.provinces` — if a boundary province ever disagrees, replace
// this table with the backend's canonical mapping (province names already match
// `th.provinces.name_th` 1:1).

export const REGION_TO_PROVINCES: Record<string, string[]> = {
  ภาคเหนือ: [
    "เชียงราย", "เชียงใหม่", "น่าน", "พะเยา", "แพร่", "แม่ฮ่องสอน", "ลำปาง",
    "ลำพูน", "อุตรดิตถ์", "ตาก", "พิษณุโลก", "เพชรบูรณ์", "สุโขทัย",
    "กำแพงเพชร", "นครสวรรค์", "พิจิตร", "อุทัยธานี",
  ],
  ภาคกลาง: [
    "ปทุมธานี", "นนทบุรี", "สมุทรปราการ", "พระนครศรีอยุธยา", "อ่างทอง",
    "สระบุรี", "ลพบุรี", "สิงห์บุรี", "ชัยนาท", "ชลบุรี", "ระยอง", "จันทบุรี",
    "ตราด", "เพชรบุรี", "ประจวบคีรีขันธ์", "ราชบุรี", "สมุทรสงคราม",
    "สมุทรสาคร", "ฉะเชิงเทรา", "ปราจีนบุรี", "นครนายก", "สระแก้ว",
    "สุพรรณบุรี", "กาญจนบุรี", "นครปฐม",
  ],
  ภาคตะวันออกเฉียงเหนือ: [
    "นครราชสีมา", "ชัยภูมิ", "บุรีรัมย์", "สุรินทร์", "ขอนแก่น", "เลย",
    "มหาสารคาม", "ร้อยเอ็ด", "อุบลราชธานี", "ศรีสะเกษ", "อำนาจเจริญ", "ยโสธร",
    "อุดรธานี", "หนองบัวลำภู", "หนองคาย", "บึงกาฬ", "กาฬสินธุ์", "สกลนคร",
    "นครพนม", "มุกดาหาร",
  ],
  ภาคใต้: [
    "สุราษฎร์ธานี", "นครศรีธรรมราช", "ชุมพร", "ระนอง", "สงขลา", "สตูล", "ยะลา",
    "ปัตตานี", "นราธิวาส", "กระบี่", "พังงา", "ภูเก็ต", "ตรัง", "พัทลุง",
  ],
  กรุงเทพมหานคร: ["กรุงเทพมหานคร"],
}

// Region names the backend may send as the area column value.
export const REGION_NAMES: ReadonlySet<string> = new Set(
  Object.keys(REGION_TO_PROVINCES),
)
