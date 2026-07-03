import { MediaSchedule, VMSMediaList } from '@/types/control-vms/vms-api'

export const VIDEO_EXTENSIONS = /\.(mp4|avi|mov|webm|mkv)(\?.*)?$/i

export const isVideoUrl = (url: string): boolean => VIDEO_EXTENSIONS.test(url)

// A setting can own multiple schedules (v2 API), each with its own media_url.
export interface ScheduleCard {
  item: VMSMediaList
  schedule: MediaSchedule
}
