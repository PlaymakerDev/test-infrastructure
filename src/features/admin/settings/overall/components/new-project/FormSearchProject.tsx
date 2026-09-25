import { useBudgetYears, useDepartments, useProjectContractors } from '@/hooks/queries/manage'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { setProjectModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { AppstoreOutlined, BarsOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, ConfigProvider, Input, Row, Segmented, Select } from 'antd'
import React, { useCallback, useRef } from 'react'
import dayjs from 'dayjs'
import { Controller, useForm } from 'react-hook-form'
import { TbPrinter, TbSearch } from 'react-icons/tb'
import { isAdmin } from '@/utils/isAdmin'

export interface ProjectSearchFormValues {
  /** Numeric — MUST match budgetYears' element type (useBudgetYears returns
   *  number[]) or the Select's value never matches an option, which breaks
   *  allowClear (the "x" clears the field value but the Select was never
   *  showing a real matched selection to begin with). */
  budget_year?: number | null
  department_id?: string | null
  contractor_id?: string | null
  search?: string
}

interface Props {
  onSearch: (values: ProjectSearchFormValues) => void
  onExport?: () => void
  displayType: 'LIST' | 'GRID'
  setDisplayType: (displayType: 'LIST' | 'GRID') => void
}

const FormSearchProject: React.FC<Props> = (props) => {
  const { onSearch, onExport, displayType, setDisplayType } = props
  const dispatch = useAppDispatch()
  const submitRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { info } = useAppSelector(state => state.auth)
  const isAdminUser = isAdmin(info)

  const { data: budgetYears, isLoading: byLoading } = useBudgetYears()
  const { data: departments, isLoading: deptLoading } = useDepartments()
  const { data: contractors, isLoading: cLoading } = useProjectContractors()

  const form = useForm<ProjectSearchFormValues>({
    defaultValues: {
      budget_year: Number(dayjs().format('BBBB')),
      department_id: null,
      contractor_id: null,
      search: '',
    }
  })

  const { control, handleSubmit } = form

  const onSubmit = useCallback((data: ProjectSearchFormValues) => {
    onSearch(data)
  }, [onSearch])

  const onOpenCreateProjectModal = useCallback(() => {
    dispatch(setProjectModalOpen({ open: true, type: 'CREATE' }))
  }, [dispatch])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Row gutter={[16, 16]} align={'bottom'}>
        <Col xs={24} sm={24} md={12} lg={8} xl={8} xxl={4} xxxl={3}>
          <Controller
            control={control}
            name='budget_year'
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='text-(--yellow)'>ปีงบประมาณ</label>
                  <Select
                    {...field}
                    placeholder='ปีงบประมาณ...'
                    size="large"
                    className='w-full'
                    allowClear
                    showSearch
                    loading={byLoading}
                    options={budgetYears?.map(year => ({ label: year, value: year }))}
                    onChange={(e) => {
                      // AntD's clear (x) fires onChange(undefined) — react-hook-form
                      // silently no-ops a Controller onChange call given `undefined`
                      // (confirmed live: field.onChange(undefined) never re-renders),
                      // so allowClear never visibly cleared this field. Coerce to
                      // `null`, same "empty" sentinel department_id/contractor_id's
                      // defaultValues already use.
                      field.onChange(e ?? null)
                      if (timeoutRef.current) clearTimeout(timeoutRef.current)
                      timeoutRef.current = setTimeout(() => {
                        submitRef.current?.click()
                      }, 700)
                    }}
                  />
                </fieldset>
              )
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={8} xl={8} xxl={4} xxxl={3}>
          <Controller
            control={control}
            name='department_id'
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='text-(--yellow)'>ผู้ว่าจ้าง</label>
                  <Select
                    {...field}
                    placeholder='ผู้ว่าจ้างทั้งหมด...'
                    size="large"
                    className='w-full'
                    allowClear
                    // Flat (non-grouped) options: rc-select's default auto-filter
                    // matches the typed text against fieldNames.value ('id') when
                    // no optionFilterProp/filterOption is given — never matches,
                    // since the user types the label text. Point it at the label
                    // field explicitly.
                    showSearch={{ optionFilterProp: 'department_short_name' }}
                    loading={deptLoading}
                    options={departments}
                    fieldNames={{ label: 'department_short_name', value: 'id' }}
                    onChange={(e) => {
                      // See budget_year's onChange — same undefined-vs-null defense.
                      field.onChange(e ?? null)
                      if (timeoutRef.current) clearTimeout(timeoutRef.current)
                      timeoutRef.current = setTimeout(() => {
                        submitRef.current?.click()
                      }, 700)
                    }}
                  />
                </fieldset>
              )
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={8} xl={8} xxl={4} xxxl={3}>
          <Controller
            control={control}
            name='contractor_id'
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='text-(--yellow)'>ผู้รับจ้าง</label>
                  <Select
                    {...field}
                    placeholder='ผู้รับจ้างทั้งหมด...'
                    size="large"
                    className='w-full'
                    allowClear
                    // Same fix as department_id above — filter by the label
                    // field (company_name), not fieldNames.value (contractor_id).
                    showSearch={{ optionFilterProp: 'company_name' }}
                    loading={cLoading}
                    options={contractors}
                    fieldNames={{ label: 'company_name', value: 'user_id' }}
                    onChange={(e) => {
                      // See budget_year's onChange — same undefined-vs-null defense.
                      field.onChange(e ?? null)
                      if (timeoutRef.current) clearTimeout(timeoutRef.current)
                      timeoutRef.current = setTimeout(() => {
                        submitRef.current?.click()
                      }, 700)
                    }}
                  />
                </fieldset>
              )
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={13} xl={16} xxl={6} xxxl={6}>
          <Controller
            name="search"
            control={control}
            render={({ field }) => {
              return (
                <fieldset>
                  <label className='text-(--yellow)'>โครงการ</label>
                  <Input
                    {...field}
                    name={field.name}
                    placeholder='ค้นหาชื่อโครงการ...'
                    size="large"
                    className='w-full'
                    suffix={<TbSearch className='text-(--yellow)' />}
                    onChange={(e) => {
                      field.onChange(e)
                      if (timeoutRef.current) clearTimeout(timeoutRef.current)
                      timeoutRef.current = setTimeout(() => {
                        submitRef.current?.click()
                      }, 700)
                    }}
                  />
                </fieldset>
              )
            }}
          />
        </Col>
        {isAdminUser && (
          <Col xs={24} sm={24} md={5} lg={4} xl={3} xxl={2} xxxl={2}>
            <Button
              block
              htmlType="button"
              type='primary'
              size="large"
              icon={<PlusOutlined />}
              shape='round'
              onClick={onOpenCreateProjectModal}
            >
              <p className='fs-12 whitespace-nowrap'>เพิ่มโครงการ</p>
            </Button>
          </Col>
        )}
        <Col xs={24} sm={24} md={5} lg={3} xl={2} xxl={2} xxxl={2}>
          <Segmented
            block
            value={displayType}
            onChange={(value) => setDisplayType(value as 'LIST' | 'GRID')}
            options={[
              { value: 'LIST', icon: <BarsOutlined /> },
              { value: 'GRID', icon: <AppstoreOutlined /> },
            ]}
            size='large'
            className='shrink-0'
          />
        </Col>
        <Col xs={24} sm={24} md={5} lg={4} xl={3} xxl={2} xxxl={2}>
          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button
              block
              type="primary"
              size="large"
              shape="round"
              icon={<TbPrinter />}
              onClick={onExport}
            >
              <p className='fs-12 whitespace-nowrap'>นำออกเอกสาร</p>
            </Button>
          </ConfigProvider>
        </Col>
      </Row>
      <button ref={submitRef} hidden type="submit" />
    </form>
  )
}

export default React.memo<Props>(FormSearchProject)
