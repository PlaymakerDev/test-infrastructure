import { useQuery } from '@tanstack/react-query'
import { getLightingDiagramTemplatesAPI } from '@/services/routes/LightingService'
import { lightingKeys } from './queryKeys'

/** The circuit-diagram layouts a new Lighting device can start from.
 *
 *  Backs the ประเภท Diagram picker on the settings create form: the chosen
 *  template's `name` is what goes into `tbl_lighting_iot.diagram_type`, and
 *  the backend copies that template into the device's own diagram on create.
 *
 *  The list is small (4 today) and effectively static, so it is cached for
 *  the session rather than refetched per modal open. */
export const useLightingDiagramTemplates = (enabled = true) =>
  useQuery({
    queryKey: lightingKeys.diagramTemplates(),
    queryFn: () => getLightingDiagramTemplatesAPI().then((r) => r.data),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
