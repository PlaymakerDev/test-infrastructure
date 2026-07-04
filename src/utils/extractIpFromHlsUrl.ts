/** Pull an IPv4 address out of an HLS stream URL.
 *
 *  Several backend endpoints (crosswalk `/cameras/random-online`, traffic-volume
 *  `/cameras/random-online`, …) omit `ip_address` from the response but embed
 *  the camera's IP inside the stream path, e.g.
 *  `https://…/live/10.101.201.125.stream/playlist.m3u8`. Extract it so the
 *  UI can display "IP Address : …" without a separate API field. Returns
 *  `'-'` when no IPv4 is present. */
export const extractIpFromHlsUrl = (url: string | undefined | null): string => {
  if (!url) return '-'
  const match = url.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/)
  return match?.[1] ?? '-'
}
