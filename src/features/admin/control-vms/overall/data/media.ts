export const VIDEO_EXTENSIONS = /\.(mp4|avi|mov|webm|mkv)(\?.*)?$/i

export const isVideoUrl = (url: string): boolean => VIDEO_EXTENSIONS.test(url)
