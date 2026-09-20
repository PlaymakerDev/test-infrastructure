import React, { useMemo } from 'react'
import { EmptySolutionContent, SolutionTitle, TableSolution } from '../components'
import { SolutionLocation } from '@/types/manage/project-detail-api'
import { useQuery } from '@tanstack/react-query'
import { getSolutionAPI } from '@/services/routes/ProjectDetailService'
import { manageKeys } from '@/hooks/queries/manage'

interface Props {
  item: SolutionLocation
}

const SolutionContent: React.FC<Props> = (props) => {
  const { item } = props

  const {
    data: solutionData,
    isLoading: isSolutionLoading,
    isError: isSolutionError
  } = useQuery({
    queryKey: manageKeys.solutions.byLocation(item.solution_location_id),
    queryFn: () => getSolutionAPI({ solution_location_id: item.solution_location_id }),
    enabled: !!item.solution_location_id,
  })

  const renderContent = useMemo(() => {
    if (!solutionData?.data?.length) return <EmptySolutionContent item={item} />
    return (
      <TableSolution
        item={item}
        data={solutionData?.data}
        isLoading={isSolutionLoading}
        isError={isSolutionError}
      />
    )
  }, [isSolutionLoading, isSolutionError, solutionData, item])


  return (
    <div>
      <section>
        <SolutionTitle
          item={item}
          hasSolution={!!solutionData?.data?.length}
          data={solutionData?.data}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(SolutionContent)
