import CardList, { DataType } from '@/components/list/CardList'
import React from 'react'

interface Props { }

const mockData: DataType[] = [
  {
    id: 1,
    plate: 'ขฉ8960 เชียงใหม่',
    vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น',
    status: 'น้ำหนักปกติ',
    actualWeight: '3.000 ตัน',
    stdWeight: '9.500 ตัน',
    overweight: '0.000 ตัน',
    laneAcceptance: 'กราย',
    speed: '59.00 กม./ชม.',
    datetime: '20 เม.ย. 2569 23:56:27 น.',
    images: [
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'รถด้านหน้า' },
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'ป้ายทะเบียน' },
    ],
  },
  {
    id: 2,
    plate: 'งพ8934 เชียงใหม่',
    vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น',
    status: 'น้ำหนักปกติ',
    actualWeight: '2.200 ตัน',
    stdWeight: '9.500 ตัน',
    overweight: '0.000 ตัน',
    laneAcceptance: 'ช่องจอด',
    speed: '45.00 กม./ชม.',
    datetime: '20 เม.ย. 2569 23:22:17 น.',
    images: [
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'รถด้านหน้า' },
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'ป้ายทะเบียน' },
    ],
  },
  {
    id: 3,
    plate: '840417 เชียงใหม่',
    vehicleType: 'ประเภท 2 : 2 เพลา 6 เส้น',
    status: 'น้ำหนักปกติ',
    actualWeight: '6.800 ตัน',
    stdWeight: '15.000 ตัน',
    overweight: '0.000 ตัน',
    laneAcceptance: 'ช่องออก',
    speed: '57.00 กม./ชม.',
    datetime: '20 เม.ย. 2569 22:38:02 น.',
    images: [
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'รถด้านหน้า' },
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'ป้ายทะเบียน' },
    ],
  },
  {
    id: 4,
    plate: 'ผพ6933 เชียงใหม่',
    vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น',
    status: 'น้ำหนักปกติ',
    actualWeight: '4.600 ตัน',
    stdWeight: '9.500 ตัน',
    overweight: '0.000 ตัน',
    laneAcceptance: 'กราย',
    speed: '42.00 กม./ชม.',
    datetime: '20 เม.ย. 2569 22:20:26 น.',
    images: [
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'รถด้านหน้า' },
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'ป้ายทะเบียน' },
    ],
  },
  {
    id: 5,
    plate: 'ยน9227 เชียงใหม่',
    vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น',
    status: 'น้ำหนักปกติ',
    actualWeight: '1.200 ตัน',
    stdWeight: '9.500 ตัน',
    overweight: '0.000 ตัน',
    laneAcceptance: 'ช่องจอด',
    speed: '67.00 กม./ชม.',
    datetime: '20 เม.ย. 2569 22:08:48 น.',
    images: [
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'รถด้านหน้า' },
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'ป้ายทะเบียน' },
    ],
  },
  {
    id: 6,
    plate: '1กช1540 เชียงใหม่',
    vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น',
    status: 'แจ้งเตือนน้ำหนัก',
    actualWeight: '1.400 ตัน',
    stdWeight: '9.500 ตัน',
    overweight: '0.000 ตัน',
    laneAcceptance: 'ช่องออก',
    speed: '48.00 กม./ชม.',
    datetime: '20 เม.ย. 2569 22:04:28 น.',
    images: [
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'รถด้านหน้า' },
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'ป้ายทะเบียน' },
    ],
  },
  {
    id: 7,
    plate: 'ยค9968 เชียงใหม่',
    vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น',
    status: 'น้ำหนักปกติ',
    actualWeight: '2.800 ตัน',
    stdWeight: '9.500 ตัน',
    overweight: '0.000 ตัน',
    laneAcceptance: 'กราย',
    speed: '58.00 กม./ชม.',
    datetime: '20 เม.ย. 2569 22:02:03 น.',
    images: [
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'รถด้านหน้า' },
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'ป้ายทะเบียน' },
    ],
  },
  {
    id: 8,
    plate: 'ผร7875 เชียงใหม่',
    vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น',
    status: 'น้ำหนักเกิน',
    actualWeight: '3.200 ตัน',
    stdWeight: '9.500 ตัน',
    overweight: '0.000 ตัน',
    laneAcceptance: 'ช่องจอด',
    speed: '62.00 กม./ชม.',
    datetime: '20 เม.ย. 2569 21:59:19 น.',
    images: [
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'รถด้านหน้า' },
      { image: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', description: 'ป้ายทะเบียน' },
    ],
  },
]

const OverallDailyWeightList: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <CardList data={mockData} />
    </div>
  )
}

export default React.memo<Props>(OverallDailyWeightList)
