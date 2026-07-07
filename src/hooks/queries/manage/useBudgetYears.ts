import { useQuery } from '@tanstack/react-query'
import { getProjectBudgetYearsAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** GET /manage/project/budget_year — bare `number[]`, no envelope. Powers
 *  the budget-year dropdown filter above the Project tab table. */
export const useBudgetYears = () =>
  useQuery({
    queryKey: manageKeys.dropdowns.budgetYears(),
    queryFn: () => getProjectBudgetYearsAPI().then((r) => r.data),
  })
