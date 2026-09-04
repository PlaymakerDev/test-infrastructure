import React, { useCallback, useMemo, useState } from 'react'
import { CardContact, ContactTitle, TableContact } from '../../components'
import { ContractorData } from '@/types/manage/contractor-api'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getProjectListAPI } from '@/services/routes/ManageService'

interface Props {
  item: ContractorData
  type: 'TABLE' | 'GRID'
  onEdit: (item: ContractorData) => void
  onDelete: (item: ContractorData) => void
}

const ContentContactorList: React.FC<Props> = (props) => {
  const { item, type, onEdit, onDelete } = props
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'contract-project',
      item.user_id,
      page,
      limit
    ],
    queryFn: () => getProjectListAPI({
      page: page,
      limit: limit,
      contractor_id: item.user_id,
    }),
    enabled: !!item.user_id,
    placeholderData: keepPreviousData,
  })

  const handlePageChange = useCallback((newPage: number, newLimit: number) => {
    setPage(newPage)
    setLimit(newLimit)
  }, [])

  const renderContent = useMemo(() => {
    if (type === 'TABLE') {
      return (
        <TableContact
          data={data?.data}
          item={item}
          page={page}
          limit={limit}
          isLoading={isLoading}
          isError={isError}
          handlePageChange={handlePageChange}
        />
      )
    }
    if (type === 'GRID') {
      return (
        <CardContact
          data={data?.data}
          item={item}
          page={page}
          limit={limit}
          isLoading={isLoading}
          isError={isError}
          handlePageChange={handlePageChange}
        />
      )
    }
    return null
  }, [item, type, data, page, limit, isLoading, isError, handlePageChange])

  return (
    <div className='mt-5'>
      <section>
        <ContactTitle
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(ContentContactorList)
