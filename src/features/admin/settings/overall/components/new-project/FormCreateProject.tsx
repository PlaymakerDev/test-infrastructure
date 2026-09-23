import { Button, ConfigProvider, Input, Select, Spin, message } from 'antd'
import dayjs from 'dayjs'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { TbPlus, TbTrash } from 'react-icons/tb'
import BuddhistDatePicker from '@/components/date-picker/BuddhistDatePicker'
import { thBuddhistLocale } from '@/components/date-picker/thBuddhistLocale'
import {
  useBudgetYears,
  useCreateProject,
  useDepartments,
  useProjectContractors,
  useProjectDetail,
  useUpdateProject,
} from '@/hooks/queries/manage'
import { useRoadsInfinite } from '@/hooks/queries/shared/useRoadsInfinite'
import type { APIRequestProject, APIResponseProject, ProjectListData } from '@/types/manage/project-api'
import { PlusOutlined } from '@ant-design/icons'

interface Props {
  data?: ProjectListData | null
  submitRef: RefObject<HTMLButtonElement | null>
  onSuccess?: () => void
}

interface FormValues {
  name: string
  budgetYear: number | null
  contractNo: string
  code: string
  owner: number | null
  contractor: string | null
  /** Each row stores the numeric road id in `roadId` plus, for rows loaded
   *  from an existing project, the `projectRoadId` so a subsequent PUT can
   *  update the row instead of duplicating it. */
  roads: { roadId: number | null; projectRoadId?: number }[]
  warrantyStart: dayjs.Dayjs | null
  warrantyEnd: dayjs.Dayjs | null
}

/** Runtime shape returned by GET /manage/project/{id}. The public type doesn't
 *  declare road linkage yet, but the server ships it as `project_roads` (with
 *  an "s") — each item nests the full road object. We cast at the edge so the
 *  edit form can restore the existing road selection AND display a proper
 *  label (road_code) instead of just `#<id>`. */
type ProjectDetailRuntime = APIResponseProject & {
  project_roads?: {
    project_road_id: number
    project_id: number
    road_id: number
    road?: {
      id: number
      road_code?: string
      road_name?: string
      province?: string
    }
  }[]
  /** Legacy singular alias — kept as a runtime fallback in case the API is
   *  ever renamed. Current server ships `project_roads` (plural). */
  project_road?: {
    project_road_id?: number
    road_id: number
    road?: { road_code?: string; road_name?: string }
  }[]
}

/** Grab the road linkage array from a project-detail payload, accepting either
 *  the current plural spelling or the legacy singular one. */
const getProjectRoads = (d: ProjectDetailRuntime | undefined) =>
  d?.project_roads ?? d?.project_road ?? []

/** Best-effort extractor for the backend's Thai error message — same shape
 *  NewProjectSection's own `errText` helper reads (`res_data.details` /
 *  `details`), since that's what's proven correct for /manage/project. */
const readErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const withResponse = error as {
      response?: { data?: { details?: unknown; res_data?: { details?: unknown } } }
      message?: string
    }
    const details =
      withResponse.response?.data?.res_data?.details ??
      withResponse.response?.data?.details
    if (typeof details === 'string') return details
    if (details && typeof details === 'object') return JSON.stringify(details)
    return withResponse.message ?? fallback
  }
  return fallback
}

const DEFAULT_VALUES: FormValues = {
  name: '',
  budgetYear: null,
  contractNo: '',
  code: '',
  owner: null,
  contractor: null,
  roads: [{ roadId: null }],
  warrantyStart: null,
  warrantyEnd: null,
}

const FormCreateProject: React.FC<Props> = (props) => {
  const { data, submitRef, onSuccess } = props

  const isEdit = !!data?.id
  const editingId = data?.id ?? null

  const { mutate: createProject, isPending: isCreatePending } = useCreateProject()
  const { mutate: updateProject, isPending: isUpdatePending } = useUpdateProject()
  const isSubmitting = isCreatePending || isUpdatePending

  const { data: budgetYears } = useBudgetYears()
  const { data: departments } = useDepartments()
  const { data: contractors } = useProjectContractors()
  // The list row (`data`) doesn't carry the full road linkage — fetch the
  // detail fresh whenever editing (component only mounts while the modal is
  // open, so this is safe to call unconditionally).
  const { data: detail, isLoading: detailLoading } = useProjectDetail(editingId)

  const form = useForm<FormValues>({ defaultValues: DEFAULT_VALUES })
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form

  const { fields, append, remove } = useFieldArray({ control, name: 'roads' })

  // ── สายทาง (roads) — server-paginated + server-searched, infinite scroll ──
  const [roadSearch, setRoadSearch] = useState('')
  const roadSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const {
    data: roadPages,
    isLoading: roadsLoading,
    isFetchingNextPage: isRoadsFetchingNextPage,
    hasNextPage: hasNextRoadsPage,
    fetchNextPage: fetchNextRoadsPage,
  } = useRoadsInfinite(roadSearch)

  const handleRoadSearch = useCallback((value: string) => {
    if (roadSearchTimerRef.current) clearTimeout(roadSearchTimerRef.current)
    roadSearchTimerRef.current = setTimeout(() => setRoadSearch(value), 400)
  }, [])

  const handleRoadPopupScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasNextRoadsPage && !isRoadsFetchingNextPage) {
      fetchNextRoadsPage()
    }
  }, [hasNextRoadsPage, isRoadsFetchingNextPage, fetchNextRoadsPage])

  // The modal doesn't remount between opens — re-seed whenever the row being
  // edited changes (or its detail resolves), or when switching back to
  // create mode.
  useEffect(() => {
    if (!isEdit) {
      reset(DEFAULT_VALUES)
      return
    }
    if (!detail) return
    const d = detail as ProjectDetailRuntime
    const links = getProjectRoads(d)
    reset({
      name: d.project_name,
      budgetYear: d.budget_year,
      contractNo: d.contract_no,
      code: d.project_no === '-' ? '' : d.project_no,
      owner: d.department_id,
      contractor: d.contractor_id,
      roads:
        links.length > 0
          ? links.map((r) => ({ roadId: r.road_id, projectRoadId: r.project_road_id }))
          : [{ roadId: null }],
      warrantyStart: d.warranty_start_date ? dayjs(d.warranty_start_date) : null,
      warrantyEnd: d.warranty_end_date ? dayjs(d.warranty_end_date) : null,
    })
  }, [isEdit, detail, reset])

  const onSubmit = useCallback((values: FormValues) => {
    const body: APIRequestProject = {
      budget_year: values.budgetYear as number,
      contract_no: values.contractNo,
      project_no: values.code || '',
      project_name: values.name,
      department_id: values.owner as number,
      contractor_id: values.contractor ?? '',
      warranty_start_date: values.warrantyStart?.format('YYYY-MM-DD') ?? '',
      warranty_end_date: values.warrantyEnd?.format('YYYY-MM-DD') ?? '',
      // Keep projectRoadId alongside roadId so PUT can update existing rows
      // in-place instead of inserting duplicates. New rows have no
      // projectRoadId and the backend will insert them.
      project_road: (values.roads || [])
        .filter((r) => r.roadId != null)
        .map((r) => ({
          road_id: Number(r.roadId),
          ...(r.projectRoadId ? { project_road_id: r.projectRoadId } : {}),
        })),
    }

    if (isEdit && editingId != null) {
      updateProject({ ...body, id: editingId }, {
        onSuccess: () => {
          message.success('แก้ไขโครงการสำเร็จ')
          onSuccess?.()
        },
        onError: (error) => {
          message.error(readErrorMessage(error, 'แก้ไขโครงการไม่สำเร็จ'))
        },
      })
    } else {
      createProject(body, {
        onSuccess: () => {
          message.success('เพิ่มโครงการสำเร็จ')
          onSuccess?.()
        },
        onError: (error) => {
          message.error(readErrorMessage(error, 'เพิ่มโครงการไม่สำเร็จ'))
        },
      })
    }
  }, [isEdit, editingId, createProject, updateProject, onSuccess])

  // ── Option lists with edit-time fallbacks ───────────────────────────────
  // Each Select is bound to a foreign key that lives on the fetched project
  // detail. When editing, the master option list can miss the stored id —
  // the row was deleted, is on a later page, or the list simply hasn't
  // resolved yet. Each memo appends a `{ label: '#<id>', value: <id> }`
  // fallback so the currently-selected value always renders.
  const detailRuntime = detail as ProjectDetailRuntime | undefined

  const yearOptions = useMemo(() => {
    const opts = (budgetYears ?? []).map((y) => ({ label: y.toString(), value: y }))
    if (
      detailRuntime?.budget_year != null &&
      !opts.some((o) => o.value === detailRuntime.budget_year)
    ) {
      opts.push({ label: String(detailRuntime.budget_year), value: detailRuntime.budget_year })
    }
    return opts
  }, [budgetYears, detailRuntime])

  const ownerOptions = useMemo(() => {
    const opts = (departments ?? []).map((d) => ({
      label: d.department_short_name,
      value: d.id,
    }))
    if (
      detailRuntime?.department_id != null &&
      !opts.some((o) => o.value === detailRuntime.department_id)
    ) {
      opts.push({
        label: `#${detailRuntime.department_id}`,
        value: detailRuntime.department_id,
      })
    }
    return opts
  }, [departments, detailRuntime])

  const contractorOptions = useMemo(() => {
    const opts = (contractors ?? []).map((c) => ({
      label: c.company_name,
      value: c.user_id,
    }))
    if (
      detailRuntime?.contractor_id &&
      !opts.some((o) => o.value === detailRuntime.contractor_id)
    ) {
      const label =
        detailRuntime.contractor?.contractor?.company_name ??
        `#${detailRuntime.contractor_id}`
      opts.push({ label, value: detailRuntime.contractor_id })
    }
    return opts
  }, [contractors, detailRuntime])

  const roadOptions = useMemo(() => {
    const rows = roadPages?.pages.flatMap((p) => p.data.res_data ?? []) ?? []
    const opts = rows.map((r) => ({
      label: `${r.road_code}${r.road_name ? ' - ' + r.road_name : ''}`,
      value: r.id as number,
    }))
    getProjectRoads(detailRuntime).forEach((r) => {
      if (!opts.some((o) => o.value === r.road_id)) {
        const nested = r.road
        const label =
          nested?.road_code
            ? `${nested.road_code}${nested.road_name ? ' - ' + nested.road_name : ''}`
            : `#${r.road_id}`
        opts.push({ label, value: r.road_id })
      }
    })
    return opts
  }, [roadPages, detailRuntime])

  return (
    <Spin spinning={isEdit && detailLoading}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset className='mb-4'>
          <Controller
            control={control}
            name='name'
            rules={{ required: 'กรุณาระบุชื่อโครงการ' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>ชื่อโครงการ <span className='text-red-500'>*</span></label>
                <Input {...field} placeholder='กรุณาระบุชื่อโครงการ...' size='large' />
                {errors.name && <p className='fs-12 text-red-500'>{errors.name.message}</p>}
              </fieldset>
            )}
          />
        </fieldset>

        <fieldset className='mb-4'>
          <Controller
            control={control}
            name='budgetYear'
            rules={{ required: 'กรุณาเลือกปีงบประมาณ' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>ปีงบประมาณ <span className='text-red-500'>*</span></label>
                <Select
                  {...field}
                  value={field.value ?? undefined}
                  placeholder='กรุณาระบุปีงบประมาณ...'
                  size='large'
                  className='w-full!'
                  options={yearOptions}
                  onChange={(v) => field.onChange(v ?? null)}
                />
                {errors.budgetYear && <p className='fs-12 text-red-500'>{errors.budgetYear.message}</p>}
              </fieldset>
            )}
          />
        </fieldset>

        <div className='grid grid-cols-2 gap-4 mb-4'>
          <Controller
            control={control}
            name='contractNo'
            rules={{ required: 'กรุณาระบุเลขที่สัญญา' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>เลขที่สัญญา <span className='text-red-500'>*</span></label>
                <Input {...field} placeholder='กรุณาระบุเลขที่สัญญา...' size='large' />
                {errors.contractNo && <p className='fs-12 text-red-500'>{errors.contractNo.message}</p>}
              </fieldset>
            )}
          />
          <Controller
            control={control}
            name='code'
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>รหัสโครงการ</label>
                <Input {...field} placeholder='กรุณาระบุรหัสโครงการ...' size='large' />
              </fieldset>
            )}
          />
        </div>

        <div className='grid grid-cols-2 gap-4 mb-4'>
          <Controller
            control={control}
            name='owner'
            rules={{ required: 'กรุณาเลือกผู้ว่าจ้าง' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>ผู้ว่าจ้าง <span className='text-red-500'>*</span></label>
                <Select
                  {...field}
                  value={field.value ?? undefined}
                  placeholder='กรุณาเลือกผู้ว่าจ้าง...'
                  size='large'
                  className='w-full!'
                  showSearch={{ optionFilterProp: 'label' }}
                  options={ownerOptions}
                  onChange={(v) => field.onChange(v ?? null)}
                />
                {errors.owner && <p className='fs-12 text-red-500'>{errors.owner.message}</p>}
              </fieldset>
            )}
          />
          <Controller
            control={control}
            name='contractor'
            rules={{ required: 'กรุณาเลือกผู้รับจ้าง' }}
            render={({ field }) => (
              <fieldset>
                <label className='text-(--yellow)'>ผู้รับจ้าง <span className='text-red-500'>*</span></label>
                <Select
                  {...field}
                  value={field.value ?? undefined}
                  placeholder='กรุณาเลือกผู้รับจ้าง...'
                  size='large'
                  className='w-full!'
                  showSearch={{ optionFilterProp: 'label' }}
                  options={contractorOptions}
                  onChange={(v) => field.onChange(v ?? null)}
                />
                {errors.contractor && <p className='fs-12 text-red-500'>{errors.contractor.message}</p>}
              </fieldset>
            )}
          />
        </div>

        <section className='mb-4'>
          {fields.map((field, index) => (
            <div key={field.id} className='flex items-end gap-2 mb-2'>
              <div className='flex-1'>
                <Controller
                  control={control}
                  name={`roads.${index}.roadId`}
                  rules={index === 0 ? { required: 'กรุณาเลือกสายทาง' } : {}}
                  render={({ field }) => (
                    <fieldset>
                      <label className='text-(--yellow)'>
                        {index === 0 ? (
                          <>สายทาง <span className='text-red-500'>*</span></>
                        ) : (
                          <span className='invisible'>สายทาง</span>
                        )}
                      </label>
                      <Select
                        {...field}
                        value={field.value ?? undefined}
                        placeholder='กรุณาเลือกสายทาง...'
                        size='large'
                        className='w-full!'
                        options={roadOptions}
                        loading={roadsLoading}
                        showSearch={{ filterOption: false, onSearch: handleRoadSearch }}
                        onPopupScroll={handleRoadPopupScroll}
                        onChange={(v) => field.onChange(v ?? null)}
                      />
                      {!!errors.roads?.[index]?.roadId && (
                        <p className='fs-12 text-red-500'>{errors.roads[index]?.roadId?.message}</p>
                      )}
                    </fieldset>
                  )}
                />
              </div>
              {fields.length > 1 && (
                <Button
                  onClick={() => remove(index)}
                  icon={<TbTrash className='text-white!' />}
                  danger
                  disabled={isSubmitting}
                  // style={{ height: 40 }}
                  size='large'
                  type='primary'
                  htmlType='button'
                />
              )}
            </div>
          ))}
          <Button
            block
            onClick={() => append({ roadId: null })}
            icon={<PlusOutlined />}
            disabled={isSubmitting}
            type='primary'
            htmlType='button'
          >
            เพิ่มสายทาง
          </Button>
        </section>

        <ConfigProvider locale={thBuddhistLocale}>
          <div className='grid grid-cols-2 gap-4'>
            <Controller
              control={control}
              name='warrantyStart'
              rules={{ required: 'กรุณาระบุวันที่เริ่มต้นค้ำประกัน' }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>วันที่เริ่มต้นค้ำประกัน <span className='text-red-500'>*</span></label>
                  <BuddhistDatePicker
                    className='w-full'
                    size='large'
                    format='DD MMM BBBB'
                    placeholder='กรุณาระบุวันที่เริ่มต้นค้ำประกัน...'
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                  />
                  {errors.warrantyStart && <p className='fs-12 text-red-500'>{errors.warrantyStart.message}</p>}
                </fieldset>
              )}
            />
            <Controller
              control={control}
              name='warrantyEnd'
              rules={{ required: 'กรุณาระบุวันที่สิ้นสุดค้ำประกัน' }}
              render={({ field }) => (
                <fieldset>
                  <label className='text-(--yellow)'>วันที่สิ้นสุดค้ำประกัน <span className='text-red-500'>*</span></label>
                  <BuddhistDatePicker
                    className='w-full'
                    size='large'
                    format='DD MMM BBBB'
                    placeholder='กรุณาระบุวันที่สิ้นสุดค้ำประกัน...'
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                  />
                  {errors.warrantyEnd && <p className='fs-12 text-red-500'>{errors.warrantyEnd.message}</p>}
                </fieldset>
              )}
            />
          </div>
        </ConfigProvider>

        <button ref={submitRef} type='submit' hidden disabled={isSubmitting} />
      </form>
    </Spin>
  )
}

export default React.memo<Props>(FormCreateProject)
