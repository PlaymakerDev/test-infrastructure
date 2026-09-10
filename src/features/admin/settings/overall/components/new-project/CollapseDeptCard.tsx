import { manageKeys } from '@/hooks/queries/manage'
import { getProjectListAPI } from '@/services/routes/ManageService'
import { ProjectDepartmentData, ProjectListData } from '@/types/manage/project-api'
import { fmtNumber } from '@/utils/formatNumber'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import React, { useCallback, useState } from 'react'
import { TbChevronDown, TbChevronUp } from "react-icons/tb";
import { ProjectCardList } from '../../components'

interface Props {
  data?: ProjectDepartmentData
  /** FormSearchProject filters — kept in sync so a card's project list
   *  narrows the same way the LIST view does. */
  search?: string
  budgetYear?: number
  contractorId?: string
  onEdit?: (row: ProjectListData) => void
  onDelete?: (row: ProjectListData) => void
}

const CollapseDeptCard: React.FC<Props> = (props) => {
  const { data, search, budgetYear, contractorId, onEdit, onDelete } = props
  const hasFilter = !!(search?.trim() || budgetYear || contractorId)

  const [manualCollapsed, setManualCollapsed] = useState(!hasFilter)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const handlePageChange = useCallback((newPage: number, newLimit: number) => {
    setPage(newPage)
    setLimit(newLimit)
  }, [])

  // A new search/filter submission narrows the result set — start this dept
  // card's project list over at page 1, and force the collapse open so a
  // match is immediately visible instead of requiring a click (clearing
  // every filter collapses it back down). Reset during render (the
  // sanctioned "adjusting state when props change" pattern — see
  // MobileSection.tsx) — react-hooks/set-state-in-effect forbids doing this
  // in a useEffect.
  const filterKey = `${search ?? ''}|${budgetYear ?? ''}|${contractorId ?? ''}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
    setManualCollapsed(!hasFilter)
  }

  const isCollapsed = manualCollapsed

  // Fetch even while collapsed once a filter is active — this is the only
  // way to know whether this department has ANY matching project, so a
  // zero-result department can hide its whole card instead of showing an
  // empty collapse the user has to open to rule out.
  const { data: projectList, isLoading, isError } = useQuery({
    queryKey: manageKeys.projects.byDepartment(data?.department_id || 0, {
      page,
      limit,
      search,
      budget_year: budgetYear,
      contractor_id: contractorId,
    }),
    queryFn: () => getProjectListAPI({
      page,
      limit,
      department_id: data?.department_id,
      search: search || undefined,
      budget_year: budgetYear,
      contractor_id: contractorId,
      sort: 'DESC',
    }),
    enabled: data?.department_id !== undefined && (!isCollapsed || hasFilter),
    placeholderData: keepPreviousData,
  })

  // Only the departments a search/filter actually matched should show —
  // once this department's filtered fetch comes back empty, drop the whole
  // card (header included) instead of leaving a dead, empty collapse around.
  if (hasFilter && !isLoading && !isError && (projectList?.data.res_data.length ?? 0) === 0) {
    return null
  }

  return (
    <>
      <div
        className='rounded-lg px-5 py-3.5 bg-(--gray) cursor-pointer mb-5'
        onClick={() => setManualCollapsed(!isCollapsed)}
      >
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-3'>
            <h4>{data?.department_short_name || '-'}</h4>
            <div className='px-3 text-center rounded-2xl border border-white'>
              <p className='fs-12'>{fmtNumber(Number(data?.project_count || 0))} โครงการ</p>
            </div>
          </div>
          {isCollapsed ? (
            <TbChevronDown className='text-(--yellow) fs-18' />
          ) : (
            <TbChevronUp className='text-(--yellow) fs-18' />
          )}
        </div>
      </div>
      {!isCollapsed && (
        <ProjectCardList
          data={projectList?.data}
          item={data}
          page={page}
          limit={limit}
          isLoading={isLoading}
          isError={isError}
          handlePageChange={handlePageChange}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  )
}

export default React.memo<Props>(CollapseDeptCard)
