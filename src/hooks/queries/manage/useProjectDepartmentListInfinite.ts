import { useInfiniteQuery } from '@tanstack/react-query'
import { getProjectDepartmentAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'
import type { APIRequestProjectDepartment } from '@/types/manage/project-api'

/** GET /manage/project/department — infinite-scroll variant, used by the
 *  grid view's department-collapse list (ProjectGridView) onScroll
 *  pagination. Each scroll-triggered fetch appends the next page of
 *  departments instead of replacing it. */
export const useProjectDepartmentListInfinite = (
  params: Omit<APIRequestProjectDepartment, 'page'> = {},
) => {
  const merged: Omit<APIRequestProjectDepartment, 'page'> = { limit: 10, ...params }

  return useInfiniteQuery({
    queryKey: manageKeys.projects.departmentsInfinite(merged),
    queryFn: ({ pageParam }) =>
      getProjectDepartmentAPI({ ...merged, page: pageParam }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta_data.page < last.meta_data.total_pages
        ? last.meta_data.page + 1
        : undefined,
  })
}
