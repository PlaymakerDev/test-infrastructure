import React, { useCallback, useState } from 'react'
import { TableUserData, FormSearchUser } from '../components'
import { useDepartments, useUsersList } from '@/hooks/queries/manage'
import type { UserSearchFormValues } from './new-user/FormSearchUser'

interface Props {

}

const NewUserSection: React.FC<Props> = (props) => {
  const { } = props

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')

  const { data: departments, isLoading: isDepartmentsLoading, isError: isDepartmentsError } = useDepartments()

  // useUsersList works around GET /manage/general_user?search=… returning
  // malformed JSON (backend bug) by stripping `search` from the network call
  // and filtering client-side instead — see the hook's own docstring.
  const { data: generalUsersData, isLoading: isGeneralUsersLoading, isError: isGeneralUsersError } = useUsersList({
    page,
    limit,
    search: search || undefined,
  })

  // A new search submission starts over at page 1 — otherwise the user
  // could land on a page past the new, narrower result set.
  const handleSearch = useCallback((values: UserSearchFormValues) => {
    setSearch(values.search?.trim() ?? '')
    setPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number, newLimit: number) => {
    setPage(newPage)
    setLimit(newLimit)
  }, [])

  return (
    <div>
      <section>
        <FormSearchUser onSearch={handleSearch} />
      </section>
      <section className='mt-5'>
        <TableUserData
          // GENERAL USERS
          data={generalUsersData}
          isLoading={isGeneralUsersLoading}
          isError={isGeneralUsersError}
          // DEPARTMENTS
          departmentsData={departments}
          isDepartmentsLoading={isDepartmentsLoading}
          isDepartmentsError={isDepartmentsError}
          onPageChange={handlePageChange}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(NewUserSection)
