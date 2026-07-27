import { useQuery } from '@tanstack/react-query'
import { getSideMenuRoadAPI } from '@/services/routes/SharedService'

/** Solution-type list scoped to ONE road (`/manage/departments/side_menu/roads`)
 *  — feeds the สายทาง tab's per-road collapse (SidebarRoute's DataDisplaySection),
 *  the road-scoped counterpart of SidebarContent's per-department solutions list. */
export const useSideMenuRoad = (roadId?: number) =>
  useQuery({
    queryKey: ['side-menu-road', roadId] as const,
    queryFn: () => getSideMenuRoadAPI({ road_id: roadId }).then((r) => r.data),
    enabled: !!roadId,
  })
