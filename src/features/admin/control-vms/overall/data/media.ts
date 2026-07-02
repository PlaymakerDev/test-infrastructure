export const VIDEO_EXTENSIONS = /\.(mp4|avi|mov|webm|mkv)(\?.*)?$/i

export const isVideoUrl = (url: string): boolean => VIDEO_EXTENSIONS.test(url)

// A setting can own multiple schedules (v2 API); TEXT-only schedules have no media_url.
// Use the first schedule with a non-empty media_url as the representative thumbnail/preview.
export const getPrimaryMediaUrl = (schedules?: { media_url: string }[]): string =>
  schedules?.find(s => s.media_url)?.media_url ?? ''
