import type { ProjectDetail } from '../types'

const CCTV_EQUIPMENT = (idx: number): import('../types').Equipment[] =>
  Array.from({ length: 5 }, (_, i) => ({
    id: `eq-${idx}-${i + 1}`,
    name: `DRR-KK1027-CAM0${i + 1} - กม.1+${380 + i * 55} มุ่งหน้า${i % 2 === 0 ? 'โรงเรียนบ้านโกทา (ขาเข้า)' : 'ทางหลวงหมายเลข 2 (ขาออก)'}`,
    km: `1+${380 + i * 55}`,
    ipAddress: `192.168.3.${170 + i}`,
    hlsUrl: `https://stream.example/${idx}-${i + 1}.m3u8`,
    latitude: `16.44${i}`,
    longitude: `102.83${i}`,
    isOnline: i !== 1,
    streamConnected: i !== 1,
    lastUpdated: '2026-04-30T09:35:29+07:00',
    crossingCode: [
      '860685c559be215f24399f2551bce2acce2f8400',
      '8a1a99add562a1f7a5583ffa57f51e42405a5e93',
      'e93640cda974efcb38601d4fb2dfdb21e86923ba',
      '1fd0dda2815bd848fdbbbc980921cbd5ca7bb',
      '4693e2a2d6516f0045f7df9b973f3170d756d13f',
    ][i],
  }))

export const MOCK_PROJECT_DETAIL: Record<string, ProjectDetail> = {
  'p-001': {
    id: 'p-001',
    code: 'tpj-0001',
    name: 'โครงการปรับปรุงทางเพื่อความปลอดภัย ถนนสาย ขก.1027 แยกทางหลวงหมายเลข 2 - บ้านโคกท่า อำเภอเมืองขอนแก่น จังหวัดขอนแก่น',
    warrantyStatus: 'in-warranty',
    routes: [
      {
        id: 'r-1027',
        code: 'ขก.1027',
        points: [
          {
            id: 'pt-1-1',
            name: 'จุดติดตั้งที่ 1',
            taskTypes: [
              {
                id: 'tt-1-1-cctv',
                kind: 'CCTV',
                pointName: 'จุดติดตั้งที่ 1',
                latitude: '16.441',
                longitude: '102.831',
                km: '1+380',
                localIp: '192.168.3.170',
                anyDesk: '123 456 789',
                ztIp: '10.147.20.10',
                equipment: CCTV_EQUIPMENT(1),
              },
              {
                id: 'tt-1-1-tv',
                kind: 'Traffic Volume',
                pointName: 'จุดติดตั้งที่ 1',
                latitude: '16.441',
                longitude: '102.831',
                km: '1+380',
                equipment: [],
                equipmentRefs: ['eq-1-1'],
              },
              {
                id: 'tt-1-1-id',
                kind: 'Incident Detection',
                pointName: 'จุดติดตั้งที่ 1',
                latitude: '16.441',
                longitude: '102.831',
                km: '1+380',
                equipment: [],
                equipmentRefs: [],
              },
            ],
          },
          {
            id: 'pt-1-2',
            name: 'จุดติดตั้งที่ 2',
            taskTypes: [
              {
                id: 'tt-1-2-cctv',
                kind: 'CCTV',
                pointName: 'จุดติดตั้งที่ 2',
                latitude: '16.442',
                longitude: '102.832',
                km: '1+600',
                equipment: CCTV_EQUIPMENT(2).slice(0, 1),
              },
            ],
          },
          {
            id: 'pt-1-3',
            name: 'จุดติดตั้งที่ 3',
            taskTypes: [
              {
                id: 'tt-1-3-cctv',
                kind: 'CCTV',
                pointName: 'จุดติดตั้งที่ 3',
                latitude: '16.443',
                longitude: '102.833',
                km: '1+650',
                equipment: CCTV_EQUIPMENT(3).slice(0, 1),
              },
            ],
          },
        ],
      },
      {
        id: 'r-1039',
        code: 'ขก.1039',
        points: [],
      },
    ],
  },
}

export const emptyProjectDetail = (id: string, name = '(โครงการใหม่)'): ProjectDetail => ({
  id,
  code: id,
  name,
  warrantyStatus: 'in-warranty',
  routes: [{ id: 'r-default', code: '-', points: [] }],
})
