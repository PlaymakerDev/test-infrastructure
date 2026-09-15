import { useProjectDepartmentListInfinite } from '@/hooks/queries/manage'
import { APIResponseProjectDepartment, APIResponseProjectList, ProjectListData } from '@/types/manage/project-api'
import { Empty, Skeleton, TableProps } from 'antd'
import React, { useEffect, useMemo, useRef } from 'react'
import { ProjectCollapseList } from '../../components'

interface Props {
  data?: APIResponseProjectList
  isLoading?: boolean
  isError?: boolean
  onTableChange?: NonNullable<TableProps<ProjectListData>['onChange']>
  /** ค้นหาชื่อโครงการ from FormSearchProject — forwarded into every open
   *  department card's own project-card fetch (ProjectCollapseList → …
   *  → ProjectCardList). Does NOT filter this view's own department list. */
  search?: string
  /** FormSearchProject's "ผู้ว่าจ้าง" field normally sends department_id, but
   *  GET /manage/project/department has no department_id filter — only a
   *  free-text `search`. NewProjectSection resolves the selected id to its
   *  department_short_name and passes that text here instead. */
  departmentSearchText?: string
  budgetYear?: number
  contractorId?: string
}

const ProjectGridView: React.FC<Props> = (props) => {
  const { search, departmentSearchText, budgetYear, contractorId } = props

  // onScroll pagination — mirrors NewContactSection's contractor list: each
  // scroll-triggered fetch appends the next page of departments instead of
  // replacing page 1. A departmentSearchText change swaps the query key
  // (see useProjectDepartmentListInfinite) so TanStack starts a fresh
  // page-1 fetch under the hood; no page state to reset by hand.
  const {
    data: infiniteData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProjectDepartmentListInfinite({ limit: 10, search: departmentSearchText ?? '' })

  // Flatten every fetched page into one list — ProjectCollapseList still
  // only ever sees a single APIResponseProjectDepartment, same shape
  // useQuery used to hand it.
  const pages = useMemo(() => infiniteData?.pages ?? [], [infiniteData])
  const allRows = useMemo(() => pages.flatMap((p) => p.res_data), [pages])
  const metaData = pages[0]?.meta_data
  const data: APIResponseProjectDepartment | undefined = useMemo(
    () =>
      infiniteData
        ? { res_data: allRows, meta_data: metaData ?? { count: 0, page: 1, limit: 10, total_pages: 0 } }
        : undefined,
    [infiniteData, allRows, metaData],
  )

  // Sentinel at the bottom of the list — scrolling it into view loads the
  // next page of departments, replacing the old fixed page-1/limit-10 fetch.
  const loadMoreRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // FALLBACK UI for error or empty data
  if (isLoading) return <Skeleton loading={true} active paragraph={{ rows: 4 }} />

  if (isError) {
    return (
      <div className="block m-auto py-18">
        <Empty description="เกิดข้อผิดพลาด" />
      </div>
    )
  }

  if (!data?.res_data || data.res_data.length === 0) {
    return (
      <div className="block m-auto py-18">
        <Empty description="ไม่มีข้อมูลโครงการ" />
      </div>
    )
  }

  return (
    <>
      <ProjectCollapseList
        data={data}
        search={search}
        budgetYear={budgetYear}
        contractorId={contractorId}
      />
      {/* onScroll pagination — this sentinel is the last thing in the list;
          IntersectionObserver above fires fetchNextPage() once it scrolls
          into view. */}
      {hasNextPage && (
        <div ref={loadMoreRef} className='flex justify-center items-center py-5'>
          <Skeleton.Button active={isFetchingNextPage} size='small' style={{ width: 120 }} />
        </div>
      )}
    </>
  )
}

export default React.memo<Props>(ProjectGridView)
