"use client"
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import { createContext, useContext, useState } from 'react'

export interface ContextProps {
  openVMSScreen: ModalVMSScreenProps
  setOpenVMSScreen: React.Dispatch<React.SetStateAction<ModalVMSScreenProps>>
}

export interface ModalVMSScreenProps {
  open: boolean
  data?: APIResponseVMSDetail
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const DetailContext = createContext<ContextProps | null>(null)

export const INIT_VMS_SCREEN: ModalVMSScreenProps = {
  open: false,
  data: {
    "id": 0,
    "solution_id": 0,
    "weather_id": 0,
    "last_connected": "",
    "vms_weather": {
      "id": 26,
      "waqi_url": "",
      "temp_url": "",
      "icon": "",
      "road_id": 0,
      "weather_logs": []
    },
    "solution": {
      "id": 0,
      "solution_location_id": 0,
      "solution_type_id": 0,
      "sta": "",
      "solution_name": "",
      "ip_address": "",
      "zt_ip_address": "",
      "geometry_point": [],
      "remarks": "",
      "anydesk": "",
      "created_at": "",
      "created_by": "",
      "updated_by": "",
      "updated_at": "",
      "solution_location": {
        "solution_location_id": 0,
        "project_id": 0,
        "location_name": "",
        "created_at": "",
        "created_by": "",
        "project_roads": {
          "project_road_id": 0,
          "project_id": 0,
          "road_id": 0,
          "road": {
            "id": 0,
            "road_name": "",
            "road_code": "",
            "subdistrict": "",
            "district": "",
            "province": "",
            "department_id": 0,
            "start_sta": "",
            "end_sta": "",
            "distance": 0,
            "created_at": "",
            "created_by": ""
          }
        }
      }
    },
    "vms_camera": [
      {
        "id": 40,
        "vms_id": 40,
        "camera_id": "019c93dc-3149-727b-88d1-f8e0a3833450",
        "camera": {
          "id": "019c93dc-3149-727b-88d1-f8e0a3833450",
          "ip_address": "10.101.201.203",
          "department_id": 50,
          "road_id": 1807,
          "solution_id": 1720,
          "camera_name": "67 - ชม.3028(31) ป้าย 1: กม.0+300",
          "sta": "",
          "hls_url": "https://67lpc-cmi3028vms1.enixma.net/live/10.101.201.118.stream/playlist.m3u8",
          "point_geometry": [
            98.946517,
            18.727578
          ],
          "remark": "",
          "created_by": "0199b853-9428-787a-8624-9e60e37533eb",
          "created_at": "2026-02-25T15:13:27.241616+07:00",
          "ping_updated": "2026-06-18T17:13:01.938648+07:00",
          "ping_status": false,
          "curl_updated": "2026-06-18T17:13:01.938648+07:00",
          "curl_status": true,
          "contractor_id": "ca521a3e-597a-4b49-8ca3-b067a3bc9be8",
          "updated_at": "2026-06-18T17:13:04.114595+07:00"
        }
      }
    ],
    "desktop_screen": {
      "id": 40,
      "vms_id": 40,
      "desktop_screen": "https://67lpc-cmi3028vms1.enixma.net/live/vms.stream/playlist.m3u8",
      "video_timestamp": "https://video.firsttech.co.th/Screen_136520251025144756.mp4"
    }
  }
}

export const DetailProvider = (props: PageProviderProps) => {
  const { children } = props
  const [openVMSScreen, setOpenVMSScreen] = useState<ModalVMSScreenProps>(INIT_VMS_SCREEN)

  return (
    <DetailContext.Provider value={{ openVMSScreen, setOpenVMSScreen }}>
      {children}
    </DetailContext.Provider>
  )
}

export const useDetailContext = () => {
  const context = useContext(DetailContext)
  if (!context) throw new Error('useDetailContext must be used within a DetailProvider')
  return context
}
