import React from 'react'
import {
  FormSearchLicense,
  LicenseList
} from '@/features/admin/tracking/detail/license/components'
import { useLicenseContext } from '../../../context'

interface Props {
  openFromDrawer?: boolean
}

const SearchSection: React.FC<Props> = (props) => {
  const { openFromDrawer } = props
  const { setLicense } = useLicenseContext()

  return (
    <div
      className={`bg-(--dark-black) rounded-tr-lg ${openFromDrawer ? 'p-5' : 'py-10 px-12'} h-full`}
    >
      <section>
        <FormSearchLicense />
      </section>
      <section className='mt-5'>
        <LicenseList
          data={[
            {
              id: "1",
              license_no: "6กต4724",
              license_province: "กรุงเทพมหานคร",
              license_type: "รถยนต์",
              road_description: "WIM สมุทรปราการ (สป.2001) ขวาทาง",
              sta: "กม.2+100",
              timestamp: "31 มี.ค. 2569 15:08:42",
              timeline: [
                {
                  id: "1",
                  image: "https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg",
                  title: "WIM สมุทรปราการ (สป.2001) ขวาทาง กม.2+100",
                  timestamp: "31 มี.ค. 2569 15:08:42",
                  camera_name: "68CNZ-WIM-SPK2001-CAM01-ขวาทาง กม.2+100 ด้านเขาทาง",
                  status: "ไม่เกินพิกัด",
                  speed: "67",
                  lane: "1",
                  weight: "1.4",
                  legal_weight: "9.5",
                },
                {
                  id: "2",
                  image: "https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg",
                  title: "สายทาง สป.2014 กม.0+005",
                  timestamp: "26 มี.ค. 2569 12:27:30",
                  camera_name: "68FTD-SPK2014-FAI002-จุดที่1-กม.0+005-มุ่งหน้าโรงงานไดโยต้า",
                  status: "ไม่เกินพิกัด",
                  speed: "75",
                  lane: "2",
                },
                {
                  id: "3",
                  image: "https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg",
                  title: "สายทาง สป.2014 กม.0+005",
                  timestamp: "20 มี.ค. 2569 17:20:36",
                  camera_name: "68FTD-SPK2014-FAI002-จุดที่1-กม.0+005-มุ่งหน้าโรงงานไดโยต้า",
                  status: "ไม่เกินพิกัด",
                  speed: "68",
                  lane: "1",
                },
                {
                  id: "4",
                  image: "https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg",
                  title: "WIM สมุทรปราการ (สป.2001) ขวาทาง กม.2+100",
                  timestamp: "18 มี.ค. 2569 09:12:18",
                  camera_name: "68CNZ-WIM-SPK2001-CAM01-ขวาทาง กม.2+100 ด้านเขาทาง",
                  status: "เกินพิกัด",
                  speed: "59",
                  lane: "1",
                  weight: "9.8",
                  legal_weight: "9.5",
                },
                {
                  id: "5",
                  image: "https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg",
                  title: "WIM อยุธยา (อย.2053)",
                  timestamp: "15 มี.ค. 2569 16:37:28",
                  camera_name: "68MST-AYA3032-CAM001-กม.2+250-มุ่งหน้าโรงเรียนวัดพระงาม",
                  status: "ไม่เกินพิกัด",
                  speed: "82",
                  lane: "1",
                  weight: "5.4",
                  legal_weight: "9.5",
                },
              ]
            },
            {
              id: "2",
              license_no: "กว7683",
              license_province: "เชียงราย",
              license_type: "รถกระบะ",
              road_description: "สายทาง ชร.1023",
              sta: "กม.5+430",
              timestamp: "31 มี.ค. 2569 14:03:25"
            },
            {
              id: "3",
              license_no: "70-4336",
              license_province: "กรุงเทพมหานคร",
              license_type: "รถพ่วง",
              road_description: "สายทาง รย.3025",
              sta: "กม.0+050 - 24+750",
              timestamp: "31 มี.ค. 2569 14:02:13"
            },
          ]}
          onSelect={(item) => setLicense(item)}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(SearchSection)
