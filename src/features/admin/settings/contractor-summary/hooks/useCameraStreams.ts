import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { getCctvCameraCentralListAPI } from '@/services/routes/CCTVService'
import { cctvKeys } from '@/hooks/queries/cctv'

/** camera id → hls_url for the cameras on the given roads.
 *
 *  GET /manage/project/device-status/{id} lists a project's cameras without
 *  their stream, so the Live Stream modal reads it from the CCTV menu's road
 *  camera list — one call per road, the same key and payload shape as
 *  useCctvCameraCentralList, so the two share cache. */
export const useCameraStreams = (roadIds: number[]) => {
  const queries = useQueries({
    queries: roadIds.map((roadId) => ({
      queryKey: cctvKeys.cameraCentralByRoad(roadId),
      queryFn: () => getCctvCameraCentralListAPI(roadId).then((r) => r.data),
    })),
  })

  const streams = useMemo(() => {
    const byId = new Map<string, string>()
    for (const query of queries) {
      for (const list of query.data?.lists ?? []) {
        for (const camera of list.cameras ?? []) {
          if (camera.hls_url) byId.set(camera.id, camera.hls_url)
        }
      }
    }
    return byId
  }, [queries])

  return { streams, isLoading: queries.some((query) => query.isLoading) }
}
