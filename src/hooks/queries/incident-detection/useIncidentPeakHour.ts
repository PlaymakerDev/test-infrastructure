import { useQuery } from '@tanstack/react-query'
import { getIncidentPeakHourAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Peak event hour for one solution (today) + its share of the day's events.
 *  Powers the "ช่วงเวลาที่มีเหตุการณ์มากที่สุด" stat card on detail Tab1. */
export const useIncidentPeakHour = (solutionId: string | number | null | undefined) =>
  useQuery({
    queryKey: incidentKeys.details.peakHour(solutionId ?? ''),
    queryFn: () => getIncidentPeakHourAPI(solutionId!).then((r) => r.data),
    enabled: !!solutionId,
  })
