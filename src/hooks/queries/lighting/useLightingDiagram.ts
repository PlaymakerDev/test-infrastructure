import { useQuery } from '@tanstack/react-query'
import { getLightingDiagramAPI } from '@/services/routes/LightingService'
import { lightingKeys } from './queryKeys'

/** Circuit diagram data for one device — used to check whether `components`
 *  is populated before rendering the diagram iframe (it's sometimes empty
 *  even when `connections` isn't, a backend data gap that otherwise renders
 *  as a silent blank canvas). */
export const useLightingDiagram = (imei: string) =>
  useQuery({
    queryKey: lightingKeys.diagram(imei),
    queryFn: () => getLightingDiagramAPI(imei).then((r) => r.data),
    enabled: !!imei,
  })
